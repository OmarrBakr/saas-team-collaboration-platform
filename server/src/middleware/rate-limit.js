const rateLimit = require('express-rate-limit');

const createLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { msg: message },
  });

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Too many requests. Please try again later.',
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Too many authentication requests. Please try again later.',
});

const sensitiveAuthLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many password recovery requests. Please try again later.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveAuthLimiter,
};
