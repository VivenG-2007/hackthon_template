const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20, // AI calls are expensive — keep this tighter than general API limits
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many AI requests, slow down.', code: 'RATE_LIMITED' } },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });

module.exports = { aiLimiter, uploadLimiter, generalLimiter };
