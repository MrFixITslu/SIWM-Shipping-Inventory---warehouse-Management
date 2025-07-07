// services/alertingService.ts
import { AlertLogEntry, AlertSeverity, UserAlertPreference, ScheduledReportSubscription } from '@/types';
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

  getUserAlertPreferences: async (): Promise<UserAlertPreference[]> => {
    const data = await api.get<any>('/notifications/preferences');
    return data.alertPreferences || [];
  },

  saveUserAlertPreferences: async (preferences: UserAlertPreference[]): Promise<boolean> => {
    const currentSubscriptions = await alertingService.getScheduledReportSubscriptions().catch(() => []);
    const data = await api.post<any>('/notifications/preferences', {
      alertPreferences: preferences,
      scheduledReportSubscriptions: currentSubscriptions,
    });
    return data.message === 'Notification preferences saved';
  },

  getScheduledReportSubscriptions: async (): Promise<ScheduledReportSubscription[]> => {
    const data = await api.get<any>('/notifications/preferences');
    return data.scheduledReportSubscriptions || [];
  },

  saveScheduledReportSubscriptions: async (subscriptions: ScheduledReportSubscription[]): Promise<boolean> => {
    const currentAlertPrefs = await alertingService.getUserAlertPreferences().catch(() => []);
    const data = await api.post<any>('/notifications/preferences', {
      alertPreferences: currentAlertPrefs,
      scheduledReportSubscriptions: subscriptions,
    });
    return data.message === 'Notification preferences saved';
  },
};
