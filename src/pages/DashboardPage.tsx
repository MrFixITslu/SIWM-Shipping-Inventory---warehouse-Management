import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import DashboardCard from '@/components/DashboardCard';
import Modal from '@/components/Modal'; 
import ErrorMessage from '@/components/ErrorMessage';
import { DashboardMetric, WorkflowMetric } from '@/types';
import { dashboardService } from '@/services/dashboardService';
import { alertingService } from '@/services/alertingService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { useInventory } from '@/hooks/useInventory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// DashboardPage.tsx
// Maintainer notes:
// - DashboardCard, LoadingSpinner, and PageContainer are already memoized for performance.
// - For advanced caching and background updates, consider using React Query or SWR.
//   This will reduce unnecessary network requests and improve perceived performance.
//
// - If dashboard data does not need to reload on every inventory change, remove 'inventory' from the useEffect dependency array.
//
// - The workflow metrics section is now memoized for further optimization.

export const DashboardPage: React.FC = () => {
  const { inventory } = useInventory();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetric[]>([]);
  const [shipmentData, setShipmentData] = useState<any[]>([]);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; message: string } | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

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

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchDashboardData(signal);
    return () => {
      controller.abort();
    };
  }, [fetchDashboardData, inventory]);

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
              {/* Memoized workflow metrics list for performance */}
              <WorkflowMetricsList workflowMetrics={workflowMetrics} />
          </div>
        </div>
      </>
    );
  };

  return (
    <PageContainer title="SIWM Dashboard">
      {renderDashboardContent()}
      <Modal isOpen={!!infoModalContent} onClose={() => setInfoModalContent(null)} title={infoModalContent?.title || ''}>
        <p className="text-secondary-700 dark:text-secondary-300">{infoModalContent?.message}</p>
        <div className="flex justify-end pt-4"> 
          <button onClick={() => setInfoModalContent(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm">OK</button> 
        </div>
      </Modal>
    </PageContainer>
  );
};

// Memoized WorkflowMetricsList to avoid unnecessary re-renders
const WorkflowMetricsList = React.memo(({ workflowMetrics }: { workflowMetrics: WorkflowMetric[] }) => (
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
));

export default DashboardPage;