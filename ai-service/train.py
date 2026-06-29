import os
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from torch.optim import AdamW

# Create synthetic technical vs entertainment dataset
train_data = [
    # Technical (Label 1)
    ("How to resolve memory leaks in React useEffect hook.", 1),
    ("Writing a high-performance REST API in Go using Gin framework.", 1),
    ("Understanding binary search trees and self-balancing algorithms.", 1),
    ("Dockerizing a Node.js express microservice with multi-stage builds.", 1),
    ("A tutorial on setting up AWS Lambda with API Gateway and serverless.", 1),
    ("Configuring indexes in MongoDB to speed up collection queries.", 1),
    ("Implementing JWT authentication and encryption in Python FastAPI.", 1),
    ("Deep dive into CSS Grid and responsive flexbox layouts.", 1),
    ("How garbage collection works in Java virtual machines.", 1),
    ("Kubernetes cluster setup using kubeadm on Ubuntu servers.", 1),
    ("Optimizing SQL queries with JOINs and index scans.", 1),
    ("Building a real-time chat application with Socket.io and Redis.", 1),
    ("Introduction to PyTorch tensors and gradient descent optimization.", 1),
    ("Creating a responsive navigation bar in Tailwind CSS.", 1),
    ("Writing shell scripts to automate backups on Linux databases.", 1),
    
    # Non-Technical / Entertainment (Label 0)
    ("Check out my gaming stream playing Elden Ring live!", 0),
    ("Hilarious comedy skit about working in an office.", 0),
    ("My favorite music playlist for summer vibes.", 0),
    ("Amazing dance choreography at the national championship.", 0),
    ("Cooking the perfect beef Wellington recipe step-by-step.", 0),
    ("Top 10 funny memes of this week compilation.", 0),
    ("Vlog of my weekend trip to Paris and visiting the Eiffel Tower.", 0),
    ("Highlights of the football match yesterday between PSG and Real Madrid.", 0),
    ("Reacting to scary ghost videos found on the internet.", 0),
    ("Pranking my best friend with a fake lottery ticket!", 0),
    ("Unboxing the new iPhone and testing its camera zoom.", 0),
    ("What I eat in a day to lose weight and stay fit.", 0),
    ("Best movies to watch on Netflix this weekend.", 0),
    ("Makeup tutorial for beginners using affordable products.", 0),
    ("Cat compilation doing funny things when nobody is watching.", 0)
]

class CaptionDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=64):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len
        
    def __len__(self):
        return len(self.texts)
        
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_len,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

def train_classifier():
    print("Initializing DistilBERT text classifier pipeline...")
    tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
    model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased', num_labels=2)
    
    texts = [x[0] for x in train_data]
    labels = [x[1] for x in train_data]
    
    dataset = CaptionDataset(texts, labels, tokenizer)
    loader = DataLoader(dataset, batch_size=4, shuffle=True)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    
    # Use AdamW directly from torch.optim or transformers
    optimizer = AdamW(model.parameters(), lr=5e-5)
    model.train()
    
    print(f"Training on device: {device}...")
    for epoch in range(3):
        total_loss = 0
        for batch in loader:
            optimizer.zero_grad()
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels_tensor = batch['labels'].to(device)
            
            outputs = model(input_ids, attention_mask=attention_mask, labels=labels_tensor)
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        print(f"Epoch {epoch+1} Loss: {total_loss/len(loader):.4f}")
        
    output_dir = os.path.join(os.path.dirname(__file__), "model_weights")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"Model and Tokenizer successfully saved to {output_dir}")

if __name__ == "__main__":
    train_classifier()
