import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, safeFetch } from './api';

describe('API Service and safeFetch', () => {
  const originalFetch = globalThis.fetch;
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    };
    vi.stubGlobal('localStorage', storageMock);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('safeFetch calls global fetch directly without recursion or stack overflow', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true, data: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse);
    globalThis.fetch = fetchSpy;

    const res = await safeFetch('https://api.example.com/test');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('https://api.example.com/test', undefined);
    expect(res.status).toBe(200);
  });

  it('safeFetch handles network errors and formats them into readable Error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(safeFetch('https://api.example.com/test')).rejects.toThrow(
      'Unable to connect to the backend server'
    );
  });

  it('api.login succeeds without recursive calls and returns token and user', async () => {
    const mockUser = {
      id: '123',
      name: 'Test Founder',
      email: 'founder@example.com',
      role: 'USER',
      authProvider: 'LOCAL',
    };
    const mockResponse = new Response(
      JSON.stringify({
        success: true,
        data: {
          token: 'jwt_mock_token_123',
          user: mockUser,
          message: 'Login successful',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await api.login({
      identifier: 'founder@example.com',
      password: 'SecurePassword123!',
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.token).toBe('jwt_mock_token_123');
    expect(result.user.email).toBe('founder@example.com');
  });

  it('api.login throws formatted error on 401 invalid credentials and clears tokens', async () => {
    mockStorage['auth_token'] = 'old_token';
    const mockResponse = new Response(
      JSON.stringify({
        detail: 'Incorrect email or password. Please try again.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(
      api.login({
        identifier: 'founder@example.com',
        password: 'WrongPassword!',
      })
    ).rejects.toThrow('Incorrect email or password. Please try again.');

    expect(mockStorage['auth_token']).toBeUndefined();
  });

  it('api.googleAuth passes signed credential token and returns session data without recursion', async () => {
    const mockGoogleUser = {
      id: '456',
      name: 'Google Founder',
      email: 'googlefounder@example.com',
      role: 'USER',
      authProvider: 'GOOGLE',
    };
    const mockResponse = new Response(
      JSON.stringify({
        success: true,
        data: {
          token: 'jwt_google_mock_token_456',
          user: mockGoogleUser,
          message: 'Google login successful',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse);
    globalThis.fetch = fetchSpy;

    const result = await api.googleAuth({
      credential: 'valid_google_id_token_xyz',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.token).toBe('jwt_google_mock_token_456');
    expect(result.user.authProvider).toBe('GOOGLE');

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(callBody.credential).toBe('valid_google_id_token_xyz');
  });

  it('api.getMe attaches Bearer token header', async () => {
    mockStorage['auth_token'] = 'active_session_token_999';

    const mockResponse = new Response(
      JSON.stringify({
        user: { id: '999', email: 'me@example.com' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse);
    globalThis.fetch = fetchSpy;

    const result = await api.getMe();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers?.Authorization).toBe('Bearer active_session_token_999');
    expect(result.user.email).toBe('me@example.com');
  });

  it('api.logout clears tokens from storage', async () => {
    mockStorage['auth_token'] = 'token_to_remove';
    mockStorage['auth_user'] = JSON.stringify({ id: '1' });
    mockStorage['ai_validate_token'] = 'token_to_remove';

    await api.logout();

    expect(mockStorage['auth_token']).toBeUndefined();
    expect(mockStorage['auth_user']).toBeUndefined();
    expect(mockStorage['ai_validate_token']).toBeUndefined();
  });
});
