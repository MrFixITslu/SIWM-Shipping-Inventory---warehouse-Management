import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { InventoryItem } from '@/types';

interface InventoryContextType {
  inventory: InventoryItem[];
  inventoryMap: Record<number, InventoryItem>;
  isLoading: boolean;
  error: string | null;
  fetchInventory: () => Promise<void>;
  addOrUpdateItem: (item: InventoryItem) => void;
  removeItemById: (itemId: number) => void;
  updateItemOptimistically: (item: Partial<InventoryItem> & { id: number }) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await inventoryService.getInventoryItems();
      setInventory(items);
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
    setInventory(prev => [...prev, newItem]);
  }, []);

  const handleInventoryUpdated = useCallback((updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
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

  const addOrUpdateItem = useCallback((item: InventoryItem) => {
    setInventory(prev => {
      const index = prev.findIndex(i => i.id === item.id);
      if (index > -1) {
        const newInventory = [...prev];
        newInventory[index] = item;
        return newInventory;
      } else {
        return [...prev, item];
      }
    });
  }, []);
  
  const updateItemOptimistically = useCallback((itemUpdate: Partial<InventoryItem> & { id: number }) => {
    setInventory(prev => 
        prev.map(item => item.id === itemUpdate.id ? { ...item, ...itemUpdate } : item)
    );
  }, []);

  const removeItemById = useCallback((itemId: number) => {
    setInventory(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const value = useMemo(() => ({
    inventory,
    inventoryMap,
    isLoading,
    error,
    fetchInventory,
    addOrUpdateItem,
    removeItemById,
    updateItemOptimistically,
  }), [inventory, inventoryMap, isLoading, error, fetchInventory, addOrUpdateItem, removeItemById, updateItemOptimistically]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export default InventoryContext;