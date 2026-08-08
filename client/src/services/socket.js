import { io } from 'socket.io-client';

let socket;

export const connectSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      withCredentials: true,
      autoConnect: false,
    });

  }

  socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
};

export const getSocket = () => socket;

export const joinWorkspacePresence = (workspaceId) => {
  socket?.emit('presence:join-workspace', workspaceId);
};

export const leaveWorkspacePresence = (workspaceId) => {
  socket?.emit('presence:leave-workspace', workspaceId);
};

export const joinBoardPresence = (boardId) => {
  socket?.emit('presence:join-board', boardId);
};

export const leaveBoardPresence = (boardId) => {
  socket?.emit('presence:leave-board', boardId);
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
