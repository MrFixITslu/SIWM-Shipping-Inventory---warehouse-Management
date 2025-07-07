import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import DashboardCard from '@/components/DashboardCard';
import Modal from '@/components/Modal'; 
import ErrorMessage from '@/components/ErrorMessage';
import { DashboardMetric, StockOutRiskForecastItem, AlertSeverity, WorkflowMetric, ItemBelowReorderPoint, ItemAtRiskOfStockOut, RunRateData } from '@/types';
import { AiIcon, CheckBadgeIcon, WarningIcon } from '@/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { aiInsightService } from '@/services/aiInsightService'; 
import { dashboardService } from '@/services/dashboardService';
import { alertingService } from '@/services/alertingService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';

export const DashboardPage: React.FC = () => {
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
    weeklyInstalls: 66, // Default: 11 installs/day × 6 days/week
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {metrics.slice(0, 4).map((metric) => (
            <DashboardCard key={metric.title} metric={metric} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg lg:col-span-2">
            <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Shipment Trends (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shipmentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary-color)' }} />
                <YAxis tick={{ fill: 'var(--text-secondary-color)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg-color)', borderColor: 'var(--tooltip-border-color)', borderRadius: '0.5rem'}} labelStyle={{ color: 'var(--tooltip-label-color)', fontWeight: 'bold' }} itemStyle={{ color: 'var(--tooltip-item-color)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary-color)'}} />
                <Bar dataKey="incoming" fill="var(--primary-color)" name="Incoming Shipments" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outgoing" fill="var(--secondary-chart-color)" name="Outgoing Shipments" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Workflow Performance</h3>
              <div className="space-y-4">
                {workflowMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.title} className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-500 dark:text-primary-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">{metric.title}</p>
                        <p className="text-lg font-bold text-secondary-800 dark:text-secondary-200">{metric.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
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

    return (
      <div className="space-y-6">
        {/* Run Rate Section */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 flex items-center">
              <WarningIcon className="h-6 w-6 mr-2 text-orange-500" />
              Run Rate Configuration
            </h3>
            <button
              onClick={() => {
                setNewRunRate(runRate.weeklyInstalls);
                setShowRunRateModal(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm transition-colors"
            >
              Update Run Rate
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-secondary-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Weekly Installs</p>
              <p className="text-2xl font-bold text-secondary-800 dark:text-secondary-200">{runRate.weeklyInstalls}</p>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Source</p>
              <p className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 capitalize">{runRate.source}</p>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Last Updated</p>
              <p className="text-sm text-secondary-800 dark:text-secondary-200">
                {new Date(runRate.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Items Below Reorder Point */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4 flex items-center">
            <WarningIcon className="h-6 w-6 mr-2 text-red-500" />
            Items Below Reorder Point ({itemsBelowReorderPoint.length})
          </h3>
          {itemsBelowReorderPoint.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                <thead className="bg-secondary-50 dark:bg-secondary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Current Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Reorder Point</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Shortfall</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                  {itemsBelowReorderPoint.map((item) => (
                    <tr key={item.itemId} className="hover:bg-secondary-50 dark:hover:bg-secondary-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{item.itemName}</div>
                          <div className="text-sm text-secondary-500 dark:text-secondary-400">{item.sku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                        {item.currentQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                        {item.reorderPoint}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          -{item.shortfall}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        {item.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-secondary-600 dark:text-secondary-400 text-center py-4">No items are currently below their reorder point.</p>
          )}
        </div>

        {/* Items at Risk of Stock-Out */}
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4 flex items-center">
            <WarningIcon className="h-6 w-6 mr-2 text-yellow-500" />
            Items at Risk of Stock-Out (6 Months) ({itemsAtRiskOfStockOut.length})
          </h3>
          {itemsAtRiskOfStockOut.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
                <thead className="bg-secondary-50 dark:bg-secondary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Current Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">6-Month Demand (Range)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Projected Stock-Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Lead Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
                  {itemsAtRiskOfStockOut.map((item) => (
                    <tr key={item.itemId} className="hover:bg-secondary-50 dark:hover:bg-secondary-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{item.itemName}</div>
                          <div className="text-sm text-secondary-500 dark:text-secondary-400">{item.sku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                        {item.currentQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900 dark:text-secondary-100">
                          {item.sixMonthDemand.toLocaleString()}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">
                          ({item.demandRange.min.toLocaleString()}–{item.demandRange.max.toLocaleString()})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {item.projectedStockOutDate}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                        {item.leadTime} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-secondary-600 dark:text-secondary-400 text-center py-4">No items are at risk of stock-out within the next 6 months.</p>
          )}
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
        <>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                VisionBot analysis of current warehouse operations:
            </p>
            <ul className="space-y-3 text-secondary-700 dark:text-secondary-300">
                {stockForecasts.length > 0 ? stockForecasts.map(forecast => (
                    <li key={forecast.sku} className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                        <span className="font-semibold text-yellow-500">Forecasting:</span> Potential stock-out for '{forecast.itemName} (SKU: {forecast.sku})' in ~{forecast.predictedStockOutDays} days (Confidence: {(forecast.confidence * 100).toFixed(0)}%). Current: {forecast.currentStock}.
                        Recommended reorder: {forecast.recommendedReorderQty} units.
                    </div>
                    <button
                        onClick={() => handleInitiateDashboardReorder(forecast.itemName, forecast.sku, forecast.recommendedReorderQty)}
                        className="flex-shrink-0 items-center text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-3 py-1.5 rounded-md shadow hover:shadow-md transition-all duration-200 self-start sm:self-center"
                    >
                        <CheckBadgeIcon className="h-4 w-4 mr-1.5 inline-block" /> Initiate Reorder
                    </button>
                    </li>
                )) : (
                    <li><div><span className="font-semibold text-green-500">Forecasting:</span> No critical stock-out risks detected by AI at this moment.</div></li>
                )}
            </ul>
        </>
    );
  };

  return (
    <PageContainer title="SIWM Dashboard">
      {renderDashboardContent()}
      
      {/* Enhanced Stock Analysis Section */}
      <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4 flex items-center">
          <WarningIcon className="h-6 w-6 mr-2 text-orange-500" />
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