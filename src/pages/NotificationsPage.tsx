

import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import NotificationItem from '@/components/NotificationItem';
import NotificationPreferencesForm from '@/components/NotificationPreferencesForm';
import { AlertLogEntry } from '@/types';
import { alertingService } from '@/services/alertingService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { BellIcon, SettingsIcon } from '@/constants';

type Tab = 'log' | 'preferences';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('log');
  const [notifications, setNotifications] = useState<AlertLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const log = await alertingService.getAlertLog();
      setNotifications(log.sort((a,b) => b.timestamp - a.timestamp)); 
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      let userFriendlyError = "An unexpected error occurred while fetching notifications. Please try again.";
      if (err.message) {
        if (err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server to fetch notifications. Please check your network or server status.";
        } else {
            userFriendlyError = `Error fetching notifications: ${err.message}.`;
        }
      }
      setError(userFriendlyError);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'log') {
      fetchNotifications();
    }
  }, [activeTab, fetchNotifications]);
  
  useEffect(() => {
    const handleNewAlert = () => {
      if (activeTab === 'log') {
        fetchNotifications();
      }
    };
    window.addEventListener('newAlertAdded', handleNewAlert);
    return () => {
      window.removeEventListener('newAlertAdded', handleNewAlert);
    };
  }, [activeTab, fetchNotifications]);


  const handleMarkAsRead = async (id: number) => {
    setError(null);
    try {
      await alertingService.markAlertAsRead(String(id));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err: any) {
      console.error("Failed to mark alert as read:", err);
       let userFriendlyError = "Failed to mark alert as read. Please try again.";
        if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server. Please check your network or server status.";
        } else if (err.message) {
            userFriendlyError = err.message;
        }
      setError(userFriendlyError);
    }
  };

  const handleMarkAllAsRead = async () => {
    setError(null);
    try {
      await alertingService.markAllAlertsAsRead();
      fetchNotifications(); 
    } catch (err: any) {
        console.error("Failed to mark all as read:", err);
        let userFriendlyError = "Failed to mark all alerts as read. Please try again.";
        if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server. Please check your network or server status.";
        } else if (err.message) {
            userFriendlyError = err.message;
        }
        setError(userFriendlyError);
    }
  };

  const handleViewDetails = (link: string) => {
    window.location.hash = link;
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <PageContainer title="Notifications & Alerts Center">
      <div className="mb-6 border-b border-secondary-300 dark:border-secondary-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('log')}
            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150
              ${activeTab === 'log' 
                ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:border-secondary-600'}`}
          >
            <BellIcon className={`h-5 w-5 inline mr-1.5 ${activeTab === 'log' ? 'text-primary-500' : 'text-secondary-400'}`} />
            Activity Log {unreadCount > 0 && <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200">{unreadCount} New</span>}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150
              ${activeTab === 'preferences' 
                ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:border-secondary-600'}`}
          >
             <SettingsIcon className={`h-5 w-5 inline mr-1.5 ${activeTab === 'preferences' ? 'text-primary-500' : 'text-secondary-400'}`} />
            Preferences
          </button>
        </nav>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-700/30 dark:text-red-300">{error}</div>}

      {activeTab === 'log' && (
        isLoading ? (
          <div className="flex justify-center items-center h-48">
            <LoadingSpinner className="w-8 h-8 text-primary-500" />
            <p className="ml-3 text-secondary-600 dark:text-secondary-400">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <>
            <div className="mb-4 text-right">
                <button
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Mark all as read
                </button>
            </div>
            <div className="space-y-4">
                {notifications.map(notification => (
                <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkAsRead}
                    onViewDetails={handleViewDetails}
                />
                ))}
            </div>
          </>
        ) : (
          !error && <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">
            No notifications or alerts at the moment.
          </p>
        )
      )}

      {activeTab === 'preferences' && (
        <NotificationPreferencesForm />
      )}
    </PageContainer>
  );
};

export default NotificationsPage;