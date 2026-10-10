from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, or_

from app.core.dependencies import require_admin
from app.database.connection import get_db
from app.models.user import User
from app.models.profile import UserProfile
from app.models.idea import Idea
from app.models.validation import ValidationResult
from app.services.embedding_cache_service import EmbeddingCacheService
from app.services.scoring_service import ScoringService
from app.schemas.envelope import SuccessResponse

router = APIRouter(prefix="/admin", tags=["Admin Observability"])
cache_service = EmbeddingCacheService()


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

    score_dist = {"EXCEPTIONAL": 0, "STRONG": 0, "MODERATE": 0, "WEAK": 0, "VERY_WEAK": 0}
    for val in validations:
        cls = val.classification
        if cls in score_dist:
            score_dist[cls] += 1
        else:
            score_dist["MODERATE"] += 1

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


@router.get("/dashboard")
def get_admin_dashboard(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_ideas = db.query(Idea).filter(Idea.is_deleted == False).count()
    validations = db.query(ValidationResult).all()
    total_validations = len(validations)

    scores = [v.overall_score for v in validations]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = db.query(User).filter(User.created_at >= today_start).count()
    new_vals_today = db.query(ValidationResult).filter(ValidationResult.created_at >= today_start).count()

    # Category buckets
    categories = {"highlyPromising": 0, "promising": 0, "needsImprovement": 0, "highRisk": 0}
    for v in validations:
        cat = ScoringService.classify(v.overall_score)["category"]
        if cat == "Highly Promising":
            categories["highlyPromising"] += 1
        elif cat == "Promising":
            categories["promising"] += 1
        elif cat == "Needs Improvement":
            categories["needsImprovement"] += 1
        elif cat == "High Risk":
            categories["highRisk"] += 1

    category_dist = [
        {"name": "Highly Promising", "value": categories["highlyPromising"], "color": "#10B981"},
        {"name": "Promising", "value": categories["promising"], "color": "#3B82F6"},
        {"name": "Needs Improvement", "value": categories["needsImprovement"], "color": "#F59E0B"},
        {"name": "High Risk", "value": categories["highRisk"], "color": "#EF4444"}
    ]

    score_dist = [
        {"range": "0-39", "count": sum(1 for s in scores if s < 40)},
        {"range": "40-59", "count": sum(1 for s in scores if 40 <= s < 60)},
        {"range": "60-74", "count": sum(1 for s in scores if 60 <= s < 75)},
        {"range": "75-89", "count": sum(1 for s in scores if 75 <= s < 90)},
        {"range": "90-100", "count": sum(1 for s in scores if s >= 90)}
    ]

    # Past 7 days activity
    user_growth = []
    val_activity = []
    for day_offset in range(6, -1, -1):
        target_day = (datetime.utcnow() - timedelta(days=day_offset)).strftime("%b %d")
        user_growth.append({"date": target_day, "users": total_users})
        val_activity.append({"date": target_day, "validations": total_validations})

    admin_stats = {
        "totalUsers": total_users,
        "totalIdeas": total_ideas,
        "totalValidations": total_validations,
        "averageValidationScore": avg_score,
        "categories": categories,
        "newUsersToday": new_users_today,
        "newValidationsToday": new_vals_today,
        "categoryDistribution": category_dist,
        "scoreDistribution": score_dist,
        "userGrowth": user_growth,
        "validationActivity": val_activity
    }

    return SuccessResponse(data={"stats": admin_stats, **admin_stats})


@router.get("/users")
def get_admin_users(
    search: Optional[str] = None,
    provider: Optional[str] = None,
    sort: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        p = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(p), User.email.ilike(p)))
    if provider:
        query = query.filter(User.auth_provider == provider.upper())

    users = query.order_by(User.id.desc()).all()
    user_items = []
    for u in users:
        prof = db.query(UserProfile).filter(UserProfile.user_id == u.id).first()
        ideas_cnt = db.query(Idea).filter(Idea.user_id == u.id, Idea.is_deleted == False).count()
        vals_cnt = (
            db.query(ValidationResult)
            .join(Idea, ValidationResult.idea_id == Idea.id)
            .filter(Idea.user_id == u.id)
            .count()
        )
        user_items.append({
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "authProvider": u.auth_provider,
            "profileImage": u.profile_image,
            "college": prof.college if prof else None,
            "course": prof.course if prof else None,
            "graduationYear": prof.graduation_year if prof else None,
            "ideasCount": ideas_cnt,
            "validationsCount": vals_cnt,
            "createdAt": u.created_at.isoformat() if u.created_at else "",
            "lastLoginAt": u.last_login_at.isoformat() if u.last_login_at else None
        })

    return SuccessResponse(data={"users": user_items, "count": len(user_items)})


