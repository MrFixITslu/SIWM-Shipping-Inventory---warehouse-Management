

import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import NotificationItem from '@/components/NotificationItem';
import NotificationPreferencesForm from '@/components/NotificationPreferencesForm';
import { AlertLogEntry } from '@/types';
import { alertingService } from '@/services/alertingService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { BellIcon, SettingsIcon } from '@/constants';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem } from '@/types';

type Tab = 'log' | 'preferences';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('log');
  const [notifications, setNotifications] = useState<AlertLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incompleteItems, setIncompleteItems] = useState<InventoryItem[]>([]);
  const [isLoadingIncomplete, setIsLoadingIncomplete] = useState(true);
  const [showIncomplete, setShowIncomplete] = useState(false);

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

  // Fetch incomplete inventory items
  useEffect(() => {
    const fetchIncomplete = async () => {
      setIsLoadingIncomplete(true);
      try {
        const items = await inventoryService.getIncompleteInventoryItems();
        setIncompleteItems(items);
      } catch (err) {
        setIncompleteItems([]);
      } finally {
        setIsLoadingIncomplete(false);
      }
    };
    fetchIncomplete();
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

      {/* Collapsible section for incomplete inventory items */}
      <div className="mb-6">
        <button
          className="flex items-center text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-md shadow hover:bg-orange-100 dark:hover:bg-orange-800/40 transition-colors"
          onClick={() => setShowIncomplete((prev) => !prev)}
        >
          <span className="mr-2">{showIncomplete ? '▼' : '►'}</span>
          {`Incomplete Inventory Items (${incompleteItems.length})`}
        </button>
        {showIncomplete && (
          <div className="mt-3 bg-white dark:bg-secondary-800 rounded-lg shadow p-4">
            {isLoadingIncomplete ? (
              <div className="flex items-center"><LoadingSpinner className="w-5 h-5 text-orange-500" /><span className="ml-2 text-orange-700 dark:text-orange-300">Loading incomplete items...</span></div>
            ) : incompleteItems.length === 0 ? (
              <p className="text-sm text-secondary-500 dark:text-secondary-400">No incomplete inventory items found.</p>
            ) : (
              <ul className="space-y-3">
                {incompleteItems.map(item => {
                  const missingFields = [];
                  if (!item.sku || item.sku === 'not found') missingFields.push('SKU');
                  if (!item.safety_stock || item.safety_stock === 0) missingFields.push('Safety Stock');
                  if (!item.reorderPoint || item.reorderPoint === 0) missingFields.push('Reorder Point');
                  return (
                    <li key={item.id} className="border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-orange-800 dark:text-orange-200">{item.name}</div>
                        <div className="text-xs text-orange-700 dark:text-orange-300">Missing: {missingFields.join(', ')}</div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">Department: {item.department || 'N/A'} | Quantity: {item.quantity}</div>
                      </div>
                      <a
                        href={`#/inventory?id=${item.id}`}
                        className="ml-4 px-3 py-1 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                      >
                        Edit
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {activeTab === 'preferences' && (
        <NotificationPreferencesForm />
      )}
    </PageContainer>
  );
};

export default NotificationsPage;