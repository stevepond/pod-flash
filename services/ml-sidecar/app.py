import os
import json
from fastapi import FastAPI
from pydantic import BaseModel
from pymongo import MongoClient
import redis

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://mongodb:27017/pod-flash")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

mongo_client = MongoClient(MONGODB_URI)
# Determine database from URI
if '/' in MONGODB_URI.rsplit('/', 1)[-1]:
    db_name = MONGODB_URI.rsplit('/', 1)[-1]
else:
    db_name = MONGODB_URI.rsplit('/', 1)[-1]

db = mongo_client.get_database(db_name)
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

app = FastAPI()

class PodcastRequest(BaseModel):
    podcast_id: str

class UserRequest(BaseModel):
    user_id: str

@app.post("/summarize")
def summarize(req: PodcastRequest):
    result = {
        "summary": "This is a mock summary generated by ml-sidecar.",
        "keywords": ["mock", "podcast", "summary"],
    }
    db.summaries.update_one({"podcast_id": req.podcast_id}, {"$set": result}, upsert=True)
    redis_client.set(f"podcast:{req.podcast_id}:summary", json.dumps(result))
    return result

@app.post("/transcribe")
def transcribe(req: PodcastRequest):
    result = {"transcript": "This is a mock transcript generated by ml-sidecar."}
    db.transcripts.update_one({"podcast_id": req.podcast_id}, {"$set": result}, upsert=True)
    redis_client.set(f"podcast:{req.podcast_id}:transcript", json.dumps(result))
    return result

@app.post("/train_recs")
def train_recs(req: UserRequest):
    result = {
        "recommendations": ["podcast-1", "podcast-2"],
        "clues": "training clues",
    }
    db.recommendations.update_one({"user_id": req.user_id}, {"$set": result}, upsert=True)
    redis_client.set(f"user:{req.user_id}:recs", json.dumps(result))
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000)
