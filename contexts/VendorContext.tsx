
import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo, useContext } from 'react';
import { vendorService } from '@/services/vendorService';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Vendor } from '@/types';

interface VendorContextType {
  vendors: Vendor[];
  isLoading: boolean;
  error: string | null;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await vendorService.getVendors();
      setVendors(items);
    } catch (err: any) {
      setError(err.message || "Failed to fetch vendor data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // --- Real-time updates via SSE ---
  const handleVendorCreated = useCallback((newVendor: Vendor) => {
    setVendors(prev => [...prev, newVendor]);
  }, []);

  const handleVendorUpdated = useCallback((updatedVendor: Vendor) => {
    setVendors(prev => prev.map(item => item.id === updatedVendor.id ? updatedVendor : item));
  }, []);

  const handleVendorDeleted = useCallback((data: { id: number }) => {
    setVendors(prev => prev.filter(item => item.id !== data.id));
  }, []);

  const realtimeHandlers = useMemo(() => ({
    'vendor_created': handleVendorCreated,
    'vendor_updated': handleVendorUpdated,
    'vendor_deleted': handleVendorDeleted,
  }), [handleVendorCreated, handleVendorUpdated, handleVendorDeleted]);

  useRealtimeUpdates(realtimeHandlers);
  // --- End of real-time updates ---

  const value = useMemo(() => ({
    vendors,
    isLoading,
    error,
  }), [vendors, isLoading, error]);

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
};

export const useVendor = (): VendorContextType => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

export default VendorContext;
