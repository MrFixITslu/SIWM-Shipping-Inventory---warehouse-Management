import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import DashboardCard from '../components/DashboardCard';
import DashboardCharts from '../components/DashboardCharts';
import InteractiveTable from '../components/InteractiveTable';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal'; 
import ErrorMessage from '../components/ErrorMessage';
import { DashboardMetric, StockOutRiskForecastItem, AlertSeverity, WorkflowMetric } from '../types';
import { AiIcon, CheckBadgeIcon, WarningIcon } from '../constants';
import { 
  CubeIcon, 
  TruckIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { aiInsightService } from '../services/aiInsightService'; 
import { dashboardService } from '../services/dashboardService';
import { alertingService } from '../services/alertingService';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';

// Type definitions for missing interfaces
interface ItemBelowReorderPoint {
  itemId: number;
  itemName: string;
  sku: string;
  currentQuantity: number;
  reorderPoint: number;
  shortfall: number;
  category: string;
  location: string;
}

interface ItemAtRiskOfStockOut {
  itemId: number;
  itemName: string;
  sku: string;
  currentQuantity: number;
  sixMonthDemand: number;
  demandRange: {
    min: number;
    max: number;
  };
  projectedStockOutDate: string;
  leadTime: number;
  category: string;
  location: string;
  variability: number;
}

interface RunRateData {
  weeklyInstalls: number;
  lastUpdated: string;
  source: 'dispatch' | 'manual' | 'default';
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetric[]>([]);
  const [shipmentData, setShipmentData] = useState<any[]>([]);
  
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: string } | null>(null);

  const [stockForecasts, setStockForecasts] = useState<StockOutRiskForecastItem[]>([]);
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // New state for enhanced stock analysis
  const [itemsBelowReorderPoint, setItemsBelowReorderPoint] = useState<ItemBelowReorderPoint[]>([]);
  const [itemsAtRiskOfStockOut, setItemsAtRiskOfStockOut] = useState<ItemAtRiskOfStockOut[]>([]);
  const [runRate, setRunRate] = useState<RunRateData>({
    weeklyInstalls: 66,
    lastUpdated: new Date().toISOString(),
    source: 'default'
  });
  const [isStockAnalysisLoading, setIsStockAnalysisLoading] = useState(true);
  const [stockAnalysisError, setStockAnalysisError] = useState<string | null>(null);
  const [showRunRateModal, setShowRunRateModal] = useState(false);
  const [newRunRate, setNewRunRate] = useState<number>(66);

  const fetchDashboardData = useCallback(async (signal: AbortSignal) => {
    setIsDashboardLoading(true);
    setDashboardError(null);
    try {
        const [metricsData, shipmentsChart, workflowData] = await Promise.all([
            dashboardService.getDashboardMetrics(signal),
            dashboardService.getShipmentChartData(signal),
            dashboardService.getWorkflowMetrics(signal),
        ]);
        if (!signal.aborted) {
            setMetrics(metricsData);
            setShipmentData(shipmentsChart);
            setWorkflowMetrics(workflowData);
        }
    } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Failed to fetch dashboard data:", error);
          setDashboardError(error.message || "Could not load dashboard data.");
        }
    } finally {
        if (!signal.aborted) {
            setIsDashboardLoading(false);
        }
    }
  }, []);

  const fetchAiInsights = useCallback(async (signal: AbortSignal) => {
    setIsAiInsightsLoading(true);
    setAiInsightsError(null);
    try {
      const forecasts = await aiInsightService.getStockOutForecast(signal);
      if (!signal.aborted) {
        setStockForecasts(forecasts);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to fetch AI insights or prerequisite data:", error);
        setAiInsightsError(error.message || "Could not load AI insights at this time.");
      }
    } finally {
      if (!signal.aborted) {
        setIsAiInsightsLoading(false);
      }
    }
  }, []);

  const fetchStockAnalysis = useCallback(async (signal: AbortSignal) => {
    setIsStockAnalysisLoading(true);
    setStockAnalysisError(null);
    try {
      const [belowReorderPoint, atRisk, currentRunRate] = await Promise.all([
        dashboardService.getItemsBelowReorderPoint(signal),
        dashboardService.getItemsAtRiskOfStockOut(signal),
        dashboardService.getCurrentRunRate(signal)
      ]);
      if (!signal.aborted) {
        setItemsBelowReorderPoint(belowReorderPoint);
        setItemsAtRiskOfStockOut(atRisk);
        setRunRate(currentRunRate);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Failed to fetch stock analysis data:", error);
        setStockAnalysisError(error.message || "Could not load stock analysis data.");
      }
    } finally {
      if (!signal.aborted) {
        setIsStockAnalysisLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetchDashboardData(signal);
    fetchAiInsights(signal);
    fetchStockAnalysis(signal);

    return () => {
      controller.abort();
    };
  }, [fetchDashboardData, fetchAiInsights, fetchStockAnalysis]);

  const handleInitiateDashboardReorder = (itemName: string, sku: string, quantity: number) => {
    alertingService.addAlert(
      AlertSeverity.Info,
      `Reorder recommended for '${itemName} (SKU: ${sku})'. Recommended Qty: ${quantity} units.`,
      'AI Reorder Recommendation',
      '/inventory'
    ).then(() => {
        setInfoModalContent({ title: 'Reorder Alert Created', message: `An alert has been sent to the procurement team for item '${itemName}'.` });
    }).catch((err) => {
        setInfoModalContent({ title: 'Error', message: `Failed to create reorder alert: ${err.message}` });
    });
  };

  const handleUpdateRunRate = async () => {
    try {
      const updatedRunRate = await dashboardService.updateRunRate(newRunRate);
      setRunRate(updatedRunRate);
      setShowRunRateModal(false);
      setInfoModalContent({ 
        title: 'Run Rate Updated', 
        message: `Weekly run rate updated to ${newRunRate} installs per week. Stock-out risk calculations will be recalculated.` 
      });
    } catch (error: any) {
      setInfoModalContent({ 
        title: 'Error', 
        message: `Failed to update run rate: ${error.message}` 
      });
    }
  };

  // Define navigation handlers for dashboard cards
  const handleInventoryClick = () => navigate('/inventory');
  const handleShipmentsClick = () => navigate('/shipments');
  const handleUsersClick = () => navigate('/users');
  const handleFinanceClick = () => navigate('/finance');

  const renderDashboardContent = () => {
    if (isDashboardLoading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-15rem)]">
          <LoadingSpinner className="w-12 h-12 text-primary-500" />
          <p className="ml-4 text-lg font-medium text-secondary-600 dark:text-secondary-400">Loading Dashboard Data...</p>
        </div>
      );
    }

    if (dashboardError) {
      return <ErrorMessage message={dashboardError} />;
    }

    return (
      <>
        {/* Enhanced Dashboard Cards with Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.slice(0, 4).map((metric, index) => {
            const navigationHandlers = [
              handleInventoryClick,
              handleShipmentsClick,
              handleUsersClick,
              handleFinanceClick
            ];
            
            return (
              <DashboardCard 
                key={metric.title} 
                metric={metric} 
                onClick={navigationHandlers[index]}
              />
            );
          })}
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Stock Alerts"
            value={itemsBelowReorderPoint.length + itemsAtRiskOfStockOut.length}
            subtitle="Items requiring attention"
            icon={ExclamationTriangleIcon}
            color="red"
            onClick={() => navigate('/inventory')}
            trend={{
              value: 12,
              isPositive: false,
              label: "vs last week"
            }}
          />
          <StatsCard
            title="Weekly Installs"
            value={runRate.weeklyInstalls}
            subtitle="Average per week"
            icon={ArrowTrendingUpIcon}
            color="green"
            onClick={() => setShowRunRateModal(true)}
            trend={{
              value: 8,
              isPositive: true,
              label: "vs last week"
            }}
          />
          <StatsCard
            title="AI Predictions"
            value={stockForecasts.length}
            subtitle="Active forecasts"
            icon={AiIcon}
            color="purple"
            onClick={() => navigate('/ai-insights')}
          />
          <StatsCard
            title="System Health"
            value="98%"
            subtitle="All systems operational"
            icon={CheckCircleIcon}
            color="blue"
            onClick={() => navigate('/system')}
            trend={{
              value: 2,
              isPositive: true,
              label: "vs last week"
            }}
          />
        </div>
        
        {/* Interactive Charts Section */}
        <div className="mb-8">
          <DashboardCharts
            shipmentData={shipmentData}
            workflowMetrics={workflowMetrics}
            itemsBelowReorderPoint={itemsBelowReorderPoint}
            itemsAtRiskOfStockOut={itemsAtRiskOfStockOut}
          />
        </div>
      </>
    );
  };

  const renderStockAnalysis = () => {
    if (isStockAnalysisLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner className="w-8 h-8 text-primary-500" />
          <p className="ml-2 text-secondary-600 dark:text-secondary-400">Loading stock analysis...</p>
        </div>
      );
    }

    if (stockAnalysisError) {
      return <ErrorMessage message={stockAnalysisError} />;
    }

    // Define table columns for items below reorder point
    const belowReorderColumns = [
      {
        key: 'itemName',
        header: 'Item',
        render: (item: ItemBelowReorderPoint) => (
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{item.itemName}</div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400">{item.sku}</div>
          </div>
        ),
      },
      { key: 'currentQuantity', header: 'Current Qty' },
      { key: 'reorderPoint', header: 'Reorder Point' },
      {
        key: 'shortfall',
        header: 'Shortfall',
        render: (item: ItemBelowReorderPoint) => (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            -{item.shortfall}
          </span>
        ),
      },
      { key: 'location', header: 'Location' },
    ];

    // Define table columns for items at risk of stock-out
    const atRiskColumns = [
      {
        key: 'itemName',
        header: 'Item',
        render: (item: ItemAtRiskOfStockOut) => (
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{item.itemName}</div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400">{item.sku}</div>
          </div>
        ),
      },
      { key: 'currentQuantity', header: 'Current Qty' },
      {
        key: 'sixMonthDemand',
        header: '6-Month Demand (Range)',
        render: (item: ItemAtRiskOfStockOut) => (
          <div>
            <div className="text-sm text-secondary-900 dark:text-secondary-100">
              {item.sixMonthDemand.toLocaleString()}
            </div>
            <div className="text-xs text-secondary-500 dark:text-secondary-400">
              ({item.demandRange.min.toLocaleString()}–{item.demandRange.max.toLocaleString()})
            </div>
          </div>
        ),
      },
      {
        key: 'projectedStockOutDate',
        header: 'Projected Stock-Out',
        render: (item: ItemAtRiskOfStockOut) => (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            {item.projectedStockOutDate}
          </span>
        ),
      },
      {
        key: 'leadTime',
        header: 'Lead Time',
        render: (item: ItemAtRiskOfStockOut) => `${item.leadTime} days`,
      },
    ];

    return (
      <div className="space-y-6">
        {/* Run Rate Configuration Card */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 flex items-center">
              <CogIcon className="h-6 w-6 mr-2 text-orange-500" />
              Run Rate Configuration
            </h3>
            <button
              onClick={() => {
                setNewRunRate(runRate.weeklyInstalls);
                setShowRunRateModal(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm transition-all duration-200 hover:shadow-lg"
            >
              Update Run Rate
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Weekly Installs</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{runRate.weeklyInstalls}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Source</p>
              <p className="text-lg font-semibold text-green-800 dark:text-green-200 capitalize">{runRate.source}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Last Updated</p>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                {new Date(runRate.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InteractiveTable
            data={itemsBelowReorderPoint}
            columns={belowReorderColumns}
            title="Items Below Reorder Point"
            icon={ExclamationTriangleIcon}
            emptyMessage="No items are currently below their reorder point."
            onRowClick={() => navigate('/inventory')}
            maxRows={5}
          />

          <InteractiveTable
            data={itemsAtRiskOfStockOut}
            columns={atRiskColumns}
            title="Items at Risk of Stock-Out (6 Months)"
            icon={ClockIcon}
            emptyMessage="No items are at risk of stock-out within the next 6 months."
            onRowClick={() => navigate('/inventory')}
            maxRows={5}
          />
        </div>
      </div>
    );
  };

  const renderAiInsights = () => {
    if (isAiInsightsLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner className="w-8 h-8 text-primary-500" />
                <p className="ml-2 text-secondary-600 dark:text-secondary-400">Loading AI insights...</p>
            </div>
        );
    }

    if (aiInsightsError) {
        return <ErrorMessage message={aiInsightsError} />;
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                VisionBot analysis of current warehouse operations:
            </p>
            <div className="space-y-3">
                {stockForecasts.length > 0 ? stockForecasts.map(forecast => (
                    <div key={forecast.sku} className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700 hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div className="flex-1">
                                <div className="flex items-center mb-2">
                                    <span className="font-semibold text-yellow-600 dark:text-yellow-400 mr-2">Forecasting:</span>
                                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                                        Potential stock-out for '{forecast.itemName} (SKU: {forecast.sku})' in ~{forecast.predictedStockOutDays} days
                                    </span>
                                </div>
                                <div className="text-sm text-secondary-500 dark:text-secondary-400">
                                    Confidence: {(forecast.confidence * 100).toFixed(0)}% | Current: {forecast.currentStock} | 
                                    Recommended reorder: {forecast.recommendedReorderQty} units
                                </div>
                            </div>
                            <button
                                onClick={() => handleInitiateDashboardReorder(forecast.itemName, forecast.sku, forecast.recommendedReorderQty)}
                                className="flex-shrink-0 items-center text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-3 py-1.5 rounded-md shadow hover:shadow-md transition-all duration-200"
                            >
                                <CheckBadgeIcon className="h-4 w-4 mr-1.5 inline-block" /> Initiate Reorder
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center">
                            <span className="font-semibold text-green-600 dark:text-green-400 mr-2">Forecasting:</span>
                            <span className="text-secondary-600 dark:text-secondary-400">No critical stock-out risks detected by AI at this moment.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <PageContainer title="SIWM Dashboard">
      {renderDashboardContent()}
      
      {/* Enhanced Stock Analysis Section */}
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4 flex items-center">
          <ChartBarIcon className="h-6 w-6 mr-2 text-orange-500" />
          Stock Analysis & Risk Assessment
        </h3>
        {renderStockAnalysis()}
      </div>
      
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-2 flex items-center">
            <AiIcon className="h-6 w-6 mr-2 text-purple-500" /> AI-Powered Insights
          </h3>
          {renderAiInsights()}
      </div>
      
      {/* Run Rate Update Modal */}
      <Modal isOpen={showRunRateModal} onClose={() => setShowRunRateModal(false)} title="Update Run Rate">
        <div className="space-y-4">
          <p className="text-secondary-700 dark:text-secondary-300">
            Update the weekly installation rate to recalculate stock-out risk projections.
          </p>
          <div>
            <label htmlFor="runRate" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Weekly Installs
            </label>
            <input
              type="number"
              id="runRate"
              value={newRunRate}
              onChange={(e) => setNewRunRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-secondary-100"
              placeholder="66"
              min="1"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowRunRateModal(false)}
              className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRunRate}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>
      
      <Modal isOpen={!!infoModalContent} onClose={() => setInfoModalContent(null)} title={infoModalContent?.title || ''}>
        <p className="text-secondary-700 dark:text-secondary-300">{infoModalContent?.message}</p>
        <div className="flex justify-end pt-4"> 
          <button onClick={() => setInfoModalContent(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm">OK</button> 
        </div>
      </Modal>
    </PageContainer>
  );
};

export default DashboardPage;