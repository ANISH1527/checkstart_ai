import { apiClient } from './client';
import type { IdeaCreateRequest, IdeaUpdateRequest, IdeaResponse } from '../types/idea';

export const ideasApi = {
  createIdea: async (data: IdeaCreateRequest): Promise<IdeaResponse> => {
    const res = await apiClient.post<IdeaResponse>('/ideas', data);
    return res.data;
  },

  getIdeas: async (): Promise<IdeaResponse[]> => {
    const res = await apiClient.get<IdeaResponse[]>('/ideas');
    return res.data;
  },

  getIdea: async (ideaId: number): Promise<IdeaResponse> => {
    const res = await apiClient.get<IdeaResponse>(`/ideas/${ideaId}`);
    return res.data;
  },

  updateIdea: async (ideaId: number, data: IdeaUpdateRequest): Promise<IdeaResponse> => {
    const res = await apiClient.put<IdeaResponse>(`/ideas/${ideaId}`, data);
    return res.data;
  },

  deleteIdea: async (ideaId: number): Promise<void> => {
    await apiClient.delete(`/ideas/${ideaId}`);
  },
};
