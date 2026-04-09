from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from tracker.router import router as tracker_router
from scheduler.router import router as scheduler_router
from cleaner.router import router as cleaner_router
from intelligence.router import router as intelligence_router


load_dotenv("../.env")

app = FastAPI(
    title="GreenNode API",
    description="Carbon-aware AI training optimizer",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tracker_router)
app.include_router(scheduler_router)
app.include_router(cleaner_router)
app.include_router(intelligence_router)

@app.get("/health")
def health_check():
    return {"status": "online", "project": "GreenNode"}