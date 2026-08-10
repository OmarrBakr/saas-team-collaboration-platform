const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

const Board = require('../models/Board');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { BadRequestError, NotFoundError } = require('../errors');
const {
  uploadCardAttachment: cloudinaryUploadCardAttachment,
  deleteCardAttachment: cloudinaryDeleteCardAttachment,
} = require('../utils/cloudinary');
const { emitBoardEvent } = require('../realtime/socket');
const {
  createCardActivityNotifications,
  createCardAssignmentNotifications,
} = require('../services/notifications');

const broadcastBoardEvent = (req, eventName, board, payload) => {
  emitBoardEvent(req.app.get('io'), eventName, board, {
    actorId: req.user?.userId?.toString?.(),
    ...payload,
  });
};

const getBoardByWorkspace = async (boardId, workspaceId) => {
  const board = await Board.findOne({
    _id: boardId,
    workspace: workspaceId,
  });

  if (!board) {
    throw new NotFoundError('Board not found');
  }

  return board;
};

const getColumnAndCard = (board, columnId, cardId) => {
  const column = board.columns.id(columnId);

  if (!column) {
    throw new NotFoundError('List not found');
  }

  const card = column.cards.id(cardId);

  if (!card) {
    throw new NotFoundError('Card not found');
  }

  return { column, card };
};

const findCardInBoard = (board, cardId) => {
  for (const column of board.columns) {
    const card = column.cards.id(cardId);
    if (card) {
      return { column, card };
    }
  }

  throw new NotFoundError('Card not found');
};

const validateAssignees = async (assignees, workspaceId) => {
  if (assignees === undefined) {
    return undefined;
  }

  if (!Array.isArray(assignees)) {
    throw new BadRequestError('Assignees must be an array of user ids');
  }

  for (const assigneeId of assignees) {
    if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
      throw new BadRequestError(`Invalid assignee id: ${assigneeId}`);
    }
  }

  const users = await User.find({ _id: { $in: assignees } }).select('_id');

  if (users.length !== assignees.length) {
    throw new BadRequestError('One or more assignees do not belong to a valid user account');
  }

  const workspace = await Workspace.findById(workspaceId).select('members.user');

  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }

  const memberIds = new Set(workspace.members.map((member) => member.user.toString()));
  const nonMembers = assignees.filter((assigneeId) => !memberIds.has(assigneeId.toString()));

  if (nonMembers.length > 0) {
    throw new BadRequestError('One or more assignees are not members of this workspace');
  }

  return assignees;
};

const validateLabels = (labels) => {
  if (labels === undefined) {
    return undefined;
  }

  if (!Array.isArray(labels)) {
    throw new BadRequestError('Labels must be an array');
  }

  return labels.map((label, index) => {
    if (!label || typeof label !== 'object') {
      throw new BadRequestError(`Label at position ${index} must be an object`);
    }

    const { name, color } = label;

    if (!name || !color) {
      throw new BadRequestError('Each label must have a name and a color');
    }

    return {
      name: String(name).trim(),
      color: String(color).trim(),
    };
  });
};

const deleteBoardAttachments = async (board) => {
  const attachmentDeletions = [];

  for (const column of board.columns) {
    for (const card of column.cards) {
      for (const attachment of card.attachments || []) {
        attachmentDeletions.push(
          cloudinaryDeleteCardAttachment(
            attachment.publicId,
            attachment.resourceType || 'image'
          )
        );
      }
    }
  }

  await Promise.all(attachmentDeletions);
};

const getWorkspaceBoards = async (req, res) => {
  const boards = await Board.find({ workspace: req.workspace._id }).sort({
    updatedAt: -1,
  });

  res.status(StatusCodes.OK).json({ count: boards.length, boards });
};

const createBoard = async (req, res) => {
  const { name, description = '' } = req.body;

  if (!name) {
    throw new BadRequestError('Board name is required');
  }

  const board = await Board.create({
    workspace: req.workspace._id,
    name,
    description,
  });

  res.status(StatusCodes.CREATED).json({ board });
};

const getBoard = async (req, res) => {
  const board = await Board.findOne({
    _id: req.params.boardId,
    workspace: req.workspace._id,
  }).populate('columns.cards.assignees', 'firstName lastName email');

  if (!board) {
    throw new NotFoundError('Board not found');
  }

  res.status(StatusCodes.OK).json({ board });
};

const updateBoard = async (req, res) => {
  const { name, description } = req.body;

  if (name === undefined && description === undefined) {
    throw new BadRequestError('Please provide at least one field to update');
  }

  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);

  if (name !== undefined) board.name = name;
  if (description !== undefined) board.description = description;

  await board.save();
  broadcastBoardEvent(req, 'board:updated', board);

  res.status(StatusCodes.OK).json({ board });
};

