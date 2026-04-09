import os
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from scheduler.schemas import SchedulerRecommendation, HourlyForecast
from scheduler.mock_entsoe import get_mock_forecast
from scheduler.carbon_calculator import find_optimal_window, calculate_saving_percentage
from database import supabase

router = APIRouter(prefix="/scheduler", tags=["scheduler"])

@router.get("/recommendation", response_model=SchedulerRecommendation)
def get_recommendation():
    try:
        # Use real ENTSO-E if key present, otherwise mock
        use_live = bool(os.getenv("ENTSOE_API_KEY"))

        if use_live:
            from scheduler.entsoe_client import get_current_intensity
            try:
                live = get_current_intensity()
                # Build forecast using mock pattern but anchor current hour to live data
                forecast_raw = get_mock_forecast()
                forecast_raw[0]["carbon_intensity_gco2_kwh"] = live["carbon_intensity_gco2_kwh"]
                forecast_raw[0]["renewable_percentage"] = live["renewable_percentage"]
                source = "entsoe+forecast"
            except Exception as e:
                print(f"ENTSO-E failed, falling back to mock: {e}")
                forecast_raw = get_mock_forecast()
                source = "mock_entsoe"
        else:
            forecast_raw = get_mock_forecast()
            source = "mock_entsoe"

        current = forecast_raw[0]
        optimal = find_optimal_window(forecast_raw)
        saving_pct = calculate_saving_percentage(
            current["carbon_intensity_gco2_kwh"],
            optimal["carbon_intensity_gco2_kwh"]
        )

        supabase.table("grid_intensity").insert({
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "zone": "NL",
            "carbon_intensity_gco2_kwh": current["carbon_intensity_gco2_kwh"],
            "renewable_percentage": current["renewable_percentage"],
            "source": source
        }).execute()

        forecast_out = []
        for entry in forecast_raw:
            forecast_out.append(HourlyForecast(
                hour=entry["hour"],
                datetime_utc=entry["datetime_utc"],
                carbon_intensity_gco2_kwh=entry["carbon_intensity_gco2_kwh"],
                renewable_percentage=entry["renewable_percentage"],
                is_optimal=entry["hour"] == optimal["hour"]
            ))

        return SchedulerRecommendation(
            current_intensity_gco2_kwh=current["carbon_intensity_gco2_kwh"],
            optimal_hour=optimal["hour"],
            optimal_datetime_utc=optimal["datetime_utc"],
            optimal_intensity_gco2_kwh=optimal["carbon_intensity_gco2_kwh"],
            potential_saving_percentage=saving_pct,
            forecast=forecast_out,
            source=source
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))