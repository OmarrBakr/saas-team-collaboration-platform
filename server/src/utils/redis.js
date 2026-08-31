const { createClient } = require('redis');

const redis = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

if (redis) {
  redis.on('error', (error) => {
    console.error('Redis error:', error.message);
  });

  redis.connect().catch((error) => {
    console.error('Redis connection failed:', error.message);
  });
}

module.exports = redis;
