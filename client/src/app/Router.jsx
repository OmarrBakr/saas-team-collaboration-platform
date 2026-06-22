import AuthPage from '../pages/AuthPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

export default function Router() {
  const path = window.location.pathname;

  if (path === '/') {
    return <AuthPage />;
  }

  if (path === '/auth') {
    return <AuthPage />;
  }

  if (path === '/reset-password' || path === '/user/reset-password') {
    return <ResetPasswordPage />;
  }

  return <AuthPage />;
}
