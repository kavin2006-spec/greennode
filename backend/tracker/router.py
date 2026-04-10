from fastapi import APIRouter, HTTPException
from tracker.runner import run_training_job
from tracker.schemas import TrainingRunResult
from database import supabase
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/tracker", tags=["tracker"])

@router.post("/run", response_model=TrainingRunResult)
def run_and_store():
    try:
        result = run_training_job()
        response = supabase.table("training_runs").insert(result).execute()
        stored = response.data[0]
        return stored
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runs", response_model=list[TrainingRunResult])
def get_runs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    try:
        response = supabase.table("training_runs")\
            .select("*")\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/runs/count")
def get_runs_count():
    try:
        response = supabase.table("training_runs")\
            .select("id", count="exact")\
            .execute()
        return {"count": response.count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))