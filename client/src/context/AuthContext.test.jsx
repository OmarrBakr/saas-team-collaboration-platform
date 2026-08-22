import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const { getCurrentUser, getNotifications, socket } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getNotifications: vi.fn(),
  socket: { on: vi.fn(), off: vi.fn() },
}));

vi.mock('../services/auth', () => ({ getCurrentUser }));
vi.mock('../services/notifications', () => ({
  getNotifications,
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));
vi.mock('../services/socket', () => ({
  connectSocket: vi.fn(() => socket),
  disconnectSocket: vi.fn(),
  joinBoardPresence: vi.fn(),
  leaveBoardPresence: vi.fn(),
}));

function AuthStatus() {
  const { user, loading } = useAuth();
  return <output>{loading ? 'loading' : user ? user.email : 'signed-out'}</output>;
}

describe('AuthProvider', () => {
  it('does not fetch the current user on the login page', async () => {
    getCurrentUser.mockResolvedValue({ user: { email: 'user@example.com' } });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AuthStatus />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it('loads the current user on a protected page', async () => {
    getCurrentUser.mockResolvedValue({ user: { email: 'user@example.com' } });
    getNotifications.mockResolvedValue({ notifications: [] });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <AuthStatus />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('user@example.com')).toBeInTheDocument());
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });
});
