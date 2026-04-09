import os
import httpx
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import xml.etree.ElementTree as ET

load_dotenv("../.env")

ENTSOE_API_KEY = os.getenv("ENTSOE_API_KEY")
ENTSOE_BASE_URL = "https://web-api.tp.entsoe.eu/api"
NL_BIDDING_ZONE = "10YNL----------L"

# gCO2/kWh emission factors per fuel type (EU average estimates)
EMISSION_FACTORS = {
    "B01": 0,    # Biomass
    "B02": 0,    # Fossil Brown coal/Lignite — using 0 as fallback
    "B03": 0,    # Fossil Coal-derived gas
    "B04": 490,  # Fossil Gas
    "B05": 820,  # Fossil Hard coal
    "B06": 650,  # Fossil Oil
    "B07": 650,  # Fossil Oil shale
    "B08": 820,  # Fossil Peat
    "B09": 0,    # Geothermal
    "B10": 0,    # Hydro Pumped Storage
    "B11": 0,    # Hydro Run-of-river
    "B12": 0,    # Hydro Water Reservoir
    "B13": 0,    # Marine
    "B14": 12,   # Nuclear
    "B15": 0,    # Other renewable
    "B16": 0,    # Solar
    "B17": 0,    # Waste
    "B18": 0,    # Wind Offshore
    "B19": 0,    # Wind Onshore
    "B20": 200,  # Other (conservative estimate)
}

RENEWABLE_TYPES = {"B01", "B09", "B10", "B11", "B12", "B13", "B15", "B16", "B18", "B19"}

def _fetch_generation(start: datetime, end: datetime) -> dict:
    params = {
        "securityToken": ENTSOE_API_KEY,
        "documentType": "A75",
        "processType": "A16",
        "in_Domain": NL_BIDDING_ZONE,
        "periodStart": start.strftime("%Y%m%d%H00"),
        "periodEnd": end.strftime("%Y%m%d%H00"),
    }

    response = httpx.get(ENTSOE_BASE_URL, params=params, timeout=15)
    response.raise_for_status()
    return response.text

def _parse_generation(xml_text: str) -> dict[str, float]:
    root = ET.fromstring(xml_text)
    ns = {"ns": "urn:iec62325.351:tc57wg16:451-6:generationloaddocument:3:0"}

    generation = {}

    for ts in root.findall(".//ns:TimeSeries", ns):
        psr_type = ts.find(".//ns:psrType", ns)
        if psr_type is None:
            continue
        fuel = psr_type.text

        # Get the last (most recent) quantity in the series
        quantities = ts.findall(".//ns:quantity", ns)
        if quantities:
            try:
                mw = float(quantities[-1].text)
                generation[fuel] = generation.get(fuel, 0) + mw
            except (ValueError, TypeError):
                continue

    return generation

def _calculate_intensity(generation: dict[str, float]) -> tuple[float, float]:
    total_mw = sum(generation.values())
    if total_mw == 0:
        return 200.0, 30.0

    weighted_co2 = sum(
        mw * EMISSION_FACTORS.get(fuel, 200)
        for fuel, mw in generation.items()
    )

    intensity = weighted_co2 / total_mw

    renewable_mw = sum(
        mw for fuel, mw in generation.items()
        if fuel in RENEWABLE_TYPES
    )
    renewable_pct = (renewable_mw / total_mw) * 100

    return round(intensity, 1), round(renewable_pct, 1)

def get_current_intensity() -> dict:
    now = datetime.now(timezone.utc)
    start = now - timedelta(hours=2)
    end = now + timedelta(hours=1)

    xml_text = _fetch_generation(start, end)
    generation = _parse_generation(xml_text)
    intensity, renewable_pct = _calculate_intensity(generation)

    return {
        "carbon_intensity_gco2_kwh": intensity,
        "renewable_percentage": renewable_pct,
        "source": "entsoe"
    }