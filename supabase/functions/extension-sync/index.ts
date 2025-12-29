import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define valid enum values
const AssetTypeSchema = z.enum(['image', 'video', 'text']);
const SourceAISchema = z.enum(['midjourney', 'dalle', 'stable', 'runway', 'sora', 'firefly', 'veo', 'chatgpt']);

// SSRF-safe URL validation (blocks internal/private IPs)
const securePreviewUrl = z.string().url().max(2000).refine(
  (url) => {
    try {
      const parsed = new URL(url);
      // Only allow HTTPS/HTTP from public URLs
      if (!['https:', 'http:'].includes(parsed.protocol)) return false;
      
      // Block internal/private IP addresses for SSRF protection
      const hostname = parsed.hostname.toLowerCase();
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^0\.0\.0\.0$/,
        /^::1$/,
        /^\[::1\]$/,
        /^169\.254\./, // Link-local
      ];
      for (const pattern of blockedPatterns) {
        if (pattern.test(hostname)) return false;
      }
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Preview URL must be HTTP(S) and not target internal addresses' }
).optional();

// Input validation schemas
const SaveAssetSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long').transform(s => s.trim()),
  preview_url: securePreviewUrl,
  source_ai: z.string().min(1, 'Source AI is required').max(50),
  asset_type: AssetTypeSchema.optional().default('image'),
  user_id: z.string().uuid('Invalid user ID format').nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const SaveBatchSchema = z.object({
  assets: z.array(SaveAssetSchema).min(1, 'At least one asset required').max(50, 'Maximum 50 assets per batch'),
});

const GetAssetsSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  status: z.enum(['scanning', 'captured', 'minted']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

const MintSchema = z.object({
  scanned_asset_id: z.string().uuid('Invalid asset ID'),
  user_id: z.string().uuid('Invalid user ID').nullable().optional(),
});

const DeleteAssetSchema = z.object({
  asset_id: z.string().uuid('Invalid asset ID'),
  user_id: z.string().uuid('Invalid user ID').nullable().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();
    console.log(`[Extension Sync] Action: ${action}`, JSON.stringify(data).substring(0, 200));

    switch (action) {
      case 'save_scanned_asset': {
        // Validate input with zod schema
        const parseResult = SaveAssetSchema.safeParse(data);
        if (!parseResult.success) {
          console.error('[Extension Sync] Validation error:', parseResult.error.errors);
          return new Response(
            JSON.stringify({ 
              error: 'Invalid input', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const payload = parseResult.data;
        
        // Map source_ai to valid enum values
        const validSourceAI = mapSourceAI(payload.source_ai);

        const { data: asset, error } = await supabase
          .from('scanned_assets')
          .insert({
            prompt: payload.prompt,
            preview_url: payload.preview_url,
            source_ai: validSourceAI,
            asset_type: payload.asset_type,
            status: 'captured',
            user_id: payload.user_id || null,
          })
          .select()
          .single();

        if (error) {
          console.error('[Extension Sync] Error saving asset:', error);
          throw error;
        }

        console.log('[Extension Sync] Asset saved:', asset.id);

        return new Response(
          JSON.stringify({ success: true, asset }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'save_batch_assets': {
        // Validate batch input with zod schema
        const parseResult = SaveBatchSchema.safeParse(data);
        if (!parseResult.success) {
          console.error('[Extension Sync] Batch validation error:', parseResult.error.errors);
          return new Response(
            JSON.stringify({ 
              error: 'Invalid input', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { assets } = parseResult.data;

        const insertData = assets.map(asset => ({
          prompt: asset.prompt,
          preview_url: asset.preview_url,
          source_ai: mapSourceAI(asset.source_ai),
          asset_type: asset.asset_type,
          status: 'captured' as const,
          user_id: asset.user_id || null,
        }));

        const { data: savedAssets, error } = await supabase
          .from('scanned_assets')
          .insert(insertData)
          .select();

        if (error) {
          console.error('[Extension Sync] Error saving batch:', error);
          throw error;
        }

        console.log('[Extension Sync] Batch saved:', savedAssets?.length, 'assets');

        return new Response(
          JSON.stringify({ success: true, assets: savedAssets, count: savedAssets?.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_scanned_assets': {
        // Validate query parameters
        const parseResult = GetAssetsSchema.safeParse(data || {});
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid query parameters', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { user_id, status, limit, offset } = parseResult.data;

        let query = supabase
          .from('scanned_assets')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (user_id) {
          query = query.eq('user_id', user_id);
        } else {
          query = query.is('user_id', null);
        }

        if (status) {
          query = query.eq('status', status);
        }

        const { data: assets, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, assets }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'mint_to_passport': {
        // Validate mint request
        const parseResult = MintSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid mint request', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { scanned_asset_id, user_id } = parseResult.data;

        // Get the scanned asset
        const { data: scannedAsset, error: fetchError } = await supabase
          .from('scanned_assets')
          .select('*')
          .eq('id', scanned_asset_id)
          .single();

        if (fetchError || !scannedAsset) {
          return new Response(
            JSON.stringify({ error: 'Scanned asset not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate ACP ID using database function
        const { data: acpIdResult } = await supabase
          .rpc('generate_acp_id');

        const acpId = acpIdResult || `ACP-${Date.now().toString(36).toUpperCase()}`;

        // Create passport from scanned asset
        const { data: passport, error: passportError } = await supabase
          .from('passports')
          .insert({
            acp_id: acpId,
            prompt: scannedAsset.prompt,
            preview_url: scannedAsset.preview_url,
            source_ai: scannedAsset.source_ai,
            asset_type: scannedAsset.asset_type,
            status: 'minted',
            minted_at: new Date().toISOString(),
            user_id: user_id || null,
            metadata: {
              scanned_asset_id: scanned_asset_id,
              minted_from_extension: true,
            },
          })
          .select()
          .single();

        if (passportError) {
          console.error('[Extension Sync] Error creating passport:', passportError);
          throw passportError;
        }

        // Update scanned asset status
        await supabase
          .from('scanned_assets')
          .update({ status: 'minted' })
          .eq('id', scanned_asset_id);

        console.log('[Extension Sync] Passport minted:', passport.acp_id);

        return new Response(
          JSON.stringify({ success: true, passport }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_scanned_asset': {
        // Validate delete request
        const parseResult = DeleteAssetSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid delete request', 
              details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { asset_id, user_id } = parseResult.data;

        let query = supabase
          .from('scanned_assets')
          .delete()
          .eq('id', asset_id);

        if (user_id) {
          query = query.eq('user_id', user_id);
        }

        const { error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('[Extension Sync] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Map various AI service names to valid enum values
function mapSourceAI(source: string): string {
  const mapping: Record<string, string> = {
    'chatgpt': 'chatgpt',
    'openai': 'chatgpt',
    'gpt': 'chatgpt',
    'midjourney': 'midjourney',
    'mj': 'midjourney',
    'dalle': 'dalle',
    'dall-e': 'dalle',
    'stable': 'stable',
    'stability': 'stable',
    'stablediffusion': 'stable',
    'stable-diffusion': 'stable',
    'runway': 'runway',
    'runwayml': 'runway',
    'firefly': 'firefly',
    'adobe': 'firefly',
    'veo': 'veo',
    'google': 'veo',
    'sora': 'sora',
  };

  const normalized = source.toLowerCase().replace(/[^a-z]/g, '');
  return mapping[normalized] || 'chatgpt'; // Default to chatgpt if unknown
}
