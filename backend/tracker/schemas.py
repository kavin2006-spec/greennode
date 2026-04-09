from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TrainingRunResult(BaseModel):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    model_name: str
    dataset: str
    duration_seconds: float
    emissions_kg: float
    energy_kwh: float
    cpu_power_w: Optional[float] = None
    ram_power_w: Optional[float] = None
    workload_type: str = "training"