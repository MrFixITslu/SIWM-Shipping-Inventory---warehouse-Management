
import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { WarningIcon } from '@/constants';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface DestructiveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmPhrase: string;
  confirmButtonText?: string;
  isSaving?: boolean;
}

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const DestructiveConfirmationModal: React.FC<DestructiveConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmPhrase, confirmButtonText = "Confirm", isSaving = false }) => {
  const [typedPhrase, setTypedPhrase] = useState('');
  const isConfirmed = typedPhrase === confirmPhrase;

  useEffect(() => {
    if (!isOpen) {
      setTypedPhrase('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800/30">
          <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg leading-6 font-medium text-secondary-900 dark:text-secondary-100">{title}</h3>
          <div className="mt-2 text-sm text-secondary-600 dark:text-secondary-400 space-y-2">
            {message}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <label htmlFor="confirm-phrase-input" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
          To confirm, please type "<strong className="text-red-500">{confirmPhrase}</strong>" in the box below.
        </label>
        <input
          id="confirm-phrase-input"
          type="text"
          value={typedPhrase}
          onChange={(e) => setTypedPhrase(e.target.value)}
          className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`}
          autoComplete="off"
        />
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto inline-flex justify-center rounded-md border border-secondary-300 dark:border-secondary-600 shadow-sm px-4 py-2 bg-white dark:bg-secondary-700 text-base font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-600"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!isConfirmed || isSaving}
          className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed"
        >
          {isSaving ? <LoadingSpinner className="h-5 w-5" /> : confirmButtonText}
        </button>
      </div>
    </Modal>
  );
};

export default DestructiveConfirmationModal;
