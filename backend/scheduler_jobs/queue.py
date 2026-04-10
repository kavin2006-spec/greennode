from database import supabase
from datetime import datetime, timezone
from scheduler.mock_entsoe import get_mock_forecast
from scheduler.carbon_calculator import find_optimal_window
import os

def get_optimal_window() -> tuple[datetime, float]:
    use_live = bool(os.getenv("ENTSOE_API_KEY"))
    if use_live:
        try:
            from scheduler.entsoe_client import get_current_intensity
            from scheduler.mock_entsoe import get_mock_forecast
            forecast = get_mock_forecast()
            live = get_current_intensity()
            forecast[0]["carbon_intensity_gco2_kwh"] = live["carbon_intensity_gco2_kwh"]
        except:
            forecast = get_mock_forecast()
    else:
        forecast = get_mock_forecast()

    optimal = find_optimal_window(forecast)
    return optimal["datetime_utc"], optimal["carbon_intensity_gco2_kwh"]

def get_queue() -> list:
    response = supabase.table("scheduled_jobs")\
        .select("*")\
        .in_("status", ["pending", "running"])\
        .order("queue_position", desc=False)\
        .execute()
    return response.data or []

def add_job(job_name: str, job_description: str, project: str,
            script_path: str, source: str) -> dict:
    queue = get_queue()
    next_position = len(queue) + 1

    # Only first job gets a real scheduled time
    if next_position == 1:
        scheduled_for, optimal_intensity = get_optimal_window()
    else:
        scheduled_for = None
        optimal_intensity = None

    new_job = {
        "job_name": job_name,
        "job_description": job_description,
        "project": project,
        "script_path": script_path,
        "source": source,
        "status": "pending",
        "queue_position": next_position,
        "scheduled_for": scheduled_for.isoformat() if scheduled_for else None,
        "optimal_intensity_gco2_kwh": optimal_intensity,
    }

    result = supabase.table("scheduled_jobs").insert(new_job).execute()
    return result.data[0]

def reorder_queue(job_ids: list[str]) -> list:
    # job_ids is the new ordered list — update queue_position for each
    for i, job_id in enumerate(job_ids):
        supabase.table("scheduled_jobs")\
            .update({"queue_position": i + 1})\
            .eq("id", job_id)\
            .execute()

    return get_queue()

def promote_next_job():
    # After a job completes, assign scheduled_for to the next pending job
    queue = get_queue()
    pending = [j for j in queue if j["status"] == "pending"]
    if not pending:
        return

    next_job = pending[0]
    scheduled_for, optimal_intensity = get_optimal_window()

    supabase.table("scheduled_jobs")\
        .update({
            "scheduled_for": scheduled_for.isoformat(),
            "optimal_intensity_gco2_kwh": optimal_intensity,
            "queue_position": 1
        })\
        .eq("id", next_job["id"])\
        .execute()