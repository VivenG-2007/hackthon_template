require('dotenv').config();

function decodeKey(base64Value, label) {
  if (!base64Value) return undefined;
  try {
    return Buffer.from(base64Value, 'base64').toString('utf8');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[env] Failed to decode ${label}:`, err.message);
    return undefined;
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  serviceName: process.env.SERVICE_NAME || 'auth-service',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGODB_URI,
  mongoDatabase: process.env.MONGODB_DATABASE || 'auth_db',

  jwt: {
    privateKey: decodeKey(process.env.JWT_PRIVATE_KEY_BASE64, 'JWT_PRIVATE_KEY_BASE64'),
    publicKey: decodeKey(process.env.JWT_PUBLIC_KEY_BASE64, 'JWT_PUBLIC_KEY_BASE64'),
    issuer: process.env.JWT_ISSUER || 'hackathon-auth-service',
    audience: process.env.JWT_AUDIENCE || 'hackathon-platform',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    kid: process.env.JWT_KID || 'key-1',
  },

  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: (process.env.COOKIE_SECURE || 'true') === 'true',
    sameSite: process.env.COOKIE_SAMESITE || 'none',
  },

  projectName: process.env.PROJECT_NAME || 'hackathon-template',
};

const requiredInProd = ['mongoUri'];
if (env.nodeEnv === 'production') {
  for (const key of requiredInProd) {
    if (!env[key]) throw new Error(`[env] Missing required env var for: ${key}`);
  }
  if (!env.jwt.privateKey || !env.jwt.publicKey) {
    throw new Error('[env] JWT_PRIVATE_KEY_BASE64 / JWT_PUBLIC_KEY_BASE64 must be set in production. Run `npm run generate-keys`.');
  }
}

module.exports = env;
