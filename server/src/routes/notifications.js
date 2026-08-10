const express = require('express');

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notifications');

const router = express.Router();

router.get('/', getNotifications);
router.patch('/read', markAllNotificationsRead);
router.patch('/:notificationId/read', markNotificationRead);

module.exports = router;
