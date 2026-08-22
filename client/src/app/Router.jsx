import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import AcceptInvitePage from '../pages/AcceptInvitePage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ProfilePage from '../pages/ProfilePage';
import BoardPage from '../pages/BoardPage';
import WorkspacePage from '../pages/WorkspacePage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import AppHeader from '../components/app/AppHeader';
import ProtectedRoute from './ProtectedRoute';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AuthenticatedRoute({ children }) {
  return (
    <ProtectedRoute>
      <AppHeader />
      {children}
    </ProtectedRoute>
  );
}

export default function Router() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthenticatedRoute>
            <DashboardPage />
          </AuthenticatedRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/user/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/user/verify-email" element={<VerifyEmailPage />} />
      <Route
        path="/workspaces/invite/accept"
        element={
          <AuthenticatedRoute>
            <AcceptInvitePage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <AuthenticatedRoute>
            <ProfilePage />
          </AuthenticatedRoute>
        }
      />

      <Route
        path="/workspaces/:workspaceId"
        element={
          <AuthenticatedRoute>
            <WorkspacePage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/workspaces/:workspaceId/boards/:boardId"
        element={
          <AuthenticatedRoute>
            <BoardPage />
          </AuthenticatedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
