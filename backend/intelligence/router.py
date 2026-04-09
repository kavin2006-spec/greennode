from fastapi import APIRouter, HTTPException
from intelligence.schemas import BudgetStatus, WhatIfRequest, WhatIfResult
from intelligence.budget import get_budget_status
from intelligence.whatif import get_whatif_analysis

router = APIRouter(prefix="/intelligence", tags=["intelligence"])

@router.get("/budget", response_model=BudgetStatus)
def get_budget():
    try:
        return get_budget_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/whatif", response_model=WhatIfResult)
def whatif_analysis(request: WhatIfRequest):
    try:
        result = get_whatif_analysis(request.run_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))