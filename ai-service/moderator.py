import os
import cv2
import torch
import whisper
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from transformers import pipeline

class AIModerator:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load local text classifier
        self.model_dir = os.path.join(os.path.dirname(__file__), "model_weights")
        if not os.path.exists(self.model_dir):
            print("Model weights not found. Fine-tuning classifier...")
            from train import train_classifier
            train_classifier()
            
        self.tokenizer = DistilBertTokenizer.from_pretrained(self.model_dir)
        self.text_model = DistilBertForSequenceClassification.from_pretrained(self.model_dir)
        self.text_model.to(self.device)
        self.text_model.eval()
        
        # Load Whisper (using tiny model for fast CPU execution)
        print("Loading Whisper Speech-to-Text model...")
        self.whisper_model = whisper.load_model("tiny")
        
        # Load Toxicity classifier
        print("Loading Toxicity Classifier...")
        try:
            self.toxicity_pipeline = pipeline(
                "sentiment-analysis", 
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1 if self.device.type == 'cpu' else 0
            )
        except Exception as e:
            print("Failed loading HF toxicity pipeline, using fallback. Error:", e)
            self.toxicity_pipeline = None

    def analyze_video_visual(self, video_path):
        """
        OpenCV: Extract frames and analyze visual features.
        """
        print(f"Extracting frames from: {video_path}")
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 1
        
        # Extract 1 frame per second
        frames = []
        success = True
        sec = 0
        while success:
            cap.set(cv2.CAP_PROP_POS_MSEC, sec * 1000)
            success, frame = cap.read()
            if success:
                frame_resized = cv2.resize(frame, (224, 224))
                frames.append(frame_resized)
                sec += 1
                if len(frames) >= 15:  # Limit frames scan
                    break
        cap.release()
        
        # Perform visual check: edge density scoring
        edge_variance_scores = []
        for f in frames:
            gray = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            density = (edges > 0).mean()
            edge_variance_scores.append(density)
            
        avg_density = sum(edge_variance_scores) / len(edge_variance_scores) if edge_variance_scores else 0
        print(f"Average visual edge density calculated: {avg_density:.4f}")
        
        return {
            "frames_analyzed": len(frames),
            "edge_density": float(avg_density),
            "approved": True
        }

    def transcribe_audio(self, video_path):
        """
        Whisper: Extract audio and convert to text transcript.
        """
        try:
            print(f"Transcribing audio from: {video_path}")
            result = self.whisper_model.transcribe(video_path)
            transcript = result.get("text", "")
            print(f"Transcription result: '{transcript}'")
            return transcript
        except Exception as e:
            print("Whisper transcription error:", e)
            return ""

    def classify_text_relevance(self, text):
        """
        BERT: Check if caption, hashtags, or transcript is technically relevant.
        """
        if not text.strip():
            return 0.5, False

        inputs = self.tokenizer(
            text, 
            truncation=True, 
            padding=True, 
            max_length=64, 
            return_tensors="pt"
        )
        
        input_ids = inputs["input_ids"].to(self.device)
        attention_mask = inputs["attention_mask"].to(self.device)
        
        with torch.no_grad():
            outputs = self.text_model(input_ids, attention_mask=attention_mask)
            probs = torch.softmax(outputs.logits, dim=1)
            tech_prob = probs[0][1].item()
            
        print(f"BERT Relevance score: {tech_prob:.4f}")
        # A score >= 0.40 is considered technical
        return tech_prob, tech_prob >= 0.40

    def check_comment_toxicity(self, comment):
        """
        DistilBERT + Fallback rules: Toxicity and hate speech assessment.
        """
        score = 0.0
        is_toxic = False
        
        # 1. Simple rule-based toxic dictionary check
        toxic_keywords = ["hate", "fool", "stupid", "idiot", "jerk", "dumb", "trash", "kill", "die", "fuck", "shit", "bitch"]
        for word in toxic_keywords:
            if word in comment.lower():
                score = 0.85
                is_toxic = True
                break
                
        # 2. Pipeline model verification
        if not is_toxic and self.toxicity_pipeline:
            try:
                res = self.toxicity_pipeline(comment)[0]
                if res['label'] == 'NEGATIVE' and res['score'] > 0.85:
                    score = float(res['score'])
                    is_toxic = True
            except Exception as e:
                print("Toxicity classification pipeline error:", e)
                
        return {
            "toxicity_score": score,
            "is_toxic": is_toxic
        }

    def moderate_post(self, video_path, caption, hashtags):
        """
        Complete Moderation Pipeline: Video + Speech + Text
        """
        # 1. Video Analysis
        visual_report = self.analyze_video_visual(video_path)
        
        # 2. Audio Transcription (If video exists, Whisper transcribes it)
        transcript = ""
        if video_path.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
            transcript = self.transcribe_audio(video_path)
        
        # 3. Combined Text Relevance Check
        full_text = f"{caption} {' '.join(hashtags)} {transcript}"
        relevance_score, is_relevant = self.classify_text_relevance(full_text)
        
        approved = is_relevant
        rejection_reason = ""
        if not approved:
            rejection_reason = "Relevance check failed: Content classified as Non-Technical / Entertainment."

        return {
            "approved": approved,
            "rejection_reason": rejection_reason,
            "relevance_score": relevance_score,
            "edge_density": visual_report["edge_density"],
            "transcript": transcript,
        }
