import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform weights for PIM calculation (basis points, sum = 10000)
const PLATFORM_WEIGHTS: Record<string, number> = {
  farcaster: 0.35,
  twitter: 0.30,
  reddit: 0.20,
  tiktok: 0.10,
  instagram: 0.05,
};

// Engagement weights
const ENGAGEMENT_WEIGHTS = {
  views: 0.10,
  likes: 0.30,
  shares: 0.40,
  comments: 0.20,
};

interface PIMCalculation {
  passport_id: string;
  epoch: number;
  platform: string;
  raw_score: number;
  normalized_score: number;
  post_count: number;
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
    console.log(`[MemePing PIM] Action: ${action}`, data);

    switch (action) {
      case 'calculate_pim': {
        const { passport_id, epoch = 1 } = data;

        // Get all matches and their engagement for this passport
        const { data: matches, error: matchError } = await supabase
          .from('matches')
          .select(`
            *,
            tracked_posts!inner (
              platform,
              engagement_snapshots (
                views,
                likes,
                shares,
                comments,
                snapshot_at
              )
            )
          `)
          .eq('passport_id', passport_id);

        if (matchError) throw matchError;

        // Calculate raw scores per platform
        const platformScores: Record<string, { rawScore: number; postCount: number }> = {};

        for (const match of matches || []) {
          const platform = match.tracked_posts.platform;
          
          if (!platformScores[platform]) {
            platformScores[platform] = { rawScore: 0, postCount: 0 };
          }

          platformScores[platform].postCount++;

          // Get latest engagement snapshot
          const snapshots = match.tracked_posts.engagement_snapshots || [];
          const latestSnapshot = snapshots.sort(
            (a: any, b: any) => new Date(b.snapshot_at).getTime() - new Date(a.snapshot_at).getTime()
          )[0];

          if (latestSnapshot) {
            const rawEngagement = 
              ENGAGEMENT_WEIGHTS.views * (latestSnapshot.views || 0) +
              ENGAGEMENT_WEIGHTS.likes * (latestSnapshot.likes || 0) +
              ENGAGEMENT_WEIGHTS.shares * (latestSnapshot.shares || 0) +
              ENGAGEMENT_WEIGHTS.comments * (latestSnapshot.comments || 0);

            platformScores[platform].rawScore += rawEngagement;
          }
        }

        // Find max score for normalization
        const maxRawScore = Math.max(
          ...Object.values(platformScores).map(p => p.rawScore),
          1 // Prevent division by zero
        );

        // Calculate normalized scores and save to DB
        const calculations: PIMCalculation[] = [];
        let totalPIM = 0;

        for (const [platform, scores] of Object.entries(platformScores)) {
          const normalizedScore = Math.log10(1 + scores.rawScore) / Math.log10(1 + maxRawScore);
          const weightedScore = normalizedScore * (PLATFORM_WEIGHTS[platform] || 0);
          totalPIM += weightedScore;

          calculations.push({
            passport_id,
            epoch,
            platform,
            raw_score: scores.rawScore,
            normalized_score: normalizedScore,
            post_count: scores.postCount,
          });
        }

        // Upsert PIM calculations
        for (const calc of calculations) {
          const { error } = await supabase
            .from('pim_calculations')
            .upsert(calc, {
              onConflict: 'passport_id,epoch,platform',
            });

          if (error) {
            console.error('[MemePing PIM] Error saving calculation:', error);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            pim: {
              passport_id,
              epoch,
              total_pim: Math.min(1, totalPIM), // Clamp to 0-1
              by_platform: calculations,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_pim': {
        const { passport_id, epoch } = data;

        let query = supabase
          .from('pim_calculations')
          .select('*')
          .eq('passport_id', passport_id);

        if (epoch) {
          query = query.eq('epoch', epoch);
        }

        const { data: calculations, error } = await query.order('epoch', { ascending: false });

        if (error) throw error;

        // Calculate total PIM from latest epoch
        const latestEpoch = calculations?.[0]?.epoch;
        const latestCalcs = calculations?.filter(c => c.epoch === latestEpoch) || [];
        
        let currentPIM = 0;
        for (const calc of latestCalcs) {
          currentPIM += calc.normalized_score * (PLATFORM_WEIGHTS[calc.platform] || 0);
        }

        return new Response(
          JSON.stringify({
            success: true,
            pim: {
              passport_id,
              current_pim: Math.min(1, currentPIM),
              latest_epoch: latestEpoch,
              history: calculations,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_leaderboard': {
        const { epoch, limit = 100, offset = 0 } = data;

        // Get latest PIM calculations grouped by passport
        const { data: calculations, error } = await supabase
          .from('pim_calculations')
          .select(`
            passport_id,
            normalized_score,
            platform,
            passports!inner (
              acp_id,
              prompt,
              preview_url,
              user_id
            )
          `)
          .eq('epoch', epoch || 1)
          .order('normalized_score', { ascending: false });

        if (error) throw error;

        // Aggregate by passport
        const passportScores: Record<string, { 
          passport_id: string;
          total_pim: number;
          passport: any;
        }> = {};

        for (const calc of calculations || []) {
          if (!passportScores[calc.passport_id]) {
            passportScores[calc.passport_id] = {
              passport_id: calc.passport_id,
              total_pim: 0,
              passport: calc.passports,
            };
          }
          passportScores[calc.passport_id].total_pim += 
            calc.normalized_score * (PLATFORM_WEIGHTS[calc.platform] || 0);
        }

        // Sort and paginate
        const leaderboard = Object.values(passportScores)
          .sort((a, b) => b.total_pim - a.total_pim)
          .slice(offset, offset + limit)
          .map((entry, index) => ({
            rank: offset + index + 1,
            ...entry,
            total_pim: Math.min(1, entry.total_pim),
          }));

        return new Response(
          JSON.stringify({
            success: true,
            leaderboard,
            total: Object.keys(passportScores).length,
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
    console.error('[MemePing PIM] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
