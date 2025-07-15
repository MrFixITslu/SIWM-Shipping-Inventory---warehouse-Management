import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { dashboardService } from '@/services/dashboardService';
import { asnService } from '@/services/asnService';
import { inventoryService } from '@/services/inventoryService';
import { aiInsightService } from '@/services/aiInsightService';
import Table from '@/components/Table';
import { 
  ShipmentIcon, 
  InventoryIcon, 
  OrderIcon, 
  DispatchIcon, 
  VendorIcon, 
  WarningIcon,
  BuildingOfficeIcon,
  ClockIcon
} from '@/constants';

// Online Status Indicator Component
const OnlineStatusIndicator: React.FC<{ isOnline: boolean; lastSyncTime?: string }> = ({ isOnline, lastSyncTime }) => (
  <div className="flex items-center space-x-4">
    <div className="flex items-center">
      <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm font-medium text-secondary-700 dark:text-secondary-200">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
    {lastSyncTime && (
      <div className="text-xs text-secondary-500 dark:text-secondary-400">
        Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
      </div>
    )}
  </div>
);

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
  changeType?: 'positive' | 'negative';
  loading?: boolean;
  className?: string;
  description?: string;
}> = ({ title, value, icon: Icon, change, changeType, loading = false, className = '', description }) => (
  <div className={`bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
          {loading ? <LoadingSpinner className="w-6 h-6" /> : value}
        </p>
        {description && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{description}</p>
        )}
        {change && (
          <p className={`text-sm mt-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </p>
        )}
      </div>
      <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg ml-4">
        <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      </div>
    </div>
  </div>
);

