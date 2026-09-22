import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Envelope unwrapping and error formatting
apiClient.interceptors.response.use(
  (response) => {
    // If response body matches the API envelope { success: true, data: ... }
    if (response.data && response.data.success === true && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Handle 401 Unauthorized
      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        const currentPath = window.location.pathname;
        if (!['/login', '/register', '/'].includes(currentPath)) {
          window.location.href = '/login';
        }
      }

      // Handle custom envelope error shape { success: false, error, message, details }
      if (data && data.success === false) {
        return Promise.reject({
          code: data.error || 'error',
          message: data.message || 'An error occurred',
          details: data.details || {},
          status,
        });
      }

      // Fallback HTTP exception error
      return Promise.reject({
        code: `http_${status}`,
        message: data?.detail || data?.message || error.message || 'Server error',
        details: data?.details || {},
        status,
      });
    }

    return Promise.reject({
      code: 'network_error',
      message: 'Network error. Please check your server connection.',
      details: {},
    });
  }
);

export default apiClient;
