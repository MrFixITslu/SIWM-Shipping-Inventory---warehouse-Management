
import React from 'react';
import { WarningIcon } from '@/constants';

interface ErrorMessageProps {
  message: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="my-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-start dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" role="alert">
      <WarningIcon className="h-5 w-5 mr-3 flex-shrink-0 text-red-500" />
      <span className="text-sm">{message}</span>
    </div>
  );
};

export default ErrorMessage;
