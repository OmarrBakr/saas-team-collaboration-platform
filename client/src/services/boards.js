import { request } from './auth';

export const getBoard = (workspaceId, boardId) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`, { method: 'GET' });

export const updateBoard = (workspaceId, boardId, payload) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteBoard = (workspaceId, boardId) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}`, {
    method: 'DELETE',
  });

export const createList = (workspaceId, boardId, payload) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/columns`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateList = (workspaceId, boardId, columnId, payload) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteList = (workspaceId, boardId, columnId) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`, {
    method: 'DELETE',
  });

export const moveList = (workspaceId, boardId, columnId, payload) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/move`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const moveCard = (workspaceId, boardId, cardId, fromColumnId, toColumnId, payload) =>
  request(
    `/api/v1/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/move/${fromColumnId}/${toColumnId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

export const createCard = (workspaceId, boardId, columnId, payload) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/cards`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateCard = (workspaceId, boardId, cardId, payload) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteCard = (workspaceId, boardId, cardId) =>
  request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}`, {
    method: 'DELETE',
  });

export const uploadCardAttachment = (workspaceId, boardId, cardId, file) => {
  const formData = new FormData();
  formData.append('attachment', file);

  return request(`/api/v1/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/attachments`, {
    method: 'POST',
    contentType: null,
    body: formData,
  });
};

export const deleteCardAttachment = (workspaceId, boardId, cardId, attachmentId) =>
  request(
    `/api/v1/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/attachments/${attachmentId}`,
    {
      method: 'DELETE',
    }
  );
