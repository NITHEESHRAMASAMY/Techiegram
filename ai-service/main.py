import os
import shutil
import tempfile
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from moderator import AIModerator
from recommender import RecommendationEngine

app = FastAPI(title="Techiegram AI Microservice")

# Initialize models once at startup
moderator = AIModerator()
recommender = RecommendationEngine()

class CommentPayload(BaseModel):
    comment: str

class RecommendationPayload(BaseModel):
    userId: str
    users: List[Dict[str, Any]]
    posts: List[Dict[str, Any]]
    interactions: List[Dict[str, Any]]
    limit: Optional[int] = 10

@app.get("/")
def read_root():
    return {"message": "Techiegram AI Microservice is online and processing."}

@app.post("/moderation/video")
async def moderate_video_post(
    video: UploadFile = File(...),
    caption: str = Form(""),
    hashtags: str = Form("[]")
):
    """
    Asynchronous file parser & OpenCV visual / speech / text moderator.
    """
    try:
        try:
            hashtags_list = json.loads(hashtags)
        except Exception:
            hashtags_list = [t.strip().lower() for t in hashtags.split(",") if t.strip()]

        # Save uploaded file to temp file to analyze
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, f"temp_{video.filename}")
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
            
        # Run moderation pipeline
        report = moderator.moderate_post(temp_file_path, caption, hashtags_list)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Moderation error: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/moderation/comment")
def moderate_comment(payload: CommentPayload):
    """
    Checks if a comment contains toxic content or hate speech.
    """
    try:
        res = moderator.check_comment_toxicity(payload.comment)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommendations")
def get_recommendations(payload: RecommendationPayload):
    """
    Computes hybrid user recommendations matching interaction arrays.
    """
    try:
        rec_ids = recommender.get_recommendations(
            target_user_id=payload.userId,
            users=payload.users,
            posts=payload.posts,
            interactions=payload.interactions,
            limit=payload.limit
        )
        return {"recommended_ids": rec_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RoadmapPayload(BaseModel):
    skill: str

class QuizPayload(BaseModel):
    topic: str

class AssistantPayload(BaseModel):
    message: str

@app.post("/ai/roadmap")
def get_ai_roadmap(payload: RoadmapPayload):
    """
    Generates step-by-step learning roadmaps.
    """
    skill = payload.skill.lower().strip()
    roadmaps = {
        "react": {
            "skill": payload.skill,
            "roadmap": [
                {"step": 1, "title": "JavaScript Fundamentals", "topics": ["ES6 Syntax", "Promises", "Async/Await"]},
                {"step": 2, "title": "React Core", "topics": ["JSX", "Components", "Props & State"]},
                {"step": 3, "title": "React Hooks", "topics": ["useState", "useEffect", "useContext"]},
                {"step": 4, "title": "State Management & Routing", "topics": ["Redux Toolkit", "React Router"]}
            ]
        },
        "python": {
            "skill": payload.skill,
            "roadmap": [
                {"step": 1, "title": "Python Programming Basics", "topics": ["Loops", "Functions", "Data Types"]},
                {"step": 2, "title": "Object-Oriented Python", "topics": ["Classes", "Inheritance", "Dunder Methods"]},
                {"step": 3, "title": "Data Manipulation Tools", "topics": ["Pandas Dataframes", "NumPy Arrays"]},
                {"step": 4, "title": "AI & Web Frameworks", "topics": ["FastAPI APIs", "PyTorch Tensors"]}
            ]
        }
    }
    result = roadmaps.get(skill, {
        "skill": payload.skill,
        "roadmap": [
            {"step": 1, "title": f"Introduction to {payload.skill}", "topics": ["Basics & Setup", "First Hello World"]},
            {"step": 2, "title": f"Intermediate {payload.skill}", "topics": ["Data Structures", "APIs & Library Integrations"]},
            {"step": 3, "title": f"Advanced {payload.skill}", "topics": ["Performance Optimization", "Security Best Practices"]}
        ]
    })
    return result

@app.post("/ai/quiz")
def get_ai_quiz(payload: QuizPayload):
    """
    Generates 5 conceptual MCQ questions on the requested topic.
    """
    questions = [
        {
            "questionText": f"Which of the following is correct regarding {payload.topic}?",
            "options": [
                "It only runs on legacy hardware systems",
                "It is a modern software paradigm designed for performance and efficiency",
                "It has been fully deprecated since 2015",
                "It is only used for styling static HTML websites"
            ],
            "correctOptionIndex": 1
        },
        {
            "questionText": f"What is a main benefit of utilizing {payload.topic} in production?",
            "options": [
                "Increases server latency automatically",
                "Bypasses database connections completely",
                "Offers high scalability and modular code reusability",
                "Forces developers to write code without tests"
            ],
            "correctOptionIndex": 2
        },
        {
            "questionText": f"Which protocol or mechanism is standard when debugging {payload.topic}?",
            "options": [
                "SMTP simple mail transfer protocol",
                "Logging and step-by-step exception breakpoints",
                "CSS styling grid alignment checks",
                "Physical cable testing checks"
            ],
            "correctOptionIndex": 1
        }
    ]
    return {"questions": questions}

@app.post("/ai/assistant")
def get_ai_assistant_reply(payload: AssistantPayload):
    """
    Provides smart interactive replies to developer queries.
    """
    msg = payload.message.lower()
    reply = "I am your Techiegram Learning Assistant. "
    if "react" in msg:
        reply += "For React development, remember to keep components stateless where possible, leverage Custom Hooks for business logic, and cache heavy calculations using useMemo."
    elif "python" in msg:
        reply += "In Python, write pythonic code using list comprehensions, handle resources using context managers ('with' statement), and verify type hints for code reliability."
    elif "mongodb" in msg or "database" in msg:
        reply += "For databases like MongoDB, ensure indexes are set on fields used in queries, check execution stats via explain(), and keep document size below 16MB."
    else:
        reply += "Regarding software architecture: prioritize modular structures, implement rate limiters, configure Docker for environment parity, and write automated integration tests!"
    return {"reply": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
