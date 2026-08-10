import { request } from './auth';

export const getNotifications = () =>
  request('/api/v1/notifications', { method: 'GET' });

export const markNotificationRead = (notificationId) =>
  request(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' });

export const markAllNotificationsRead = () =>
  request('/api/v1/notifications/read', { method: 'PATCH' });
