const express = require('express');
const {
  authLimiter,
  sensitiveAuthLimiter,
} = require('../middleware/rate-limit');

const {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resetPassword,
  forgetPassword,
  initiateGoogleOAuth,
  googleOAuthCallback,
} = require('../controllers/auth');

const router = express.Router();

router.use(authLimiter);

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/verifyEmail', verifyEmail);
router.post('/forgetPassword', sensitiveAuthLimiter, forgetPassword);
router.post('/resetPassword', sensitiveAuthLimiter, resetPassword);

// OAuth Routes
router.get('/google', initiateGoogleOAuth);
router.get('/google/callback', googleOAuthCallback);

module.exports = router;
