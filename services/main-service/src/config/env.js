require('dotenv').config();

function decodeKey(base64Value) {
  if (!base64Value) return undefined;
  try {
    return Buffer.from(base64Value, 'base64').toString('utf8');
  } catch {
    return undefined;
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5001,
  serviceName: process.env.SERVICE_NAME || 'main-service',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean),

  jwt: {
    publicKey: decodeKey(process.env.JWT_PUBLIC_KEY_BASE64),
    issuer: process.env.JWT_ISSUER || 'hackathon-auth-service',
    audience: process.env.JWT_AUDIENCE || 'hackathon-platform',
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  aiStorageServiceUrl: process.env.AI_STORAGE_SERVICE_URL || 'http://localhost:5002',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',

  projectName: process.env.PROJECT_NAME || 'hackathon-template',
};

if (env.nodeEnv === 'production' && !env.jwt.publicKey) {
  throw new Error('[env] JWT_PUBLIC_KEY_BASE64 must be set in production (copy it from auth-service).');
}

module.exports = env;
