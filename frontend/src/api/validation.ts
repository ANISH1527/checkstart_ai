import { apiClient } from './client';
import type { ValidationResponse, ValidationHistoryItem, VersionComparisonResult } from '../types/validation';

export const validationApi = {
  validateIdea: async (ideaId: number): Promise<ValidationResponse> => {
    const res = await apiClient.post<ValidationResponse>(`/ideas/${ideaId}/validate`);
    return res.data;
  },

  revalidateIdea: async (ideaId: number): Promise<ValidationResponse> => {
    const res = await apiClient.post<ValidationResponse>(`/ideas/${ideaId}/revalidate`);
    return res.data;
  },

  getLatestValidation: async (ideaId: number): Promise<ValidationResponse> => {
    const res = await apiClient.get<ValidationResponse>(`/ideas/${ideaId}/validation`);
    return res.data;
  },

  getHistory: async (ideaId: number): Promise<ValidationHistoryItem[]> => {
    const res = await apiClient.get<ValidationHistoryItem[]>(`/ideas/${ideaId}/history`);
    return res.data;
  },

  toggleRecommendationComplete: async (ideaId: number, recId: string): Promise<{ status: string; rec_id: string; new_status: string }> => {
    const res = await apiClient.post<{ status: string; rec_id: string; new_status: string }>(`/ideas/${ideaId}/recommendations/${recId}/complete`);
    return res.data;
  },

  getValidationComparison: async (ideaId: number): Promise<VersionComparisonResult> => {
    const res = await apiClient.get<VersionComparisonResult>(`/ideas/${ideaId}/comparison`);
    return res.data;
  },

  getMarkdownReport: async (ideaId: number): Promise<string> => {
    const res = await apiClient.get<string>(`/reports/${ideaId}/markdown`, {
      responseType: 'text',
    });
    return res.data;
  },
};
