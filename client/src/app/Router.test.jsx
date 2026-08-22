import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

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

describe('ProtectedRoute', () => {
  beforeEach(() => {
    getNotifications.mockResolvedValue({ notifications: [] });
  });

  it('renders its content for an authenticated user', async () => {
    getCurrentUser.mockResolvedValue({ user: { email: 'user@example.com' } });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <AuthProvider>
          <ProtectedRoute>
            <p>Private content</p>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Private content')).toBeInTheDocument();
  });

  it('does not render protected content when authentication fails', async () => {
    getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    render(
      <MemoryRouter initialEntries={['/private']}>
        <AuthProvider>
          <ProtectedRoute>
            <p>Private content</p>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.queryByText('Private content')).not.toBeInTheDocument()
    );
  });
});
