const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on('connect', () => logger.info('Redis connected (ai-storage-service)'));
redis.on('error', (err) => logger.error({ err }, 'Redis error — continuing without cache'));

module.exports = redis;
