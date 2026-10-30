from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
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

    if category and category.strip().lower() != "all":
        classification_options = ["Highly Promising", "Promising", "Needs Improvement", "High Risk"]
        matched_class = next((c for c in classification_options if c.lower() == category.strip().lower()), None)
        if matched_class:
            classification = matched_class
        else:
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


@router.get("/{idea_id}/reports/{report_id}")
def get_idea_report_by_id(
    idea_id: int,
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch a specific validation report for an idea enforcing ownership."""
    idea_repo = IdeaRepository(db)
    idea = idea_repo.get_by_id_and_user(idea_id, current_user.id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found or access denied."
        )

    try:
        val_id = int(report_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report ID must be a valid integer."
        )

    val = db.query(ValidationResult).filter(
        ValidationResult.id == val_id,
        ValidationResult.idea_id == idea_id
    ).first()
    if not val:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found for this idea."
        )

    from app.api.reports import format_validation_report
    report_payload = format_validation_report(val, idea, db)
    return SuccessResponse(data={"report": report_payload, **report_payload})


@router.get("/{idea_id}/compare")
def compare_idea_versions(
    idea_id: int,
    from_version: Optional[int] = Query(None, alias="from"),
    to_version: Optional[int] = Query(None, alias="to"),
    v1: Optional[int] = None,
    v2: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare two validation report versions for an idea.
    Returns per-parameter delta (S_v2 - S_v1), overall delta, confidence delta,
    reasons for change, and recommendation completion status.
    Enforces ownership (returns 404 for another user's idea).
    """
    idea_repo = IdeaRepository(db)
    idea = idea_repo.get_by_id_and_user(idea_id, current_user.id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found or access denied."
        )

    val_repo = ValidationRepository(db)
    v_from = from_version if from_version is not None else v1
    v_to = to_version if to_version is not None else v2

    if v_from is None or v_to is None:
        history = val_repo.get_validation_history(idea_id)
        if len(history) < 2:
            return SuccessResponse(data={
                "has_comparison": False,
                "message": "At least 2 validation versions are required for comparison."
            })
        val1 = history[-2]
        val2 = history[-1]
        v_from = val1.version
        v_to = val2.version
    else:
        val1 = val_repo.get_validation_by_version(idea_id, v_from)
        val2 = val_repo.get_validation_by_version(idea_id, v_to)
        if not val1 or not val2:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Validation version {v_from} and/or {v_to} not found for this idea."
            )

    # 7-parameter delta calculation
    report_params = [
        "market_demand", "problem_severity", "competition",
        "target_customer", "innovation", "feasibility", "revenue_potential"
    ]

    param_deltas = []
    for p in report_params:
        s1 = getattr(val1, p, None)
        if s1 is None and val1.scores:
            s1 = next((s.score for s in val1.scores if s.parameter == p), 5.0)
        s2 = getattr(val2, p, None)
        if s2 is None and val2.scores:
            s2 = next((s.score for s in val2.scores if s.parameter == p), 5.0)

        s1_val = round(float(s1 if s1 is not None else 5.0), 1)
        s2_val = round(float(s2 if s2 is not None else 5.0), 1)
        d = round(s2_val - s1_val, 1)

        reason = "No change in score."
        if d > 0:
            reason = f"Score improved by +{d} due to clearer specifications or verified evidence for {p.replace('_', ' ')}."
        elif d < 0:
            reason = f"Score decreased by -{abs(d)} due to stricter constraint verification or missing signals for {p.replace('_', ' ')}."

        param_deltas.append({
            "parameter": p,
            "v1_score": s1_val,
            "v2_score": s2_val,
            "delta": d,
            "associated_change": reason,
            "reason_for_change": reason
        })

    # Overall & confidence deltas
    overall_v1 = round(float(val1.percentage if getattr(val1, "percentage", None) is not None else val1.overall_score), 1)
    overall_v2 = round(float(val2.percentage if getattr(val2, "percentage", None) is not None else val2.overall_score), 1)
    overall_delta = round(overall_v2 - overall_v1, 1)

    conf_v1 = round(float(val1.confidence_score), 1)
    conf_v2 = round(float(val2.confidence_score), 1)
    conf_delta = round(conf_v2 - conf_v1, 1)

    # Recommendations from v1 and their completion status
    from app.models.recommendation import Recommendation
    v1_recs = db.query(Recommendation).filter(Recommendation.validation_id == val1.id).all()
    recommendations_out = []
    completed_ids = []
    unresolved_ids = []

    for r in v1_recs:
        rec_ident = r.rec_id or str(r.id)
        is_done = r.status == "COMPLETED"
        if is_done:
            completed_ids.append(rec_ident)
        else:
            unresolved_ids.append(rec_ident)

        recommendations_out.append({
            "id": r.id,
            "rec_id": rec_ident,
            "action": r.action,
            "status": r.status,
            "completed": is_done
        })

    return SuccessResponse(data={
        "idea_id": idea.id,
        "idea_title": idea.title,
        "from_version": v_from,
        "to_version": v_to,
        "v1_version": v_from,
        "v2_version": v_to,
        "overall_score_v1": overall_v1,
        "overall_score_v2": overall_v2,
        "overall_delta": overall_delta,
        "score_delta": overall_delta,
        "confidence_v1": conf_v1,
        "confidence_v2": conf_v2,
        "confidence_delta": conf_delta,
        "parameter_comparisons": param_deltas,
        "parameter_deltas": param_deltas,
        "v1_recommendations": recommendations_out,
        "completed_recommendations": completed_ids,
        "unresolved_recommendations": unresolved_ids,
        "has_comparison": True
    })


