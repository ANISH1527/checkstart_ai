from datetime import datetime
import json
import logging
from app.core.celery_app import celery_app
from app.database.connection import SessionLocal
from app.models.idea import Idea
from app.models.pipeline_job import PipelineJob
from app.services.validation_service import ValidationService

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="run_validation_pipeline_task")
def run_validation_pipeline_task(self, idea_id: int):
    db = SessionLocal()
    task_id = self.request.id or "eager_task_id"
    job = db.query(PipelineJob).filter(PipelineJob.celery_task_id == task_id).first()

    if not job:
        job = PipelineJob(
            idea_id=idea_id,
            celery_task_id=task_id,
            status="RUNNING",
            created_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
    else:
        job.status = "RUNNING"
        db.commit()

    try:
        idea = db.query(Idea).filter(Idea.id == idea_id, Idea.is_deleted == False).first()
        if not idea:
            job.status = "FAILED"
            job.completed_at = datetime.utcnow()
            db.commit()
            return {"status": "FAILED", "reason": "Idea not found"}

        val_service = ValidationService(db)
        result = val_service.run_validation_pipeline(idea)

        job.status = "COMPLETED"
        job.result_id = result.get("validation_id")
        job.completed_at = datetime.utcnow()
        db.commit()

        # Webhook Notification Support (Task 6)
        webhook_url = getattr(idea, "webhook_url", None)
        if webhook_url:
            dispatch_webhook_notification(webhook_url, {
                "idea_id": idea.id,
                "job_id": task_id,
                "status": "COMPLETED",
                "overall_score": result.get("overall_score"),
                "classification": result.get("classification")
            })

        return {
            "status": "COMPLETED",
            "job_id": task_id,
            "validation_id": result.get("validation_id"),
            "overall_score": result.get("overall_score")
        }

    except Exception as exc:
        db.rollback()
        job.status = "FAILED"
        job.completed_at = datetime.utcnow()
        db.commit()
        logger.error(f"Celery task run_validation_pipeline_task failed for idea_id {idea_id}: {exc}", exc_info=True)
        raise exc
    finally:
        db.close()


def dispatch_webhook_notification(webhook_url: str, payload: dict):
    import httpx
    import time
    for attempt in range(1, 4):
        try:
            resp = httpx.post(webhook_url, json=payload, timeout=5.0)
            if resp.status_code < 400:
                logger.info(f"Webhook notification delivered to {webhook_url} on attempt {attempt}")
                return
        except Exception as e:
            logger.warning(f"Webhook attempt {attempt} failed for {webhook_url}: {e}")
        time.sleep(0.1 * (2 ** attempt))
    logger.error(f"Failed to deliver webhook notification to {webhook_url} after 3 retries")
