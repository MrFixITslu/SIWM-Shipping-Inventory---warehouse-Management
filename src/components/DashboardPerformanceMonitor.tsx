import React, { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  lastUpdate: Date | null;
  cacheHits: number;
  cacheMisses: number;
  errorCount: number;
}

interface DashboardPerformanceMonitorProps {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export const DashboardPerformanceMonitor: React.FC<DashboardPerformanceMonitorProps> = ({
  loading,
  error,
  lastUpdated,
  onRefresh
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    lastUpdate: null,
    cacheHits: 0,
    cacheMisses: 0,
    errorCount: 0
  });

  const [showDetails, setShowDetails] = useState(false);
  const loadStartTimeRef = useRef<number | null>(null);
  const prevLoadingRef = useRef<boolean>(false);
  const prevErrorRef = useRef<string | null>(null);

  // Track loading state changes without causing infinite loops
  useEffect(() => {
    if (loading && !prevLoadingRef.current) {
      // Starting to load
      loadStartTimeRef.current = Date.now();
    } else if (!loading && prevLoadingRef.current && loadStartTimeRef.current) {
      // Finished loading
      const loadTime = Date.now() - loadStartTimeRef.current;
      setMetrics(prev => ({ 
        ...prev, 
        loadTime: loadTime,
        lastUpdate: lastUpdated 
      }));
      loadStartTimeRef.current = null;
    }
    prevLoadingRef.current = loading;
  }, [loading, lastUpdated]);

  // Track error state changes
  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
    prevErrorRef.current = error;
  }, [error]);

  const getPerformanceStatus = () => {
    if (metrics.loadTime < 2000) return 'Excellent';
    if (metrics.loadTime < 5000) return 'Good';
    if (metrics.loadTime < 10000) return 'Fair';
    return 'Poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Fair': return 'text-yellow-600';
      case 'Poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-sm font-medium">
              {loading ? 'Loading...' : 'Dashboard Status'}
            </span>
          </div>
          
          {metrics.loadTime > 0 && (
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Load time: {metrics.loadTime}ms
              <span className={`ml-2 font-medium ${getStatusColor(getPerformanceStatus())}`}>
                ({getPerformanceStatus()})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-secondary-700 dark:text-secondary-300">Last Update</div>
              <div className="text-secondary-600 dark:text-secondary-400">
                {metrics.lastUpdate ? metrics.lastUpdate.toLocaleTimeString() : 'Never'}
              </div>
            </div>
            
            <div>
              <div className="font-medium text-secondary-700 dark:text-secondary-300">Load Time</div>
              <div className="text-secondary-600 dark:text-secondary-400">
                {metrics.loadTime}ms
              </div>
            </div>
            
            <div>
              <div className="font-medium text-secondary-700 dark:text-secondary-300">Performance</div>
              <div className={`font-medium ${getStatusColor(getPerformanceStatus())}`}>
                {getPerformanceStatus()}
              </div>
            </div>
            
            <div>
              <div className="font-medium text-secondary-700 dark:text-secondary-300">Errors</div>
              <div className="text-secondary-600 dark:text-secondary-400">
                {metrics.errorCount}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <div className="text-sm font-medium text-red-800 dark:text-red-200">Error</div>
              <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 