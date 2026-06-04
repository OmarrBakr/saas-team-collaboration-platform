const express = require('express');

const {
  register,
  login,
  refresh,
  verifyEmail,
  resetPassword,
  forgetPassword,
  initiateGoogleOAuth,
  googleOAuthCallback,
} = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/verifyEmail', verifyEmail);
router.post('/forgetPassword', forgetPassword);
router.post('/resetPassword', resetPassword);

// OAuth Routes
router.get('/google', initiateGoogleOAuth);
router.get('/google/callback', googleOAuthCallback);

module.exports = router;
