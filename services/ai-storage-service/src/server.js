const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { ensureContainer } = require('./config/azureBlob');
const logger = require('./config/logger');

async function start() {
  try {
    await connectDB();
    await ensureContainer();
    const server = app.listen(env.port, () => {
      logger.info(`ai-storage-service listening on :${env.port} [${env.nodeEnv}] provider=${env.ai.provider}`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(err, 'failed to start ai-storage-service');
    process.exit(1);
  }
}

start();
