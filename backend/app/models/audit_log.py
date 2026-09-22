from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    validation_id = Column(Integer, ForeignKey("validation_results.id", ondelete="CASCADE"), nullable=False)
    event = Column(String(100), nullable=False)
    log_metadata = Column("metadata", Text, nullable=True)  # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    validation = relationship("ValidationResult", back_populates="audit_logs")
