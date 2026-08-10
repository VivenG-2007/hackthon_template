const express = require('express');
const env = require('../config/env');

const router = express.Router();

// Exposes the current public key so other services (or a future JWKS-aware
// client) can fetch it directly instead of copy-pasting env vars, and so key
// rotation can be automated later. Kept intentionally simple (not full JWKS/JWK
// format) — swap for a real `jose`-based JWKS endpoint if you need rotation.
router.get('/jwks', (req, res) => {
  res.status(200).json({
    kid: env.jwt.kid,
    algorithm: 'RS256',
    publicKeyPem: env.jwt.publicKey || null,
  });
});

module.exports = router;
