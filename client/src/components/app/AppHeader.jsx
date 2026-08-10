import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import UserMenu from '../dashboard/UserMenu';
import '../../styles/dashboard.css';

export default function AppHeader() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState('');
  const isNotificationsOpen = openMenu === 'notifications';

  return (
    <header className="app-header">
      <button type="button" className="app-brand" onClick={() => navigate('/')}>
        <span className="app-brand-mark" aria-hidden="true">F</span>
        <span>Flowvia</span>
      </button>

      <div className="app-header-actions">
        <div className="notifications-menu">
          <button
            type="button"
            className="notifications-trigger"
            onClick={() => setOpenMenu((current) => (current === 'notifications' ? '' : 'notifications'))}
            aria-label="Open notifications"
            aria-expanded={isNotificationsOpen}
            aria-haspopup="true"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
            </svg>
          </button>

          {isNotificationsOpen && (
            <div className="notifications-panel" role="dialog" aria-label="Notifications">
              <div className="notifications-panel-head">
                <strong>Notifications</strong>
              </div>
              <p className="notifications-empty">No new notifications.</p>
            </div>
          )}
        </div>

        <UserMenu
          open={openMenu === 'profile'}
          onToggle={(shouldOpen) => setOpenMenu(shouldOpen ? 'profile' : '')}
        />
      </div>
    </header>
  );
}
