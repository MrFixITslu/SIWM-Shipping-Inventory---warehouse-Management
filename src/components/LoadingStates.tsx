import React, { Suspense, useState, useEffect } from 'react';
import LoadingSpinner from './icons/LoadingSpinner';

// Skeleton components for better UX
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg animate-pulse ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="text-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
    <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Progressive loading component
export const ProgressiveLoader: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  onLoad?: () => void;
}> = ({ children, fallback, delay = 200, onLoad }) => {
  const [showFallback, setShowFallback] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(false);
      setShowContent(true);
      onLoad?.();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, onLoad]);

  if (showFallback) {
    return <>{fallback}</>;
  }

  return <>{showContent ? children : fallback}</>;
};

// Loading overlay with blur effect
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  blur?: boolean;
  opacity?: number;
}> = ({ isLoading, children, blur = true, opacity = 0.7 }) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div 
        className={`absolute inset-0 flex items-center justify-center z-50 ${
          blur ? 'backdrop-blur-sm' : ''
        }`}
        style={{ backgroundColor: `rgba(255, 255, 255, ${opacity})` }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center">
          <LoadingSpinner className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )}
  </div>
);

// Infinite scroll loading indicator
export const InfiniteScrollLoader: React.FC<{ hasMore: boolean; isLoading: boolean }> = ({ 
  hasMore, 
  isLoading 
}) => {
  if (!hasMore) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No more items to load
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading more...</span>
      </div>
    );
  }

  return null;
};

// Suspense wrapper with custom fallback
export const SuspenseWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
}> = ({ children, fallback, timeout = 10000 }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasError(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (hasError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Loading Timeout
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          The content is taking longer than expected to load. Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={fallback || <LoadingSpinner className="w-8 h-8" />}>
      {children}
    </Suspense>
  );
};

// Lazy loading component with intersection observer
export const LazyLoad: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}> = ({ children, fallback, threshold = 0.1, rootMargin = '50px' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setHasLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div ref={ref}>
      {!hasLoaded ? fallback : children}
    </div>
  );
};

// Loading states for different data types
export const DataLoadingState: React.FC<{
  type: 'card' | 'chart' | 'table' | 'list';
  count?: number;
  className?: string;
}> = ({ type, count = 1, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <SkeletonCard className={className} />;
      case 'chart':
        return <SkeletonChart />;
      case 'table':
        return <SkeletonTable rows={count} />;
      case 'list':
        return (
          <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
      default:
        return <LoadingSpinner className="w-8 h-8" />;
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
}; 