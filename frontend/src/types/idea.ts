export interface IdeaCreateRequest {
  title: string;
  description: string;
  problem?: string;
  target_customer?: string;
  solution?: string;
  industry?: string;
  business_model?: string;
  revenue_model?: string;
  pricing?: string;
  technology?: string;
}

export interface IdeaUpdateRequest {
  title?: string;
  description?: string;
  problem?: string;
  target_customer?: string;
  solution?: string;
  industry?: string;
  business_model?: string;
  revenue_model?: string;
  pricing?: string;
  technology?: string;
}

export interface IdeaResponse {
  id: number;
  user_id: number;
  title: string;
  description: string;
  problem: string | null;
  target_customer: string | null;
  solution: string | null;
  industry: string | null;
  business_model: string | null;
  revenue_model: string | null;
  pricing: string | null;
  technology: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}
