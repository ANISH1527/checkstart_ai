from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.idea import Idea
from app.schemas.idea import IdeaCreate, IdeaUpdate


class IdeaRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, idea_id: int, include_deleted: bool = False) -> Optional[Idea]:
        query = self.db.query(Idea).filter(Idea.id == idea_id)
        if not include_deleted:
            query = query.filter(Idea.is_deleted == False)
        return query.first()

    def get_by_id_and_user(self, idea_id: int, user_id: int, include_deleted: bool = False) -> Optional[Idea]:
        query = self.db.query(Idea).filter(Idea.id == idea_id, Idea.user_id == user_id)
        if not include_deleted:
            query = query.filter(Idea.is_deleted == False)
        return query.first()

    def get_user_ideas(self, user_id: int, skip: int = 0, limit: int = 100, include_deleted: bool = False) -> List[Idea]:
        query = self.db.query(Idea).filter(Idea.user_id == user_id)
        if not include_deleted:
            query = query.filter(Idea.is_deleted == False)
        return query.offset(skip).limit(limit).all()

    def get_all_ideas(self, skip: int = 0, limit: int = 100, include_deleted: bool = False) -> List[Idea]:
        query = self.db.query(Idea)
        if not include_deleted:
            query = query.filter(Idea.is_deleted == False)
        return query.offset(skip).limit(limit).all()

    def create(self, idea_in: IdeaCreate, user_id: int) -> Idea:
        db_idea = Idea(
            user_id=user_id,
            title=idea_in.title,
            description=idea_in.description,
            problem=idea_in.problem,
            target_customer=idea_in.target_customer,
            solution=idea_in.solution,
            industry=idea_in.industry,
            business_model=idea_in.business_model,
            revenue_model=idea_in.revenue_model,
            pricing=idea_in.pricing,
            technology=idea_in.technology,
            webhook_url=getattr(idea_in, "webhook_url", None),
            version=1,
            is_deleted=False
        )
        self.db.add(db_idea)
        self.db.commit()
        self.db.refresh(db_idea)
        return db_idea

    def update(self, db_idea: Idea, idea_in: IdeaUpdate) -> Idea:
        update_data = idea_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_idea, field, value)
        self.db.commit()
        self.db.refresh(db_idea)
        return db_idea

    def increment_version(self, db_idea: Idea) -> Idea:
        db_idea.version += 1
        self.db.commit()
        self.db.refresh(db_idea)
        return db_idea

    def soft_delete(self, db_idea: Idea) -> None:
        db_idea.is_deleted = True
        db_idea.deleted_at = datetime.utcnow()
        self.db.commit()

    def hard_delete(self, db_idea: Idea) -> None:
        self.db.delete(db_idea)
        self.db.commit()

    def delete(self, db_idea: Idea) -> None:
        self.soft_delete(db_idea)
