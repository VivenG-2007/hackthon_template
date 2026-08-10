const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Same local-verification pattern as main-service: this service trusts NO
// upstream call chain — it re-checks the JWT signature itself with the
// auth-service's public key, whether the request arrived directly from the
// frontend or via main-service's proxy.
function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.access_token) return req.cookies.access_token;
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: { message: 'Missing access token', code: 'NO_TOKEN', requestId: req.id } });
  }
  try {
    const payload = jwt.verify(token, env.jwt.publicKey, {
      algorithms: ['RS256'],
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    });
    if (payload.type !== 'access') throw new Error('wrong token type');
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN', requestId: req.id } });
  }
}

module.exports = { requireAuth, extractToken };
