const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const Board = require('../models/Board');
const Workspace = require('../models/Workspace');

const globalPresence = new Map();
const boardPresence = new Map();

const createSocketEventLimiter = ({ windowMs, max }) => {
  const eventsByKey = new Map();

  return (key) => {
    const now = Date.now();
    const timestamps = (eventsByKey.get(key) || []).filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (timestamps.length >= max) {
      eventsByKey.set(key, timestamps);
      return false;
    }

    timestamps.push(now);
    eventsByKey.set(key, timestamps);
    return true;
  };
};

const isPresenceEventAllowed = createSocketEventLimiter({
  windowMs: 60 * 1000,
  max: 30,
});

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((cookies, cookie) => {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex < 0) return cookies;

    const name = cookie.slice(0, separatorIndex).trim();
    const value = decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
    cookies[name] = value;
    return cookies;
  }, {});

const emitGlobalPresence = (io) => {
  io.emit('presence:global:updated', {
    userIds: [...globalPresence.keys()],
  });
};

const emitBoardPresence = (io, boardId) => {
  io.to(`board:${boardId}`).emit('board:presence:updated', {
    boardId,
    userIds: [...(boardPresence.get(boardId)?.keys() || [])],
  });
};

const addGlobalPresence = (userId) => {
  globalPresence.set(userId, (globalPresence.get(userId) || 0) + 1);
};

const removeGlobalPresence = (userId) => {
  const connectionCount = (globalPresence.get(userId) || 0) - 1;
  if (connectionCount > 0) {
    globalPresence.set(userId, connectionCount);
  } else {
    globalPresence.delete(userId);
  }
};

const addBoardPresence = (boardId, userId) => {
  if (!boardPresence.has(boardId)) boardPresence.set(boardId, new Map());
  const users = boardPresence.get(boardId);
  users.set(userId, (users.get(userId) || 0) + 1);
};

const removeBoardPresence = (boardId, userId) => {
  const users = boardPresence.get(boardId);
  if (!users) return;

  const connectionCount = (users.get(userId) || 0) - 1;
  if (connectionCount > 0) users.set(userId, connectionCount);
  else users.delete(userId);

  if (!users.size) boardPresence.delete(boardId);
};

const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.accessToken;
      if (!token) return next(new Error('Authentication invalid'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { userId: payload.userId.toString() };
      next();
    } catch (error) {
      next(new Error('Authentication invalid'));
    }
  });

  io.on('connection', (socket) => {
    socket.joinedBoards = new Set();
    socket.boardPresenceVersions = new Map();
    socket.join(`user:${socket.user.userId}`);
    addGlobalPresence(socket.user.userId);
    emitGlobalPresence(io);

    socket.on('presence:join-board', async (boardId, acknowledge) => {
      if (!isPresenceEventAllowed(`${socket.user.userId}:presence:join-board`)) {
        acknowledge?.({ ok: false, code: 'RATE_LIMITED', message: 'Too many board presence requests' });
        return;
      }

      try {
        const normalizedRequestedBoardId = boardId?.toString();
        const operationVersion =
          (socket.boardPresenceVersions.get(normalizedRequestedBoardId) || 0) + 1;
        socket.boardPresenceVersions.set(normalizedRequestedBoardId, operationVersion);

        const board = await Board.findById(boardId).select('workspace');
        const workspace = board
          ? await Workspace.findById(board.workspace).select('members')
          : null;

        if (!board || !workspace || !workspace.isMember(socket.user.userId)) {
          throw new Error('Board access denied');
        }

        const normalizedBoardId = board._id.toString();
        if (
          socket.disconnected ||
          socket.boardPresenceVersions.get(normalizedBoardId) !== operationVersion
        ) {
          acknowledge?.({ ok: false, message: 'Board presence request expired' });
          return;
        }

        if (!socket.joinedBoards.has(normalizedBoardId)) {
          socket.join(`board:${normalizedBoardId}`);
          socket.joinedBoards.add(normalizedBoardId);
          addBoardPresence(normalizedBoardId, socket.user.userId);
          emitBoardPresence(io, normalizedBoardId);
        }

        acknowledge?.({
          ok: true,
          boardId: normalizedBoardId,
          userIds: [...(boardPresence.get(normalizedBoardId)?.keys() || [])],
        });
      } catch (error) {
        acknowledge?.({ ok: false, message: error.message });
      }
    });

    socket.on('presence:leave-board', (boardId, acknowledge) => {
      if (!isPresenceEventAllowed(`${socket.user.userId}:presence:leave-board`)) {
        acknowledge?.({ ok: false, code: 'RATE_LIMITED', message: 'Too many board presence requests' });
        return;
      }

      const normalizedBoardId = boardId?.toString();
      socket.boardPresenceVersions.set(
        normalizedBoardId,
        (socket.boardPresenceVersions.get(normalizedBoardId) || 0) + 1
      );
      if (!socket.joinedBoards.has(normalizedBoardId)) {
        acknowledge?.({ ok: true, boardId: normalizedBoardId, joined: false });
        return;
      }

      socket.leave(`board:${normalizedBoardId}`);
      socket.joinedBoards.delete(normalizedBoardId);
      removeBoardPresence(normalizedBoardId, socket.user.userId);
      emitBoardPresence(io, normalizedBoardId);

      acknowledge?.({ ok: true, boardId: normalizedBoardId, joined: false });

    });

    socket.on('disconnect', () => {
      removeGlobalPresence(socket.user.userId);
      emitGlobalPresence(io);
      for (const boardId of socket.joinedBoards) {
        removeBoardPresence(boardId, socket.user.userId);
        emitBoardPresence(io, boardId);
      }
      socket.joinedBoards.clear();
      socket.boardPresenceVersions.clear();
    });
  });

  return io;
};

const emitBoardEvent = (io, eventName, board, payload = {}) => {
  if (!io || !board?._id) return;

  io.to(`board:${board._id}`).emit(eventName, {
    boardId: board._id.toString(),
    board,
    ...payload,
  });
};

module.exports = setupSocket;
module.exports.emitBoardEvent = emitBoardEvent;
