from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import require_admin
from app.database.connection import get_db
from app.models.user import User
from app.models.validation import ValidationResult

router = APIRouter(prefix="/admin", tags=["Admin Observability"])


from app.services.embedding_cache_service import EmbeddingCacheService

cache_service = EmbeddingCacheService()


from app.schemas.envelope import SuccessResponse


@router.get("/metrics")
def get_admin_metrics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    cache_stats = cache_service.get_cache_stats()
    validations = db.query(ValidationResult).all()
    total_validations = len(validations)

    if total_validations == 0:
        return SuccessResponse(data={
            "total_validations": 0,
            "avg_pipeline_duration_ms": 0.0,
            "slowest_layer_avg": {"name": "none", "avg_ms": 0.0},
            "llm_fallback_rate": "0%",
            "score_distribution": {
                "EXCEPTIONAL": 0,
                "STRONG": 0,
                "MODERATE": 0,
                "WEAK": 0,
                "VERY_WEAK": 0
            },
            "avg_confidence_score": 0.0,
            "cache_stats": cache_stats
        })

    # Total & Average pipeline duration
    durations = []
    layer_durations: Dict[str, list] = {}
    mock_fallbacks = 0

    for val in validations:
        if val.model_name in ["mock-llm", "mock"]:
            mock_fallbacks += 1

        timing = val.pipeline_timing or {}
        if isinstance(timing, dict) and timing:
            total_dur = sum(timing.values())
            durations.append(total_dur)
            for k, v in timing.items():
                if isinstance(v, (int, float)):
                    layer_durations.setdefault(k, []).append(v)

    avg_pipeline_duration_ms = round(sum(durations) / len(durations), 2) if durations else 0.0

    slowest_name = "none"
    slowest_avg = 0.0
    for l_name, l_vals in layer_durations.items():
        avg_val = sum(l_vals) / len(l_vals)
        if avg_val > slowest_avg:
            slowest_avg = avg_val
            slowest_name = l_name

    fallback_rate = f"{round((mock_fallbacks / total_validations) * 100, 1)}%"

    # Score distribution
    score_dist = {"EXCEPTIONAL": 0, "STRONG": 0, "MODERATE": 0, "WEAK": 0, "VERY_WEAK": 0}
    for val in validations:
        cls = val.classification
        if cls in score_dist:
            score_dist[cls] += 1
        else:
            score_dist["MODERATE"] += 1

    # Avg confidence
    avg_conf = round(sum(v.confidence_score for v in validations) / total_validations, 2)

    return SuccessResponse(data={
        "total_validations": total_validations,
        "avg_pipeline_duration_ms": avg_pipeline_duration_ms,
        "slowest_layer_avg": {
            "name": slowest_name,
            "avg_ms": round(slowest_avg, 2)
        },
        "llm_fallback_rate": fallback_rate,
        "score_distribution": score_dist,
        "avg_confidence_score": avg_conf,
        "cache_stats": cache_stats
    })


