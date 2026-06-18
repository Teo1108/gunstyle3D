const crypto = require('crypto');

function createAuthService(password) {
  const validTokens = new Set();

  function login(attemptedPassword) {
    if (attemptedPassword !== password) return null;
    const token = crypto.randomUUID();
    validTokens.add(token);
    return token;
  }

  function verifyToken(token) {
    if (!token) return false;
    return validTokens.has(token);
  }

  return { login, verifyToken };
}

module.exports = { createAuthService };
