import json
from typing import List, Optional, Any, Dict, Union
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.idea import Idea
from app.models.validation import ValidationResult
from app.repositories.idea_repository import IdeaRepository
from app.repositories.validation_repository import ValidationRepository
from app.services.scoring_service import ScoringService, FRAMEWORK_VERSION
from app.schemas.envelope import SuccessResponse
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(tags=["Idea Comparison"])


class CompareRequest(BaseModel):
    idea_ids: Optional[List[Union[int, str]]] = Field(default=None, alias="ideaIds")
    ideaIds: Optional[List[Union[int, str]]] = None

    class Config:
        populate_by_name = True


def _generate_comparison_synthesis(ideas_data: List[Dict[str, Any]]) -> str:
    """Generate comparative synthesis highlighting relative strengths and risks."""
    summary_parts = []
    
    # Sort ideas descending by score
    sorted_ideas = sorted(ideas_data, key=lambda x: x["scores"]["overallScore"] if x.get("scores") else 0, reverse=True)
    top_idea = sorted_ideas[0]
    
    # Check if Gemini can be invoked
    gemini_key = getattr(settings, "GEMINI_API_KEY", "")
    if gemini_key and gemini_key.strip() not in ["", "none", "n/a"]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-pro")
            prompt = (
                "You are an expert startup venture partner. Compare the following startup ideas based on their validated scores and metrics:\n\n"
                + json.dumps([{
                    "name": i["name"],
                    "industry": i["industry"],
                    "stage": i["stage"],
                    "overallScore": i["scores"]["overallScore"],
                    "scores": i["scores"],
                    "summary": i["summary"]
                } for i in sorted_ideas], indent=2)
                + "\n\nProvide a concise 2-3 paragraph comparative analysis discussing relative market potential, execution feasibility, and competitive moat. Highlight the leading opportunity."
            )
            response = model.generate_content(prompt)
            if response and response.text:
                return (
                    response.text.strip()
                    + "\n\n*Disclaimer: This comparison is decision support analysis and does not constitute investment or business advice.*"
                )
        except Exception as e:
            logger.warning(f"Gemini comparison generation failed, falling back to heuristic synthesis: {e}")

    # Heuristic synthesis
    summary_parts.append(
        f"Among the compared ventures, **{top_idea['name']}** ranks highest with an overall validation score of "
        f"{top_idea['scores']['overallScore']}/100 ({top_idea['scores']['validationCategory']}), showing standout potential in its target domain ({top_idea['industry']})."
    )

    if len(sorted_ideas) > 1:
        runner_up = sorted_ideas[1]
        summary_parts.append(
            f"**{runner_up['name']}** follows at {runner_up['scores']['overallScore']}/100. "
            f"While {top_idea['name']} leads in overall viability, comparing their underlying parameters reveals distinct strategic trade-offs: "
            f"ensure you validate primary unit economics and customer acquisition costs before committing resources."
        )

    summary_parts.append(
        "Priority should be allocated to resolving the highest-risk assumptions identified in the individual validation reports."
    )

    summary_text = " ".join(summary_parts)
    return summary_text + "\n\n*Disclaimer: This comparison is decision support analysis and does not constitute investment or business advice.*"


def _execute_comparison(payload: CompareRequest, current_user: User, db: Session):
    raw_ids = payload.idea_ids or payload.ideaIds
    if not raw_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ideaIds list is required."
        )

    try:
        parsed_ids = [int(i) for i in raw_ids]
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All idea IDs must be valid integers or integer strings."
        )

    unique_ids = list(dict.fromkeys(parsed_ids))
    if len(unique_ids) < 2 or len(unique_ids) > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Comparison requires between 2 and 4 distinct ideas. Provided: {len(unique_ids)}."
        )

    idea_repo = IdeaRepository(db)
    val_repo = ValidationRepository(db)

    ideas_list = []
    for idea_id in unique_ids:
        idea = idea_repo.get_by_id_and_user(idea_id, current_user.id)
        if not idea:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Idea with ID {idea_id} was not found or access is denied."
            )

        latest_val = val_repo.get_latest_validation(idea_id)
        if not latest_val:
            idea_name = getattr(idea, "title", getattr(idea, "name", ""))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Idea '{idea_name}' (ID: {idea_id}) has not been validated yet. All ideas must have a completed validation report to be compared."
            )

        # Framework check
        val_fw = getattr(latest_val, "framework_version", None) or FRAMEWORK_VERSION
        if val_fw != FRAMEWORK_VERSION:
            logger.info(f"Comparison note: report version is {val_fw}, current framework is {FRAMEWORK_VERSION}")

        # Build 7-parameter scores
        param_dict = {s.parameter: s.score for s in latest_val.scores}
        seven_params = ScoringService.aggregate_to_7_parameters(param_dict)
        classification_info = ScoringService.classify(latest_val.overall_score)

        # Extract strengths & weaknesses
        analysis_data = latest_val.analysis_json or {}
        strengths = analysis_data.get("strengths") or [
            f"Strong initial validation in {idea.industry or 'market'}",
            "Viable product proposition"
        ]
        weaknesses = analysis_data.get("weaknesses") or [
            "Customer acquisition channels need testing",
            "Competition requires continuous monitoring"
        ]

        scores_payload = {
            **seven_params,
            "overallScore": latest_val.overall_score,
            "validationPercentage": round(latest_val.overall_score),
            "validationCategory": classification_info["category"]
        }

        ideas_list.append({
            "id": str(idea.id),
            "name": getattr(idea, "title", getattr(idea, "name", "")),
            "industry": idea.industry or "General",
            "stage": getattr(idea, "stage", getattr(idea, "current_stage", "Idea")),
            "businessModel": idea.business_model or "Not specified",
            "reportId": str(latest_val.id),
            "scores": scores_payload,
            "summary": latest_val.summary or idea.description or "",
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendedAction": latest_val.recommended_action or "Proceed to user discovery interviews."
        })

    # Sort rankedOrder by overallScore descending
    ranked_order = [
        item["id"] for item in sorted(ideas_list, key=lambda x: x["scores"]["overallScore"], reverse=True)
    ]

    comparison_summary = _generate_comparison_synthesis(ideas_list)

    result_data = {
        "ideas": ideas_list,
        "rankedOrder": ranked_order,
        "comparisonSummary": comparison_summary
    }

    return SuccessResponse(data=result_data)


@router.post("/comparisons")
def compare_ideas(
    payload: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _execute_comparison(payload, current_user, db)


@router.post("/ideas/compare")
def compare_ideas_alias(
    payload: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _execute_comparison(payload, current_user, db)


@router.get("/comparisons/{idea_ids_slug}")
def get_comparison_by_slug(
    idea_ids_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ids = [i.strip() for i in idea_ids_slug.split(",") if i.strip()]
    return _execute_comparison(CompareRequest(ideaIds=ids), current_user, db)
