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


class IdeaEmbedding(Base):
    __tablename__ = "idea_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(Integer, ForeignKey("ideas.id", ondelete="CASCADE"), nullable=True)
    version = Column(Integer, nullable=False, default=1)
    model_name = Column(String(100), nullable=False, default="all-MiniLM-L6-v2")
    vector = Column(Text, nullable=False)  # JSON string of 384 floats
    text_hash = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    idea = relationship("Idea", back_populates="idea_embeddings")
