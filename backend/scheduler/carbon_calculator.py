def find_optimal_window(forecast: list[dict]) -> dict:
    optimal = min(forecast, key=lambda x: x["carbon_intensity_gco2_kwh"])
    return optimal

def calculate_saving_percentage(current: float, optimal: float) -> float:
    if current == 0:
        return 0.0
    saving = ((current - optimal) / current) * 100
    return round(max(0.0, saving), 1)

def estimate_run_emissions(energy_kwh: float, intensity_gco2_kwh: float) -> float:
    return round(energy_kwh * intensity_gco2_kwh, 6)