const { StatusCodes } = require('http-status-codes');

const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('actor', 'firstName lastName email');

  res.status(StatusCodes.OK).json({ notifications });
};

const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, recipient: req.user.userId, readAt: null },
    { readAt: new Date() },
    { new: true }
  ).populate('actor', 'firstName lastName email');

  if (!notification) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Notification not found' });
  }

  res.status(StatusCodes.OK).json({ notification });
};

const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.userId, readAt: null },
    { readAt: new Date() }
  );

  res.status(StatusCodes.OK).json({ msg: 'Notifications marked as read' });
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