class ChatMessageRequest(BaseModel):
    message: str
    content: Optional[str] = None


@router.post("/{idea_id}/chat")
def chat_with_idea_endpoint(
    idea_id: int,
    body: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Conversational validation chat for an idea, enforcing tenant ownership.
    Returns 404 for ideas belonging to another user.
    """
    idea_repo = IdeaRepository(db)
    idea = idea_repo.get_by_id_and_user(idea_id, current_user.id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found or access denied."
        )

    msg_text = body.message or body.content or ""
    if not msg_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    from app.services.chat_service import ChatService
    chat_svc = ChatService(db)
    session = chat_svc.get_or_create_session(
        user_id=current_user.id,
        idea_id=idea.id,
        initial_title=idea.title
    )
    result = chat_svc.process_user_message(
        session_id=session.id,
        user=current_user,
        message_content=msg_text
    )

    return SuccessResponse(data={
        "conversation_id": str(session.id),
        "session_id": str(session.id),
        "response": result.get("response"),
        "message": result.get("response"),
        "state": result.get("state"),
        "readiness": result.get("readiness")
    })


@router.post("/{idea_id}/recommendations/{rec_id}/complete")
def toggle_recommendation_status(
    idea_id: int,
    rec_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle recommendation between OPEN and COMPLETED, enforcing ownership."""
    idea_repo = IdeaRepository(db)
    idea = idea_repo.get_by_id_and_user(idea_id, current_user.id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found or access denied."
        )

    val_repo = ValidationRepository(db)
    validations = val_repo.get_validation_history(idea_id)
    if not validations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No validation found for this idea."
        )

    val_ids = [v.id for v in validations]
    from app.models.recommendation import Recommendation
    rec = db.query(Recommendation).filter(
        Recommendation.validation_id.in_(val_ids),
        (Recommendation.rec_id == rec_id) | (Recommendation.id == (int(rec_id) if rec_id.isdigit() else -1))
    ).first()

    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found."
        )

    rec.status = "COMPLETED" if rec.status != "COMPLETED" else "OPEN"
    db.commit()
    db.refresh(rec)

    return SuccessResponse(data={
        "status": "success",
        "rec_id": rec_id,
        "new_status": rec.status,
        "completed": rec.status == "COMPLETED"
    })


