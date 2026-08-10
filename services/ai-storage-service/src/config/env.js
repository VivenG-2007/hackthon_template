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
  port: Number(process.env.PORT) || 5002,
  serviceName: process.env.SERVICE_NAME || 'ai-storage-service',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean),

  jwt: {
    publicKey: decodeKey(process.env.JWT_PUBLIC_KEY_BASE64),
    issuer: process.env.JWT_ISSUER || 'hackathon-auth-service',
    audience: process.env.JWT_AUDIENCE || 'hackathon-platform',
  },
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',

  mongoUri: process.env.MONGODB_URI,
  mongoDatabase: process.env.MONGODB_DATABASE || 'ai_storage_db',

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    container: process.env.AZURE_STORAGE_CONTAINER || 'hackathon-uploads',
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || 25 * 1024 * 1024,
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'mock',
    model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
    apiKey: process.env.AI_API_KEY || '',
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || '',
  },

  projectName: process.env.PROJECT_NAME || 'hackathon-template',
};

if (env.nodeEnv === 'production' && !env.jwt.publicKey) {
  throw new Error('[env] JWT_PUBLIC_KEY_BASE64 must be set in production (copy it from auth-service).');
}

module.exports = env;
