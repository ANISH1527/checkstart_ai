import { apiClient } from './client';
import type { UserRegisterRequest, TokenResponse, UserProfile } from '../types/auth';

export const authApi = {
  register: async (data: UserRegisterRequest): Promise<UserProfile> => {
    const res = await apiClient.post<UserProfile>('/auth/register', data);
    return res.data;
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const res = await apiClient.post<TokenResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return res.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>('/auth/me');
    return res.data;
  },
};
