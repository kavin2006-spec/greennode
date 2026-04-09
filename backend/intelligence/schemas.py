from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class BudgetStatus(BaseModel):
    has_enough_data: bool
    runs_recorded: int
    runs_required: int
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    budget_kg: Optional[float] = None
    actual_kg: Optional[float] = None
    baseline_kg: Optional[float] = None
    reduction_target_pct: Optional[float] = None
    remaining_kg: Optional[float] = None
    percent_used: Optional[float] = None
    on_track: Optional[bool] = None
    message: str

class WhatIfRequest(BaseModel):
    run_id: str

class WhatIfResult(BaseModel):
    run_id: str
    model_name: str
    actual_emissions_kg: float
    actual_intensity_gco2_kwh: Optional[float]
    optimal_intensity_gco2_kwh: Optional[float]
    optimal_emissions_kg: Optional[float]
    emissions_saved_kg: Optional[float]
    saving_percentage: Optional[float]
    energy_kwh: float
    ran_at: datetime
    message: str