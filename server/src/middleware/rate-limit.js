const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const logger = require('../utils/logger');
const redis = require('../utils/redis');

const logRateLimitExceeded = ({ name }) => (req, res, next, options) => {
  const ip = req.ip || 'unknown';
  const userId = req.user?.userId?.toString?.() || 'anonymous';

  logger.warn('rate_limit.exceeded', {
    limiter: name,
    ip,
    userId: userId === 'anonymous' ? undefined : userId,
    method: req.method,
    route: req.originalUrl,
  });

  res.status(options.statusCode).send(options.message);
};

const createLimiter = ({ name, windowMs, limit, message, keyGenerator }) =>
  rateLimit({
    windowMs,
    limit,
    handler: logRateLimitExceeded({ name }),
    ...(keyGenerator ? { keyGenerator } : {}),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { msg: message },
    ...(redis
      ? {
          store: new RedisStore({
            prefix: `rate-limit:${name}:`,
            sendCommand: (...args) => redis.redisReady.then(() => redis.sendCommand(args)),
          }),
        }
      : {}),
  });

const apiLimiter = createLimiter({
  name: 'api',
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Too many requests. Please try again later.',
});

const authLimiter = createLimiter({
  name: 'authentication',
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Too many authentication requests. Please try again later.',
});

const sensitiveAuthLimiter = createLimiter({
  name: 'sensitive_authentication',
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many password recovery requests. Please try again later.',
});

const invitationAdminLimiter = createLimiter({
  name: 'invitation_admin',
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `admin:${req.user.userId}`,
  message: 'This admin has sent too many invitations. Please try again later.',
});

const invitationWorkspaceLimiter = createLimiter({
  name: 'invitation_workspace',
  windowMs: 60 * 60 * 1000,
  limit: 50,
  keyGenerator: (req) => `workspace:${req.params.workspaceId}`,
  message: 'This workspace has sent too many invitations. Please try again later.',
});

const uploadUserLimiter = createLimiter({
  name: 'upload_user',
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => `upload-user:${req.user.userId}`,
  message: 'You have uploaded too many files. Please try again later.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveAuthLimiter,
  invitationAdminLimiter,
  invitationWorkspaceLimiter,
  uploadUserLimiter,
};
