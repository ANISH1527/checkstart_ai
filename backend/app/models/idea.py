from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Idea(Base):
    __tablename__ = "ideas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    problem = Column(Text, nullable=True)
    target_customer = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    industry = Column(String(100), nullable=True)
    business_model = Column(String(100), nullable=True)
    revenue_model = Column(String(100), nullable=True)
    pricing = Column(String(100), nullable=True)
    technology = Column(Text, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    webhook_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="ideas")
    validations = relationship("ValidationResult", back_populates="idea", cascade="all, delete-orphan")
    embeddings = relationship("Embedding", back_populates="idea", cascade="all, delete-orphan")