// Workflow Metrics Component
const WorkflowMetrics: React.FC<{ metrics: any[]; loading: boolean }> = ({ metrics, loading }) => (
  <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700">
    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
      Workflow Performance
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse mb-1"></div>
              <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
            </div>
          </div>
        ))
      ) : (
        metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50">
                <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 truncate">
                  {metric.title}
                </p>
                <p className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
                  {metric.value}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

// Stock Analysis Component
const StockAnalysis: React.FC<{ 
  itemsBelowReorderPoint: any[]; 
  itemsAtRiskOfStockOut: any[];
  loading: boolean;
}> = ({ itemsBelowReorderPoint, itemsAtRiskOfStockOut, loading }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Items Below Reorder Point */}
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Items Below Reorder Point
        </h3>
        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
          {itemsBelowReorderPoint.length}
        </span>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {itemsBelowReorderPoint.slice(0, 8).map((item, index) => {
            // Calculate shortfall if not provided
            const shortfall = item.shortfall || (item.reorderPoint - item.quantity);
            const shortfallPercentage = item.reorderPoint > 0 ? ((shortfall / item.reorderPoint) * 100).toFixed(1) : 0;
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {item.name || item.itemName}
                    </p>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">
                      -{shortfall}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400">
                    <span>SKU: {item.sku}</span>
                    <span>{item.category || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    <span>Qty: {item.quantity || item.currentQuantity} / {item.reorderPoint}</span>
                    <span>{shortfallPercentage}% below</span>
                  </div>
                  {item.location && (
                    <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                      📍 {item.location}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {itemsBelowReorderPoint.length === 0 && (
            <div className="text-center py-6">
              <div className="text-green-500 dark:text-green-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                No items below reorder point
              </p>
              <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                All inventory levels are healthy
              </p>
            </div>
          )}
          {itemsBelowReorderPoint.length > 8 && (
            <div className="text-center pt-2 border-t border-secondary-200 dark:border-secondary-700">
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                +{itemsBelowReorderPoint.length - 8} more items below reorder point
              </p>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Items At Risk of Stock Out */}
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Items At Risk of Stock Out
        </h3>
        <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {itemsAtRiskOfStockOut.length}
        </span>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {itemsAtRiskOfStockOut.slice(0, 8).map((item, index) => {
            // Map StockOutRiskForecastItem fields to display fields
            const itemName = item.itemName || item.name;
            const itemSku = item.sku;
            const currentStock = item.currentStock || item.quantity || item.currentQuantity;
            const daysUntilStockOut = item.predictedStockOutDays || item.daysUntilStockOut || 7;
            const confidence = item.confidence || 0;
            
            // Determine risk level based on confidence and days until stock out
            let riskLevel = 'Medium';
            if (daysUntilStockOut <= 3 || confidence >= 0.8) {
              riskLevel = 'Critical';
            } else if (daysUntilStockOut <= 7 || confidence >= 0.6) {
              riskLevel = 'High';
            } else if (daysUntilStockOut <= 14) {
              riskLevel = 'Medium';
            } else {
              riskLevel = 'Low';
            }
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {itemName}
                    </p>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      riskLevel === 'Critical' 
                        ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50'
                        : riskLevel === 'High'
                        ? 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50'
                        : 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50'
                    }`}>
                      {riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400">
                    <span>SKU: {itemSku}</span>
                    <span>{item.category || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                    <span>Qty: {currentStock}</span>
                    <span>{daysUntilStockOut} days left</span>
                  </div>
                  {item.recommendedReorderQty && (
                    <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                      📦 Recommended reorder: {item.recommendedReorderQty} units
                    </div>
                  )}
                  {item.location && (
                    <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                      📍 {item.location}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {itemsAtRiskOfStockOut.length === 0 && (
            <div className="text-center py-6">
              <div className="text-green-500 dark:text-green-400 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                No items at risk of stock out
              </p>
              <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                Stock levels are well managed
              </p>
            </div>
          )}
          {itemsAtRiskOfStockOut.length > 8 && (
            <div className="text-center pt-2 border-t border-secondary-200 dark:border-secondary-700">
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                +{itemsAtRiskOfStockOut.length - 8} more items at risk
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

// ASN Status Summary Component
const ASNStatusSummary: React.FC<{ asnData: any }> = ({ asnData }) => (
  <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700">
    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
      Incoming Shipments Status
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {asnData?.onTime || 0}
        </div>
        <div className="text-sm text-secondary-600 dark:text-secondary-400">On Time</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {asnData?.delayed || 0}
        </div>
        <div className="text-sm text-secondary-600 dark:text-secondary-400">Delayed</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {asnData?.atWarehouse || 0}
        </div>
        <div className="text-sm text-secondary-600 dark:text-secondary-400">At Warehouse</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {asnData?.processing || 0}
        </div>
        <div className="text-sm text-secondary-600 dark:text-secondary-400">Processing</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
          {asnData?.complete || 0}
        </div>
        <div className="text-sm text-secondary-600 dark:text-secondary-400">Complete</div>
      </div>
    </div>
  </div>
);

// Stock Value by Department Table Component
const StockValueTable: React.FC<{ stockData: any[]; loading: boolean }> = ({ stockData, loading }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalValue = stockData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  const totalItems = stockData.reduce((sum, item) => sum + (item.itemCount || 0), 0);

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700">
      {/* Header with collapse toggle */}
      <div 
        className="p-6 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors duration-200"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Total Stock Value by Department
            </h3>
            <div className="flex items-center space-x-4 text-sm text-secondary-600 dark:text-secondary-400">
              <span>Total: {formatCurrency(totalValue)}</span>
              <span>Items: {totalItems}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary-500 dark:text-secondary-400">
              {isCollapsed ? 'Click to expand' : 'Click to collapse'}
            </span>
            <div className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'
      }`}>
        <div className="px-6 pb-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table
              columns={[]}
              data={stockData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Aged Inventory Table Component
const AgedInventoryTable: React.FC<{ agedData: any[]; loading: boolean }> = ({ agedData, loading }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAge = (days: number) => {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      return `${years}y ${remainingDays}d`;
    }
    return `${days}d`;
  };

  // Filter to show items that are either manually marked as aged OR have been in stock for 365+ days
  const agedItemsOnly = useMemo(() => {
    return agedData.filter(item => {
      const ageInDays = item.ageInDays || 0;
      const isManuallyAged = item.isAged === true;
      const isOldEnough = ageInDays >= 365;
      
      // Include if manually marked as aged OR if item is 365+ days old
      return isManuallyAged || isOldEnough;
    });
  }, [agedData]);

  const totalAgedValue = agedItemsOnly.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  const totalAgedItems = agedItemsOnly.length;
  const avgAge = agedItemsOnly.length > 0 
    ? Math.round(agedItemsOnly.reduce((sum, item) => sum + (item.ageInDays || 0), 0) / agedItemsOnly.length)
    : 0;

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700">
      {/* Header with collapse toggle */}
      <div 
        className="p-6 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors duration-200"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Aged Inventory
            </h3>
            <div className="flex items-center space-x-4 text-sm text-secondary-600 dark:text-secondary-400">
              <span>Total Value: {formatCurrency(totalAgedValue)}</span>
              <span>Items: {totalAgedItems}</span>
              <span>Avg Age: {formatAge(avgAge)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary-500 dark:text-secondary-400">
              {isCollapsed ? 'Click to expand' : 'Click to collapse'}
            </span>
            <div className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'
      }`}>
        <div className="px-6 pb-6">

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Value</div>
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{formatCurrency(totalAgedValue)}</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Items</div>
              <div className="text-lg font-bold text-orange-800 dark:text-orange-200">{totalAgedItems}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-red-600 dark:text-red-400">Avg Age</div>
              <div className="text-lg font-bold text-red-800 dark:text-red-200">{formatAge(avgAge)}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Oldest Item</div>
              <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                {agedItemsOnly.length > 0 ? formatAge(Math.max(...agedItemsOnly.map((item: any) => item.ageInDays || 0))) : 'N/A'}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : agedItemsOnly.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-500 dark:text-green-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                No aged inventory items found
              </p>
              <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                No items marked as aged or older than 365 days
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {agedItemsOnly.slice(0, 10).map((item: any, index: number) => {
                const ageInDays = item.ageInDays || 0;
                const isVeryOld = ageInDays > 730; // More than 2 years
                const isOld = ageInDays > 365; // More than 1 year
                
                return (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${
                    isVeryOld 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : isOld 
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          {item.isAged && (
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">
                              Aged
                            </span>
                          )}
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            isVeryOld 
                              ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50'
                              : isOld 
                                ? 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50'
                                : 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50'
                          }`}>
                            {formatAge(ageInDays)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400">
                        <span>SKU: {item.sku}</span>
                        <span>{item.department || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                        <span>Qty: {item.quantity}</span>
                        <span>{formatCurrency(item.totalValue || 0)}</span>
                      </div>
                      {item.location && (
                        <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                          📍 {item.location}
                        </div>
                      )}
                      {item.entryDate && (
                        <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                          📅 Entry: {formatDate(item.entryDate)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {agedItemsOnly.length > 10 && (
                <div className="text-center pt-2 border-t border-secondary-200 dark:border-secondary-700">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    +{agedItemsOnly.length - 10} more aged items
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Header Component
const DashboardHeader: React.FC<{ 
  isOnline: boolean; 
  lastSyncTime?: string;
  metrics: any;
  asnData: any;
  agedInventoryData: any[];
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}> = ({ isOnline, lastSyncTime, metrics, asnData, agedInventoryData, lastUpdated, onRefresh, isRefreshing }) => (
  <div className="mb-8">
    {/* Header with Online Status */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
          Warehouse Management Dashboard
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1">
          Real-time overview of your warehouse operations
        </p>
        {lastUpdated && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-4 mt-4 md:mt-0">
        <OnlineStatusIndicator isOnline={isOnline} lastSyncTime={lastSyncTime} />
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          {isRefreshing ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
    </div>

    {/* Main KPIs Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KPICard
        title="Active Shipments"
        value={metrics?.activeShipments || 0}
        icon={ShipmentIcon}
        change="+5%"
        changeType="positive"
        description="Incoming and Outgoing"
      />
      <KPICard
        title="Inventory Items"
        value={metrics?.inventoryItems || 0}
        icon={InventoryIcon}
        change="+2%"
        changeType="positive"
        description="Total SKUs in stock"
      />
      <KPICard
        title="Pending Orders"
        value={metrics?.pendingOrders || 0}
        icon={OrderIcon}
        change="-3%"
        changeType="negative"
        description="Awaiting fulfillment"
      />
      <KPICard
        title="Dispatches Today"
        value={metrics?.dispatchesToday || 0}
        icon={DispatchIcon}
        change="+8%"
        changeType="positive"
        description="Shipments sent out"
      />
    </div>

    {/* Secondary KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <KPICard
        title="Active Vendors"
        value={metrics?.activeVendors || 0}
        icon={VendorIcon}
        description="Suppliers onboarded"
      />
      <KPICard
        title="Stock Alerts"
        value={metrics?.stockAlerts || 0}
        icon={WarningIcon}
        description="Items below reorder point"
      />
      <KPICard
        title="Warehouse Capacity"
        value={`${metrics?.capacityPercentage || 0}%`}
        icon={BuildingOfficeIcon}
        description="Current utilization"
      />
      <KPICard
        title="Aged Items"
        value={agedInventoryData?.length || 0}
        icon={ClockIcon}
        description="365+ days old"
      />
    </div>

    {/* ASN Status Summary */}
    <ASNStatusSummary asnData={asnData} />
  </div>
);

// Main Dashboard Component
const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>({});
  const [workflowMetrics, setWorkflowMetrics] = useState<any[]>([]);
  const [asnData, setAsnData] = useState<any>({});
  const [stockValueData, setStockValueData] = useState<any[]>([]);
  const [agedInventoryData, setAgedInventoryData] = useState<any[]>([]);
  const [itemsBelowReorderPoint, setItemsBelowReorderPoint] = useState<any[]>([]);
  const [itemsAtRiskOfStockOut, setItemsAtRiskOfStockOut] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [offlineStatus, setOfflineStatus] = useState({ isOnline: true, lastSyncTime: undefined });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Load all dashboard data in parallel, but fetch inventory items separately
      const [
        metricsData, 
        workflowData, 
        asns, 
        offlineData, 
        stockValueData, 
        agedInventoryData,
        itemsBelowReorderPointData,
        stockOutForecastData,
        inventoryItemsData
      ] = await Promise.all([
        dashboardService.getDashboardMetrics(),
        dashboardService.getWorkflowMetrics(),
        asnService.getASNs(),
        dashboardService.getOfflineStatus(),
        dashboardService.getStockValueByDepartment(),
        dashboardService.getAgedInventory(),
        dashboardService.getItemsBelowReorderPoint(),
        aiInsightService.getStockOutForecast(),
        inventoryService.getInventoryItems()
      ]);

      setMetrics(metricsData);
      setWorkflowMetrics(workflowData);
      setOfflineStatus(offlineData);
      setInventoryItems(Array.isArray(inventoryItemsData) ? inventoryItemsData : []);
      
      // Log the stock value by department API response for debugging
      console.log('Stock Value by Department API response:', stockValueData);
      console.log('Stock Value by Department type:', typeof stockValueData);
      console.log('Stock Value by Department is array:', Array.isArray(stockValueData));
      
      setStockValueData(Array.isArray(stockValueData) ? stockValueData : (stockValueData as any)?.departments || []);
      setAgedInventoryData(Array.isArray(agedInventoryData) ? agedInventoryData : (agedInventoryData as any)?.agedItems || []);
      setItemsBelowReorderPoint(Array.isArray(itemsBelowReorderPointData) ? itemsBelowReorderPointData : (itemsBelowReorderPointData as any)?.items || []);
      setItemsAtRiskOfStockOut(Array.isArray(stockOutForecastData) ? stockOutForecastData : []);
      setLastUpdated(new Date());

      // Process ASN data for status summary
      const asnStatusCounts = asns.reduce((acc: any, asn: any) => {
        acc[asn.status] = (acc[asn.status] || 0) + 1;
        return acc;
      }, {});

      setAsnData({
        onTime: asnStatusCounts['On Time'] || 0,
        delayed: asnStatusCounts['Delayed'] || 0,
        atWarehouse: asnStatusCounts['At the Warehouse'] || 0,
        processing: asnStatusCounts['Processing'] || 0,
        complete: asnStatusCounts['Complete'] || 0,
        total: asns.length
      });

      console.log('Dashboard data loaded successfully');
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (error) {
    return (
      <PageContainer>
        <ErrorMessage message={error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DashboardHeader
        isOnline={offlineStatus.isOnline}
        lastSyncTime={offlineStatus.lastSyncTime}
        metrics={{
          ...metrics,
          inventoryItems: inventoryItems.filter(item => item.quantity > 0).length
        }}
        asnData={asnData}
        agedInventoryData={agedInventoryData}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Workflow Metrics */}
      <div className="mb-8">
        <WorkflowMetrics metrics={workflowMetrics} loading={isLoading} />
      </div>

      {/* Stock Analysis */}
      <div className="mb-8">
        <StockAnalysis 
          itemsBelowReorderPoint={itemsBelowReorderPoint}
          itemsAtRiskOfStockOut={itemsAtRiskOfStockOut}
          loading={isLoading}
        />
      </div>

      {/* Stock Value by Department Table */}
      <div className="mb-8">
        <StockValueTable stockData={stockValueData} loading={isLoading} />
      </div>

      {/* Aged Inventory Table */}
      <div className="mb-8">
        <AgedInventoryTable agedData={agedInventoryData} loading={isLoading} />
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-secondary-500 dark:text-secondary-400 mt-8">
        Dashboard rebuilt with comprehensive KPIs and real-time data
        {isRefreshing && (
          <div className="mt-2 flex items-center justify-center">
            <LoadingSpinner className="w-4 h-4 mr-2" />
            <span>Checking for updates...</span>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default DashboardPage;