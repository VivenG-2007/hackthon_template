const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./config/logger');

async function start() {
  try {
    await connectDB();
    const server = app.listen(env.port, () => {
      logger.info(`auth-service listening on :${env.port} [${env.nodeEnv}]`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(err, 'failed to start auth-service');
    process.exit(1);
  }
}

start();