@router.get("/users/{user_id}")
def get_admin_user_details(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")

    prof = db.query(UserProfile).filter(UserProfile.user_id == u.id).first()
    ideas = db.query(Idea).filter(Idea.user_id == u.id, Idea.is_deleted == False).all()
    validations = (
        db.query(ValidationResult)
        .join(Idea, ValidationResult.idea_id == Idea.id)
        .filter(Idea.user_id == u.id)
        .all()
    )

    scores = [v.overall_score for v in validations]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    highest_score = max(scores) if scores else 0.0

    idea_items = []
    for idea in ideas:
        latest = (
            db.query(ValidationResult)
            .filter(ValidationResult.idea_id == idea.id)
            .order_by(ValidationResult.version.desc())
            .first()
        )
        latest_report = None
        if latest:
            latest_report = {
                "id": str(latest.id),
                "overallScore": latest.overall_score,
                "validationPercentage": round(latest.overall_score),
                "validationCategory": ScoringService.classify(latest.overall_score)["category"],
                "summary": latest.summary or "",
                "createdAt": latest.created_at.isoformat() if latest.created_at else ""
            }
        idea_items.append({
            "id": str(idea.id),
            "name": idea.title,
            "industry": idea.industry or "General",
            "stage": idea.current_stage or idea.stage or "Idea",
            "createdAt": idea.created_at.isoformat() if idea.created_at else "",
            "latestReport": latest_report
        })

    return SuccessResponse(data={
        "user": {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "authProvider": u.auth_provider,
            "profileImage": u.profile_image,
            "college": prof.college if prof else None,
            "course": prof.course if prof else None,
            "graduationYear": prof.graduation_year if prof else None,
            "createdAt": u.created_at.isoformat() if u.created_at else "",
            "lastLoginAt": u.last_login_at.isoformat() if u.last_login_at else None
        },
        "stats": {
            "totalIdeas": len(ideas),
            "totalValidations": len(validations),
            "averageScore": avg_score,
            "highestScore": highest_score
        },
        "ideas": idea_items
    })


@router.get("/ideas")
def get_admin_ideas(
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Idea).filter(Idea.is_deleted == False)
    if search:
        p = f"%{search.strip()}%"
        query = query.filter(or_(Idea.title.ilike(p), Idea.description.ilike(p)))
    if category:
        query = query.filter(Idea.industry.ilike(f"%{category.strip()}%"))

    ideas = query.order_by(Idea.id.desc()).all()
    idea_items = []
    for idea in ideas:
        owner = db.query(User).filter(User.id == idea.user_id).first()
        prof = db.query(UserProfile).filter(UserProfile.user_id == owner.id).first() if owner else None
        latest = (
            db.query(ValidationResult)
            .filter(ValidationResult.idea_id == idea.id)
            .order_by(ValidationResult.version.desc())
            .first()
        )
        latest_report = None
        if latest:
            latest_report = {
                "id": str(latest.id),
                "overallScore": latest.overall_score,
                "validationPercentage": round(latest.overall_score),
                "validationCategory": ScoringService.classify(latest.overall_score)["category"],
                "summary": latest.summary or "",
                "createdAt": latest.created_at.isoformat() if latest.created_at else ""
            }
        idea_items.append({
            "id": str(idea.id),
            "name": idea.title,
            "industry": idea.industry or "General",
            "location": "Global",
            "currentStage": idea.current_stage or idea.stage or "Idea",
            "createdAt": idea.created_at.isoformat() if idea.created_at else "",
            "user": {
                "id": str(owner.id) if owner else "",
                "name": owner.name if owner else "Unknown",
                "email": owner.email if owner else "",
                "college": prof.college if prof else None,
                "profileImage": owner.profile_image if owner else None
            },
            "latestReport": latest_report
        })

    return SuccessResponse(data={"ideas": idea_items, "count": len(idea_items)})


@router.get("/reports")
def get_admin_reports(
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort: Optional[str] = None,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(ValidationResult).join(Idea, ValidationResult.idea_id == Idea.id)
    if search:
        p = f"%{search.strip()}%"
        query = query.filter(or_(Idea.title.ilike(p), ValidationResult.summary.ilike(p)))

    vals = query.order_by(ValidationResult.id.desc()).all()
    report_items = []
    for v in vals:
        idea = db.query(Idea).filter(Idea.id == v.idea_id).first()
        owner = db.query(User).filter(User.id == idea.user_id).first() if idea else None
        prof = db.query(UserProfile).filter(UserProfile.user_id == owner.id).first() if owner else None

        report_items.append({
            "id": str(v.id),
            "startupIdeaId": str(idea.id) if idea else "",
            "startupName": idea.title if idea else "Unknown",
            "industry": idea.industry or "General" if idea else "General",
            "user": {
                "id": str(owner.id) if owner else "",
                "name": owner.name if owner else "Unknown",
                "email": owner.email if owner else "",
                "college": prof.college if prof else None,
                "profileImage": owner.profile_image if owner else None
            },
            "overallScore": v.overall_score,
            "validationPercentage": round(v.overall_score),
            "validationCategory": ScoringService.classify(v.overall_score)["category"],
            "summary": v.summary or "",
            "createdAt": v.created_at.isoformat() if v.created_at else ""
        })

    return SuccessResponse(data={"reports": report_items, "count": len(report_items)})
