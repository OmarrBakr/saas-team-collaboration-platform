const rateLimit = require('express-rate-limit');

const createLimiter = ({ windowMs, limit, message, keyGenerator }) =>
  rateLimit({
    windowMs,
    limit,
    ...(keyGenerator ? { keyGenerator } : {}),
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

const invitationAdminLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `admin:${req.user.userId}`,
  message: 'This admin has sent too many invitations. Please try again later.',
});

const invitationWorkspaceLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  keyGenerator: (req) => `workspace:${req.params.workspaceId}`,
  message: 'This workspace has sent too many invitations. Please try again later.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveAuthLimiter,
  invitationAdminLimiter,
  invitationWorkspaceLimiter,
};
