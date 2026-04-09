from database import supabase
from datetime import timezone

def get_whatif_analysis(run_id: str) -> dict:
    # Fetch the training run
    run_response = supabase.table("training_runs")\
        .select("*")\
        .eq("id", run_id)\
        .execute()

    if not run_response.data:
        return {"error": "Run not found"}

    run = run_response.data[0]

    # Find the grid intensity snapshot closest to when the run happened
    run_time = run["created_at"]
    intensity_response = supabase.table("grid_intensity")\
        .select("*")\
        .lte("recorded_at", run_time)\
        .order("recorded_at", desc=True)\
        .limit(1)\
        .execute()

    actual_intensity = None
    if intensity_response.data:
        actual_intensity = intensity_response.data[0]["carbon_intensity_gco2_kwh"]

    # Find the best grid intensity we've ever recorded (optimal baseline)
    best_response = supabase.table("grid_intensity")\
        .select("carbon_intensity_gco2_kwh")\
        .order("carbon_intensity_gco2_kwh", desc=False)\
        .limit(1)\
        .execute()

    optimal_intensity = None
    optimal_emissions_kg = None
    emissions_saved_kg = None
    saving_percentage = None

    if best_response.data:
        optimal_intensity = best_response.data[0]["carbon_intensity_gco2_kwh"]
        optimal_emissions_kg = run["energy_kwh"] * (optimal_intensity / 1000)
        emissions_saved_kg = run["emissions_kg"] - optimal_emissions_kg
        saving_percentage = (emissions_saved_kg / run["emissions_kg"] * 100) \
            if run["emissions_kg"] > 0 else 0
        saving_percentage = round(max(0, saving_percentage), 1)

    # Build message
    if saving_percentage and saving_percentage > 0:
        message = f"Running at the optimal grid window would have saved {saving_percentage}% of emissions for this job."
    elif actual_intensity and optimal_intensity and actual_intensity <= optimal_intensity * 1.05:
        message = "This run was already close to the optimal grid window — good timing."
    else:
        message = "No grid intensity data available for this run window."

    return {
        "run_id": run_id,
        "model_name": run["model_name"],
        "actual_emissions_kg": run["emissions_kg"],
        "actual_intensity_gco2_kwh": actual_intensity,
        "optimal_intensity_gco2_kwh": optimal_intensity,
        "optimal_emissions_kg": optimal_emissions_kg,
        "emissions_saved_kg": emissions_saved_kg,
        "saving_percentage": saving_percentage,
        "energy_kwh": run["energy_kwh"],
        "ran_at": run["created_at"],
        "message": message
    }