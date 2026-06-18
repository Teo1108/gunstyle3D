import { describe, it, expect } from 'vitest';
import { createAuthService } from './auth.js';

describe('createAuthService', () => {
  it('login returns null for the wrong password', () => {
    const auth = createAuthService('correct-password');
    expect(auth.login('wrong')).toBeNull();
  });

  it('login returns a token string for the correct password', () => {
    const auth = createAuthService('correct-password');
    const token = auth.login('correct-password');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifyToken returns true for a token issued by login', () => {
    const auth = createAuthService('correct-password');
    const token = auth.login('correct-password');
    expect(auth.verifyToken(token)).toBe(true);
  });

  it('verifyToken returns false for an unknown token', () => {
    const auth = createAuthService('correct-password');
    expect(auth.verifyToken('bogus-token')).toBe(false);
  });

  it('verifyToken returns false for an empty token', () => {
    const auth = createAuthService('correct-password');
    expect(auth.verifyToken('')).toBe(false);
  });
});
