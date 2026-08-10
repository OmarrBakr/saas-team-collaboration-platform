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

const createCardActivityNotifications = async ({
  io,
  actorId,
  workspaceId,
  boardId,
  card,
  type,
  message,
  recipientIds,
}) => {
  const actorKey = actorId.toString();
  const recipients = (recipientIds || (card.assignees || []).map((id) => id.toString()));
  const uniqueRecipientIds = [...new Set(recipients)]
    .filter((recipientId) => recipientId !== actorKey);

  for (const recipientId of uniqueRecipientIds) {
    const notification = await Notification.create({
      recipient: recipientId,
      actor: actorId,
      type,
      workspace: workspaceId,
      board: boardId,
      card: card._id,
      cardTitle: card.title,
      message,
    });

    await notification.populate('actor', 'firstName lastName email');
    io?.to(`user:${notification.recipient}`).emit('notification:new', notification);
  }
};

const createWorkspaceNotifications = async ({
  io,
  actorId,
  workspaceId,
  type,
  notifications,
}) => {
  for (const { recipientId, message } of notifications) {
    if (recipientId.toString() === actorId.toString()) continue;

    const notification = await Notification.create({
      recipient: recipientId,
      actor: actorId,
      type,
      workspace: workspaceId,
      message,
    });

    await notification.populate('actor', 'firstName lastName email');
    io?.to(`user:${notification.recipient}`).emit('notification:new', notification);
  }
};

module.exports = {
  createCardAssignmentNotifications,
  createCardActivityNotifications,
  createWorkspaceNotifications,
};
