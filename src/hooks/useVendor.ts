

// This file now acts as a clean re-export for the canonical useVendor hook.
import { useContext } from 'react';
import VendorContext, { VendorContextType } from '@/contexts/VendorContext';

export const useVendor = (): VendorContextType => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};
