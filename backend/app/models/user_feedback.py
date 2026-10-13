from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class UserFeedback(Base):
    """Records user feedback on validation result scores."""
    __tablename__ = "user_feedback"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(
        Integer,
        ForeignKey("validation_results.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    direction = Column(String(20), nullable=False)   # too_high | too_low | accurate
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    validation = relationship("ValidationResult", back_populates="feedback")
    user = relationship("User")
