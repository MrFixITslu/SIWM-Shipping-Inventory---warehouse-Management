
import React from 'react';
import { AlertLogEntry, AlertSeverity } from '@/types';
import { WarningIcon, SuccessIcon, InfoIcon } from '@/constants';

interface NotificationItemProps {
  notification: AlertLogEntry;
  onMarkAsRead?: (id: number) => void; // Optional: if read status is managed
  onViewDetails?: (link: string) => void; // Optional: to navigate
}

const NotificationItemInner: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onViewDetails }) => {
  const getSeverityStyles = () => {
    switch (notification.severity) {
      case AlertSeverity.Error:
      case AlertSeverity.Critical:
        return {
          icon: <WarningIcon className="h-5 w-5 text-red-500" />,
          bgColor: 'bg-red-50 dark:bg-red-800/30',
          borderColor: 'border-red-500',
          textColor: 'text-red-700 dark:text-red-300',
        };
      case AlertSeverity.Warning:
        return {
          icon: <WarningIcon className="h-5 w-5 text-yellow-500" />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-800/30',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-700 dark:text-yellow-300',
        };
      case AlertSeverity.Info:
      default:
        return {
          icon: <InfoIcon className="h-5 w-5 text-blue-500" />,
          bgColor: 'bg-blue-50 dark:bg-blue-800/30',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-700 dark:text-blue-300',
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div 
      className={`p-4 rounded-lg shadow-sm border-l-4 ${styles.borderColor} ${styles.bgColor} ${!notification.isRead ? 'font-semibold' : ''}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {styles.icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className={`text-sm font-medium ${styles.textColor}`}>{notification.type}</p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
          </div>
          <p className={`mt-1 text-sm ${styles.textColor} ${!notification.isRead ? '' : 'font-normal'}`}>
            {notification.message}
          </p>
          <div className="mt-2 flex space-x-3">
            {notification.detailsLink && onViewDetails && (
              <button 
                onClick={() => onViewDetails(notification.detailsLink!)}
                className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
              >
                View Details
              </button>
            )}
            {!notification.isRead && onMarkAsRead && (
               <button 
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
               >
                Mark as Read
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationItem = React.memo(NotificationItemInner);
export default NotificationItem;