const deleteBoard = async (req, res) => {
  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);

  await deleteBoardAttachments(board);
  await board.deleteOne();
  req.app.get('io')?.to(`board:${req.params.boardId}`).emit('board:updated', {
    boardId: req.params.boardId,
    board: null,
    deleted: true,
    actorId: req.user?.userId?.toString?.(),
  });

  res.status(StatusCodes.OK).json({ msg: 'Board deleted successfully' });
};

const addColumn = async (req, res) => {
  const { title } = req.body;

  if (!title) {
    throw new BadRequestError('List title is required');
  }

  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);

  board.columns.push({
    title,
    position: board.columns.length,
    cards: [],
  });

  await board.save();
  broadcastBoardEvent(req, 'list:created', board);
  res.status(StatusCodes.OK).json({ board });
};

const addCard = async (req, res) => {
  const { columnId } = req.params;
  const { title, description = '', dueDate = null, priority = 'medium' } = req.body;

  if (!title) {
    throw new BadRequestError('Card title is required');
  }

  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);
  const column = board.columns.id(columnId);

  if (!column) {
    throw new NotFoundError('List not found');
  }

  column.cards.push({
    title,
    description,
    dueDate,
    priority,
    position: column.cards.length,
  });

  await board.save();
  broadcastBoardEvent(req, 'card:created', board);
  res.status(StatusCodes.CREATED).json({ board });
};

const updateColumn = async (req, res) => {
  const { title } = req.body;

  if (!title) {
    throw new BadRequestError('List title is required');
  }

  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);
  const column = board.columns.id(req.params.columnId);

  if (!column) {
    throw new NotFoundError('List not found');
  }

  column.title = title;
  await board.save();
  broadcastBoardEvent(req, 'list:updated', board);

  res.status(StatusCodes.OK).json({ board });
};

const deleteColumn = async (req, res) => {
  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);
  const column = board.columns.id(req.params.columnId);

  if (!column) {
    throw new NotFoundError('List not found');
  }

  if (column.cards.length > 0) {
    throw new BadRequestError('List must be empty before it can be deleted');
  }

  board.columns.pull(req.params.columnId);

  board.columns.forEach((currentColumn, index) => {
    currentColumn.position = index;
  });

  await board.save();
  broadcastBoardEvent(req, 'list:deleted', board);
  res.status(StatusCodes.OK).json({ msg: 'List deleted successfully', board });
};

const moveColumn = async (req, res) => {
  const { toPosition } = req.body;

  if (toPosition === undefined) {
    throw new BadRequestError('Please provide a target position');
  }

  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);
  const column = board.columns.id(req.params.columnId);

  if (!column) {
    throw new NotFoundError('List not found');
  }

  const currentIndex = board.columns.findIndex(
    (currentColumn) => currentColumn._id.toString() === req.params.columnId
  );

  const targetIndex = Number(toPosition);

  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= board.columns.length) {
    throw new BadRequestError('Target position is out of range');
  }

  const [movedColumn] = board.columns.splice(currentIndex, 1);
  board.columns.splice(targetIndex, 0, movedColumn);

  board.columns.forEach((currentColumn, index) => {
    currentColumn.position = index;
  });

  await board.save();
  broadcastBoardEvent(req, 'list:moved', board);
  res.status(StatusCodes.OK).json({ board });
};

const updateCard = async (req, res) => {
  const {
    title,
    description,
    assignees,
    labels,
    dueDate,
    priority,
  } = req.body;

  if (
    title === undefined &&
    description === undefined &&
    assignees === undefined &&
    labels === undefined &&
    dueDate === undefined &&
    priority === undefined
  ) {
    throw new BadRequestError('Please provide at least one field to update');
  }

  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);
  const previousAssigneeIds = [];
  const hasCardContentUpdate = [title, description, labels, dueDate, priority]
    .some((value) => value !== undefined);
  let sourceColumn;
  let card;

  for (const currentColumn of board.columns) {
    const foundCard = currentColumn.cards.id(req.params.cardId);
    if (foundCard) {
      sourceColumn = currentColumn;
      card = foundCard;
      break;
    }
  }

  if (!card || !sourceColumn) {
    throw new NotFoundError('Card not found');
  }

  previousAssigneeIds.push(...card.assignees);

  if (title !== undefined) card.title = title;
  if (description !== undefined) card.description = description;
  if (dueDate !== undefined) card.dueDate = dueDate;
  if (priority !== undefined) card.priority = priority;

  if (assignees !== undefined) {
    card.assignees = await validateAssignees(assignees, req.workspace._id);
  }

  if (labels !== undefined) {
    card.labels = validateLabels(labels);
  }

  await board.save();
  if (assignees !== undefined) {
    await createCardAssignmentNotifications({
      io: req.app.get('io'),
      actorId: req.user.userId,
      workspaceId: req.workspace._id,
      boardId: board._id,
      card,
      previousAssigneeIds,
    });
  }
  if (hasCardContentUpdate) {
    const currentAssigneeIds = card.assignees.map((id) => id.toString());
    const previousAssigneeSet = new Set(previousAssigneeIds.map((id) => id.toString()));
    const existingAssigneeIds = currentAssigneeIds.filter((id) => previousAssigneeSet.has(id));

    await createCardActivityNotifications({
      io: req.app.get('io'),
      actorId: req.user.userId,
      workspaceId: req.workspace._id,
      boardId: board._id,
      card,
      type: 'card_updated',
      message: `Card "${card.title}" was updated.`,
      recipientIds: existingAssigneeIds,
    });
  }
  broadcastBoardEvent(req, 'card:updated', board);
  res.status(StatusCodes.OK).json({ board });
};

