from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class ValidationScore(Base):
    __tablename__ = "validation_scores"

    id = Column(Integer, primary_key=True, index=True)
    validation_id = Column(Integer, ForeignKey("validation_results.id", ondelete="CASCADE"), nullable=False)
    parameter = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)

    validation = relationship("ValidationResult", back_populates="scores")
