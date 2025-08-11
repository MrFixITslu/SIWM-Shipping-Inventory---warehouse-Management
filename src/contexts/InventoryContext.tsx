
import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { InventoryItem } from '@/types';

export interface InventoryContextType {
  inventory: InventoryItem[];
  inventoryMap: Record<number, InventoryItem>;
  isLoading: boolean;
  error: string | null;
  fetchInventory: () => Promise<void>;
  lastUpdatedId: { id: number; type: 'create' | 'update' } | null;
  clearLastUpdatedId: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedId, setLastUpdatedId] = useState<{ id: number; type: 'create' | 'update' } | null>(null);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let items = await inventoryService.getInventoryItems();
      // Remove items without a name
      const itemsWithName = items.filter(item => item.name && item.name.trim() !== '');
      const itemsWithoutName = items.filter(item => !item.name || item.name.trim() === '');
      // Delete items without a name from the backend
      await Promise.all(itemsWithoutName.map(item => inventoryService.deleteInventoryItem(item.id)));
      setInventory(itemsWithName);
    } catch (err: any) {
      setError(err.message || "Failed to fetch inventory data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // --- Real-time updates via SSE ---
  const handleInventoryCreated = useCallback((newItem: InventoryItem) => {
    setInventory(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
    setLastUpdatedId({ id: newItem.id, type: 'create' });
  }, []);

  const handleInventoryUpdated = useCallback((updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setLastUpdatedId({ id: updatedItem.id, type: 'update' });
  }, []);

  const handleInventoryDeleted = useCallback((data: { id: number }) => {
    setInventory(prev => prev.filter(item => item.id !== data.id));
  }, []);

  const realtimeHandlers = useMemo(() => ({
    'inventory_created': handleInventoryCreated,
    'inventory_updated': handleInventoryUpdated,
    'inventory_deleted': handleInventoryDeleted,
  }), [handleInventoryCreated, handleInventoryUpdated, handleInventoryDeleted]);

  useRealtimeUpdates(realtimeHandlers);
  // --- End of real-time updates ---

  const inventoryMap = useMemo(() => {
    const newMap: Record<number, InventoryItem> = {};
    inventory.forEach(item => { newMap[item.id] = item; });
    return newMap;
  }, [inventory]);

  const value = useMemo(() => ({
    inventory,
    inventoryMap,
    isLoading,
    error,
    fetchInventory,
    lastUpdatedId,
    clearLastUpdatedId: () => setLastUpdatedId(null),
  }), [inventory, inventoryMap, isLoading, error, fetchInventory, lastUpdatedId]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export default InventoryContext;