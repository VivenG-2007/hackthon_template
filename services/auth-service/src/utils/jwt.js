const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, type: 'access' },
    env.jwt.privateKey,
    {
      algorithm: 'RS256',
      expiresIn: env.jwt.accessExpiresIn,
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      keyid: env.jwt.kid,
    }
  );
}

function signRefreshToken(user, tokenVersion) {
  return jwt.sign(
    { sub: user.id, type: 'refresh', tv: tokenVersion },
    env.jwt.privateKey,
    {
      algorithm: 'RS256',
      expiresIn: env.jwt.refreshExpiresIn,
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      keyid: env.jwt.kid,
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.publicKey, {
    algorithms: ['RS256'],
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { signAccessToken, signRefreshToken, verifyToken, hashToken };
