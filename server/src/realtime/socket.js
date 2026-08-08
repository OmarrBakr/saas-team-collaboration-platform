const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const Board = require('../models/Board');
const Workspace = require('../models/Workspace');

const workspacePresence = new Map();
const boardPresence = new Map();

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((cookies, cookie) => {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex < 0) return cookies;

    const name = cookie.slice(0, separatorIndex).trim();
    const value = decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
    cookies[name] = value;
    return cookies;
  }, {});

const getPresence = (workspaceId) => [
  ...(workspacePresence.get(workspaceId)?.keys() || []),
];

const emitPresence = (io, workspaceId) => {
  io.to(`workspace:${workspaceId}`).emit('presence:updated', {
    workspaceId,
    userIds: getPresence(workspaceId),
  });
};

const emitBoardPresence = (io, boardId) => {
  io.to(`board:${boardId}`).emit('board:presence:updated', {
    boardId,
    userIds: [...(boardPresence.get(boardId)?.keys() || [])],
  });
};

const addPresence = (workspaceId, userId) => {
  if (!workspacePresence.has(workspaceId)) {
    workspacePresence.set(workspaceId, new Map());
  }

  const users = workspacePresence.get(workspaceId);
  users.set(userId, (users.get(userId) || 0) + 1);
};

const removePresence = (workspaceId, userId) => {
  const users = workspacePresence.get(workspaceId);
  if (!users) return;

  const connectionCount = (users.get(userId) || 0) - 1;
  if (connectionCount > 0) {
    users.set(userId, connectionCount);
  } else {
    users.delete(userId);
  }

  if (!users.size) workspacePresence.delete(workspaceId);
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
    socket.joinedWorkspaces = new Set();
    socket.joinedBoards = new Set();

    socket.on('presence:join-workspace', async (workspaceId, acknowledge) => {
      try {
        const workspace = await Workspace.findById(workspaceId).select('members');
        if (!workspace || !workspace.isMember(socket.user.userId)) {
          throw new Error('Workspace access denied');
        }

        const normalizedWorkspaceId = workspace._id.toString();
        if (!socket.joinedWorkspaces.has(normalizedWorkspaceId)) {
          socket.join(`workspace:${normalizedWorkspaceId}`);
          socket.joinedWorkspaces.add(normalizedWorkspaceId);
          addPresence(normalizedWorkspaceId, socket.user.userId);
          emitPresence(io, normalizedWorkspaceId);
        }

        acknowledge?.({
          ok: true,
          workspaceId: normalizedWorkspaceId,
          userIds: getPresence(normalizedWorkspaceId),
        });
      } catch (error) {
        acknowledge?.({ ok: false, message: error.message });
      }
    });

    const leaveWorkspace = (workspaceId) => {
      if (!socket.joinedWorkspaces.has(workspaceId)) return;

      socket.leave(`workspace:${workspaceId}`);
      socket.joinedWorkspaces.delete(workspaceId);
      removePresence(workspaceId, socket.user.userId);
      emitPresence(io, workspaceId);
    };

    socket.on('presence:leave-workspace', (workspaceId) => {
      leaveWorkspace(workspaceId?.toString());
    });

    socket.on('presence:join-board', async (boardId, acknowledge) => {
      try {
        const board = await Board.findById(boardId).select('workspace');
        const workspace = board
          ? await Workspace.findById(board.workspace).select('members')
          : null;

        if (!board || !workspace || !workspace.isMember(socket.user.userId)) {
          throw new Error('Board access denied');
        }

        const normalizedBoardId = board._id.toString();
        const normalizedWorkspaceId = workspace._id.toString();

        if (!socket.joinedWorkspaces.has(normalizedWorkspaceId)) {
          socket.join(`workspace:${normalizedWorkspaceId}`);
          socket.joinedWorkspaces.add(normalizedWorkspaceId);
          addPresence(normalizedWorkspaceId, socket.user.userId);
          emitPresence(io, normalizedWorkspaceId);
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
          workspaceId: normalizedWorkspaceId,
          userIds: [...(boardPresence.get(normalizedBoardId)?.keys() || [])],
        });
      } catch (error) {
        acknowledge?.({ ok: false, message: error.message });
      }
    });

    socket.on('presence:leave-board', (boardId) => {
      const normalizedBoardId = boardId?.toString();
      if (!socket.joinedBoards.has(normalizedBoardId)) return;

      socket.leave(`board:${normalizedBoardId}`);
      socket.joinedBoards.delete(normalizedBoardId);
      removeBoardPresence(normalizedBoardId, socket.user.userId);
      emitBoardPresence(io, normalizedBoardId);

      for (const workspaceId of socket.joinedWorkspaces) {
        leaveWorkspace(workspaceId);
      }
    });

    socket.on('disconnect', () => {
      for (const boardId of socket.joinedBoards) {
        removeBoardPresence(boardId, socket.user.userId);
        emitBoardPresence(io, boardId);
      }
      for (const workspaceId of socket.joinedWorkspaces) {
        removePresence(workspaceId, socket.user.userId);
        emitPresence(io, workspaceId);
      }
      socket.joinedWorkspaces.clear();
      socket.joinedBoards.clear();
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
