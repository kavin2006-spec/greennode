from fastapi import APIRouter, HTTPException
from cleaner.schemas import CompressionRequest, CompressionResult
from cleaner.compressor import compress_prompt, estimate_tokens, estimate_co2_saved, estimate_water_saved
from cleaner.embedder import compute_similarity
from database import supabase

router = APIRouter(prefix="/cleaner", tags=["cleaner"])

SIMILARITY_THRESHOLD = 0.85

@router.post("/compress", response_model=CompressionResult)
def compress(request: CompressionRequest):
    try:
        original = request.text
        compressed = compress_prompt(original)

        original_tokens = estimate_tokens(original)
        compressed_tokens = estimate_tokens(compressed)
        tokens_saved = max(0, original_tokens - compressed_tokens)

        similarity = compute_similarity(original, compressed)
        intent_preserved = similarity >= SIMILARITY_THRESHOLD

        co2_saved = estimate_co2_saved(tokens_saved)
        water_saved = estimate_water_saved(tokens_saved)

        supabase.table("prompt_compressions").insert({
            "original_text": original,
            "compressed_text": compressed,
            "original_tokens": original_tokens,
            "compressed_tokens": compressed_tokens,
            "similarity_score": similarity,
            "estimated_co2_saved_g": co2_saved
        }).execute()

        return CompressionResult(
            original_text=original,
            compressed_text=compressed,
            original_tokens=original_tokens,
            compressed_tokens=compressed_tokens,
            tokens_saved=tokens_saved,
            compression_ratio=round(compressed_tokens / original_tokens, 4),
            similarity_score=similarity,
            intent_preserved=intent_preserved,
            estimated_co2_saved_g=co2_saved,
            estimated_water_saved_ml=water_saved
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))