import { supabase } from '@/integrations/supabase/client';
import { ScannedAsset, AIService, AssetType, AssetStatus } from '@/types/wallet';

// Convert DB row to ScannedAsset type
function dbToScannedAsset(row: any): ScannedAsset {
  return {
    id: row.id,
    prompt: row.prompt,
    previewUrl: row.preview_url || '',
    sourceAI: row.source_ai as AIService,
    assetType: row.asset_type as AssetType,
    status: row.status as AssetStatus,
    timestamp: new Date(row.created_at),
  };
}

// Fetch scanned assets from database
export async function fetchScannedAssets(limit = 50): Promise<ScannedAsset[]> {
  const { data, error } = await supabase
    .from('scanned_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching scanned assets:', error);
    return [];
  }

  return (data || []).map(dbToScannedAsset);
}

// Subscribe to real-time scanned assets updates
export function subscribeToScannedAssets(
  onInsert: (asset: ScannedAsset) => void,
  onUpdate: (asset: ScannedAsset) => void,
  onDelete: (id: string) => void
) {
  const channel = supabase
    .channel('scanned_assets_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'scanned_assets',
      },
      (payload) => {
        onInsert(dbToScannedAsset(payload.new));
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'scanned_assets',
      },
      (payload) => {
        onUpdate(dbToScannedAsset(payload.new));
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'scanned_assets',
      },
      (payload) => {
        onDelete((payload.old as any).id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Create a new scanned asset locally (for demo mode)
export async function createScannedAsset(asset: Omit<ScannedAsset, 'id' | 'timestamp'>): Promise<ScannedAsset | null> {
  const { data, error } = await supabase
    .from('scanned_assets')
    .insert({
      prompt: asset.prompt,
      preview_url: asset.previewUrl || null,
      source_ai: asset.sourceAI,
      asset_type: asset.assetType,
      status: asset.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating scanned asset:', error);
    return null;
  }

  return dbToScannedAsset(data);
}

// Update asset status
export async function updateAssetStatus(id: string, status: AssetStatus): Promise<boolean> {
  const { error } = await supabase
    .from('scanned_assets')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating asset status:', error);
    return false;
  }

  return true;
}

// Delete a scanned asset
export async function deleteScannedAsset(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('scanned_assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting scanned asset:', error);
    return false;
  }

  return true;
}
