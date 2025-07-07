
import React from 'react';
import PageContainer from '@/components/PageContainer';
import { WarningIcon } from '@/constants';
import { useNavigate } from 'react-router-dom';

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Access Denied">
      <div className="text-center py-10">
        <WarningIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-secondary-800 dark:text-secondary-200">Permission Required</h2>
        <p className="mt-2 text-base text-secondary-600 dark:text-secondary-400">
          You do not have the required permissions to access this page.
        </p>
        <p className="mt-1 text-sm text-secondary-500">
          Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </PageContainer>
  );
};

export default AccessDeniedPage;
