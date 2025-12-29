import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();
    console.log(`[MemePing Alerts] Action: ${action}`, data);

    switch (action) {
      case 'create_alert': {
        const { user_id, passport_id, alert_type, title, body, alert_data, channels } = data;

        const { data: alert, error } = await supabase
          .from('memeping_alerts')
          .insert({
            user_id,
            passport_id,
            alert_type,
            title,
            body,
            data: alert_data || {},
            channels_sent: channels || ['in_app'],
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
        const { user_id, alert_type, read, limit = 50, offset = 0 } = data;

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
          .range(offset, offset + limit - 1);

        // For demo mode, get alerts without user_id
        if (user_id) {
          query = query.eq('user_id', user_id);
        } else {
          query = query.is('user_id', null);
        }

        if (alert_type) {
          query = query.eq('alert_type', alert_type);
        }

        if (typeof read === 'boolean') {
          query = query.eq('read', read);
        }

        const { data: alerts, error, count } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, alerts, total: count }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'mark_read': {
        const { alert_id, user_id } = data;

        const { error } = await supabase
          .from('memeping_alerts')
          .update({ read: true })
          .eq('id', alert_id)
          .eq('user_id', user_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'mark_all_read': {
        const { user_id } = data;

        const { error } = await supabase
          .from('memeping_alerts')
          .update({ read: true })
          .eq('user_id', user_id)
          .eq('read', false);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_unread_count': {
        const { user_id } = data;

        let query = supabase
          .from('memeping_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('read', false);

        if (user_id) {
          query = query.eq('user_id', user_id);
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
        const { user_id, preferences } = data;

        const { data: prefs, error } = await supabase
          .from('notification_preferences')
          .upsert({
            user_id,
            ...preferences,
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
        const { user_id } = data;

        const { data: prefs, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user_id)
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
