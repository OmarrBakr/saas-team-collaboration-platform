const express = require('express');

const { register, login, refresh, verifyEmail } = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/refresh', refresh);
router.post('/verifyEmail', verifyEmail);

module.exports = router;
