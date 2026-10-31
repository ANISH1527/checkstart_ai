/**
 * Authentication and API Configuration for CheckStart AI
 */

/**
 * Normalizes and returns the API base URL.
 * Ensures trailing slashes are removed and '/api' is appended if an absolute host was provided.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string' || !envUrl.trim()) {
    return '/api';
  }
  let clean = envUrl.trim().replace(/\/+$/, '');
  // If an absolute backend origin was provided without /api or /api/v1, append /api
  if (/^https?:\/\//i.test(clean)) {
    if (!clean.endsWith('/api') && !clean.endsWith('/api/v1')) {
      clean = `${clean}/api`;
    }
  }
  return clean;
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Google OAuth 2.0 Web Client ID for Google Identity Services.
 */
export const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '659981468656-7rb8trd9vbuijaqncul1lmb46f0iulb6.apps.googleusercontent.com';
