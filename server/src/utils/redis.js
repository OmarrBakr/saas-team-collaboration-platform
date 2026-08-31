const { createClient } = require('redis');
const logger = require('./logger');

const redisOptions = {
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 1000, 30000),
  },
};

const createRedisClient = () => {
  if (!process.env.REDIS_URL) return null;

  return createClient(redisOptions);
};

const redis = process.env.REDIS_URL
  ? createClient(redisOptions)
  : null;

if (!redis) {
  throw new Error('REDIS_URL is required to start the server');
}

if (redis) {
  redis.on('error', (error) => {
    logger.error('redis.error', {
      error: logger.serializeError(error),
    });
  });
}

const connectRedis = async () => {
  if (redis.isReady) return redis;

  while (!redis.isReady) {
    try {
      await redis.connect();
      logger.info('redis.connected', { database: 'redis' });
    } catch (error) {
      logger.warn('redis.connection_retry', {
        error: logger.serializeError(error),
        retryIn: '5 seconds',
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  return redis;
};

const redisReady = connectRedis();
redis.redisReady = redisReady;

module.exports = redis;
module.exports.createRedisClient = createRedisClient;
module.exports.connectRedis = connectRedis;