const deleteCard = async (req, res) => {
  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);

  for (const column of board.columns) {
    const card = column.cards.id(req.params.cardId);
    if (card) {
      await Promise.all(
        (card.attachments || []).map((attachment) =>
          cloudinaryDeleteCardAttachment(
            attachment.publicId,
            attachment.resourceType || 'image'
          )
        )
      );
      const cardData = card.toObject();
      column.cards.pull(req.params.cardId);
      await board.save();
      await createCardActivityNotifications({
        io: req.app.get('io'),
        actorId: req.user.userId,
        workspaceId: req.workspace._id,
        boardId: board._id,
        card: cardData,
        type: 'card_deleted',
        message: `Card "${cardData.title}" was deleted.`,
      });
      broadcastBoardEvent(req, 'card:deleted', board);
      return res.status(StatusCodes.OK).json({ msg: 'Card deleted successfully', board });
    }
  }

  throw new NotFoundError('Card not found');
};

const uploadCardAttachment = async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('Please provide a file to upload');
  }

  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);
  const { card } = findCardInBoard(board, req.params.cardId);

  const result = await cloudinaryUploadCardAttachment(
    req.file.buffer,
    board._id,
    card._id,
    req.file.originalname
  );

  card.attachments.push({
    title: req.file.originalname,
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: req.file.mimetype,
    resourceType: result.resource_type || 'image',
    size: req.file.size,
    uploadedAt: new Date(),
  });

  await board.save();

  res.status(StatusCodes.OK).json({ board });
};

const deleteCardAttachment = async (req, res) => {
  const { attachmentId } = req.params;
  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);
  const { card } = findCardInBoard(board, req.params.cardId);

  const attachment = card.attachments.id(attachmentId);

  if (!attachment) {
    throw new NotFoundError('Attachment not found');
  }

  await cloudinaryDeleteCardAttachment(
    attachment.publicId,
    attachment.resourceType || 'image'
  );
  card.attachments.pull(attachmentId);
  await board.save();

  res.status(StatusCodes.OK).json({ board });
};

const moveCard = async (req, res) => {
  const { fromColumnId, toColumnId, cardId } = req.params;
  const { position } = req.body;

  if (position === undefined) {
    throw new BadRequestError('Please provide a target position');
  }

  const board = await getBoardByWorkspace(req.params.boardId, req.workspace._id);
  const { column: fromColumn, card } = getColumnAndCard(board, fromColumnId, cardId);
  const toColumn = board.columns.id(toColumnId);

  if (!toColumn) {
    throw new NotFoundError('List not found');
  }

  const fromColumnTitle = fromColumn.title;
  const toColumnTitle = toColumn.title;

  const cardData = card.toObject();
  fromColumn.cards.pull(cardId);

  const targetPosition = Number(position);

  if (!Number.isInteger(targetPosition) || targetPosition < 0) {
    throw new BadRequestError('Target position must be a non-negative integer');
  }

  if (fromColumnId === toColumnId) {
    const currentCards = fromColumn.cards.toObject();
    const boundedPosition = Math.min(targetPosition, currentCards.length);
    currentCards.splice(boundedPosition, 0, cardData);
    fromColumn.cards = currentCards;
  } else {
    const currentCards = toColumn.cards.toObject();
    const boundedPosition = Math.min(targetPosition, currentCards.length);
    currentCards.splice(boundedPosition, 0, cardData);
    toColumn.cards = currentCards;
  }

  const normalizeCards = (cards) =>
    cards.forEach((currentCard, index) => {
      currentCard.position = index;
    });

  normalizeCards(fromColumn.cards);
  normalizeCards(toColumn.cards);

  await board.save();
  if (fromColumnId !== toColumnId) {
    await createCardActivityNotifications({
      io: req.app.get('io'),
      actorId: req.user.userId,
      workspaceId: req.workspace._id,
      boardId: board._id,
      card: cardData,
      type: 'card_moved',
      message: `Card "${cardData.title}" was moved from "${fromColumnTitle}" to "${toColumnTitle}".`,
    });
  }
  broadcastBoardEvent(req, 'card:moved', board);
  res.status(StatusCodes.OK).json({ board });
};

module.exports = {
  getWorkspaceBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addColumn,
  addCard,
  updateColumn,
  deleteColumn,
  moveColumn,
  updateCard,
  deleteCard,
  uploadCardAttachment,
  deleteCardAttachment,
  moveCard,
};
