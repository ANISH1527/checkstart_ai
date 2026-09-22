from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RootCauseItem(BaseModel):
    cause: str
    status: str = Field(..., description="SUPPORTED, LIKELY, UNKNOWN")
    source: str = Field(..., description="idea_profile, information_gap, llm_analysis, similarity_results, evidence_layer")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)


class ParameterRootCause(BaseModel):
    parameter: str
    score: float
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW, NONE")
    root_causes: List[RootCauseItem] = []


class AffectedParameterImpact(BaseModel):
    parameter: str
    expected_direction: str = Field(..., description="IMPROVE, MAY_IMPROVE")
    reason: str


class ImprovementImpactPrediction(BaseModel):
    action: str
    potentially_affected_parameters: List[AffectedParameterImpact] = []


class StructuredRecommendation(BaseModel):
    id: str
    parameter: str
    category: str = Field(default="GENERAL", description="Category matching parameter or functional area")
    current_score: float
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW")
    root_cause: str
    missing_information: str
    objective: str
    action: str
    priority: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW")
    effort: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH")
    why_it_matters: str
    validation_method: str
    expected_impact: str
    affected_parameters: List[str] = []
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    status: str = Field(default="OPEN", description="OPEN, COMPLETED")


class TopActionSummary(BaseModel):
    rank: int
    title: str
    action: str
    parameter: str
    priority: str
    reason: str


class RecommendationEngineOutput(BaseModel):
    root_causes: List[ParameterRootCause] = []
    recommendations: List[StructuredRecommendation] = []
    top_3_actions: List[TopActionSummary] = []
    impact_predictions: List[ImprovementImpactPrediction] = []


class ParameterScoreComparison(BaseModel):
    parameter: str
    v1_score: float
    v2_score: float
    delta: float
    associated_change: str
    confidence: float = 0.85


class VersionComparisonResult(BaseModel):
    idea_id: int
    v1_version: int
    v2_version: int
    overall_score_v1: float
    overall_score_v2: float
    overall_delta: float
    parameter_comparisons: List[ParameterScoreComparison] = []
    completed_recommendations: List[str] = []
    unresolved_recommendations: List[str] = []
