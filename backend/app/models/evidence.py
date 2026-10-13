from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    validation_id = Column(Integer, ForeignKey("validation_results.id", ondelete="CASCADE"), nullable=False)
    source_name = Column(String(150), nullable=False, default="System")
    source_url = Column(String(500), nullable=True)
    retrieved_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    claim = Column(Text, nullable=False, default="")
    claim_type = Column(String(100), nullable=True)
    evidence_summary = Column(Text, nullable=False, default="")
    reliability = Column(String(50), nullable=True, default="UNKNOWN")

    @property
    def content(self) -> str:
        return self.claim or self.evidence_summary or ""

    @content.setter
    def content(self, value: str):
        self.claim = value
        self.evidence_summary = value

    validation = relationship("ValidationResult", back_populates="evidence")
