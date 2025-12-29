import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScannedAssetPayload {
  prompt: string;
  preview_url?: string;
  source_ai: string;
  asset_type?: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
}

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
        const payload = data as ScannedAssetPayload;

        // Validate required fields
        if (!payload.prompt || !payload.source_ai) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: prompt and source_ai' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Map source_ai to valid enum values
        const validSourceAI = mapSourceAI(payload.source_ai);

        const { data: asset, error } = await supabase
          .from('scanned_assets')
          .insert({
            prompt: payload.prompt.substring(0, 1000), // Limit prompt length
            preview_url: payload.preview_url,
            source_ai: validSourceAI,
            asset_type: payload.asset_type || 'image',
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
        const { assets } = data as { assets: ScannedAssetPayload[] };

        if (!assets || !Array.isArray(assets) || assets.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No assets provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Limit batch size
        const limitedAssets = assets.slice(0, 50);

        const insertData = limitedAssets.map(asset => ({
          prompt: asset.prompt?.substring(0, 1000) || 'AI Generated Content',
          preview_url: asset.preview_url,
          source_ai: mapSourceAI(asset.source_ai),
          asset_type: asset.asset_type || 'image',
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
        const { user_id, status, limit = 50, offset = 0 } = data;

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
        const { scanned_asset_id, user_id } = data;

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
        const { asset_id, user_id } = data;

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
