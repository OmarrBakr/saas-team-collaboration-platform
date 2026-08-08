import { io } from 'socket.io-client';

let socket;
const logSocket = (...args) => {
  if (import.meta.env.DEV) console.log('[socket]', ...args);
};

export const connectSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      withCredentials: true,
      autoConnect: false,
    });

    socket.on('connect', () => logSocket('connected', socket.id));
    socket.on('connect_error', (error) => logSocket('connection error', error.message));
    socket.on('disconnect', (reason) => logSocket('disconnected', reason));
  }

  logSocket('connecting');
  socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  logSocket('disconnect requested');
  socket?.disconnect();
};

export const getSocket = () => socket;

export const joinWorkspacePresence = (workspaceId) => {
  logSocket('joining workspace presence', workspaceId);
  socket?.emit('presence:join-workspace', workspaceId);
};

export const leaveWorkspacePresence = (workspaceId) => {
  logSocket('leaving workspace presence', workspaceId);
  socket?.emit('presence:leave-workspace', workspaceId);
};

export const joinBoardPresence = (boardId) => {
  logSocket('joining board presence', boardId);
  socket?.emit('presence:join-board', boardId);
};

export const leaveBoardPresence = (boardId) => {
  logSocket('leaving board presence', boardId);
  socket?.emit('presence:leave-board', boardId);
};
