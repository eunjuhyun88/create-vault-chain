import { useState, useEffect, useCallback } from 'react';
import { ScannedAsset } from '@/types/wallet';
import { 
  fetchScannedAssets, 
  subscribeToScannedAssets, 
  createScannedAsset,
  updateAssetStatus,
  deleteScannedAsset
} from '@/services/scannedAssetsService';
import { useToast } from '@/hooks/use-toast';

export function useScannedAssets() {
  const [assets, setAssets] = useState<ScannedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initial fetch
  useEffect(() => {
    const loadAssets = async () => {
      setIsLoading(true);
      try {
        const data = await fetchScannedAssets();
        setAssets(data);
        setError(null);
      } catch (err) {
        setError('Failed to load assets');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToScannedAssets(
      // On Insert
      (newAsset) => {
        setAssets(prev => {
          // Check if already exists
          if (prev.some(a => a.id === newAsset.id)) return prev;
          return [newAsset, ...prev];
        });
        toast({
          title: '🔍 New Asset Detected',
          description: `Captured from ${newAsset.sourceAI.toUpperCase()}`,
        });
      },
      // On Update
      (updatedAsset) => {
        setAssets(prev => 
          prev.map(a => a.id === updatedAsset.id ? updatedAsset : a)
        );
      },
      // On Delete
      (deletedId) => {
        setAssets(prev => prev.filter(a => a.id !== deletedId));
      }
    );

    return unsubscribe;
  }, [toast]);

  // Add new asset (for demo/simulation)
  const addAsset = useCallback(async (asset: Omit<ScannedAsset, 'id' | 'timestamp'>) => {
    const created = await createScannedAsset(asset);
    if (created) {
      // Real-time subscription will handle the update
      return created;
    }
    return null;
  }, []);

  // Update status
  const updateStatus = useCallback(async (id: string, status: ScannedAsset['status']) => {
    const success = await updateAssetStatus(id, status);
    if (success) {
      setAssets(prev => 
        prev.map(a => a.id === id ? { ...a, status } : a)
      );
    }
    return success;
  }, []);

  // Remove asset
  const removeAsset = useCallback(async (id: string) => {
    const success = await deleteScannedAsset(id);
    if (success) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
    return success;
  }, []);

  // Refetch
  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchScannedAssets();
      setAssets(data);
      setError(null);
    } catch (err) {
      setError('Failed to reload assets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    assets,
    isLoading,
    error,
    addAsset,
    updateStatus,
    removeAsset,
    refetch,
  };
}
