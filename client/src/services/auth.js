const request = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.msg || 'Something went wrong');
  }

  return data;
};

export const login = (payload) =>
  request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const register = (payload) =>
  request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const forgetPassword = (payload) =>
  request('/api/v1/auth/forgetPassword', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const resetPassword = (payload) =>
  request('/api/v1/auth/resetPassword', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
