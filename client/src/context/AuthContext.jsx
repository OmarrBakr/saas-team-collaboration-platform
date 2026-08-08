import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { getCurrentUser } from '../services/auth';
import {
  connectSocket,
  disconnectSocket,
  joinBoardPresence,
  joinWorkspacePresence,
  leaveBoardPresence,
  leaveWorkspacePresence,
} from '../services/socket';

const AuthContext = createContext(null);

const isPublicTokenPage = (pathname) =>
  pathname === '/login' ||
  pathname === '/reset-password' ||
  pathname === '/user/reset-password' ||
  pathname === '/verify-email' ||
  pathname === '/user/verify-email' ||
  pathname === '/register' ||
  pathname === '/forgot-password';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [presenceByWorkspace, setPresenceByWorkspace] = useState({});
  const [presenceByBoard, setPresenceByBoard] = useState({});
  const location = useLocation();
  const initialPathname = location.pathname;

  useEffect(() => {
    if (isPublicTokenPage(initialPathname)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getCurrentUser()
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setPresenceByWorkspace({});
      setPresenceByBoard({});
      return undefined;
    }

    const socket = connectSocket();
    const handlePresenceUpdate = ({ workspaceId, userIds }) => {
      setPresenceByWorkspace((current) => ({
        ...current,
        [workspaceId]: userIds,
      }));
    };
    const handleBoardPresenceUpdate = ({ boardId, userIds }) => {
      setPresenceByBoard((current) => ({ ...current, [boardId]: userIds }));
    };

    socket.on('presence:updated', handlePresenceUpdate);
    socket.on('board:presence:updated', handleBoardPresenceUpdate);

    return () => {
      socket.off('presence:updated', handlePresenceUpdate);
      socket.off('board:presence:updated', handleBoardPresenceUpdate);
      disconnectSocket();
      setPresenceByWorkspace({});
      setPresenceByBoard({});
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        presenceByWorkspace,
        presenceByBoard,
        joinBoardPresence,
        joinWorkspacePresence,
        leaveBoardPresence,
        leaveWorkspacePresence,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
