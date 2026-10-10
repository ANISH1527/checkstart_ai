from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.idea import Idea
from app.models.validation import ValidationResult
from app.models.chat import ValidationSession
from app.services.scoring_service import ScoringService
from app.schemas.envelope import SuccessResponse

router = APIRouter(tags=["Founder Dashboard"])


@router.get("/dashboard/stats")
@router.get("/ideas/dashboard/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Total ideas owned by user
    user_ideas = db.query(Idea).filter(
        Idea.user_id == current_user.id,
        Idea.is_deleted == False
    ).all()
    total_ideas = len(user_ideas)

    # 2. Total validations across all versions
    idea_ids = [i.id for i in user_ideas]
    total_validations = 0
    if idea_ids:
        total_validations = db.query(ValidationResult).filter(
            ValidationResult.idea_id.in_(idea_ids)
        ).count()

    # 3. Active conversations
    active_conversations = db.query(ValidationSession).filter(
        ValidationSession.user_id == current_user.id,
        ValidationSession.is_deleted == False
    ).count()

    # 4. Latest completed report per idea
    latest_reports: List[ValidationResult] = []
    for idea in user_ideas:
        latest = db.query(ValidationResult).filter(
            ValidationResult.idea_id == idea.id
        ).order_by(ValidationResult.version.desc()).first()
        if latest:
            latest_reports.append(latest)

    scores = [r.overall_score for r in latest_reports]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    highest_score = round(max(scores), 1) if scores else 0.0
    lowest_score = round(min(scores), 1) if scores else 0.0
    promising_count = sum(1 for s in scores if s >= 60.0)

    # 5. Category counts
    cat_counts = {
        "highlyPromising": 0,
        "promising": 0,
        "needsImprovement": 0,
        "highRisk": 0
    }
    for s in scores:
        if s >= 80.0:
            cat_counts["highlyPromising"] += 1
        elif s >= 60.0:
            cat_counts["promising"] += 1
        elif s >= 40.0:
            cat_counts["needsImprovement"] += 1
        else:
            cat_counts["highRisk"] += 1

    # 6. Score history timeline (chronological order of reports)
    all_reports = []
    if idea_ids:
        all_reports = db.query(ValidationResult).filter(
            ValidationResult.idea_id.in_(idea_ids)
        ).order_by(ValidationResult.created_at.asc()).limit(20).all()

    idea_map = {i.id: i for i in user_ideas}
    score_history = []
    for r in all_reports:
        idea = idea_map.get(r.idea_id)
        idea_name = idea.title if idea else f"Idea #{r.idea_id}"
        cls_info = ScoringService.classify(r.overall_score)
        score_history.append({
            "id": str(r.id),
            "name": idea_name[:14] + ("..." if len(idea_name) > 14 else ""),
            "fullName": idea_name,
            "score": round(r.overall_score),
            "category": cls_info["category"],
            "date": r.created_at.strftime("%b %d")
        })

    # 7. Recent analyses (up to 10 latest evaluations)
    recent_reports = []
    if idea_ids:
        recent_reports = db.query(ValidationResult).filter(
            ValidationResult.idea_id.in_(idea_ids)
        ).order_by(ValidationResult.created_at.desc()).limit(10).all()

    recent_analyses = []
    for r in recent_reports:
        idea = idea_map.get(r.idea_id)
        idea_name = idea.title if idea else f"Idea #{r.idea_id}"
        industry = idea.industry if idea and idea.industry else "Technology"
        cls_info = ScoringService.classify(r.overall_score)
        total_v = db.query(ValidationResult).filter(ValidationResult.idea_id == r.idea_id).count()

        recent_analyses.append({
            "id": str(r.idea_id),
            "name": idea_name,
            "industry": industry,
            "reportId": str(r.id),
            "versionNumber": r.version,
            "totalVersions": total_v,
            "score": round(r.overall_score),
            "category": cls_info["category"],
            "createdAt": r.created_at.isoformat(),
            "summary": r.summary or f"{idea_name} evaluated across 9 dimensions."
        })

    stats_payload = {
        "totalIdeas": total_ideas,
        "totalValidations": total_validations,
        "activeConversations": active_conversations or total_ideas,
        "averageScore": avg_score,
        "highestScore": highest_score,
        "lowestScore": lowest_score,
        "promisingIdeas": promising_count,
        "categories": cat_counts,
        "scoreHistory": score_history,
        "recentAnalyses": recent_analyses
    }

    return SuccessResponse(data={"stats": stats_payload, **stats_payload})


@router.get("/dashboard/score-history")
def get_score_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = get_dashboard_stats(current_user=current_user, db=db)
    stats_data = res.data if hasattr(res, "data") else res
    return SuccessResponse(data={"scoreHistory": stats_data["stats"]["scoreHistory"]})


@router.get("/dashboard/classification-counts")
def get_classification_counts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = get_dashboard_stats(current_user=current_user, db=db)
    stats_data = res.data if hasattr(res, "data") else res
    return SuccessResponse(data={"categories": stats_data["stats"]["categories"]})


@router.get("/dashboard/recent")
def get_recent_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = get_dashboard_stats(current_user=current_user, db=db)
    stats_data = res.data if hasattr(res, "data") else res
    return SuccessResponse(data={"recentAnalyses": stats_data["stats"]["recentAnalyses"]})

