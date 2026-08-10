const fetch = require('node-fetch');
const env = require('../config/env');
const logger = require('../config/logger');

// Main backend acts as the front door: it forwards the caller's own bearer
// token to the AI/Storage service, which verifies it locally too (defense in
// depth — it does not trust main-service blindly). We also attach an internal
// service token so ai-storage-service can distinguish "trusted gateway call"
// from a direct call, useful if you later want stricter internal-only routes.
async function proxyToAiStorage(req, res, next) {
  try {
    const targetPath = req.originalUrl.replace(/^\/api\/proxy/, '');
    const url = `${env.aiStorageServiceUrl}${targetPath}`;

    const headers = {
      'content-type': req.headers['content-type'] || 'application/json',
      authorization: req.headers.authorization || '',
      'x-internal-service-token': env.internalServiceToken,
      'x-request-id': req.id,
    };

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      timeout: 15000,
    });

    const contentType = response.headers.get('content-type') || '';
    const status = response.status;
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(status).json(data);
    }
    const text = await response.text();
    return res.status(status).send(text);
  } catch (err) {
    logger.error({ err }, 'proxy to ai-storage-service failed');
    return res.status(502).json({ error: { message: 'AI/Storage service unavailable', code: 'UPSTREAM_UNAVAILABLE', requestId: req.id } });
  }
}

module.exports = { proxyToAiStorage };
