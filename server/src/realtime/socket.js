const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');

const Board = require('../models/Board');
const Workspace = require('../models/Workspace');
const redis = require('../utils/redis');
const logger = require('../utils/logger');

const globalPresenceKey = 'presence:global';
const boardPresenceKey = (boardId) => `presence:board:${boardId}`;
const isRedisAvailable = () => Boolean(redis?.isReady);

const createSocketEventLimiter = ({ windowMs, max }) => {
  return async (key) => {
    if (!isRedisAvailable()) return false;

    try {
      const redisKey = `socket-rate-limit:${key}`;
      const requestCount = await redis.incr(redisKey);

      if (requestCount === 1) {
        await redis.expire(redisKey, Math.ceil(windowMs / 1000));
      }

      return requestCount <= max;
    } catch (error) {
      logger.error('socket_rate_limit.redis_failed', {
        error: logger.serializeError(error),
      });
      return false;
    }
  };
};

const isPresenceEventAllowed = createSocketEventLimiter({
  windowMs: 60 * 1000,
  max: 30,
});

const logPresenceRateLimitExceeded = (socket, event) => {
  logger.warn('socket_rate_limit.exceeded', {
    userId: socket.user.userId,
    socketId: socket.id,
    socketEvent: event,
  });
};

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((cookies, cookie) => {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex < 0) return cookies;

    const name = cookie.slice(0, separatorIndex).trim();
    const value = decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
    cookies[name] = value;
    return cookies;
  }, {});

const emitGlobalPresence = async (io) => {
  const userIds = isRedisAvailable() ? await redis.hKeys(globalPresenceKey) : [];

  io.emit('presence:global:updated', {
    userIds,
  });
};

const emitBoardPresence = async (io, boardId) => {
  const userIds = isRedisAvailable() ? await redis.hKeys(boardPresenceKey(boardId)) : [];

  io.to(`board:${boardId}`).emit('board:presence:updated', {
    boardId,
    userIds,
  });
};

const addGlobalPresence = async (userId) => {
  if (isRedisAvailable()) await redis.hIncrBy(globalPresenceKey, userId, 1);
};

const removeGlobalPresence = async (userId) => {
  if (isRedisAvailable()) {
    const count = await redis.hIncrBy(globalPresenceKey, userId, -1);
    if (count <= 0) await redis.hDel(globalPresenceKey, userId);
  }
};

const addBoardPresence = async (boardId, userId) => {
  if (isRedisAvailable()) await redis.hIncrBy(boardPresenceKey(boardId), userId, 1);
};

const removeBoardPresence = async (boardId, userId) => {
  if (isRedisAvailable()) {
    const key = boardPresenceKey(boardId);
    const count = await redis.hIncrBy(key, userId, -1);
    if (count <= 0) await redis.hDel(key, userId);
  }
};

const setupSocket = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  if (isRedisAvailable()) {
    try {
      const pubClient = redis.duplicate();
      const subClient = redis.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('socket.redis_adapter.connected', { database: 'redis' });
    } catch (error) {
      logger.error('socket.redis_adapter.failed', {
        error: logger.serializeError(error),
      });
    }
  } else {
    logger.warn('socket.redis_adapter.unavailable');
  }

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

  io.on('connection', async (socket) => {
    socket.joinedBoards = new Set();
    socket.boardPresenceVersions = new Map();
    socket.join(`user:${socket.user.userId}`);
    addGlobalPresence(socket.user.userId);
    await emitGlobalPresence(io);

    socket.on('presence:join-board', async (boardId, acknowledge) => {
      if (!(await isPresenceEventAllowed(`${socket.user.userId}:presence:join-board`))) {
        logPresenceRateLimitExceeded(socket, 'presence:join-board');
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
          await addBoardPresence(normalizedBoardId, socket.user.userId);
          await emitBoardPresence(io, normalizedBoardId);
        }

        acknowledge?.({
          ok: true,
          boardId: normalizedBoardId,
          userIds: isRedisAvailable()
            ? await redis.hKeys(boardPresenceKey(normalizedBoardId))
            : [],
        });
      } catch (error) {
        acknowledge?.({ ok: false, message: error.message });
      }
    });

    socket.on('presence:leave-board', async (boardId, acknowledge) => {
      if (!(await isPresenceEventAllowed(`${socket.user.userId}:presence:leave-board`))) {
        logPresenceRateLimitExceeded(socket, 'presence:leave-board');
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
      await removeBoardPresence(normalizedBoardId, socket.user.userId);
      await emitBoardPresence(io, normalizedBoardId);

      acknowledge?.({ ok: true, boardId: normalizedBoardId, joined: false });

    });

    socket.on('disconnect', async () => {
      await removeGlobalPresence(socket.user.userId);
      await emitGlobalPresence(io);
      for (const boardId of socket.joinedBoards) {
        await removeBoardPresence(boardId, socket.user.userId);
        await emitBoardPresence(io, boardId);
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
