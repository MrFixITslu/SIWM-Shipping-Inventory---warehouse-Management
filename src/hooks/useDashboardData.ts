import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { dashboardService } from '@/services/dashboardService';
import { asnService } from '@/services/asnService';

interface DashboardData {
  warehouseMetrics: any[];
  inventoryFlowData: any[];
  supportMetrics: any | null;
  offlineStatus: any;
  inventoryMovements: any[];
  inventoryFlowChart: any[];
  asnKpis: {
    avgLandedToApprovalRequest: number | null;
    avgApprovalRequestToApproved: number | null;
    avgApprovedToPaid: number | null;
    avgLandedToPaid: number | null;
  };
  itemsBelowThreshold: any[];
  itemsAtRiskOfStockOut: any[];
}

interface UseDashboardDataOptions {
  selectedWarehouse?: number;
  refreshInterval?: number;
  enableRealTime?: boolean;
}

export const useDashboardData = (options: UseDashboardDataOptions = {}) => {
  const {
    selectedWarehouse,
    refreshInterval = 60000, // Increased to 60 seconds to reduce constant refreshes
    enableRealTime = true
  } = options;

  const [data, setData] = useState<DashboardData>({
    warehouseMetrics: [],
    inventoryFlowData: [],
    supportMetrics: null,
    offlineStatus: { isOnline: true, pendingActions: 0, syncInProgress: false },
    inventoryMovements: [],
    inventoryFlowChart: [],
    asnKpis: {
      avgLandedToApprovalRequest: null,
      avgApprovalRequestToApproved: null,
      avgApprovedToPaid: null,
      avgLandedToPaid: null,
    },
    itemsBelowThreshold: [],
    itemsAtRiskOfStockOut: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // Cache for expensive operations
  const cacheRef = useRef<Map<string, { data: any; timestamp: number; ttl: number }>>(new Map());

  // Helper function to check if cache is valid
  const getCachedData = useCallback((key: string, ttl: number = 300000) => { // 5 minutes default
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, []);

  // Helper function to set cache
  const setCachedData = useCallback((key: string, data: any, ttl: number = 300000) => {
    cacheRef.current.set(key, { data, timestamp: Date.now(), ttl });
  }, []);

  // Memoized data fetching function with better error handling and caching
  const fetchDashboardData = useCallback(async (signal: AbortSignal, forceRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (!forceRefresh && Date.now() - lastFetchTimeRef.current < 5000) {
      return; // Skip if last fetch was less than 5 seconds ago
    }

    try {
      setLoading(true);
      setError(null);
      lastFetchTimeRef.current = Date.now();

      // Check cache for non-critical data
      const cacheKey = `dashboard_${selectedWarehouse || 'all'}`;
      const cachedData = getCachedData(cacheKey, 60000); // 1 minute cache for dashboard data

      if (!forceRefresh && cachedData) {
        setData(cachedData);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      // Fetch critical data first (warehouse metrics and offline status)
      const [warehouseMetricsData, offlineStatusData] = await Promise.all([
        dashboardService.getWarehouseMetrics(signal),
        dashboardService.getOfflineStatus(signal),
      ]);

      if (signal.aborted) return;

      // Update critical data immediately
      setData(prev => ({
        ...prev,
        warehouseMetrics: warehouseMetricsData,
        offlineStatus: offlineStatusData,
      }));

      // Fetch non-critical data in parallel
      const [
        inventoryFlowData,
        supportMetricsData,
        inventoryMovementsData,
        inventoryFlowChartData,
        itemsBelowThresholdData,
        itemsAtRiskOfStockOutData
      ] = await Promise.all([
        dashboardService.getInventoryFlowData(selectedWarehouse, signal),
        dashboardService.getSupportDashboardMetrics(signal),
        dashboardService.getInventoryMovements(selectedWarehouse, 7, signal),
        dashboardService.getInventoryFlowChart(selectedWarehouse, signal),
        dashboardService.getItemsBelowReorderPoint(selectedWarehouse, signal),
        dashboardService.getItemsAtRiskOfStockOut(selectedWarehouse, signal),
      ]);

      if (!signal.aborted) {
        const newData = {
          warehouseMetrics: warehouseMetricsData,
          inventoryFlowData,
          supportMetrics: supportMetricsData,
          offlineStatus: offlineStatusData,
          inventoryMovements: inventoryMovementsData,
          inventoryFlowChart: inventoryFlowChartData,
          itemsBelowThreshold: itemsBelowThresholdData,
          itemsAtRiskOfStockOut: itemsAtRiskOfStockOutData,
          asnKpis: data.asnKpis, // Preserve existing ASN KPIs
        };

        setData(newData);
        setLastUpdated(new Date());
        
        // Cache the result
        setCachedData(cacheKey, newData, 60000);
      }
    } catch (error: unknown) {
      if (!(error && typeof error === 'object' && 'name' in error && (error as any).name === 'AbortError')) {
        console.error("Failed to fetch dashboard data:", error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedWarehouse, getCachedData, setCachedData]);

  // Memoized ASN KPI calculation with caching
  const fetchAsnKpis = useCallback(async (signal: AbortSignal, forceRefresh = false) => {
    const cacheKey = 'asn_kpis';
    const cachedKpis = getCachedData(cacheKey, 300000); // 5 minutes cache for ASN KPIs

    if (!forceRefresh && cachedKpis) {
      setData(prev => ({ ...prev, asnKpis: cachedKpis }));
      return;
    }

    try {
      const asns = await asnService.getASNs();
      if (!asns || asns.length === 0) {
        console.log('No ASNs found for KPI calculation');
        return;
      }
      const durations = asns.map((asn: any) => {
        const created = asn.createdAt ? new Date(asn.createdAt).getTime() : null;
        let approvalRequest: number | null = null;
        let approved: number | null = null;
        let paid: number | null = null;
        
        if (asn.feeStatusHistory) {
          for (const entry of asn.feeStatusHistory) {
            if (entry.status === 'Pending Approval' && !approvalRequest) {
              approvalRequest = new Date(entry.timestamp).getTime();
            }
            if (entry.status === 'Approved' && !approved) {
              approved = new Date(entry.timestamp).getTime();
            }
            if (entry.status === 'Payment Confirmed' && !paid) {
              paid = new Date(entry.timestamp).getTime();
            }
          }
        }
        
        return {
          landedToApprovalRequest: created && approvalRequest ? (approvalRequest - created) / 3600000 : null,
          approvalRequestToApproved: approvalRequest && approved ? (approved - approvalRequest) / 3600000 : null,
          approvedToPaid: approved && paid ? (paid - approved) / 3600000 : null,
          landedToPaid: created && paid ? (paid - created) / 3600000 : null,
        };
      });

      const avg = (arr: (number | null)[]) => {
        const nums = arr.filter((v): v is number => v !== null);
        return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      };

      const kpis = {
        avgLandedToApprovalRequest: avg(durations.map(d => d.landedToApprovalRequest)),
        avgApprovalRequestToApproved: avg(durations.map(d => d.approvalRequestToApproved)),
        avgApprovedToPaid: avg(durations.map(d => d.approvedToPaid)),
        avgLandedToPaid: avg(durations.map(d => d.landedToPaid)),
      };

      if (!signal.aborted) {
        setData(prev => ({ ...prev, asnKpis: kpis }));
        setCachedData(cacheKey, kpis, 300000);
      }
    } catch (error) {
      if (!(error && typeof error === 'object' && 'name' in error && (error as any).name === 'AbortError')) {
        console.error("Failed to fetch ASN KPIs:", error);
      }
    }
  }, [getCachedData, setCachedData]);

  // Memoized refresh function with debouncing
  const refresh = useCallback((forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    fetchDashboardData(signal, forceRefresh);
    fetchAsnKpis(signal, forceRefresh);
  }, [fetchDashboardData, fetchAsnKpis]);

  // Setup real-time updates with better interval management
  useEffect(() => {
    // Always set up the effect, but conditionally start the interval
    let intervalId: NodeJS.Timeout | null = null;
    
    if (enableRealTime && isInitializedRef.current) {
      // Clear existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set new interval
      intervalId = setInterval(() => {
        refresh(false); // Don't force refresh for interval updates
      }, refreshInterval);
      
      refreshIntervalRef.current = intervalId;
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [refresh, refreshInterval, enableRealTime]);

  // Initial data fetch - only run once
  useEffect(() => {
    // Always set up the effect, but conditionally trigger the fetch
    let abortController: AbortController | null = null;
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      fetchDashboardData(abortController.signal, true);
      fetchAsnKpis(abortController.signal, true);
    }

    return () => {
      if (abortController) {
        abortController.abort();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDashboardData, fetchAsnKpis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Memoized computed values for performance
  const computedValues = useMemo(() => {
    const totalItems = data.warehouseMetrics.reduce((sum, warehouse) => sum + warehouse.inventory_items, 0);
    const totalOrders = data.warehouseMetrics.reduce((sum, warehouse) => sum + warehouse.pending_orders, 0);
    const totalAlerts = data.warehouseMetrics.reduce((sum, warehouse) => sum + warehouse.stock_alerts, 0);
    const avgCapacity = data.warehouseMetrics.length > 0 
      ? data.warehouseMetrics.reduce((sum, warehouse) => sum + warehouse.capacity_percentage, 0) / data.warehouseMetrics.length 
      : 0;

    return {
      totalItems,
      totalOrders,
      totalAlerts,
      avgCapacity,
      criticalItems: data.itemsBelowThreshold.filter(item => item.critical).length,
      itemsAtRisk: data.itemsAtRiskOfStockOut.length,
    };
  }, [data]);

  // Memoized chart data for performance
  const chartData = useMemo(() => {
    return {
      warehouseCapacity: data.warehouseMetrics.map(warehouse => ({
        name: warehouse.warehouse_name,
        capacity: warehouse.capacity_percentage,
        items: warehouse.inventory_items,
        orders: warehouse.pending_orders,
      })),
      inventoryFlow: data.inventoryFlowChart,
      movements: data.inventoryMovements,
    };
  }, [data.warehouseMetrics, data.inventoryFlowChart, data.inventoryMovements]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    computedValues,
    chartData,
  };
}; 