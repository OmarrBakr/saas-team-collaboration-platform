import { request } from './auth';

export const getMyWorkspaces = () =>
  request('/api/v1/workspaces', { method: 'GET' });

export const getWorkspace = (workspaceId) =>
  request(`/api/v1/workspaces/${workspaceId}`, { method: 'GET' });

export const getWorkspaceBoards = (workspaceId) =>
  request(`/api/v1/workspaces/${workspaceId}/boards`, { method: 'GET' });

export const getWorkspaceMembers = (workspaceId) =>
  request(`/api/v1/workspaces/${workspaceId}/members`, { method: 'GET' });

export const inviteWorkspaceMember = (workspaceId, payload) =>
  request(`/api/v1/workspaces/${workspaceId}/invite`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const acceptWorkspaceInvitation = (payload) =>
  request('/api/v1/workspaces/invite/accept', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const leaveWorkspace = (workspaceId) =>
  request(`/api/v1/workspaces/${workspaceId}/leave`, {
    method: 'DELETE',
  });

export const deleteWorkspace = (workspaceId) =>
  request(`/api/v1/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });

export const removeWorkspaceMember = (workspaceId, userId) =>
  request(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
    method: 'DELETE',
  });

export const createWorkspace = (payload) =>
  request('/api/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const uploadWorkspaceLogo = (workspaceId, file) => {
  const formData = new FormData();
  formData.append('logo', file);

  return fetch(`/api/v1/workspaces/${workspaceId}/logo`, {
    method: 'PATCH',
    credentials: 'include',
    body: formData,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.msg || 'Something went wrong');
    }

    return data;
  });
};
