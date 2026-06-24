// ─── Token refresh interceptor ────────────────────────────────────────────────
// If a request returns 401 we attempt one token refresh, then replay the
// original request. If the refresh also fails we redirect to /login.

let isRefreshing = false;
let pendingCallbacks = [];

const onRefreshComplete = () => {
  pendingCallbacks.forEach((cb) => cb());
  pendingCallbacks = [];
};

export const request = async (path, options = {}) => {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  // Only intercept 401 on non-auth endpoints so we don't loop forever
  const isAuthEndpoint =
    path.includes('/auth/refresh') ||
    path.includes('/auth/login') ||
    path.includes('/auth/register');

  if (res.status === 401 && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      isRefreshing = false;

      if (refreshRes.ok) {
        // Token refreshed — replay all queued requests
        onRefreshComplete();
      } else {
        // Refresh failed — clear queue and throw; ProtectedRoute will
        // redirect to /login via <Navigate> without a page reload
        pendingCallbacks = [];
        throw new Error('Session expired. Please sign in again.');
      }
    }

    // Queue this request until the in-flight refresh resolves
    return new Promise((resolve) => {
      pendingCallbacks.push(() => resolve(request(path, options)));
    });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.msg || 'Something went wrong');
  }

  return data;
};

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const login = (payload) =>
  request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) });

export const register = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) });

export const forgetPassword = (payload) =>
  request('/api/v1/auth/forgetPassword', { method: 'POST', body: JSON.stringify(payload) });

export const resetPassword = (payload) =>
  request('/api/v1/auth/resetPassword', { method: 'POST', body: JSON.stringify(payload) });

export const getCurrentUser = () =>
  request('/api/v1/users/me', { method: 'GET' });
