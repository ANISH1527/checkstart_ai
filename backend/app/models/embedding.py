from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(Integer, ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    model_name = Column(String(100), nullable=False)
    vector_reference = Column(Text, nullable=False)  # JSON-encoded array or FAISS vector ID
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    idea = relationship("Idea", back_populates="embeddings")
