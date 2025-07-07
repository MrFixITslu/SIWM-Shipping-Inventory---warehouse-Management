


import React from 'react';
import Modal from '@/components/Modal';
import { WarningIcon } from '@/constants';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText = "Confirm" }) => {
  const destructiveWords = ['delete', 'remove', 'reset', 'deactivate'];
  const isDestructive = destructiveWords.some(word => (confirmButtonText || '').toLowerCase().includes(word));
  
  const confirmButtonClasses = isDestructive 
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" 
    : "bg-primary-600 hover:bg-primary-700 focus:ring-primary-500";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isDestructive ? 'bg-red-100 dark:bg-red-800/30' : 'bg-blue-100 dark:bg-blue-800/30'}`}>
          <WarningIcon className={`h-6 w-6 ${isDestructive ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg leading-6 font-medium text-secondary-900 dark:text-secondary-100" id="modal-title">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-4 space-y-2 space-y-reverse sm:space-y-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto inline-flex justify-center rounded-md border border-secondary-300 dark:border-secondary-600 shadow-sm px-4 py-2 bg-white dark:bg-secondary-700 text-base font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClasses}`}
        >
          {confirmButtonText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;