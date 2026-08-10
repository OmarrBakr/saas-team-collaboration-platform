import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logout } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

function initialsFromUser(user) {
  const first = user?.firstName?.[0] || '';
  const last = user?.lastName?.[0] || '';
  return `${first}${last}`.trim() || 'U';
}

export default function UserMenu({ open = false, onToggle = () => {} }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await logout();
    } catch (err) {
      // If the request fails, still clear the local session state.
    } finally {
      setUser(null);
      onToggle(false);
      setIsSigningOut(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-trigger"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
      >
        <span className="workspace-card-logo user-avatar">
          <span className="workspace-logo-fallback user-avatar-text">
            {initialsFromUser(user)}
          </span>
        </span>
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
            onClick={() => {
              onToggle(false);
              navigate('/profile');
            }}
          >
            Edit profile
          </button>
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
