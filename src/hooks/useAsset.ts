

// This file now acts as a clean re-export for the canonical useAsset hook.
import { useContext } from 'react';
import AssetContext, { AssetContextType } from '@/contexts/AssetContext';

export const useAsset = (): AssetContextType => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAsset must be used within an AssetProvider');
  }
  return context;
};
