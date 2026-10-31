import { describe, it, expect } from 'vitest';
import { getApiBaseUrl, GOOGLE_CLIENT_ID } from './auth';

describe('Auth Configuration', () => {
  it('provides a valid default Google Client ID', () => {
    expect(GOOGLE_CLIENT_ID).toBeDefined();
    expect(GOOGLE_CLIENT_ID).toContain('apps.googleusercontent.com');
  });

  it('normalizes API base URL defaults', () => {
    const url = getApiBaseUrl();
    expect(url).toBeDefined();
    expect(url.endsWith('/')).toBe(false);
  });
});
