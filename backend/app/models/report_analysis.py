from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class ReportAnalysis(Base):
    __tablename__ = "report_analyses"

    id = Column(Integer, primary_key=True, index=True)
    validation_id = Column(Integer, ForeignKey("validation_results.id", ondelete="CASCADE"), nullable=False, unique=True)
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    risks = Column(JSON, nullable=True)  # list of {risk, severity, mitigation}
    recommendations = Column(JSON, nullable=True)  # list of {id, action, status: "OPEN"|"COMPLETED", impact, effort}
    evidence = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    validation = relationship("ValidationResult", back_populates="report_analysis")
