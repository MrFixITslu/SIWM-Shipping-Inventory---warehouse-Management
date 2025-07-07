// services/inventoryService.ts
import { InventoryItem } from '@/types';
import { api } from './apiHelper';

export const inventoryService = {
  getInventoryItems: (): Promise<InventoryItem[]> => {
    return api.get('/inventory');
  },

  addInventoryItem: (itemData: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    return api.post('/inventory', itemData);
  },

  updateInventoryItem: (itemId: number, itemData: Partial<InventoryItem>): Promise<InventoryItem> => {
    return api.put(`/inventory/${itemId}`, itemData);
  },

  deleteInventoryItem: (itemId: number): Promise<void> => {
    return api.delete(`/inventory/${itemId}`);
  },

  manageItemSerials: (itemId: number, serials: string[]): Promise<InventoryItem> => {
    return api.post(`/inventory/${itemId}/serials`, { serials });
  },

  getUniqueCategories: (): Promise<string[]> => {
    return api.get('/inventory/data/categories');
  }
};
