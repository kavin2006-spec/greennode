import os
from dotenv import load_dotenv

load_dotenv("../.env")

def get_data_source():
    if os.getenv("ENTSOE_API_KEY"):
        from scheduler.entsoe_client import get_current_intensity
        return get_current_intensity, "entsoe"
    else:
        from scheduler.mock_entsoe import get_mock_forecast
        return get_mock_forecast, "mock"