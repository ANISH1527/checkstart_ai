from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


class IdeaCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=5000)
    problem: Optional[str] = Field(None, max_length=3000)
    target_customer: Optional[str] = Field(None, max_length=1000)
    solution: Optional[str] = None
    industry: Optional[str] = None
    business_model: Optional[str] = None
    revenue_model: Optional[str] = None
    pricing: Optional[str] = None
    technology: Optional[str] = None
    webhook_url: Optional[str] = None

    @field_validator("*", mode="before")
    @classmethod
    def strip_whitespace(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value


class IdeaUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    problem: Optional[str] = Field(None, max_length=3000)
    target_customer: Optional[str] = Field(None, max_length=1000)
    solution: Optional[str] = None
    industry: Optional[str] = None
    business_model: Optional[str] = None
    revenue_model: Optional[str] = None
    pricing: Optional[str] = None
    technology: Optional[str] = None
    webhook_url: Optional[str] = None

    @field_validator("*", mode="before")
    @classmethod
    def strip_whitespace(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value


class IdeaResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    problem: Optional[str] = None
    target_customer: Optional[str] = None
    solution: Optional[str] = None
    industry: Optional[str] = None
    business_model: Optional[str] = None
    revenue_model: Optional[str] = None
    pricing: Optional[str] = None
    technology: Optional[str] = None
    webhook_url: Optional[str] = None
    version: int
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
