import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logout } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

function initialsFromUser(user) {
  const first = user?.firstName?.[0] || '';
  const last = user?.lastName?.[0] || '';
  return `${first}${last}`.trim() || 'U';
}

export default function UserMenu() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await logout();
    } catch (err) {
      // If the request fails, still clear the local session state.
    } finally {
      setUser(null);
      setOpen(false);
      setIsSigningOut(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="user-avatar">{initialsFromUser(user)}</span>
        <span className="user-meta">
          <strong>{user?.firstName} {user?.lastName}</strong>
          <small>{user?.email}</small>
        </span>
      </button>

      {open && (
        <div className="user-menu-panel">
          <div className="user-menu-header">
            <strong>{user?.firstName} {user?.lastName}</strong>
            <span>{user?.email}</span>
          </div>
          <button
            type="button"
            className="user-menu-item"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
