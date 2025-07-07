
import React from 'react';
import PageContainer from '@/components/PageContainer';
import { ShieldCheckIcon } from '@/constants';

const CompliancePage: React.FC = () => {
  return (
    <PageContainer title="Compliance & Regulatory Standards">
      <div className="text-center py-10">
        <ShieldCheckIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-secondary-800 dark:text-secondary-200">
          Feature Under Development
        </h2>
        <p className="mt-2 text-base text-secondary-600 dark:text-secondary-400">
          The Compliance Management module is currently being built.
        </p>
        <p className="mt-1 text-sm text-secondary-500">
          This section will allow for tracking regulatory documents, standards, and audit trails. Please check back later for updates.
        </p>
      </div>
    </PageContainer>
  );
};

export default CompliancePage;
