import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import UserMenu from '../dashboard/UserMenu';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard.css';

export default function AppHeader() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAuth();
  const [openMenu, setOpenMenu] = useState('');
  const isNotificationsOpen = openMenu === 'notifications';
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  const openNotification = async (notification) => {
    if (!notification.readAt) {
      await markNotificationRead(notification._id);
    }

    setOpenMenu('');
    if (notification.workspace && notification.board) {
      navigate(`/workspaces/${notification.workspace}/boards/${notification.board}`);
    }
  };

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
            {unreadCount > 0 && <span className="notifications-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {isNotificationsOpen && (
            <div className="notifications-panel" role="dialog" aria-label="Notifications">
              <div className="notifications-panel-head">
                <strong>Notifications</strong>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllNotificationsRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length ? (
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <button
                      key={notification._id}
                      type="button"
                      className={`notification-item${notification.readAt ? '' : ' notification-item--unread'}`}
                      onClick={() => openNotification(notification)}
                    >
                      <span>{notification.message}</span>
                      <small>{new Date(notification.createdAt).toLocaleString()}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="notifications-empty">No notifications.</p>
              )}
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
