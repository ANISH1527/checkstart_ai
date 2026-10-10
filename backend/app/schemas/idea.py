from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class IdeaCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    name: Optional[str] = None
    description: Optional[str] = Field(None, max_length=5000)
    problem: Optional[str] = Field(None, max_length=3000)
    problemStatement: Optional[str] = None
    target_customer: Optional[str] = Field(None, max_length=1000)
    targetCustomer: Optional[str] = None
    solution: Optional[str] = None
    proposedSolution: Optional[str] = None
    industry: Optional[str] = None
    business_model: Optional[str] = None
    businessModel: Optional[str] = None
    revenue_model: Optional[str] = None
    revenueModel: Optional[str] = None
    pricing: Optional[str] = None
    technology: Optional[str] = None
    webhook_url: Optional[str] = None
    currentStage: Optional[str] = None
    location: Optional[str] = None

    class Config:
        populate_by_name = True

    @field_validator("*", mode="before")
    @classmethod
    def strip_whitespace(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def reconcile_fields(self):
        if not self.title and self.name:
            self.title = self.name
        if not self.problem and self.problemStatement:
            self.problem = self.problemStatement
        if not self.solution and self.proposedSolution:
            self.solution = self.proposedSolution
        if not self.target_customer and self.targetCustomer:
            self.target_customer = self.targetCustomer
        if not self.business_model and self.businessModel:
            self.business_model = self.businessModel
        if not self.revenue_model and self.revenueModel:
            self.revenue_model = self.revenueModel

        if not self.title:
            raise ValueError("title or name is required")
        if not self.description:
            self.description = self.problem or self.solution or self.title

        return self


class IdeaUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    name: Optional[str] = None
    description: Optional[str] = Field(None, max_length=5000)
    problem: Optional[str] = Field(None, max_length=3000)
    problemStatement: Optional[str] = None
    target_customer: Optional[str] = Field(None, max_length=1000)
    targetCustomer: Optional[str] = None
    solution: Optional[str] = None
    proposedSolution: Optional[str] = None
    industry: Optional[str] = None
    business_model: Optional[str] = None
    businessModel: Optional[str] = None
    revenue_model: Optional[str] = None
    revenueModel: Optional[str] = None
    pricing: Optional[str] = None
    technology: Optional[str] = None
    webhook_url: Optional[str] = None
    currentStage: Optional[str] = None
    location: Optional[str] = None

    class Config:
        populate_by_name = True

    @field_validator("*", mode="before")
    @classmethod
    def strip_whitespace(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def reconcile_fields(self):
        if not self.title and self.name:
            self.title = self.name
        if not self.problem and self.problemStatement:
            self.problem = self.problemStatement
        if not self.solution and self.proposedSolution:
            self.solution = self.proposedSolution
        if not self.target_customer and self.targetCustomer:
            self.target_customer = self.targetCustomer
        if not self.business_model and self.businessModel:
            self.business_model = self.businessModel
        if not self.revenue_model and self.revenueModel:
            self.revenue_model = self.revenueModel
        return self


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
