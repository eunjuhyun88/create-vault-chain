-- Fix PUBLIC_DATA_EXPOSURE: Restrict tracked_posts access to passport owners only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view tracked posts" ON public.tracked_posts;

-- Create policy that allows users to view posts matching their passports
CREATE POLICY "Users can view posts matching their passports"
  ON public.tracked_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN passports p ON p.id = m.passport_id
      WHERE m.tracked_post_id = tracked_posts.id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- Also fix related tables for consistent access control
DROP POLICY IF EXISTS "Anyone can view engagement snapshots" ON public.engagement_snapshots;

CREATE POLICY "Users can view engagement for their tracked posts"
  ON public.engagement_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tracked_posts tp
      JOIN matches m ON m.tracked_post_id = tp.id
      JOIN passports p ON p.id = m.passport_id
      WHERE tp.id = engagement_snapshots.tracked_post_id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Anyone can view matches" ON public.matches;

CREATE POLICY "Users can view their own matches"
  ON public.matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM passports p
      WHERE p.id = matches.passport_id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- PIM calculations can remain somewhat public since it's aggregate/score data
-- but we should still restrict detailed access to passport owners
DROP POLICY IF EXISTS "Anyone can view PIM calculations" ON public.pim_calculations;

CREATE POLICY "Users can view PIM for their passports"
  ON public.pim_calculations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM passports p
      WHERE p.id = pim_calculations.passport_id
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );