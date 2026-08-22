const { doubleCsrf } = require('csrf-csrf');

const csrfSecret = process.env.CSRF_SECRET;

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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

module.exports = { generateCsrfToken, doubleCsrfProtection };
