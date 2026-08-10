const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./config/logger');
const redis = require('./config/redis');
const requestId = require('./middleware/requestId');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const itemsRoutes = require('./routes/itemsRoutes');
const proxyRoutes = require('./routes/proxyRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(requestId);
app.use(pinoHttp({ logger, customProps: (req) => ({ requestId: req.id }) }));
app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(generalLimiter);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: env.serviceName }));
app.get('/ready', async (req, res) => {
  let redisOk = false;
  try {
    redisOk = (await redis.ping()) === 'PONG';
  } catch {
    redisOk = false;
  }
  const ready = redisOk; // Supabase has no cheap ping; readiness here focuses on our own dependency
  res.status(ready ? 200 : 503).json({ ready, service: env.serviceName, dependencies: { redis: redisOk } });
});
app.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    service: env.serviceName,
    uptimeSeconds: process.uptime(),
    memory: { rssMB: +(mem.rss / 1024 / 1024).toFixed(1), heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(1) },
  });
});

app.use('/api/items', itemsRoutes);
app.use('/api/proxy', proxyRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
