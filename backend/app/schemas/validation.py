from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ScoreDetail(BaseModel):
    parameter: str
    score: float
    confidence: float
    reason: str
    status: Optional[str] = "SUPPORTED"


class CompetitorDetail(BaseModel):
    name: str
    similarity_score: float
    target_customer: Optional[str] = None
    business_model: Optional[str] = None
    pricing: Optional[str] = None
    differentiator: Optional[str] = None
    source_url: Optional[str] = None


class EvidenceDetail(BaseModel):
    source_name: str
    source_url: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    claim: str
    evidence_summary: str
    reliability: str = "MEDIUM"


class RecommendationDetail(BaseModel):
    id: Optional[str] = None
    action: str
    category: Optional[str] = "GENERAL"
    priority: str = "HIGH"
    success_metric: Optional[str] = "Completion of action"
    estimated_effort: Optional[str] = "MEDIUM"
    actionability: Optional[str] = "HIGH"
    parameter: Optional[str] = None
    current_score: Optional[float] = None
    severity: Optional[str] = None
    root_cause: Optional[str] = None
    missing_information: Optional[str] = None
    objective: Optional[str] = None
    effort: Optional[str] = "MEDIUM"
    why_it_matters: Optional[str] = None
    validation_method: Optional[str] = None
    expected_impact: Optional[str] = None
    affected_parameters: Optional[List[str]] = []
    confidence: Optional[float] = 0.85
    status: Optional[str] = "OPEN"


class InformationGapDetail(BaseModel):
    category: str
    priority: str
    question: str
    reason: str
    validation_method: str


class VerificationResultDetail(BaseModel):
    passed: bool
    issues: List[str] = []


class ValidationResponse(BaseModel):
    idea_id: int
    version: int
    validation_id: Optional[int] = None
    overall_score: float
    confidence_score: float
    classification: str
    scores: Dict[str, float]
    score_details: List[ScoreDetail] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    risks: List[str] = []
    information_gaps: List[InformationGapDetail] = []
    competitors: List[CompetitorDetail] = []
    evidence: List[EvidenceDetail] = []
    recommendations: List[RecommendationDetail] = []
    root_causes: Optional[List[Dict[str, Any]]] = []
    top_3_actions: Optional[List[Dict[str, Any]]] = []
    impact_predictions: Optional[List[Dict[str, Any]]] = []
    verification: VerificationResultDetail

    model_config = ConfigDict(from_attributes=True)


class ValidationHistoryItem(BaseModel):
    version: int
    date: datetime
    overall_score: float
    confidence_score: float
    classification: str
    major_weaknesses: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class ValidationJobResponse(BaseModel):
    job_id: str
    status: str


class ValidationStatusResponse(BaseModel):
    status: str
    result_id: Optional[int] = None


class ValidationHistoryEnvelope(BaseModel):
    items: List[ValidationHistoryItem]
    total: int
    limit: int
    offset: int
    has_more: bool

