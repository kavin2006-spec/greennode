from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from tracker.router import router as tracker_router
from scheduler.router import router as scheduler_router
from cleaner.router import router as cleaner_router
from intelligence.router import router as intelligence_router
from scheduler_jobs.router import router as jobs_router
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone

scheduler = BackgroundScheduler()

def check_and_run_jobs():
    from database import supabase
    from scheduler_jobs.executor import execute_job

    now = datetime.now(timezone.utc)
    response = supabase.table("scheduled_jobs")\
        .select("*")\
        .eq("status", "pending")\
        .eq("queue_position", 1)\
        .lte("scheduled_for", now.isoformat())\
        .execute()

    for job in response.data:
        execute_job(job)

scheduler.add_job(check_and_run_jobs, "interval", minutes=1)
scheduler.start()

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
app.include_router(jobs_router)

@app.get("/health")
def health_check():
    return {"status": "online", "project": "GreenNode"}