import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { getCurrentUser } from '../services/auth';

const AuthContext = createContext(null);

const isPublicTokenPage = (pathname) =>
  pathname === '/reset-password' ||
  pathname === '/user/reset-password' ||
  pathname === '/verify-email' ||
  pathname === '/user/verify-email';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
