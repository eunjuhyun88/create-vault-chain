import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const AlertTypeSchema = z.enum(['viral', 'repost', 'infringement', 'revenue', 'ranking']);

const CreateAlertSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  passport_id: z.string().uuid().nullable().optional(),
  alert_type: AlertTypeSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  alert_data: z.record(z.unknown()).optional(),
  channels: z.array(z.string().max(50)).max(10).optional(),
});

const GetAlertsSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  alert_type: AlertTypeSchema.optional(),
  read: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

const MarkReadSchema = z.object({
  alert_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
});

const MarkAllReadSchema = z.object({
  user_id: z.string().uuid().optional(),
});

const GetUnreadCountSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
});

const PreferencesSchema = z.object({
  viral_alerts: z.boolean().optional(),
  repost_alerts: z.boolean().optional(),
  infringement_alerts: z.boolean().optional(),
  revenue_alerts: z.boolean().optional(),
  ranking_alerts: z.boolean().optional(),
  viral_threshold: z.number().int().min(1).max(1000000).optional(),
  channels: z.array(z.string().max(50)).max(10).optional(),
  webhook_url: z.string().url().max(500).nullable().optional(),
  telegram_chat_id: z.string().max(100).nullable().optional(),
});

const UpdatePreferencesSchema = z.object({
  user_id: z.string().uuid(),
  preferences: PreferencesSchema,
});

const GetPreferencesSchema = z.object({
  user_id: z.string().uuid(),
});

// Helper to extract and validate user from auth header
async function getAuthenticatedUser(req: Request, supabase: any) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { user: null, error: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return { user, error };
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
    console.log(`[MemePing Alerts] Action: ${action}`);

    // Get authenticated user (may be null for demo mode)
    const { user, error: authError } = await getAuthenticatedUser(req, supabase);
    
    switch (action) {
      case 'create_alert': {
        // Validate input
        const parseResult = CreateAlertSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const validData = parseResult.data;

        // For authenticated users, enforce user_id match
        if (user && validData.user_id && validData.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Forbidden: Cannot create alerts for other users' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If authenticated, use their user_id
        const effectiveUserId = user ? user.id : validData.user_id;

        const { data: alert, error } = await supabase
          .from('memeping_alerts')
          .insert({
            user_id: effectiveUserId,
            passport_id: validData.passport_id,
            alert_type: validData.alert_type,
            title: validData.title,
            body: validData.body,
            data: validData.alert_data || {},
            channels_sent: validData.channels || ['in_app'],
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, alert }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_alerts': {
        // Validate input
        const parseResult = GetAlertsSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const validData = parseResult.data;

        let query = supabase
          .from('memeping_alerts')
          .select(`
            *,
            passports (
              acp_id,
              prompt,
              preview_url
            )
          `)
          .order('created_at', { ascending: false })
          .range(validData.offset, validData.offset + validData.limit - 1);

        // Authenticated users can only see their own alerts
        if (user) {
          query = query.eq('user_id', user.id);
        } else if (validData.user_id) {
          // For non-authenticated requests, only allow viewing null user_id alerts (demo mode)
          query = query.is('user_id', null);
        } else {
          query = query.is('user_id', null);
        }

        if (validData.alert_type) {
          query = query.eq('alert_type', validData.alert_type);
        }

        if (typeof validData.read === 'boolean') {
          query = query.eq('read', validData.read);
        }

        const { data: alerts, error, count } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, alerts, total: count }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'mark_read': {
        // Validate input
        const parseResult = MarkReadSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const validData = parseResult.data;

        // Authenticated users can only mark their own alerts
        let query = supabase
          .from('memeping_alerts')
          .update({ read: true })
          .eq('id', validData.alert_id);

        if (user) {
          query = query.eq('user_id', user.id);
        } else {
          // Demo mode: only allow marking null user_id alerts
          query = query.is('user_id', null);
        }

        const { error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'mark_all_read': {
        // Validate input
        const parseResult = MarkAllReadSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let query = supabase
          .from('memeping_alerts')
          .update({ read: true })
          .eq('read', false);

        if (user) {
          query = query.eq('user_id', user.id);
        } else {
          // Demo mode: only allow marking null user_id alerts
          query = query.is('user_id', null);
        }

        const { error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_unread_count': {
        // Validate input
        const parseResult = GetUnreadCountSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let query = supabase
          .from('memeping_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('read', false);

        if (user) {
          query = query.eq('user_id', user.id);
        } else {
          query = query.is('user_id', null);
        }

        const { count, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, unread_count: count || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_preferences': {
        // Require authentication for preferences
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized: Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate input
        const parseResult = UpdatePreferencesSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const validData = parseResult.data;

        // Enforce user can only update their own preferences
        if (validData.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Forbidden: Cannot update preferences for other users' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: prefs, error } = await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            ...validData.preferences,
          }, {
            onConflict: 'user_id',
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, preferences: prefs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_preferences': {
        // Require authentication for preferences
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized: Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate input
        const parseResult = GetPreferencesSchema.safeParse(data);
        if (!parseResult.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const validData = parseResult.data;

        // Enforce user can only get their own preferences
        if (validData.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Forbidden: Cannot view preferences for other users' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: prefs, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        // Return default preferences if none exist
        const defaultPrefs = {
          viral_alerts: true,
          repost_alerts: true,
          infringement_alerts: true,
          revenue_alerts: true,
          ranking_alerts: true,
          viral_threshold: 100,
          channels: ['in_app'],
        };

        return new Response(
          JSON.stringify({ success: true, preferences: prefs || defaultPrefs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Demo: Create sample alerts for testing
      case 'create_demo_alerts': {
        const demoAlerts = [
          {
            user_id: null,
            passport_id: null,
            alert_type: 'viral',
            title: '🔥 Your artwork is going viral!',
            body: 'Your "Cyberpunk Warrior" creation hit 500 likes in the last hour on Farcaster!',
            data: { likes: 500, platform: 'farcaster' },
            channels_sent: ['in_app'],
          },
          {
            user_id: null,
            passport_id: null,
            alert_type: 'repost',
            title: '🔄 New share detected!',
            body: '@cryptoartist shared your artwork on Twitter with proper credit.',
            data: { sharer: '@cryptoartist', platform: 'twitter', followers: 25000 },
            channels_sent: ['in_app'],
          },
          {
            user_id: null,
            passport_id: null,
            alert_type: 'infringement',
            title: '⚠️ Possible unauthorized use',
            body: 'Your image may have been used without credit on TikTok (100K+ views).',
            data: { platform: 'tiktok', views: 150000 },
            channels_sent: ['in_app'],
          },
          {
            user_id: null,
            passport_id: null,
            alert_type: 'revenue',
            title: '💰 You earned 25 PLART!',
            body: 'An AI company licensed your artwork for training data.',
            data: { amount: 25, currency: 'PLART', buyer: 'AI Training Co' },
            channels_sent: ['in_app'],
          },
          {
            user_id: null,
            passport_id: null,
            alert_type: 'ranking',
            title: '🏆 Ranking update!',
            body: 'Your PIM ranking jumped from #45 to #23 this week!',
            data: { old_rank: 45, new_rank: 23 },
            channels_sent: ['in_app'],
          },
        ];

        const { data: alerts, error } = await supabase
          .from('memeping_alerts')
          .insert(demoAlerts)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, alerts }),
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
    console.error('[MemePing Alerts] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
