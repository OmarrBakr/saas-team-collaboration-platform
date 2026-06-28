import { request } from './auth';

export const updateCurrentUser = (payload) =>
  request('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const updatePassword = (payload) =>
  request('/api/v1/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
