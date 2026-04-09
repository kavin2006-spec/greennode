from datetime import date, timedelta
from database import supabase
import statistics

MINIMUM_RUNS = 10
REDUCTION_TARGET_PCT = 10.0

def get_all_runs() -> list:
    response = supabase.table("training_runs")\
        .select("emissions_kg, created_at")\
        .order("created_at", desc=False)\
        .execute()
    return response.data or []

def get_runs_count() -> int:
    response = supabase.table("training_runs")\
        .select("id", count="exact")\
        .execute()
    return response.count or 0

def estimate_monthly_runs(runs: list) -> float:
    if len(runs) < 2:
        return float(len(runs))

    first = runs[0]["created_at"]
    last = runs[-1]["created_at"]

    from datetime import datetime, timezone

    def parse(dt):
        if isinstance(dt, str):
            return datetime.fromisoformat(dt.replace("Z", "+00:00"))
        return dt

    first_dt = parse(first)
    last_dt = parse(last)

    days_elapsed = max((last_dt - first_dt).total_seconds() / 86400, 1)
    runs_per_day = len(runs) / days_elapsed
    return runs_per_day * 30

def calculate_baseline(runs: list) -> tuple[float, float, int]:
    emissions = [r["emissions_kg"] for r in runs if r["emissions_kg"] > 0]
    if not emissions:
        return 0.0, 0.0, 0

    median_per_run = statistics.median(emissions)
    monthly_run_estimate = estimate_monthly_runs(runs)
    monthly_baseline = median_per_run * monthly_run_estimate

    return monthly_baseline, median_per_run, len(emissions)

def get_actual_this_month() -> float:
    today = date.today()
    period_start = today.replace(day=1)

    runs = supabase.table("training_runs")\
        .select("emissions_kg")\
        .gte("created_at", period_start.isoformat())\
        .execute()

    return sum(r["emissions_kg"] for r in runs.data)

def get_or_create_current_budget() -> dict | None:
    today = date.today()
    period_start = today.replace(day=1)
    if today.month == 12:
        period_end = date(today.year + 1, 1, 1) - timedelta(days=1)
    else:
        period_end = date(today.year, today.month + 1, 1) - timedelta(days=1)

    response = supabase.table("emissions_budget")\
        .select("*")\
        .eq("period_start", period_start.isoformat())\
        .execute()

    if response.data:
        return response.data[0]

    all_runs = get_all_runs()
    if len(all_runs) < MINIMUM_RUNS:
        return None

    monthly_baseline, median_per_run, runs_count = calculate_baseline(all_runs)
    budget_kg = monthly_baseline * (1 - REDUCTION_TARGET_PCT / 100)

    new_budget = {
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "budget_kg": budget_kg,
        "actual_kg": 0.0,
        "baseline_kg": monthly_baseline,
        "reduction_target_pct": REDUCTION_TARGET_PCT,
        "auto_suggested": True,
        "runs_in_baseline": runs_count,
        "notes": f"Monthly baseline from {runs_count} runs at {median_per_run * 1e9:.4f} ngCO₂ median/run, ~{estimate_monthly_runs(all_runs):.1f} runs/month projected"
    }

    result = supabase.table("emissions_budget").insert(new_budget).execute()
    return result.data[0]

def update_actual_emissions(budget_id: str) -> float:
    actual_kg = get_actual_this_month()
    supabase.table("emissions_budget")\
        .update({"actual_kg": actual_kg})\
        .eq("id", budget_id)\
        .execute()
    return actual_kg

def get_budget_status() -> dict:
    runs_count = get_runs_count()

    if runs_count < MINIMUM_RUNS:
        return {
            "has_enough_data": False,
            "runs_recorded": runs_count,
            "runs_required": MINIMUM_RUNS,
            "message": f"Collecting baseline data — {runs_count}/{MINIMUM_RUNS} runs recorded. Keep training to unlock your carbon budget."
        }

    budget = get_or_create_current_budget()
    if not budget:
        return {
            "has_enough_data": False,
            "runs_recorded": runs_count,
            "runs_required": MINIMUM_RUNS,
            "message": "Budget calculation in progress."
        }

    actual_kg = update_actual_emissions(budget["id"])
    remaining_kg = budget["budget_kg"] - actual_kg
    percent_used = (actual_kg / budget["budget_kg"] * 100) if budget["budget_kg"] > 0 else 0
    on_track = actual_kg <= budget["budget_kg"]

    return {
        "has_enough_data": True,
        "runs_recorded": runs_count,
        "runs_required": MINIMUM_RUNS,
        "period_start": budget["period_start"],
        "period_end": budget["period_end"],
        "budget_kg": budget["budget_kg"],
        "actual_kg": actual_kg,
        "baseline_kg": budget["baseline_kg"],
        "reduction_target_pct": budget["reduction_target_pct"],
        "remaining_kg": remaining_kg,
        "percent_used": round(percent_used, 1),
        "on_track": on_track,
        "message": "On track — emissions within monthly budget." if on_track else f"Over budget by {abs(remaining_kg * 1e9):.4f} ngCO₂ this month."
    }