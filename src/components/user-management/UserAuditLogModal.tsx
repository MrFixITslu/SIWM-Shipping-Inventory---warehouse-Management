
import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { User, AuditLogEntry } from '@/types';
import { userService } from '@/services/userService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';

interface UserAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UserAuditLogModal: React.FC<UserAuditLogModalProps> = ({ isOpen, onClose, user }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      setError(null);
      userService.getUserAuditLog(user.id)
        .then(setLogs)
        .catch(err => setError(err.message || 'Failed to fetch audit logs.'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Audit Log for ${user?.name}`} size="2xl">
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner className="w-8 h-8 text-primary-500" />
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {logs.length > 0 ? logs.map(log => (
            <div key={log.id} className="p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-md text-sm">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-secondary-800 dark:text-secondary-200">{log.action.replace(/_/g, ' ')}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
              <p className="text-secondary-600 dark:text-secondary-300">
                Performed by: <span className="font-medium">{log.actingUserName || 'System'}</span>
              </p>
              {/* Add more detail rendering here based on log.details if needed */}
            </div>
          )) : (
            <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">No audit log entries found for this user.</p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default UserAuditLogModal;
