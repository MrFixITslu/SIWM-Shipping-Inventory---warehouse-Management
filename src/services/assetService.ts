
// services/assetService.ts
import { WarehouseAsset, MaintenanceRecord } from '@/types';
import { api } from './apiHelper';

export const assetService = {
  getAssets: (): Promise<WarehouseAsset[]> => {
    return api.get('/assets');
  },

  addAsset: (assetData: Omit<WarehouseAsset, 'id'>): Promise<WarehouseAsset> => {
    return api.post('/assets', assetData);
  },

  updateAsset: (updatedAsset: WarehouseAsset): Promise<WarehouseAsset> => {
    return api.put(`/assets/${updatedAsset.id}`, updatedAsset);
  },

  deleteAsset: (assetId: number): Promise<void> => {
    return api.delete(`/assets/${assetId}`);
  },

  // --- Maintenance Records ---
  getMaintenanceRecordsForAsset: (assetId: number): Promise<MaintenanceRecord[]> => {
    return api.get(`/assets/${assetId}/maintenance`);
  },

  addMaintenanceRecord: (assetId: number, recordData: Omit<MaintenanceRecord, 'id' | 'assetName'>): Promise<MaintenanceRecord> => {
    return api.post(`/assets/${assetId}/maintenance`, recordData);
  },

  updateMaintenanceRecord: (assetId: number, recordId: number, updatedRecord: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    return api.put(`/assets/${assetId}/maintenance/${recordId}`, updatedRecord);
  },

  deleteMaintenanceRecord: (assetId: number, recordId: number): Promise<void> => {
    return api.delete(`/assets/${assetId}/maintenance/${recordId}`);
  },
};
