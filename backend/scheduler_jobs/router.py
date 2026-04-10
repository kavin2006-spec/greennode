from fastapi import APIRouter, HTTPException
from scheduler_jobs.schemas import JobRequest, JobResponse
from scheduler_jobs.queue import add_job, get_queue, reorder_queue
from database import supabase

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("/defer", response_model=JobResponse)
def defer_job(request: JobRequest):
    try:
        job = add_job(
            job_name=request.job_name,
            job_description=request.job_description,
            project=request.project,
            script_path=request.script_path,
            source=request.source
        )
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/queue", response_model=list[JobResponse])
def get_job_queue():
    try:
        return get_queue()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reorder")
def reorder(job_ids: list[str]):
    try:
        return reorder_queue(job_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=list[JobResponse])
def get_history():
    try:
        response = supabase.table("scheduled_jobs")\
            .select("*")\
            .in_("status", ["completed", "failed"])\
            .order("completed_at", desc=True)\
            .limit(50)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))