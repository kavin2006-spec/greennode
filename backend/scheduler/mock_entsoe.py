from datetime import datetime, timedelta, timezone
import random

# Realistic NL grid carbon intensity pattern (gCO2/kWh)
# NL grid is typically cleanest 01:00-06:00 (low demand, more wind)
# and dirtiest 17:00-20:00 (peak demand, gas peakers online)
NL_HOURLY_PATTERN = [
    180, 165, 150, 140, 135, 130,  # 00:00 - 05:00 (cleanest)
    145, 160, 185, 210, 220, 225,  # 06:00 - 11:00 (morning ramp)
    215, 210, 205, 200, 210, 230,  # 12:00 - 17:00 (midday)
    245, 250, 235, 220, 205, 190,  # 18:00 - 23:00 (evening peak then drop)
]

def get_mock_forecast() -> list[dict]:
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    forecast = []

    for i in range(24):
        dt = now + timedelta(hours=i)
        hour = dt.hour
        base_intensity = NL_HOURLY_PATTERN[hour]

        # Add small random variance to make it feel like real data
        variance = random.uniform(-10, 10)
        intensity = round(base_intensity + variance, 1)

        # Estimate renewable percentage inversely from intensity
        # Lower intensity = more renewables on the grid
        renewable_pct = round(max(20, min(80, 100 - (intensity / 3))), 1)

        forecast.append({
            "hour": hour,
            "datetime_utc": dt,
            "carbon_intensity_gco2_kwh": intensity,
            "renewable_percentage": renewable_pct,
        })

    return forecast