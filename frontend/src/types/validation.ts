export interface ScoreDetail {
  parameter: string;
  score: number;
  confidence: number;
  reason: string;
  status?: string;
}

export interface CompetitorDetail {
  name: string;
  similarity_score: number;
  target_customer?: string;
  business_model?: string;
  pricing?: string;
  differentiator?: string;
  source_url?: string;
}

export interface EvidenceDetail {
  source_name: string;
  source_url?: string;
  retrieved_at?: string;
  claim: string;
  evidence_summary: string;
  reliability: string;
}

export interface RecommendationDetail {
  id?: string;
  action: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  success_metric?: string;
  estimated_effort?: string;
  actionability?: 'HIGH' | 'MEDIUM' | 'LOW';
  parameter?: string;
  current_score?: number;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  root_cause?: string;
  missing_information?: string;
  objective?: string;
  effort?: 'LOW' | 'MEDIUM' | 'HIGH';
  why_it_matters?: string;
  validation_method?: string;
  expected_impact?: string;
  affected_parameters?: string[];
  confidence?: number;
  status?: 'OPEN' | 'COMPLETED';
}

export interface RootCauseItem {
  cause: string;
  status: 'SUPPORTED' | 'LIKELY' | 'UNKNOWN';
  source: string;
  confidence: number;
}

export interface ParameterRootCause {
  parameter: string;
  score: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  root_causes: RootCauseItem[];
}

export interface TopActionSummary {
  rank: number;
  title: string;
  action: string;
  parameter: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface AffectedParameterImpact {
  parameter: string;
  expected_direction: 'IMPROVE' | 'MAY_IMPROVE';
  reason: string;
}

export interface ImprovementImpactPrediction {
  action: string;
  potentially_affected_parameters: AffectedParameterImpact[];
}

export interface InformationGapDetail {
  category: string;
  priority: string;
  question: string;
  reason: string;
  validation_method: string;
}

export interface VerificationResultDetail {
  passed: boolean;
  issues: string[];
}

export interface ValidationResponse {
  idea_id: number;
  version: number;
  validation_id?: number;
  overall_score: number;
  confidence_score: number;
  classification: 'EXCEPTIONAL' | 'STRONG' | 'MODERATE' | 'WEAK' | 'VERY_WEAK';
  scores: Record<string, number>;
  score_details: ScoreDetail[];
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  information_gaps: InformationGapDetail[];
  competitors: CompetitorDetail[];
  evidence: EvidenceDetail[];
  recommendations: RecommendationDetail[];
  root_causes?: ParameterRootCause[];
  top_3_actions?: TopActionSummary[];
  impact_predictions?: ImprovementImpactPrediction[];
  verification: VerificationResultDetail;
}

export interface ValidationHistoryItem {
  version: number;
  date: string;
  overall_score: number;
  confidence_score: number;
  classification: string;
  major_weaknesses: string[];
}

export interface ParameterScoreComparison {
  parameter: string;
  v1_score: number;
  v2_score: number;
  delta: number;
  associated_change: string;
  confidence: number;
}

export interface VersionComparisonResult {
  has_comparison: boolean;
  idea_id?: number;
  v1_version?: number;
  v2_version?: number;
  overall_score_v1?: number;
  overall_score_v2?: number;
  overall_delta?: number;
  parameter_comparisons?: ParameterScoreComparison[];
  completed_recommendations?: string[];
  unresolved_recommendations?: string[];
  message?: string;
}
