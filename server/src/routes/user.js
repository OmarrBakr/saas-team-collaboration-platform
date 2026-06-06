const express = require('express');

const {
  getCurrentUser,
  updateCurrentUser,
  updatePassword,
} = require('../controllers/user');

const router = express.Router();

router.get('/me', getCurrentUser);
router.patch('/me', updateCurrentUser);
router.patch('/me/password', updatePassword);

module.exports = router;
