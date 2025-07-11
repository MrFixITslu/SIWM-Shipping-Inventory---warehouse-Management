// services/warehouseService.ts
import { api } from './apiHelper';
import { Warehouse } from '@/types';

export const warehouseService = {
  // Get all warehouses
  getWarehouses: async (): Promise<Warehouse[]> => {
    const data = await api.get<any>('/warehouses');
    return data.warehouses || [];
  },

  // Get warehouse by ID
  getWarehouseById: async (id: number): Promise<Warehouse> => {
    const data = await api.get<any>(`/warehouses/${id}`);
    return data.warehouse;
  },

  // Create new warehouse
  createWarehouse: async (warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>): Promise<Warehouse> => {
    const data = await api.post<any>('/warehouses', warehouse);
    return data.warehouse;
  },

  // Update warehouse
  updateWarehouse: async (id: number, warehouse: Partial<Warehouse>): Promise<Warehouse> => {
    const data = await api.put<any>(`/warehouses/${id}`, warehouse);
    return data.warehouse;
  },

  // Delete warehouse
  deleteWarehouse: async (id: number): Promise<void> => {
    await api.delete(`/warehouses/${id}`);
  },

  // Get warehouse zones
  getWarehouseZones: async (warehouseId: number): Promise<any[]> => {
    const data = await api.get<any>(`/warehouses/${warehouseId}/zones`);
    return data.zones || [];
  },

  // Get warehouse aisles
  getWarehouseAisles: async (warehouseId: number): Promise<any[]> => {
    const data = await api.get<any>(`/warehouses/${warehouseId}/aisles`);
    return data.aisles || [];
  },

  // Get warehouse capacity
  getWarehouseCapacity: async (warehouseId: number): Promise<any> => {
    const data = await api.get<any>(`/warehouses/${warehouseId}/capacity`);
    return data.capacity;
  },

  // Get warehouse performance
  getWarehousePerformance: async (warehouseId: number): Promise<any> => {
    const data = await api.get<any>(`/warehouses/${warehouseId}/performance`);
    return data.performance;
  },
};
