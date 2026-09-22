from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    validation_id = Column(Integer, ForeignKey("validation_results.id", ondelete="CASCADE"), nullable=False)
    source_name = Column(String(150), nullable=False)
    source_url = Column(String(500), nullable=True)
    retrieved_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    claim = Column(Text, nullable=False)
    evidence_summary = Column(Text, nullable=False)
    reliability = Column(String(50), nullable=False, default="MEDIUM")

    validation = relationship("ValidationResult", back_populates="evidence")
