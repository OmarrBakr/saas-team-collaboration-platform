const { createClient } = require('redis');
const logger = require('./logger');

const createRedisClient = () => {
  if (!process.env.REDIS_URL) return null;

  return createClient({ url: process.env.REDIS_URL });
};

const redis = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

if (redis) {
  redis.on('error', (error) => {
    logger.error('redis.error', { error: logger.serializeError(error) });
  });

  redis
    .connect()
    .then(() => logger.info('redis.connected', { database: 'redis' }))
    .catch((error) => logger.error('redis.connection_failed', {
      error: logger.serializeError(error),
    }));
}

module.exports = redis;
module.exports.createRedisClient = createRedisClient;
