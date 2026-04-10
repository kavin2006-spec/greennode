from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class JobRequest(BaseModel):
    job_name: str
    job_description: Optional[str] = None
    project: str = "default"
    script_path: str
    source: str = "manual"

class JobResponse(BaseModel):
    id: str
    job_name: str
    job_description: Optional[str] = None
    project: str
    script_path: str
    scheduled_for: Optional[datetime] = None
    optimal_intensity_gco2_kwh: Optional[float] = None
    status: str
    source: str
    queue_position: Optional[int] = None
    run_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime