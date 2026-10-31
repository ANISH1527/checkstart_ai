import {
  User,
  StartupIdea,
  ValidationReport,
  DashboardStats,
  ComparisonResult,
  ValidationConversation,
  ChatMessage,
  StructuredStartupState,
  VersionReportItem,
  AdminDashboardStats,
  AdminUserItem,
  AdminUserDetails,
  AdminIdeaItem,
  AdminReportItem,
} from '../types';
import { API_BASE_URL } from '../config/auth';

const API_BASE = API_BASE_URL;

function formatNetworkError(err: any): Error {
  const msg = err?.message || String(err);
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return new Error(
      'Unable to connect to the backend server. Please verify your connection, CORS configuration, and VITE_API_URL.'
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    throw formatNetworkError(err);
  }
}

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // ignore storage access issues
  }
  return null;
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage access issues
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStorageItem('ai_validate_token') || getStorageItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return { message: 'Success' } as unknown as T;
  }

  let data: any = {};
  let rawText = '';
  try {
    rawText = await response.text();
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeStorageItem('ai_validate_token');
      removeStorageItem('ai_validate_user');
      removeStorageItem('auth_token');
      removeStorageItem('auth_user');
    }

    let message = '';
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message.trim();
      } else if (typeof data.detail === 'string' && data.detail.trim()) {
        message = data.detail.trim();
      } else if (typeof data.error === 'string' && data.error.trim()) {
        message = data.error.trim();
      }

      if (data.details && typeof data.details === 'object' && !message) {
        const detailsObj = data.details as Record<string, any>;
        const fieldMsgs = Object.values(detailsObj).filter((v) => typeof v === 'string');
        if (fieldMsgs.length > 0) {
          message = fieldMsgs.join('; ');
        }
      }
    }

    if (!message) {
      if (response.status === 400) {
        message = 'Invalid request. Please check your information and try again.';
      } else if (response.status === 401) {
        message = 'Incorrect email or password. Please try again.';
      } else if (response.status === 403) {
        message = 'Access forbidden. You do not have permission to perform this action.';
      } else if (response.status === 404) {
        message = 'The requested resource or API endpoint was not found. Please verify VITE_API_URL.';
      } else if (response.status === 405) {
        message =
          'API routing error (HTTP 405 Method Not Allowed). Please ensure VITE_API_URL points to the backend server rather than the frontend host.';
      } else if (response.status === 422) {
        message = 'Validation error: please verify that all required fields are correctly formatted.';
      } else if (response.status === 429) {
        message = 'Too many requests. Please wait a moment and try again.';
      } else if (response.status === 502 || response.status === 503) {
        message =
          'The backend service is currently spinning up or temporarily unavailable. Please wait 30 seconds and try again.';
      } else if (response.status >= 500) {
        message = 'An internal server error occurred on the backend. Please try again later.';
      } else {
        message = `Request failed with status code ${response.status}.`;
      }
    }

    throw new Error(message);
  }

  if (data && typeof data === 'object' && 'data' in data && data.success === true) {
    return data.data as T;
  }

  return data;
}


export const api = {
  // Generic GET
  async get(endpoint: string): Promise<any> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = cleanEndpoint.startsWith('/api')
      ? cleanEndpoint
      : `${API_BASE}${cleanEndpoint}`;
    const res = await safeFetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Sessions API
  async getSessions(): Promise<{ sessions: any[]; conversations: any[]; items: any[] }> {
    const res = await safeFetch(`${API_BASE}/sessions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Auth
  async register(payload: {
    name: string;
    email: string;
    password: string;
    college?: string;
    course?: string;
    graduationYear?: number;
  }): Promise<{ token: string; user: User; message: string }> {
    const res = await safeFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async login(payload: {
    email?: string;
    username?: string;
    identifier?: string;
    password: string;
  }): Promise<{ token: string; user: User; message: string }> {
    const res = await safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async googleAuth(payload: {
    credential: string;
    college?: string;
    course?: string;
    graduationYear?: number;
  }): Promise<{ token: string; user: User; message: string }> {
    const res = await safeFetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async adminLogin(payload: {
    username?: string;
    email?: string;
    password: string;
  }): Promise<{ token: string; user: User; message: string }> {
    const res = await safeFetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await safeFetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async forgotPassword(email: string): Promise<{ message: string; resetLink?: string; devToken?: string }> {
    const res = await safeFetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    removeStorageItem('ai_validate_token');
    removeStorageItem('ai_validate_user');
    removeStorageItem('auth_token');
    removeStorageItem('auth_user');
  },

  // Conversation & Chatbot APIs
  async getConversations(): Promise<{ conversations: ValidationConversation[] }> {
    const res = await safeFetch(`${API_BASE}/conversations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createConversation(initialMessage?: string): Promise<{ conversation: ValidationConversation }> {
    const res = await safeFetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ initialMessage }),
    });
    return handleResponse(res);
  },

  async getConversation(id: string): Promise<{ conversation: ValidationConversation }> {
    const res = await safeFetch(`${API_BASE}/conversations/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async sendMessage(
    id: string,
    message: string
  ): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    structuredData: StructuredStartupState;
    report?: any;
  }> {
    const res = await safeFetch(`${API_BASE}/conversations/${id}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse(res);
  },

  async validateConversation(
    id: string
  ): Promise<{
    reportId: string;
    versionNumber: number;
    overallScore: number;
    validationPercentage: number;
    validationCategory: string;
    message: string;
  }> {
    const res = await safeFetch(`${API_BASE}/conversations/${id}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async deleteConversation(id: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Dashboard & Ideas
  async getDashboardStats(): Promise<{ stats: DashboardStats }> {
    const res = await safeFetch(`${API_BASE}/ideas/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getIdeas(params?: {
    search?: string;
    category?: string;
    sort?: string;
  }): Promise<{ ideas: StartupIdea[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);

    const res = await safeFetch(`${API_BASE}/ideas?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getIdeaById(id: string): Promise<{ idea: StartupIdea }> {
    const res = await safeFetch(`${API_BASE}/ideas/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getIdeaReports(id: string): Promise<{
    startupName: string;
    totalVersions: number;
    reports: VersionReportItem[];
  }> {
    const res = await safeFetch(`${API_BASE}/ideas/${id}/reports`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createIdea(payload: Partial<StartupIdea>): Promise<{ idea: StartupIdea; message: string }> {
    const res = await safeFetch(`${API_BASE}/ideas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateIdea(id: string, payload: Partial<StartupIdea>): Promise<{ idea: StartupIdea; message: string }> {
    const res = await safeFetch(`${API_BASE}/ideas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteIdea(id: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE}/ideas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // AI Validation
  async analyzeIdea(ideaId: string): Promise<{ report: ValidationReport; message: string }> {
    const res = await safeFetch(`${API_BASE}/validation/analyze/${ideaId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getReport(reportId: string): Promise<{ report: ValidationReport }> {
    const res = await safeFetch(`${API_BASE}/validation/${reportId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async toggleRecommendation(ideaId: string | number, recId: string | number): Promise<any> {
    const res = await safeFetch(`${API_BASE}/ideas/${ideaId}/recommendations/${recId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async compareIdeaVersions(ideaId: string | number, fromVersion: number, toVersion: number): Promise<any> {
    const res = await safeFetch(`${API_BASE}/ideas/${ideaId}/compare?from=${fromVersion}&to=${toVersion}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Comparison
  async compareIdeas(ideaIds: string[]): Promise<ComparisonResult> {
    const res = await safeFetch(`${API_BASE}/ideas/compare`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ideaIds }),
    });
    return handleResponse(res);
  },

  // Profile & Settings
  async getProfile(): Promise<{ profile: User }> {
    const res = await safeFetch(`${API_BASE}/user/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateProfile(payload: {
    name?: string;
    college?: string | null;
    course?: string | null;
    graduationYear?: number | null;
  }): Promise<{ user: User; message: string }> {
    const res = await safeFetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updatePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE}/user/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async verifyDeleteIdentity(payload: {
    password?: string;
    googleEmail?: string;
    credential?: string;
  }): Promise<{ verificationToken: string; message: string }> {
    const res = await safeFetch(`${API_BASE}/user/verify-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteAccount(payload: {
    confirmText: string;
    verificationToken: string;
  }): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE}/user/account`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getSettings(): Promise<{ settings: { theme: string; emailNotifications: boolean } }> {
    const res = await safeFetch(`${API_BASE}/settings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async updateSettings(payload: {
    theme?: string;
    emailNotifications?: boolean;
  }): Promise<{ message: string; settings: { theme: string; emailNotifications: boolean } }> {
    const res = await safeFetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },


  // Admin APIs
  async getAdminDashboardStats(): Promise<{ stats: AdminDashboardStats }> {
    const res = await safeFetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminUsers(params?: {
    search?: string;
    provider?: string;
    sort?: string;
  }): Promise<{ users: AdminUserItem[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.provider) query.set('provider', params.provider);
    if (params?.sort) query.set('sort', params.sort);

    const res = await safeFetch(`${API_BASE}/admin/users?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminUserDetails(id: string): Promise<AdminUserDetails> {
    const res = await safeFetch(`${API_BASE}/admin/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminIdeas(params?: {
    search?: string;
    category?: string;
    sort?: string;
  }): Promise<{ ideas: AdminIdeaItem[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);

    const res = await safeFetch(`${API_BASE}/admin/ideas?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminReports(params?: {
    search?: string;
    category?: string;
    sort?: string;
  }): Promise<{ reports: AdminReportItem[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);

    const res = await safeFetch(`${API_BASE}/admin/reports?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
