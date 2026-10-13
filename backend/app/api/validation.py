from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.pipeline_job import PipelineJob
from app.repositories.idea_repository import IdeaRepository
from app.repositories.validation_repository import ValidationRepository
from app.schemas.validation import ValidationResponse, ValidationJobResponse, ValidationStatusResponse
from app.services.validation_service import ValidationService
from app.services.tasks import run_validation_pipeline_task
from app.core.limiter import limiter

router = APIRouter(prefix="/ideas", tags=["Validation Engine"])


from app.schemas.envelope import SuccessResponse


@router.post("/{idea_id}/validate")
@limiter.limit("20/minute")
def validate_idea(
    request: Request,
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

    task = run_validation_pipeline_task.delay(idea.id)

    job = db.query(PipelineJob).filter(PipelineJob.celery_task_id == task.id).first()
    if not job:
        job = PipelineJob(
            idea_id=idea.id,
            celery_task_id=task.id,
            status="PENDING",
            created_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    return SuccessResponse(data={"job_id": task.id, "status": job.status})


@router.post("/{idea_id}/revalidate")
def revalidate_idea(
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

    # Increment version to preserve iterative validation history
    idea_repo.increment_version(idea)

    task = run_validation_pipeline_task.delay(idea.id)

    job = db.query(PipelineJob).filter(PipelineJob.celery_task_id == task.id).first()
    if not job:
        job = PipelineJob(
            idea_id=idea.id,
            celery_task_id=task.id,
            status="PENDING",
            created_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    return SuccessResponse(data={"job_id": task.id, "status": job.status})


@router.get("/{idea_id}/validation/status")
def get_validation_status(
    idea_id: int,
    job_id: Optional[str] = None,
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

    query = db.query(PipelineJob).filter(PipelineJob.idea_id == idea_id)
    if job_id:
        query = query.filter(PipelineJob.celery_task_id == job_id)

    job = query.order_by(PipelineJob.created_at.desc()).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No validation job found for this idea."
        )

    return SuccessResponse(data={"status": job.status, "result_id": job.result_id})


@router.get("/{idea_id}/validation")
def get_validation(
    idea_id: int,
    version: Optional[int] = None,
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
    if version is not None:
        target_val = val_repo.get_validation_by_version(idea_id, version)
        if not target_val:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Validation version {version} not found for this idea."
            )
    else:
        target_val = val_repo.get_latest_validation(idea_id)

    if not target_val:
        # Run validation on-demand if never validated before
        val_service = ValidationService(db)
        res = val_service.run_validation_pipeline(idea)
        return SuccessResponse(data=res)

    latest = target_val

    # Construct response from DB records
    param_scores = {s.parameter: s.score for s in latest.scores}
    score_details = [
        {
            "parameter": s.parameter,
            "score": s.score,
            "confidence": s.confidence,
            "reason": s.reason
        }
        for s in latest.scores
    ]

    competitors = [
        {
            "name": c.name,
            "similarity_score": c.similarity_score,
            "target_customer": c.target_customer,
            "business_model": c.business_model,
            "pricing": c.pricing,
            "differentiator": c.differentiator,
            "source_url": c.source_url
        }
        for c in latest.competitors
    ]

    evidence = [
        {
            "source_name": e.source_name,
            "source_url": e.source_url,
            "retrieved_at": e.retrieved_at,
            "claim": e.claim,
            "claim_type": getattr(e, "claim_type", "GENERAL"),
            "evidence_summary": e.evidence_summary,
            "reliability": e.reliability
        }
        for e in latest.evidence
    ]

    import json
    recommendations = [
        {
            "id": r.rec_id or f"rec_{r.id}",
            "action": r.action,
            "category": r.category,
            "priority": r.priority,
            "success_metric": r.success_metric or r.validation_method or "Completion of action",
            "estimated_effort": r.estimated_effort or "MEDIUM",
            "actionability": r.actionability or "HIGH",
            "parameter": r.parameter,
            "current_score": r.current_score,
            "severity": r.severity or r.priority,
            "root_cause": r.root_cause,
            "missing_information": r.missing_information,
            "objective": r.objective,
            "effort": r.estimated_effort or "MEDIUM",
            "why_it_matters": r.why_it_matters,
            "validation_method": r.validation_method,
            "expected_impact": r.expected_impact,
            "affected_parameters": json.loads(r.affected_parameters) if r.affected_parameters else [],
            "confidence": r.confidence,
            "status": r.status or "OPEN"
        }
        for r in latest.recommendations
    ]

    res_data = {
        "idea_id": idea.id,
        "version": latest.version,
        "validation_id": latest.id,
        "overall_score": latest.overall_score,
        "confidence_score": latest.confidence_score,
        "confidence": latest.confidence_score,
        "confidence_breakdown": latest.confidence_breakdown or {},
        "score_overrides": latest.score_overrides or [],
        "classification": latest.classification,
        "prompt_version": latest.prompt_version or "v1.3",
        "embedding_model_version": latest.embedding_model_version or "all-MiniLM-L6-v2-v1.0",
        "scoring_version": latest.scoring_version or "v2.0",
        "pipeline_timing": latest.pipeline_timing or {},
        "scores": param_scores,
        "score_details": score_details,
        "scores_dict": param_scores,
        "strengths": ["Core concept registered"],
        "weaknesses": ["Requires empirical market validation"],
        "risks": ["Competition risk"],
        "information_gaps": [],
        "competitors": competitors,
        "evidence": evidence,
        "recommendations": recommendations,
        "root_causes": [],
        "top_3_actions": [],
        "impact_predictions": [],
        "verification": {"passed": True, "issues": []}
    }
    return SuccessResponse(data=res_data)


@router.post("/{idea_id}/recommendations/{rec_id}/complete")
def toggle_recommendation_complete(
    idea_id: int,
    rec_id: str,
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
    latest = val_repo.get_latest_validation(idea_id)
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No validation found for this idea."
        )

    from app.models.recommendation import Recommendation
    rec = db.query(Recommendation).filter(
        Recommendation.validation_id == latest.id,
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

    return SuccessResponse(data={"status": "success", "rec_id": rec_id, "new_status": rec.status})


@router.get("/{idea_id}/comparison")
def get_validation_comparison(
    idea_id: int,
    v1: Optional[int] = None,
    v2: Optional[int] = None,
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

    if v1 is not None and v2 is not None:
        v1_val = val_repo.get_validation_by_version(idea_id, v1)
        v2_val = val_repo.get_validation_by_version(idea_id, v2)
        if not v1_val or not v2_val:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Validation version {v1} and/or {v2} not found for this idea."
            )
    else:
        history = val_repo.get_validation_history(idea_id)
        if len(history) < 2:
            return SuccessResponse(data={
                "has_comparison": False,
                "message": "At least 2 validation versions are required for comparison."
            })
        v1_val = history[-2]
        v2_val = history[-1]

    val_service = ValidationService(db)
    comp_result = val_service.compare_validations(v1_val, v2_val)
    comp_result["has_comparison"] = True
    comp_result["v1"] = {"version": v1_val.version, "overall_score": v1_val.overall_score}
    comp_result["v2"] = {"version": v2_val.version, "overall_score": v2_val.overall_score}
    comp_result["score_delta"] = comp_result.get("overall_delta", 0.0)

    return SuccessResponse(data=comp_result)


