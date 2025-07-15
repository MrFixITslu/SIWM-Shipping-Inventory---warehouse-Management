// services/dashboardService.ts
import { DashboardMetric, WorkflowMetric, WarehouseMetric, InventoryFlowData, SupportDashboardMetric } from '@/types';
import { api } from './apiHelper';
import { ShipmentIcon, InventoryIcon, OrderIcon, DispatchIcon, VendorIcon, WarningIcon, CheckBadgeIcon } from '@/constants';

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
        { title: 'Orders Acknowledged', value: data.ordersAcknowledged || '0', icon: CheckBadgeIcon },
        { title: 'Orders Picked', value: data.ordersPicked || '0', icon: OrderIcon },
        { title: 'Orders Packed', value: data.ordersPacked || '0', icon: DispatchIcon },
        { title: 'Orders Shipped', value: data.ordersShipped || '0', icon: ShipmentIcon },
    ];
  },

  // Multi-warehouse dashboard methods
  getWarehouseMetrics: async (signal?: AbortSignal): Promise<WarehouseMetric[]> => {
    const data = await api.get<any>('/dashboard/warehouse-metrics', { signal });
    return data.warehouses || [];
  },

  getInventoryFlowData: async (warehouseId?: number, signal?: AbortSignal): Promise<InventoryFlowData[]> => {
    const path = warehouseId ? `/dashboard/inventory-flow?warehouse_id=${warehouseId}` : '/dashboard/inventory-flow';
    const data = await api.get<any>(path, { signal });
    return data.flowData || [];
  },

  getWarehouseCapacityData: async (warehouseId?: number, signal?: AbortSignal): Promise<any[]> => {
    const path = warehouseId ? `/dashboard/warehouse-capacity?warehouse_id=${warehouseId}` : '/dashboard/warehouse-capacity';
    const data = await api.get<any>(path, { signal });
    return data.capacityData || [];
  },

  getWarehousePerformanceData: async (warehouseId?: number, signal?: AbortSignal): Promise<any[]> => {
    const path = warehouseId ? `/dashboard/warehouse-performance?warehouse_id=${warehouseId}` : '/dashboard/warehouse-performance';
    const data = await api.get<any>(path, { signal });
    return data.performanceData || [];
  },

  // Customer support dashboard methods
  getSupportDashboardMetrics: async (signal?: AbortSignal): Promise<SupportDashboardMetric> => {
    const data = await api.get<any>('/dashboard/support-metrics', { signal });
    return {
      total_tickets: data.total_tickets || 0,
      open_tickets: data.open_tickets || 0,
      resolved_today: data.resolved_today || 0,
      average_resolution_time_hours: data.average_resolution_time_hours || 0,
      tickets_by_priority: data.tickets_by_priority || {},
      tickets_by_category: data.tickets_by_category || {},
    };
  },

  getSupportTicketTrends: async (signal?: AbortSignal): Promise<any[]> => {
    const data = await api.get<any>('/dashboard/support-trends', { signal });
    return data.trends || [];
  },

  // Enhanced stock analysis with warehouse support
  getItemsBelowReorderPoint: async (warehouseId?: number, signal?: AbortSignal): Promise<any[]> => {
    const path = warehouseId ? `/dashboard/items-below-reorder-point?warehouse_id=${warehouseId}` : '/dashboard/items-below-reorder-point';
    const data = await api.get<any>(path, { signal });
    return data.items || [];
  },

  getItemsAtRiskOfStockOut: async (warehouseId?: number, signal?: AbortSignal): Promise<any[]> => {
    const path = warehouseId ? `/dashboard/items-at-risk?warehouse_id=${warehouseId}` : '/dashboard/items-at-risk';
    const data = await api.get<any>(path, { signal });
    return data.items || [];
  },

  getStockAnalysis: async (warehouseId?: number, signal?: AbortSignal): Promise<any> => {
    const path = warehouseId ? `/dashboard/stock-analysis?warehouse_id=${warehouseId}` : '/dashboard/stock-analysis';
    const data = await api.get<any>(path, { signal });
    return {
      itemsBelowReorderPoint: data.itemsBelowReorderPoint || [],
      itemsAtRiskOfStockOut: data.itemsAtRiskOfStockOut || [],
      runRate: data.runRate || { weeklyInstalls: 66, lastUpdated: new Date().toISOString(), source: 'default' },
    };
  },

  updateRunRate: async (weeklyInstalls: number, signal?: AbortSignal): Promise<void> => {
    await api.put('/dashboard/run-rate', { weeklyInstalls }, { signal });
  },

  // Visual inventory flow methods
  getInventoryMovements: async (warehouseId?: number, days?: number, signal?: AbortSignal): Promise<any[]> => {
    let path = '/dashboard/inventory-movements';
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouse_id', warehouseId.toString());
    if (days) params.append('days', days.toString());
    if (params.toString()) path += `?${params.toString()}`;
    
    const data = await api.get<any>(path, { signal });
    return data.movements || [];
  },

  getInventoryFlowChart: async (warehouseId?: number, signal?: AbortSignal): Promise<any[]> => {
    const path = warehouseId ? `/dashboard/inventory-flow-chart?warehouse_id=${warehouseId}` : '/dashboard/inventory-flow-chart';
    const data = await api.get<any>(path, { signal });
    return data.flowData || [];
  },

  // Quick action methods for unified dashboard
  acknowledgeOrder: async (orderId: number, signal?: AbortSignal): Promise<void> => {
    await api.put(`/orders/${orderId}/acknowledge`, {}, { signal });
  },

  startPicking: async (orderId: number, signal?: AbortSignal): Promise<void> => {
    await api.put(`/orders/${orderId}/start-picking`, {}, { signal });
  },

  completePicking: async (orderId: number, signal?: AbortSignal): Promise<void> => {
    await api.put(`/orders/${orderId}/complete-picking`, {}, { signal });
  },

  shipOrder: async (orderId: number, shipmentData: any, signal?: AbortSignal): Promise<void> => {
    await api.post(`/orders/${orderId}/ship`, shipmentData, { signal });
  },

  // Offline status methods
  getOfflineStatus: async (signal?: AbortSignal): Promise<any> => {
    const data = await api.get<any>('/dashboard/offline-status', { signal });
    return {
      isOnline: data.isOnline || true,
      lastSyncTime: data.lastSyncTime,
      pendingActions: data.pendingActions || 0,
      syncInProgress: data.syncInProgress || false,
    };
  },

  syncOfflineActions: async (signal?: AbortSignal): Promise<any> => {
    const data = await api.post<any>('/dashboard/sync-offline-actions', {}, { signal });
    return {
      success: data.success || false,
      syncedActions: data.syncedActions || 0,
      failedActions: data.failedActions || 0,
      errors: data.errors || [],
    };
  },

  // Warehouse management methods
  getWarehouses: async (signal?: AbortSignal): Promise<any[]> => {
    const data = await api.get<any>('/warehouses', { signal });
    return data.warehouses || [];
  },

  getWarehouseDetails: async (warehouseId: number, signal?: AbortSignal): Promise<any> => {
    const data = await api.get<any>(`/warehouses/${warehouseId}`, { signal });
    return data.warehouse;
  },

  // Real-time updates for multi-warehouse
  subscribeToWarehouseUpdates: (warehouseId?: number) => {
    const eventSource = new EventSource(`/api/v1/dashboard/warehouse-updates${warehouseId ? `?warehouse_id=${warehouseId}` : ''}`);
    return eventSource;
  },

  // Stock value by department
  getStockValueByDepartment: async (signal?: AbortSignal): Promise<any[]> => {
    const data = await api.get<any>('/dashboard/stock-value-by-department', { signal });
    return data.departments || [];
  },

  // Aged inventory (items older than 365 days)
  getAgedInventory: async (signal?: AbortSignal): Promise<any[]> => {
    const data = await api.get<any>('/dashboard/aged-inventory', { signal });
    return data.agedItems || [];
  },

  getOutOfStockItemsWithDetails: async (signal?: AbortSignal): Promise<any[]> => {
    const data = await api.get<any>('/dashboard/out-of-stock-items', { signal });
    return data.items || [];
  },
};
