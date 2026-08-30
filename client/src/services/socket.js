import { io } from 'socket.io-client';

let socket;
const activeBoardPresence = new Map();
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

const requestBoardPresence = (boardId) => {
  const normalizedBoardId = boardId?.toString();
  if (!socket || !normalizedBoardId) return;

  socket.emit('presence:join-board', normalizedBoardId, (response) => {
    if (!response?.ok) {
      return;
    }

    activeBoardPresence.get(normalizedBoardId)?.(response);
  });
};

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });
    socket.on('connect', () => {
      activeBoardPresence.forEach((_, boardId) => requestBoardPresence(boardId));
    });
  }

  socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
};

export const getSocket = () => socket;

export const joinBoardPresence = (boardId, onPresence) => {
  const normalizedBoardId = boardId?.toString();
  if (!normalizedBoardId) return;

  activeBoardPresence.set(normalizedBoardId, onPresence);
  requestBoardPresence(normalizedBoardId);
};

export const leaveBoardPresence = (boardId) => {
  const normalizedBoardId = boardId?.toString();
  if (!normalizedBoardId) return;

  activeBoardPresence.delete(normalizedBoardId);
  socket?.emit('presence:leave-board', normalizedBoardId, (response) => {
    if (!response?.ok) {
      return;
    }

  });
};

const boardEventNames = [
  'board:updated',
  'list:created',
  'list:updated',
  'list:moved',
  'list:deleted',
  'card:created',
  'card:updated',
  'card:moved',
  'card:deleted',
];

export const subscribeToBoardUpdates = (boardId, handler) => {
  if (!socket) return () => {};

  const listeners = boardEventNames.map((eventName) => {
    const listener = (payload) => {
      if (payload?.boardId?.toString?.() !== boardId?.toString?.()) return;
      handler(eventName, payload);
    };

    socket.on(eventName, listener);
    return { eventName, listener };
  });

  return () => {
    listeners.forEach(({ eventName, listener }) => socket.off(eventName, listener));
  };
};
