from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(Integer, primary_key=True, index=True)
    validation_id = Column(Integer, ForeignKey("validation_results.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    similarity_score = Column(Float, nullable=False)
    target_customer = Column(Text, nullable=True)
    business_model = Column(String(100), nullable=True)
    pricing = Column(String(100), nullable=True)
    differentiator = Column(Text, nullable=True)
    source_url = Column(String(500), nullable=True)

    validation = relationship("ValidationResult", back_populates="competitors")
