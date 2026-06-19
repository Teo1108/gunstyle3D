// @vitest-environment node
import { describe, it, expect } from 'vitest';

process.env.ADMIN_PASSWORD = 'testpass';
process.env.ADMIN_JWT_SECRET = 'test-secret-at-least-32-chars-longXXXX';

describe('POST /api/admin/login', () => {
  it('returns JWT on correct password', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'testpass' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.token).toBe('string');
    expect(body.token.split('.').length).toBe(3); // valid JWT format
  });

  it('returns 401 on wrong password', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });
});
