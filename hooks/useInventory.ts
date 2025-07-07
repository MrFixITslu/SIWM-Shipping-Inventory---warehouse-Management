import { useContext } from 'react';
import InventoryContext from '@/contexts/InventoryContext';

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
