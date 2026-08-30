// ─── Token refresh interceptor ────────────────────────────────────────────────
// If a request returns 401 we attempt one token refresh, then replay the
// original request. If the refresh also fails we redirect to /login.

let refreshPromise = null;
const API_URL = import.meta.env.VITE_BACKEND_URL || '';

const getCookie = (name) =>
  document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split('=')[1];

const ensureCsrfToken = async () => {
  let token = getCookie('csrfToken');

  if (!token) {
    const response = await fetch(`${API_URL}/api/v1/auth/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    token = data.csrfToken;
  }

  return token;
};

const redirectToLogin = () => {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign('/login');
};

export const request = async (path, options = {}) => {
  const { contentType = 'application/json', headers = {}, ...fetchOptions } = options;
  const requestHeaders = { ...headers };

  if (contentType) {
    requestHeaders['Content-Type'] = contentType;
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes((fetchOptions.method || 'GET').toUpperCase())) {
    requestHeaders['X-CSRF-Token'] = await ensureCsrfToken();
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders,
    credentials: 'include',
  });

  // Only intercept 401 on non-auth endpoints so we don't loop forever
  const isAuthEndpoint =
    path.includes('/auth/refresh') ||
    path.includes('/auth/login') ||
    path.includes('/auth/logout') ||
    path.includes('/auth/register') ||
    path.includes('/auth/verifyEmail') ||
    path.includes('/auth/resetPassword') ||
    path.includes('/auth/forgetPassword');

  if (res.status === 401 && !isAuthEndpoint) {
    if (!refreshPromise) {
      refreshPromise = ensureCsrfToken().then((csrfToken) =>
        fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-CSRF-Token': csrfToken },
        })
      )
        .then((refreshRes) => {
          if (!refreshRes.ok) {
            redirectToLogin();
            throw new Error('Session expired. Please sign in again.');
          }
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    await refreshPromise;
    return request(path, options);
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

export const logout = () =>
  request('/api/v1/auth/logout', { method: 'POST' });

export const register = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) });

export const forgetPassword = (payload) =>
  request('/api/v1/auth/forgetPassword', { method: 'POST', body: JSON.stringify(payload) });

export const resetPassword = (payload) =>
  request('/api/v1/auth/resetPassword', { method: 'POST', body: JSON.stringify(payload) });

export const verifyEmail = (payload) =>
  request('/api/v1/auth/verifyEmail', { method: 'POST', body: JSON.stringify(payload) });

export const getCurrentUser = () =>
  request('/api/v1/users/me', { method: 'GET' });

export { ensureCsrfToken };
