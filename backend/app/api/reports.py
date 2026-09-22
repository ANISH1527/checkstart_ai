from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.api.validation import get_validation as get_latest_validation
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{idea_id}/markdown", response_class=PlainTextResponse)
def export_markdown_report(
    idea_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    val_res = get_latest_validation(idea_id=idea_id, current_user=current_user, db=db)
    val_data = val_res.data if hasattr(val_res, "data") else val_res
    report_service = ReportService()
    markdown_out = report_service.generate_markdown_report(val_data)
    return markdown_out

