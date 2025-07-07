
import React, { useState } from 'react';
import DestructiveConfirmationModal from '@/components/DestructiveConfirmationModal';
import { systemService } from '@/services/systemService';
import { WarningIcon } from '@/constants';

interface DangerZoneProps {
  onResetSuccess: (message: string) => void;
  onResetError: (error: string) => void;
}

const DangerZone: React.FC<DangerZoneProps> = ({ onResetSuccess, onResetError }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleResetData = async () => {
    setIsSaving(true);
    onResetError('');
    try {
      const result = await systemService.resetTransactionalData();
      onResetSuccess(result.message);
      setIsResetModalOpen(false);
      // Optionally trigger a page reload or state refetch after a delay
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      onResetError(err.message || 'Failed to reset data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mt-8 pt-6 border-t border-red-500/30">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center">
          <WarningIcon className="h-5 w-5 mr-2" />
          Danger Zone
        </h3>
        <div className="mt-2 max-w-xl text-sm text-secondary-600 dark:text-secondary-400">
          <p>
            This action will permanently delete all transactional data from the system, including shipments, inventory, orders, logs, and notifications. This is intended for demonstration purposes to reset the system to a clean state.
          </p>
        </div>
        <div className="mt-4">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            Reset All Transactional Data
          </button>
        </div>
      </div>
      <DestructiveConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetData}
        isSaving={isSaving}
        title="Confirm System Data Reset"
        confirmPhrase="reset data"
        confirmButtonText="Yes, reset all data"
        message={
          <>
            <p>This is an irreversible action.</p>
            <p>All shipments, inventory records, orders, and other transactional data will be permanently deleted.</p>
          </>
        }
      />
    </>
  );
};

export default DangerZone;