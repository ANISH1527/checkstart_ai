from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_


from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.idea import Idea
from app.models.validation import ValidationResult
from app.repositories.idea_repository import IdeaRepository
from app.repositories.validation_repository import ValidationRepository
from app.schemas.idea import IdeaCreate, IdeaUpdate, IdeaResponse
from app.services.scoring_service import ScoringService
from app.schemas.envelope import SuccessResponse

router = APIRouter(prefix="/ideas", tags=["Startup Ideas"])


def _format_idea(idea: Idea, db: Session) -> Dict[str, Any]:
    validations = (
        db.query(ValidationResult)
        .filter(ValidationResult.idea_id == idea.id)
        .order_by(ValidationResult.version.desc())
        .all()
    )

    latest_report = None
    conv_id = None
    if validations:
        latest = validations[0]
        if latest.session_id:
            conv_id = str(latest.session_id)
        classification_info = ScoringService.classify(latest.overall_score)
        latest_report = {
            "id": str(latest.id),
            "versionNumber": latest.version,
            "overallScore": latest.overall_score,
            "validationPercentage": round(latest.overall_score),
            "validationCategory": classification_info["category"],
            "summary": latest.summary or "",
            "createdAt": latest.created_at.isoformat() if latest.created_at else datetime.utcnow().isoformat()
        }

    if not conv_id:
        from app.models.chat import ValidationSession
        sess = db.query(ValidationSession).filter(
            ValidationSession.idea_id == idea.id,
            ValidationSession.is_deleted == False
        ).order_by(ValidationSession.updated_at.desc()).first()
        if sess:
            conv_id = str(sess.id)

    return {
        "id": idea.id,
        "user_id": idea.user_id,
        "name": idea.title,
        "title": idea.title,
        "conversationId": conv_id,
        "description": idea.description,
        "problemStatement": idea.problem or "",
        "problem": idea.problem or "",
        "proposedSolution": idea.solution or "",
        "solution": idea.solution or "",
        "targetCustomer": idea.target_customer or "",
        "target_customer": idea.target_customer or "",
        "industry": idea.industry or "General",
        "location": "Global",
        "businessModel": idea.business_model or "",
        "business_model": idea.business_model or "",
        "revenueModel": idea.revenue_model or "",
        "revenue_model": idea.revenue_model or "",
        "currentStage": "Idea",
        "stage": "Idea",
        "technology": idea.technology or "",
        "pricing": idea.pricing or "",
        "version": idea.version,
        "is_deleted": idea.is_deleted,
        "createdAt": idea.created_at.isoformat() if idea.created_at else "",
        "created_at": idea.created_at,
        "updatedAt": idea.updated_at.isoformat() if idea.updated_at else "",
        "updated_at": idea.updated_at,
        "reportsCount": len(validations),
        "latestReport": latest_report
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_idea(
    idea_in: IdeaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea_repo = IdeaRepository(db)
    created = idea_repo.create(idea_in, user_id=current_user.id)
    formatted = _format_idea(created, db)
    return SuccessResponse(data={
        **formatted,
        "idea": formatted,
        "message": "Startup idea created successfully."
    })


@router.get("")
def list_ideas(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort: Optional[str] = None,
    classification: Optional[str] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    sort_by: Optional[str] = None,
    order: Optional[str] = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Idea).filter(Idea.user_id == current_user.id, Idea.is_deleted == False)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Idea.title.ilike(search_pattern),
                Idea.description.ilike(search_pattern),
                Idea.industry.ilike(search_pattern),
                Idea.problem.ilike(search_pattern)
            )
        )

    if category:
        query = query.filter(Idea.industry.ilike(f"%{category.strip()}%"))

    needs_val_join = (
        classification or min_score is not None or max_score is not None or
        sort_by == "score" or sort in ["highest-score", "lowest-score"]
    )

    if needs_val_join:
        query = query.join(ValidationResult, Idea.id == ValidationResult.idea_id)
        if classification:
            query = query.filter(ValidationResult.classification == classification)
        if min_score is not None:
            query = query.filter(ValidationResult.overall_score >= min_score)
        if max_score is not None:
            query = query.filter(ValidationResult.overall_score <= max_score)

    if sort == "highest-score" or (sort_by == "score" and order == "desc"):
        query = query.order_by(desc(ValidationResult.overall_score))
    elif sort == "lowest-score" or (sort_by == "score" and order == "asc"):
        query = query.order_by(asc(ValidationResult.overall_score))
    elif sort == "oldest" or (sort_by == "created_at" and order == "asc"):
        query = query.order_by(asc(Idea.created_at))
    elif sort == "newest" or (sort_by == "created_at" and order == "desc"):
        query = query.order_by(desc(Idea.created_at))
    else:
        query = query.order_by(desc(Idea.id))

    total = query.distinct().count()
    ideas = query.distinct().offset(offset).limit(limit).all()

    items = [_format_idea(i, db) for i in ideas]
    has_more = (offset + limit) < total

    return SuccessResponse(data={
        "ideas": items,
        "items": items,
        "count": total,
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
    formatted = _format_idea(idea, db)
    return SuccessResponse(data={
        **formatted,
        "idea": formatted
    })


@router.get("/{idea_id}/reports")
def get_idea_reports(
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

    val_repo = ValidationRepository(db)
    validations = val_repo.get_validation_history(idea_id)

    report_items = []
    for idx, v in enumerate(validations):
        classification_info = ScoringService.classify(v.overall_score)
        param_dict = {s.parameter: s.score for s in v.scores}
        seven_params = ScoringService.aggregate_to_7_parameters(param_dict)
        prev_id = str(validations[idx + 1].id) if idx + 1 < len(validations) else None

        report_items.append({
            "id": str(v.id),
            "versionNumber": v.version,
            "previousReportId": prev_id,
            "overallScore": v.overall_score,
            "validationPercentage": round(v.overall_score),
            "validationCategory": classification_info["category"],
            "summary": v.summary or "",
            "recommendedAction": v.recommended_action or "Review customer feedback",
            "createdAt": v.created_at.isoformat() if v.created_at else "",
            "scores": seven_params
        })

    return SuccessResponse(data={
        "startupName": idea.title,
        "totalVersions": len(validations),
        "reports": report_items
    })


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
    formatted = _format_idea(updated, db)
    return SuccessResponse(data={
        **formatted,
        "idea": formatted,
        "message": "Startup idea updated successfully."
    })


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

