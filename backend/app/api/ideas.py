from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.idea import Idea
from app.models.validation import ValidationResult
from app.repositories.idea_repository import IdeaRepository
from app.schemas.idea import IdeaCreate, IdeaUpdate, IdeaResponse

from app.schemas.envelope import SuccessResponse

router = APIRouter(prefix="/ideas", tags=["Startup Ideas"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_idea(
    idea_in: IdeaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea_repo = IdeaRepository(db)
    created = idea_repo.create(idea_in, user_id=current_user.id)
    return SuccessResponse(data=IdeaResponse.model_validate(created))


@router.get("")
def list_ideas(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    classification: Optional[str] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    sort_by: Optional[str] = None,
    order: Optional[str] = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Idea).filter(Idea.user_id == current_user.id, Idea.is_deleted == False)

    if classification or min_score is not None or max_score is not None or sort_by == "score":
        query = query.join(ValidationResult, Idea.id == ValidationResult.idea_id)
        if classification:
            query = query.filter(ValidationResult.classification == classification)
        if min_score is not None:
            query = query.filter(ValidationResult.overall_score >= min_score)
        if max_score is not None:
            query = query.filter(ValidationResult.overall_score <= max_score)

    if sort_by == "score":
        query = query.order_by(desc(ValidationResult.overall_score) if order == "desc" else asc(ValidationResult.overall_score))
    elif sort_by == "created_at":
        query = query.order_by(desc(Idea.created_at) if order == "desc" else asc(Idea.created_at))
    else:
        query = query.order_by(desc(Idea.id))

    total = query.distinct().count()
    ideas = query.distinct().offset(offset).limit(limit).all()

    items = [IdeaResponse.model_validate(i) for i in ideas]
    has_more = (offset + limit) < total

    return SuccessResponse(data={
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": has_more
    })


@router.get("/{idea_id}")
def get_idea(
    idea_id: int,
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
    return SuccessResponse(data=IdeaResponse.model_validate(idea))


@router.put("/{idea_id}")
def update_idea(
    idea_id: int,
    idea_in: IdeaUpdate,
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
    updated = idea_repo.update(idea, idea_in)
    return SuccessResponse(data=IdeaResponse.model_validate(updated))



@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(
    idea_id: int,
    hard: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea_repo = IdeaRepository(db)
    if hard:
        if getattr(current_user, "role", "USER") != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Hard deletion requires admin privileges."
            )
        idea = idea_repo.get_by_id(idea_id, include_deleted=True)
    else:
        idea = idea_repo.get_by_id_and_user(idea_id, current_user.id)

    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found or access denied."
        )

    if hard:
        idea_repo.hard_delete(idea)
    else:
        idea_repo.soft_delete(idea)
    return None

