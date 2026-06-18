import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAdminToken, setAdminToken, clearAdminToken, authFetch } from './adminAuth';

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('token storage', () => {
  it('returns null when no token was set', () => {
    expect(getAdminToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    setAdminToken('abc-123');
    expect(getAdminToken()).toBe('abc-123');
  });

  it('clears the stored token', () => {
    setAdminToken('abc-123');
    clearAdminToken();
    expect(getAdminToken()).toBeNull();
  });
});

describe('authFetch', () => {
  it('adds an Authorization header with the stored token', async () => {
    setAdminToken('my-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await authFetch('/api/products', { method: 'POST' });

    expect(fetchMock).toHaveBeenCalledWith('/api/products', {
      method: 'POST',
      headers: { Authorization: 'Bearer my-token' },
    });
  });
});
