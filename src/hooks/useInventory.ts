
import { useContext } from 'react';
import InventoryContext, { InventoryContextType } from '@/contexts/InventoryContext';

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
