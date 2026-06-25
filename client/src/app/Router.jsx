import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import AuthPage from '../pages/AuthPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';

// ─── Placeholder dashboard (replace when the real page exists) ─────────────────
function Dashboard() {
  const { user } = useAuth();
  return (
    <div style={{ padding: '2rem', color: '#eef3ff', fontFamily: 'inherit' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.firstName}!</p>
    </div>
  );
}

// ─── Route guard ───────────────────────────────────────────────────────────────
// While the session check is in-flight we render nothing (avoids flicker).
// Once resolved:
//   • authenticated  → render the requested page
//   • unauthenticated → redirect to /login, preserving the intended URL
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─── Public-only guard ─────────────────────────────────────────────────────────
// Prevents authenticated users from hitting /login or /register again
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ─── Router ────────────────────────────────────────────────────────────────────
export default function Router() {
  return (
    <Routes>
      {/* "/" → dashboard (protected) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* "/login" → auth page (public-only) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Password reset — accessible to anyone with a valid token link */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/user/reset-password" element={<ResetPasswordPage />} />

      {/* Email verification — accessible to anyone with a valid token link */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/user/verify-email" element={<VerifyEmailPage />} />

      {/* Fallback — redirect unknown paths to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
