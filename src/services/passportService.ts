import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';

// Use types from Supabase
export type Passport = Tables<'passports'>;
export type PassportInsert = TablesInsert<'passports'>;
export type PassportUpdate = TablesUpdate<'passports'>;

export type ScannedAsset = Tables<'scanned_assets'>;
export type ScannedAssetInsert = TablesInsert<'scanned_assets'>;
export type ScannedAssetUpdate = TablesUpdate<'scanned_assets'>;

export type AssetType = 'image' | 'video' | 'text';
export type AssetStatus = 'scanning' | 'captured' | 'minted';
export type AIService = 'midjourney' | 'dalle' | 'stable' | 'runway' | 'sora' | 'firefly' | 'veo' | 'chatgpt';

export interface CreatePassportInput {
  prompt: string;
  preview_url?: string;
  source_ai: AIService;
  asset_type?: AssetType;
  trust_level?: number;
  metadata?: Json;
}

export interface CreateScannedAssetInput {
  prompt: string;
  preview_url?: string;
  source_ai: AIService;
  asset_type?: AssetType;
}

// Generate ACP ID locally (fallback if DB function fails)
function generateLocalAcpId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ACP-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Passport CRUD operations
export const passportService = {
  // Get all passports for current user
  async getAll(): Promise<Passport[]> {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching passports:', error);
      throw error;
    }

    return data || [];
  },

  // Get a single passport by ID
  async getById(id: string): Promise<Passport | null> {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching passport:', error);
      throw error;
    }

    return data;
  },

  // Create a new passport (mint)
  async create(input: CreatePassportInput): Promise<Passport> {
    const acpId = generateLocalAcpId();
    
    const insertData: PassportInsert = {
      acp_id: acpId,
      prompt: input.prompt,
      preview_url: input.preview_url || null,
      source_ai: input.source_ai,
      asset_type: input.asset_type || 'image',
      status: 'minted',
      trust_level: input.trust_level || 85,
      metadata: input.metadata || null,
      minted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('passports')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating passport:', error);
      throw error;
    }

    return data;
  },

  // Update a passport
  async update(id: string, updates: PassportUpdate): Promise<Passport> {
    const { data, error } = await supabase
      .from('passports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating passport:', error);
      throw error;
    }

    return data;
  },

  // Delete a passport
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('passports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting passport:', error);
      throw error;
    }
  },

  // Get passports by source AI
  async getBySource(source: AIService): Promise<Passport[]> {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('source_ai', source)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching passports by source:', error);
      throw error;
    }

    return data || [];
  },
};

// Scanned Assets CRUD operations
export const scannedAssetService = {
  // Get all scanned assets
  async getAll(): Promise<ScannedAsset[]> {
    const { data, error } = await supabase
      .from('scanned_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching scanned assets:', error);
      throw error;
    }

    return data || [];
  },

  // Create a new scanned asset
  async create(input: CreateScannedAssetInput): Promise<ScannedAsset> {
    const insertData: ScannedAssetInsert = {
      prompt: input.prompt,
      preview_url: input.preview_url || null,
      source_ai: input.source_ai,
      asset_type: input.asset_type || 'image',
      status: 'scanning',
    };

    const { data, error } = await supabase
      .from('scanned_assets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating scanned asset:', error);
      throw error;
    }

    return data;
  },

  // Update scanned asset status
  async updateStatus(id: string, status: AssetStatus, previewUrl?: string): Promise<ScannedAsset> {
    const updates: ScannedAssetUpdate = { status };
    if (previewUrl) updates.preview_url = previewUrl;

    const { data, error } = await supabase
      .from('scanned_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating scanned asset:', error);
      throw error;
    }

    return data;
  },

  // Delete a scanned asset
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('scanned_assets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scanned asset:', error);
      throw error;
    }
  },

  // Convert scanned asset to passport (mint)
  async mintToPassport(scannedAssetId: string, trustLevel?: number): Promise<Passport> {
    // Get the scanned asset
    const { data: asset, error: fetchError } = await supabase
      .from('scanned_assets')
      .select('*')
      .eq('id', scannedAssetId)
      .single();

    if (fetchError || !asset) {
      throw new Error('Scanned asset not found');
    }

    // Create passport from scanned asset
    const passport = await passportService.create({
      prompt: asset.prompt,
      preview_url: asset.preview_url || undefined,
      source_ai: asset.source_ai,
      asset_type: asset.asset_type,
      trust_level: trustLevel || 85,
    });

    // Delete the scanned asset
    await scannedAssetService.delete(scannedAssetId);

    return passport;
  },
};
