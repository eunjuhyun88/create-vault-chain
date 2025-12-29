import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform weights for PIM calculation (basis points, sum = 10000)
const PLATFORM_WEIGHTS: Record<string, number> = {
  farcaster: 3500,
  twitter: 3000,
  reddit: 2000,
  tiktok: 1000,
  instagram: 500,
};

// Engagement weights
const ENGAGEMENT_WEIGHTS = {
  views: 0.1,
  likes: 0.3,
  shares: 0.4,
  comments: 0.2,
};

// Viral thresholds
const VIRAL_THRESHOLDS = {
  likes_per_hour: 100,
  shares_per_hour: 50,
  views_per_hour: 1000,
};

interface TrackingPayload {
  platform: string;
  platform_post_id: string;
  author_id?: string;
  author_handle?: string;
  content?: string;
  media_urls?: string[];
  phash?: string;
  posted_at?: string;
  engagement?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    saves?: number;
  };
  passport_id?: string;
  match_type?: string;
  has_credit?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();
    console.log(`[MemePing Track] Action: ${action}`, data);

    switch (action) {
      case 'track_post': {
        const payload = data as TrackingPayload;
        
        // Insert or update tracked post
        const { data: trackedPost, error: postError } = await supabase
          .from('tracked_posts')
          .upsert({
            platform: payload.platform,
            platform_post_id: payload.platform_post_id,
            author_id: payload.author_id,
            author_handle: payload.author_handle,
            content: payload.content,
            media_urls: payload.media_urls,
            phash: payload.phash ? hexToBytes(payload.phash) : null,
            posted_at: payload.posted_at,
          }, {
            onConflict: 'platform,platform_post_id',
          })
          .select()
          .single();

        if (postError) {
          console.error('[MemePing Track] Error inserting post:', postError);
          throw postError;
        }

        // Insert engagement snapshot if provided
        if (payload.engagement) {
          const { error: engageError } = await supabase
            .from('engagement_snapshots')
            .insert({
              tracked_post_id: trackedPost.id,
              views: payload.engagement.views || 0,
              likes: payload.engagement.likes || 0,
              shares: payload.engagement.shares || 0,
              comments: payload.engagement.comments || 0,
              saves: payload.engagement.saves || 0,
            });

          if (engageError) {
            console.error('[MemePing Track] Error inserting engagement:', engageError);
          }
        }

        // Create match if passport_id is provided
        if (payload.passport_id) {
          const { error: matchError } = await supabase
            .from('matches')
            .upsert({
              tracked_post_id: trackedPost.id,
              passport_id: payload.passport_id,
              match_type: payload.match_type || 'exact',
              has_credit: payload.has_credit || false,
            }, {
              onConflict: 'tracked_post_id,passport_id',
            });

          if (matchError) {
            console.error('[MemePing Track] Error creating match:', matchError);
          }

          // Check for viral activity and create alert
          await checkViralActivity(supabase, trackedPost.id, payload.passport_id, payload.engagement);
        }

        return new Response(
          JSON.stringify({ success: true, tracked_post: trackedPost }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_engagement': {
        const { tracked_post_id, engagement } = data;

        const { error } = await supabase
          .from('engagement_snapshots')
          .insert({
            tracked_post_id,
            views: engagement.views || 0,
            likes: engagement.likes || 0,
            shares: engagement.shares || 0,
            comments: engagement.comments || 0,
            saves: engagement.saves || 0,
          });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_tracking_stats': {
        const { passport_id } = data;

        // Get all matches for passport
        const { data: matches, error: matchError } = await supabase
          .from('matches')
          .select(`
            *,
            tracked_posts (
              *,
              engagement_snapshots (*)
            )
          `)
          .eq('passport_id', passport_id);

        if (matchError) throw matchError;

        // Aggregate stats by platform
        const platformStats: Record<string, any> = {};
        let totalEngagement = { views: 0, likes: 0, shares: 0, comments: 0 };

        for (const match of matches || []) {
          const post = match.tracked_posts;
          const platform = post.platform;

          if (!platformStats[platform]) {
            platformStats[platform] = { posts: 0, engagement: { views: 0, likes: 0, shares: 0, comments: 0 } };
          }

          platformStats[platform].posts++;

          // Get latest engagement snapshot
          const latestSnapshot = post.engagement_snapshots?.sort(
            (a: any, b: any) => new Date(b.snapshot_at).getTime() - new Date(a.snapshot_at).getTime()
          )[0];

          if (latestSnapshot) {
            platformStats[platform].engagement.views += latestSnapshot.views;
            platformStats[platform].engagement.likes += latestSnapshot.likes;
            platformStats[platform].engagement.shares += latestSnapshot.shares;
            platformStats[platform].engagement.comments += latestSnapshot.comments;

            totalEngagement.views += latestSnapshot.views;
            totalEngagement.likes += latestSnapshot.likes;
            totalEngagement.shares += latestSnapshot.shares;
            totalEngagement.comments += latestSnapshot.comments;
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            stats: {
              totalPosts: matches?.length || 0,
              totalEngagement,
              byPlatform: platformStats,
            },
          }),
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
    console.error('[MemePing Track] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to convert hex string to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Check for viral activity and create alert
async function checkViralActivity(
  supabase: any,
  trackedPostId: string,
  passportId: string,
  engagement?: { views?: number; likes?: number; shares?: number; comments?: number }
) {
  if (!engagement) return;

  const isViral = 
    (engagement.likes || 0) >= VIRAL_THRESHOLDS.likes_per_hour ||
    (engagement.shares || 0) >= VIRAL_THRESHOLDS.shares_per_hour ||
    (engagement.views || 0) >= VIRAL_THRESHOLDS.views_per_hour;

  if (isViral) {
    // Get passport info
    const { data: passport } = await supabase
      .from('passports')
      .select('user_id, acp_id, prompt')
      .eq('id', passportId)
      .single();

    if (passport) {
      // Create viral alert
      await supabase
        .from('memeping_alerts')
        .insert({
          user_id: passport.user_id,
          passport_id: passportId,
          alert_type: 'viral',
          title: '🔥 Your artwork is going viral!',
          body: `Your creation "${passport.prompt?.substring(0, 50)}..." is trending with ${engagement.likes} likes!`,
          data: {
            tracked_post_id: trackedPostId,
            engagement,
            acp_id: passport.acp_id,
          },
          channels_sent: ['in_app'],
        });

      console.log(`[MemePing] Viral alert created for passport ${passportId}`);
    }
  }
}
