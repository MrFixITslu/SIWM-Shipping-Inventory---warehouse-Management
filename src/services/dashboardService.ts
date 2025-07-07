// services/dashboardService.ts
import { DashboardMetric, WorkflowMetric } from '@/types';
import { api } from './apiHelper';
import { ShipmentIcon, InventoryIcon, OrderIcon, DispatchIcon, VendorIcon, WarningIcon, CurrencyDollarIcon, ShieldCheckIcon, CheckBadgeIcon } from '@/constants';

export const dashboardService = {
  getDashboardMetrics: async (signal?: AbortSignal): Promise<DashboardMetric[]> => {
    const data = await api.get<any>('/dashboard/metrics', { signal });
    return [
        { title: 'Active Shipments', value: data.activeShipments || 0, icon: ShipmentIcon, description: 'Incoming and Outgoing' },
        { title: 'Inventory Items', value: data.inventoryItems || 0, icon: InventoryIcon, description: 'Total SKUs in stock' },
        { title: 'Pending Orders', value: data.pendingOrders || 0, icon: OrderIcon, description: 'Awaiting fulfillment' },
        { title: 'Dispatches Today', value: data.dispatchesToday || 0, icon: DispatchIcon, description: 'Shipments sent out' },
        { title: 'Active Vendors', value: data.activeVendors || 0, icon: VendorIcon, description: 'Suppliers onboarded' },
        { title: 'Stock Alerts', value: data.stockAlerts || 0, icon: WarningIcon, description: 'Items below reorder point' },
    ];
  },

  getShipmentChartData: (signal?: AbortSignal): Promise<any[]> => {
    return api.get('/dashboard/charts/shipments', { signal });
  },
  
  getOrderVolumeChartData: (signal?: AbortSignal): Promise<any[]> => {
    return api.get('/dashboard/charts/order-volume', { signal });
  },

  getUnacknowledgedOrdersCount: async (signal?: AbortSignal): Promise<number> => {
    const data = await api.get<any>('/dashboard/unacknowledged-orders-count', { signal });
    return data.count || 0;
  },

  getWorkflowMetrics: async (signal?: AbortSignal): Promise<WorkflowMetric[]> => {
    const data = await api.get<any>('/dashboard/workflow-metrics', { signal });
    return [
        { title: 'Avg. Broker Submission', value: data.brokerSubmissionAvg || 'N/A', icon: CurrencyDollarIcon },
        { title: 'Avg. Finance Approval', value: data.financeApprovalAvg || 'N/A', icon: ShieldCheckIcon },
        { title: 'Avg. Broker Payment', value: data.brokerPaymentAvg || 'N/A', icon: CheckBadgeIcon },
        { title: 'Avg. Time to Warehouse', value: data.deliveryFromPaymentAvg || 'N/A', icon: ShipmentIcon },
    ];
  }
};
