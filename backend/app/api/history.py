from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.repositories.idea_repository import IdeaRepository
from app.repositories.validation_repository import ValidationRepository
from app.schemas.validation import ValidationHistoryItem, ValidationHistoryEnvelope

router = APIRouter(prefix="/ideas", tags=["Validation History"])


from app.schemas.envelope import SuccessResponse


@router.get("/{idea_id}/history")
def get_idea_history(
    idea_id: int,
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea_repo = IdeaRepository(db)
    idea = idea_repo.get_by_id_and_user(idea_id, current_user.id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found or access denied."
        )

    val_repo = ValidationRepository(db)
    all_validations = val_repo.get_validation_history(idea_id)

    total = len(all_validations)
    paged_validations = all_validations[offset: offset + limit]

    history_items = []
    for v in paged_validations:
        history_items.append({
            "version": v.version,
            "date": v.created_at,
            "overall_score": v.overall_score,
            "confidence_score": v.confidence_score,
            "classification": v.classification,
            "major_weaknesses": ["Customer acquisition testing required"]
        })

    return SuccessResponse(data={
        "items": history_items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total
    })


