import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function initialsFromUser(user) {
  const first = user?.firstName?.[0] || '';
  const last = user?.lastName?.[0] || '';
  return `${first}${last}`.trim() || 'U';
}

export default function UserMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

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
        </div>
      )}
    </div>
  );
}
