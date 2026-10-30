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
    prompt_version = Column(String(50), nullable=False, default="v1.3")
    embedding_model_version = Column(String(50), nullable=True, default="all-MiniLM-L6-v2-v1.0")
    scoring_version = Column(String(50), nullable=True, default="v2.0")
    input_hash = Column(String(64), nullable=False)
    overall_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    confidence_breakdown = Column(JSON, nullable=True)
    score_overrides = Column(JSON, nullable=True)
    rules_version = Column(String(50), nullable=True, default="v1")
    category = Column(String(50), nullable=True)
    sample_spread = Column(JSON, nullable=True)
    classification = Column(String(50), nullable=False)
    pipeline_timing = Column(JSON, nullable=True)
    session_id = Column(String(64), ForeignKey("validation_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    framework_name = Column(String(50), default="report_v1", nullable=False)
    framework_version = Column(String(20), default="v1.0", nullable=False)
    previous_report_id = Column(Integer, ForeignKey("validation_results.id", ondelete="SET NULL"), nullable=True)
    percentage = Column(Float, nullable=True)
    market_demand = Column(Float, nullable=True)
    problem_severity = Column(Float, nullable=True)
    competition = Column(Float, nullable=True)
    target_customer = Column(Float, nullable=True)
    innovation = Column(Float, nullable=True)
    feasibility = Column(Float, nullable=True)
    revenue_potential = Column(Float, nullable=True)
    generation_mode = Column(String(30), default="ai_standard", nullable=False)
    degraded = Column(Boolean, default=False, nullable=False)
    inputs_changed = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    strategic_verdict = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    analysis_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    @property
    def confidence(self) -> float:
        return self.confidence_score

    @confidence.setter
    def confidence(self, val: float):
        self.confidence_score = val

    idea = relationship("Idea", back_populates="validations")
    session = relationship("ValidationSession", back_populates="validations")
    scores = relationship("ValidationScore", back_populates="validation", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="validation", cascade="all, delete-orphan")
    competitors = relationship("Competitor", back_populates="validation", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="validation", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="validation", cascade="all, delete-orphan")
    feedback = relationship("UserFeedback", back_populates="validation", cascade="all, delete-orphan")
    report_analysis = relationship("ReportAnalysis", back_populates="validation", uselist=False, cascade="all, delete-orphan")
