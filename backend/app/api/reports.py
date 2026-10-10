from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.idea import Idea
from app.models.validation import ValidationResult
from app.repositories.idea_repository import IdeaRepository
from app.repositories.validation_repository import ValidationRepository
from app.services.report_service import ReportService
from app.services.validation_service import ValidationService
from app.services.scoring_service import ScoringService
from app.api.ideas import _format_idea
from app.schemas.envelope import SuccessResponse

router = APIRouter(tags=["Reports & Validation Analysis"])


def format_validation_report(val: ValidationResult, idea: Idea, db: Session) -> Dict[str, Any]:
    classification_info = ScoringService.classify(val.overall_score)
    param_dict = {s.parameter: s.score for s in val.scores}
    seven_params = ScoringService.aggregate_to_7_parameters(param_dict)

    # Find previous report if any
    prev = (
        db.query(ValidationResult)
        .filter(ValidationResult.idea_id == idea.id, ValidationResult.version < val.version)
        .order_by(ValidationResult.version.desc())
        .first()
    )

    analysis_data = val.analysis_json or {}

    strengths = analysis_data.get("strengths") or [
        "Core value proposition clearly differentiated",
        "Target market segment demonstrates latent demand",
        "Solution architecture aligns with primary customer pain points"
    ]
    weaknesses = analysis_data.get("weaknesses") or [
        "Customer discovery interview data is not yet quantified",
        "Unit economics and customer acquisition costs require validation",
        "Distribution moat needs proactive protection against incumbents"
    ]

    risks = analysis_data.get("risks") or [
        {"risk": "Market adoption latency", "severity": "Medium", "mitigation": "Run customer discovery pilots"},
        {"risk": "Competitive response", "severity": "Medium", "mitigation": "Accelerate proprietary feature release"}
    ]
    formatted_risks = []
    for r in risks:
        if isinstance(r, dict):
            formatted_risks.append({
                "risk": r.get("risk") or r.get("claim") or "Execution risk",
                "severity": r.get("severity") or "Medium",
                "mitigation": r.get("mitigation") or "Conduct focused customer interviews"
            })
        else:
            formatted_risks.append({
                "risk": str(r),
                "severity": "Medium",
                "mitigation": "Iterate on user feedback"
            })

    recommendations = analysis_data.get("recommendations") or [
        "Conduct 10-15 structured user interviews with target persona.",
        "Launch an unbranded landing page test to evaluate conversion intent.",
        "Define primary North Star metric and 90-day retention hypothesis."
    ]
    if recommendations and isinstance(recommendations[0], dict):
        recommendations = [r.get("action", str(r)) for r in recommendations]

    report_analysis = {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "marketAnalysis": analysis_data.get("market_analysis") or (
            f"Market dynamics for {idea.industry or 'target sector'} show viable expansion room. "
            "Addressable customer demand exhibits early traction potential."
        ),
        "competitionAnalysis": analysis_data.get("competition_analysis") or (
            "Differentiated positioning relative to direct and indirect alternatives; focus on execution speed."
        ),
        "targetCustomerAnalysis": analysis_data.get("target_customer_analysis") or (
            f"Target audience: {idea.target_customer or 'Defined founder persona'}. Focus on high-urgency friction points."
        ),
        "innovationAnalysis": analysis_data.get("innovation_analysis") or (
            "Novel solution configuration delivering clear value delta over manual or fragmented alternatives."
        ),
        "feasibilityAnalysis": analysis_data.get("feasibility_analysis") or (
            "High implementation feasibility with modern cloud tooling and API ecosystem."
        ),
        "revenueAnalysis": analysis_data.get("revenue_analysis") or (
            f"Revenue model: {idea.revenue_model or 'Value-based recurring subscription'}. Unit economics appear sound."
        ),
        "risks": formatted_risks,
        "recommendations": recommendations,
        "finalVerdict": val.strategic_verdict or val.summary or "Viable venture concept with clear next validation milestones.",
        "recommendedAction": val.recommended_action or "Begin target user problem-interview phase."
    }

    return {
        "id": str(val.id),
        "startupIdeaId": str(idea.id),
        "startupIdea": _format_idea(idea, db),
        "conversationId": str(val.session_id) if val.session_id else None,
        "versionNumber": val.version,
        "previousReportId": str(prev.id) if prev else None,
        "scores": seven_params,
        "overallScore": val.overall_score,
        "validationPercentage": round(val.overall_score),
        "validationCategory": classification_info["category"],
        "summary": val.summary or idea.description or "",
        "createdAt": val.created_at.isoformat() if val.created_at else "",
        "analysis": report_analysis
    }


@router.get("/reports/{report_id}")
@router.get("/validation/{report_id}")
def get_report_by_id(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    try:
        val_id = int(report_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report ID must be a valid integer."
        )

    val = db.query(ValidationResult).filter(ValidationResult.id == val_id).first()
    if not val:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Validation report with ID {report_id} not found."
        )

    idea = db.query(Idea).filter(Idea.id == val.idea_id).first()
    if not idea or (idea.user_id != current_user.id and getattr(current_user, "role", "USER") != "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Validation report not found or access denied."
        )

    report_payload = format_validation_report(val, idea, db)
    return SuccessResponse(data={"report": report_payload, **report_payload})


@router.post("/validation/analyze/{idea_id}")
def analyze_idea_direct(
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

    val_service = ValidationService(db)
    pipeline_res = val_service.run_validation_pipeline(idea)

    val_id = pipeline_res.get("validation_id")
    val = db.query(ValidationResult).filter(ValidationResult.id == val_id).first()
    if not val:
        raise HTTPException(status_code=500, detail="Validation execution completed but result record not found.")

    report_payload = format_validation_report(val, idea, db)
    return SuccessResponse(data={
        "report": report_payload,
        **report_payload,
        "message": "Validation analysis completed successfully."
    })


@router.get("/reports/{idea_id}/markdown", response_class=PlainTextResponse)
def export_markdown_report(
    idea_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    val_repo = ValidationRepository(db)
    val = val_repo.get_latest_validation(idea_id)
    if not val:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No validation report found.")

    idea_repo = IdeaRepository(db)
    idea = idea_repo.get_by_id_and_user(idea_id, current_user.id)
    if not idea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found.")

    report_data = format_validation_report(val, idea, db)
    report_service = ReportService()
    markdown_out = report_service.generate_markdown_report(report_data)
    return markdown_out
