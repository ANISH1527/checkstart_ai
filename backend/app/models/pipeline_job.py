from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class PipelineJob(Base):
    __tablename__ = "pipeline_jobs"

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(Integer, ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    celery_task_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, RUNNING, COMPLETED, FAILED
    result_id = Column(Integer, ForeignKey("validation_results.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    idea = relationship("Idea")
    result = relationship("ValidationResult")
