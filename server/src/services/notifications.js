const Notification = require('../models/Notification');

const createCardAssignmentNotifications = async ({
  io,
  actorId,
  workspaceId,
  boardId,
  card,
  previousAssigneeIds,
}) => {
  const previousIds = new Set(previousAssigneeIds.map((id) => id.toString()));
  const nextIds = card.assignees.map((id) => id.toString());
  const nextIdSet = new Set(nextIds);
  const addedIds = nextIds.filter((id) => !previousIds.has(id));
  const removedIds = [...previousIds].filter((id) => !nextIdSet.has(id));
  const actorKey = actorId.toString();
  const notifications = [];

  for (const recipientId of addedIds) {
    if (recipientId === actorKey) continue;
    notifications.push({
      recipient: recipientId,
      type: 'card_assigned',
      message: `You were assigned to card "${card.title}".`,
    });
  }

  for (const recipientId of removedIds) {
    if (recipientId === actorKey) continue;
    notifications.push({
      recipient: recipientId,
      type: 'card_unassigned',
      message: `You were unassigned from card "${card.title}".`,
    });
  }

  for (const notificationData of notifications) {
    const notification = await Notification.create({
      ...notificationData,
      actor: actorId,
      workspace: workspaceId,
      board: boardId,
      card: card._id,
      cardTitle: card.title,
    });

    await notification.populate('actor', 'firstName lastName email');
    io?.to(`user:${notification.recipient}`).emit('notification:new', notification);
  }
};

module.exports = { createCardAssignmentNotifications };
