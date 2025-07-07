


import { useState, useCallback } from 'react';

type ConfirmationAction = () => void | Promise<void>;

interface ConfirmationOptions {
  confirmText?: string;
  // future options like `cancelText`, `variant`, etc.
}

const useConfirmationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [onConfirmAction, setOnConfirmAction] = useState<{ action: ConfirmationAction } | null>(null);
  const [confirmButtonText, setConfirmButtonText] = useState('Confirm');

  const showConfirmation = useCallback((action: ConfirmationAction, options?: ConfirmationOptions) => {
    setOnConfirmAction({ action });
    setConfirmButtonText(options?.confirmText || 'Confirm');
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirmAction?.action();
    setIsOpen(false);
    setOnConfirmAction(null);
  }, [onConfirmAction]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setOnConfirmAction(null);
  }, []);

  return {
    isModalOpen: isOpen,
    confirmButtonText,
    showConfirmation,
    handleConfirm,
    handleClose,
  };
};

export default useConfirmationModal;