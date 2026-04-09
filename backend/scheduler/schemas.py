from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HourlyForecast(BaseModel):
    hour: int
    datetime_utc: datetime
    carbon_intensity_gco2_kwh: float
    renewable_percentage: float
    is_optimal: bool

class SchedulerRecommendation(BaseModel):
    current_intensity_gco2_kwh: float
    optimal_hour: int
    optimal_datetime_utc: datetime
    optimal_intensity_gco2_kwh: float
    potential_saving_percentage: float
    forecast: list[HourlyForecast]
    source: str