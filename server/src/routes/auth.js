const express = require('express');

const { register, login, refresh, verifyEmail, resetPassword, forgetPassword } = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/verifyEmail', verifyEmail);
router.post('/forgetPassword', forgetPassword);
router.post('/resetPassword', resetPassword);

module.exports = router;
