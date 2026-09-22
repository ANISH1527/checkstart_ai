from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    rec_id = Column(String(50), nullable=True)  # e.g. rec_001
    validation_id = Column(Integer, ForeignKey("validation_results.id", ondelete="CASCADE"), nullable=False)
    parameter = Column(String(100), nullable=True)
    current_score = Column(Float, nullable=True)
    severity = Column(String(20), nullable=True)  # CRITICAL, HIGH, MEDIUM, LOW
    root_cause = Column(Text, nullable=True)
    missing_information = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)
    action = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, default="GENERAL")
    priority = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    success_metric = Column(Text, nullable=False, default="Completion of action")
    estimated_effort = Column(String(50), nullable=False, default="MEDIUM")
    actionability = Column(String(20), nullable=False, default="HIGH")
    why_it_matters = Column(Text, nullable=True)
    validation_method = Column(Text, nullable=True)
    expected_impact = Column(Text, nullable=True)
    affected_parameters = Column(Text, nullable=True)  # JSON serialized list of parameters
    confidence = Column(Float, nullable=False, default=0.85)
    status = Column(String(20), nullable=False, default="OPEN")  # OPEN, COMPLETED

    validation = relationship("ValidationResult", back_populates="recommendations")
