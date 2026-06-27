import { request } from './auth';

export const getMyWorkspaces = () =>
  request('/api/v1/workspaces', { method: 'GET' });

export const getWorkspace = (workspaceId) =>
  request(`/api/v1/workspaces/${workspaceId}`, { method: 'GET' });

export const getWorkspaceBoards = (workspaceId) =>
  request(`/api/v1/workspaces/${workspaceId}/boards`, { method: 'GET' });

export const getWorkspaceMembers = (workspaceId) =>
  request(`/api/v1/workspaces/${workspaceId}/members`, { method: 'GET' });
