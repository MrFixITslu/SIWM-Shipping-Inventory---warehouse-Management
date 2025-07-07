import React from 'react';
import LoadingSpinner from './icons/LoadingSpinner';

// Skeleton loading component for table rows
export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-secondary-100 dark:border-secondary-700 animate-pulse">
    {Array.from({ length: columns }).map((_, index) => (
      <div key={index} className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded" />
    ))}
  </div>
);

// Skeleton loading for cards
export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg animate-pulse">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 bg-secondary-200 dark:bg-secondary-700 rounded-lg mr-4" />
      <div className="flex-1">
        <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-2" />
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-2/3" />
      </div>
    </div>
    <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded mb-2" />
    <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2" />
  </div>
);

// Skeleton loading for dashboard metrics
export const MetricSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg animate-pulse">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-secondary-200 dark:bg-secondary-700 rounded-lg mr-4" />
      <div className="flex-1">
        <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-2" />
        <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded mb-1" />
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
      </div>
    </div>
  </div>
);

// Skeleton loading for charts
export const ChartSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg animate-pulse">
    <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded mb-4 w-1/3" />
    <div className="h-64 bg-secondary-200 dark:bg-secondary-700 rounded" />
  </div>
);

// Skeleton loading for forms
export const FormSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div>
      <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-1/4" />
      <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded" />
    </div>
    <div>
      <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-1/4" />
      <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded" />
    </div>
    <div>
      <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-1/4" />
      <div className="h-10 bg-secondary-200 dark:bg-secondary-700 rounded" />
    </div>
  </div>
);

// Loading overlay for modals
export const ModalLoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/80 dark:bg-secondary-800/80 flex items-center justify-center z-10">
    <div className="text-center">
      <LoadingSpinner className="w-8 h-8 text-primary-500 mx-auto mb-2" />
      <p className="text-sm text-secondary-600 dark:text-secondary-400">Loading...</p>
    </div>
  </div>
);

// Loading state for buttons
export const ButtonLoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <LoadingSpinner className={`${sizeClasses[size]} text-current`} />
  );
};

// Loading state for search
export const SearchLoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner className="w-6 h-6 text-primary-500 mr-3" />
    <span className="text-secondary-600 dark:text-secondary-400">Searching...</span>
  </div>
);

// Loading state for data fetching
export const DataLoadingState: React.FC<{ message?: string }> = ({ message = "Loading data..." }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <LoadingSpinner className="w-12 h-12 text-primary-500 mx-auto mb-4" />
      <p className="text-lg font-medium text-secondary-600 dark:text-secondary-400">{message}</p>
    </div>
  </div>
);

// Loading state for empty states
export const EmptyStateLoading: React.FC<{ message?: string }> = ({ message = "No data available" }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="w-16 h-16 bg-secondary-200 dark:bg-secondary-700 rounded-full mx-auto mb-4 flex items-center justify-center">
        <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-secondary-600 dark:text-secondary-400">{message}</p>
    </div>
  </div>
);

// Loading state for infinite scroll
export const InfiniteScrollLoading: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <LoadingSpinner className="w-6 h-6 text-primary-500 mr-2" />
    <span className="text-sm text-secondary-600 dark:text-secondary-400">Loading more...</span>
  </div>
);

// Loading state for saving
export const SavingState: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <LoadingSpinner className="w-5 h-5 text-primary-500 mr-2" />
    <span className="text-sm text-secondary-600 dark:text-secondary-400">Saving...</span>
  </div>
);

// Loading state for deleting
export const DeletingState: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <LoadingSpinner className="w-5 h-5 text-red-500 mr-2" />
    <span className="text-sm text-secondary-600 dark:text-secondary-400">Deleting...</span>
  </div>
);

// Loading state for uploading
export const UploadingState: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <LoadingSpinner className="w-5 h-5 text-primary-500 mr-2" />
    <span className="text-sm text-secondary-600 dark:text-secondary-400">Uploading...</span>
  </div>
);

// Progress bar component
export const ProgressBar: React.FC<{ progress: number; message?: string }> = ({ progress, message }) => (
  <div className="w-full">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-secondary-600 dark:text-secondary-400">{message}</span>
      <span className="text-sm text-secondary-600 dark:text-secondary-400">{progress}%</span>
    </div>
    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
      <div 
        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
); 