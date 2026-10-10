from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base


class ValidationResult(Base):
    __tablename__ = "validation_results"
    __table_args__ = (
        UniqueConstraint("idea_id", "version", name="uq_validation_result_idea_version"),
    )

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(Integer, ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    prompt_version = Column(String(50), nullable=False)
    input_hash = Column(String(64), nullable=False)
    overall_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    classification = Column(String(50), nullable=False)
    pipeline_timing = Column(JSON, nullable=True)
    session_id = Column(String(64), ForeignKey("validation_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    framework_version = Column(String(20), default="v1.0", nullable=False)
    generation_mode = Column(String(30), default="ai_standard", nullable=False)
    degraded = Column(Boolean, default=False, nullable=False)
    inputs_changed = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    strategic_verdict = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    analysis_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    idea = relationship("Idea", back_populates="validations")
    session = relationship("ValidationSession", back_populates="validations")
    scores = relationship("ValidationScore", back_populates="validation", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="validation", cascade="all, delete-orphan")
    competitors = relationship("Competitor", back_populates="validation", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="validation", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="validation", cascade="all, delete-orphan")
