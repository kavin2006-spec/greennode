from pydantic import BaseModel
from typing import Optional

class CompressionRequest(BaseModel):
    text: str

class CompressionResult(BaseModel):
    original_text: str
    compressed_text: str
    original_tokens: int
    compressed_tokens: int
    tokens_saved: int
    compression_ratio: float
    similarity_score: float
    intent_preserved: bool
    estimated_co2_saved_g: float
    estimated_water_saved_ml: float