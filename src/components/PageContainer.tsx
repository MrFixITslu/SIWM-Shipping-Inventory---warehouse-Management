import React from 'react';

interface PageContainerProps {
  title?: string;
  actions?: React.ReactNode; // Optional action buttons like "Add New"
  children: React.ReactNode;
  titleClassName?: string; // Optional prop for title styling
}

const PageContainer: React.FC<PageContainerProps> = ({ title, actions, children, titleClassName }) => {
  return (
    <div className="space-y-6">
      {title && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className={`font-bold text-secondary-800 dark:text-secondary-200 ${titleClassName || 'text-3xl'}`}>{title}</h1>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="bg-white dark:bg-secondary-800 shadow-lg rounded-xl p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default React.memo(PageContainer);