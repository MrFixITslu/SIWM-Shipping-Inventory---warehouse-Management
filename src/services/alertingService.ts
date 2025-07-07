// services/alertingService.ts
import { AlertLogEntry, AlertSeverity, NotificationPreferences } from '@/types';
import { api } from './apiHelper';

export const alertingService = {
  getAlertLog: (): Promise<AlertLogEntry[]> => {
    return api.get('/notifications/alerts');
  },

  addAlert: async (severity: AlertSeverity, message: string, type: string, detailsLink?: string): Promise<AlertLogEntry> => {
    const newAlert = await api.post<AlertLogEntry>('/notifications/alerts', { severity, message, type, detailsLink });
    window.dispatchEvent(new CustomEvent('newAlertAdded', { detail: newAlert }));
    return newAlert;
  },

  markAlertAsRead: async (alertId: string): Promise<boolean> => {
    const data = await api.post<any>(`/notifications/alerts/${alertId}/mark-read`, {});
    return data.message === 'Alert marked as read';
  },
  
  markAllAlertsAsRead: async (): Promise<boolean> => {
    const data = await api.post<any>('/notifications/alerts/mark-all-read', {});
    return data.message === 'All alerts marked as read';
  },

  getNotificationPreferences: (): Promise<NotificationPreferences> => {
    return api.get('/notifications/preferences');
  },

  saveNotificationPreferences: (preferences: NotificationPreferences): Promise<{ message: string }> => {
    return api.post('/notifications/preferences', preferences);
  },
};
