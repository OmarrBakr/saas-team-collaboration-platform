const { doubleCsrf } = require('csrf-csrf');

const csrfSecret = process.env.CSRF_SECRET;
const csrfSameSite = process.env.COOKIE_SAME_SITE || 'lax';

if (process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET) {
  throw new Error('CSRF_SECRET is required in production');
}

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => csrfSecret,
  getSessionIdentifier: (req) => req.ip || 'anonymous',
  cookieName: 'csrfToken',
  cookieOptions: {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: csrfSameSite,
    path: '/',
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

module.exports = { generateCsrfToken, doubleCsrfProtection };
