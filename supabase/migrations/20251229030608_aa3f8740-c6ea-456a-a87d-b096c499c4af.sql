-- MemePing Service Database Schema

-- Platform enum for tracking sources
CREATE TYPE public.social_platform AS ENUM ('farcaster', 'twitter', 'reddit', 'tiktok', 'instagram');

-- Match type enum
CREATE TYPE public.match_type AS ENUM ('exact', 'variant', 'derivative');

-- Alert type enum  
CREATE TYPE public.alert_type AS ENUM ('viral', 'repost', 'infringement', 'revenue', 'ranking');

-- Tracked social posts table
CREATE TABLE public.tracked_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform social_platform NOT NULL,
  platform_post_id VARCHAR(255) NOT NULL,
  author_id VARCHAR(255),
  author_handle VARCHAR(255),
  content TEXT,
  media_urls TEXT[],
  phash BYTEA,
  posted_at TIMESTAMP WITH TIME ZONE,
  tracked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(platform, platform_post_id)
);

-- Enable RLS on tracked_posts
ALTER TABLE public.tracked_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for tracked posts (tracking data is public)
CREATE POLICY "Anyone can view tracked posts"
  ON public.tracked_posts
  FOR SELECT
  USING (true);

-- Matches table - links tracked posts to ACP passports
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_post_id UUID REFERENCES public.tracked_posts(id) ON DELETE CASCADE NOT NULL,
  passport_id UUID REFERENCES public.passports(id) ON DELETE CASCADE NOT NULL,
  match_type match_type NOT NULL DEFAULT 'exact',
  hamming_distance SMALLINT DEFAULT 0,
  has_credit BOOLEAN DEFAULT false,
  is_authorized BOOLEAN DEFAULT false,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(tracked_post_id, passport_id)
);

-- Enable RLS on matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Anyone can view matches
CREATE POLICY "Anyone can view matches"
  ON public.matches
  FOR SELECT
  USING (true);

-- Engagement snapshots table (time-series data)
CREATE TABLE public.engagement_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_post_id UUID REFERENCES public.tracked_posts(id) ON DELETE CASCADE NOT NULL,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  saves BIGINT DEFAULT 0,
  snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on engagement_snapshots
ALTER TABLE public.engagement_snapshots ENABLE ROW LEVEL SECURITY;

-- Anyone can view engagement data
CREATE POLICY "Anyone can view engagement snapshots"
  ON public.engagement_snapshots
  FOR SELECT
  USING (true);

-- PIM calculations table
CREATE TABLE public.pim_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id UUID REFERENCES public.passports(id) ON DELETE CASCADE NOT NULL,
  epoch INTEGER NOT NULL DEFAULT 1,
  platform social_platform NOT NULL,
  raw_score NUMERIC NOT NULL DEFAULT 0,
  normalized_score NUMERIC NOT NULL DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(passport_id, epoch, platform)
);

-- Enable RLS on pim_calculations
ALTER TABLE public.pim_calculations ENABLE ROW LEVEL SECURITY;

-- Anyone can view PIM calculations
CREATE POLICY "Anyone can view PIM calculations"
  ON public.pim_calculations
  FOR SELECT
  USING (true);

-- Alerts table
CREATE TABLE public.memeping_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  passport_id UUID REFERENCES public.passports(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  channels_sent TEXT[],
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on alerts
ALTER TABLE public.memeping_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view their own alerts"
  ON public.memeping_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Public can view alerts without user_id (demo mode)
CREATE POLICY "Public can view alerts without user_id"
  ON public.memeping_alerts
  FOR SELECT
  USING (user_id IS NULL);

-- Users can update their own alerts (mark as read)
CREATE POLICY "Users can update their own alerts"
  ON public.memeping_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  viral_alerts BOOLEAN DEFAULT true,
  repost_alerts BOOLEAN DEFAULT true,
  infringement_alerts BOOLEAN DEFAULT true,
  revenue_alerts BOOLEAN DEFAULT true,
  ranking_alerts BOOLEAN DEFAULT true,
  viral_threshold INTEGER DEFAULT 100,
  channels TEXT[] DEFAULT ARRAY['in_app'],
  telegram_chat_id VARCHAR(255),
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_tracked_posts_platform ON public.tracked_posts(platform);
CREATE INDEX idx_tracked_posts_phash ON public.tracked_posts(phash);
CREATE INDEX idx_tracked_posts_tracked_at ON public.tracked_posts(tracked_at DESC);
CREATE INDEX idx_matches_passport_id ON public.matches(passport_id);
CREATE INDEX idx_matches_matched_at ON public.matches(matched_at DESC);
CREATE INDEX idx_engagement_snapshot_at ON public.engagement_snapshots(snapshot_at DESC);
CREATE INDEX idx_pim_passport_epoch ON public.pim_calculations(passport_id, epoch);
CREATE INDEX idx_alerts_user_id ON public.memeping_alerts(user_id);
CREATE INDEX idx_alerts_created_at ON public.memeping_alerts(created_at DESC);

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.memeping_alerts;

-- Trigger for updating notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();