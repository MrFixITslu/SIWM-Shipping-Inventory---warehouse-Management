

import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import FocusTrap from 'focus-trap-react';
import useModalScrollLock from '@/hooks/useModalScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  contentRef?: React.RefObject<HTMLDivElement>; // For scrolling control from parent
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', contentRef }) => {
  useModalScrollLock(isOpen);
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = contentRef || internalRef;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-screen-2xl',
  };

  return (
    <FocusTrap active={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300 ease-in-out" role="dialog" aria-modal="true">
        <div className={`bg-white dark:bg-secondary-800 rounded-xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-appear`}>
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700">
            <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200">{title}</h3>
            <button
              onClick={onClose}
              className="text-secondary-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div ref={ref} className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default Modal;