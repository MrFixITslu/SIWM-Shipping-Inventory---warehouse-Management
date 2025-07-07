
import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo, useContext } from 'react';
import { assetService } from '@/services/assetService';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WarehouseAsset } from '@/types';

interface AssetContextType {
  assets: WarehouseAsset[];
  isLoading: boolean;
  error: string | null;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<WarehouseAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await assetService.getAssets();
      setAssets(items);
    } catch (err: any) {
      setError(err.message || "Failed to fetch asset data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // --- Real-time updates via SSE ---
  const handleAssetCreated = useCallback((newAsset: WarehouseAsset) => {
    setAssets(prev => [...prev, newAsset]);
  }, []);

  const handleAssetUpdated = useCallback((updatedAsset: WarehouseAsset) => {
    setAssets(prev => prev.map(item => item.id === updatedAsset.id ? updatedAsset : item));
  }, []);

  const handleAssetDeleted = useCallback((data: { id: number }) => {
    setAssets(prev => prev.filter(item => item.id !== data.id));
  }, []);

  const realtimeHandlers = useMemo(() => ({
    'asset_created': handleAssetCreated,
    'asset_updated': handleAssetUpdated,
    'asset_deleted': handleAssetDeleted,
  }), [handleAssetCreated, handleAssetUpdated, handleAssetDeleted]);

  useRealtimeUpdates(realtimeHandlers);
  // --- End of real-time updates ---

  const value = useMemo(() => ({
    assets,
    isLoading,
    error,
  }), [assets, isLoading, error]);

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
};

export const useAsset = (): AssetContextType => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAsset must be used within an AssetProvider');
  }
  return context;
};

export default AssetContext;
