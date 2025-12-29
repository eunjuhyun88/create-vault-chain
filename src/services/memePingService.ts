import { supabase } from '@/integrations/supabase/client';

// Types
export interface TrackedPost {
  id: string;
  platform: 'farcaster' | 'twitter' | 'reddit' | 'tiktok' | 'instagram';
  platform_post_id: string;
  author_id?: string;
  author_handle?: string;
  content?: string;
  media_urls?: string[];
  posted_at?: string;
  tracked_at: string;
}

export interface Engagement {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  saves?: number;
}

export interface Match {
  id: string;
  tracked_post_id: string;
  passport_id: string;
  match_type: 'exact' | 'variant' | 'derivative';
  hamming_distance: number;
  has_credit: boolean;
  is_authorized: boolean;
  matched_at: string;
}

export interface PIMCalculation {
  id: string;
  passport_id: string;
  epoch: number;
  platform: string;
  raw_score: number;
  normalized_score: number;
  post_count: number;
  calculated_at: string;
}

export interface MemePingAlert {
  id: string;
  user_id?: string;
  passport_id?: string;
  alert_type: 'viral' | 'repost' | 'infringement' | 'revenue' | 'ranking';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels_sent?: string[];
  read: boolean;
  created_at: string;
  passports?: {
    acp_id: string;
    prompt: string;
    preview_url?: string;
  };
}

export interface TrackingStats {
  totalPosts: number;
  totalEngagement: Engagement;
  byPlatform: Record<string, {
    posts: number;
    engagement: Engagement;
  }>;
}

export interface PIMData {
  passport_id: string;
  current_pim: number;
  latest_epoch?: number;
  history?: PIMCalculation[];
}

export interface LeaderboardEntry {
  rank: number;
  passport_id: string;
  total_pim: number;
  passport: {
    acp_id: string;
    prompt: string;
    preview_url?: string;
  };
}

export interface NotificationPreferences {
  viral_alerts: boolean;
  repost_alerts: boolean;
  infringement_alerts: boolean;
  revenue_alerts: boolean;
  ranking_alerts: boolean;
  viral_threshold: number;
  channels: string[];
  telegram_chat_id?: string;
  webhook_url?: string;
}

// Tracking Service
export const memePingTrackingService = {
  async trackPost(payload: {
    platform: string;
    platform_post_id: string;
    author_id?: string;
    author_handle?: string;
    content?: string;
    media_urls?: string[];
    phash?: string;
    posted_at?: string;
    engagement?: Engagement;
    passport_id?: string;
    match_type?: string;
    has_credit?: boolean;
  }) {
    const { data, error } = await supabase.functions.invoke('memeping-track', {
      body: { action: 'track_post', data: payload },
    });
    
    if (error) throw error;
    return data;
  },

  async updateEngagement(trackedPostId: string, engagement: Engagement) {
    const { data, error } = await supabase.functions.invoke('memeping-track', {
      body: { 
        action: 'update_engagement', 
        data: { tracked_post_id: trackedPostId, engagement },
      },
    });
    
    if (error) throw error;
    return data;
  },

  async getTrackingStats(passportId: string): Promise<TrackingStats> {
    const { data, error } = await supabase.functions.invoke('memeping-track', {
      body: { action: 'get_tracking_stats', data: { passport_id: passportId } },
    });
    
    if (error) throw error;
    return data.stats;
  },
};

// PIM Service
export const memePingPIMService = {
  async calculatePIM(passportId: string, epoch?: number) {
    const { data, error } = await supabase.functions.invoke('memeping-pim', {
      body: { 
        action: 'calculate_pim', 
        data: { passport_id: passportId, epoch },
      },
    });
    
    if (error) throw error;
    return data.pim;
  },

  async getPIM(passportId: string, epoch?: number): Promise<PIMData> {
    const { data, error } = await supabase.functions.invoke('memeping-pim', {
      body: { 
        action: 'get_pim', 
        data: { passport_id: passportId, epoch },
      },
    });
    
    if (error) throw error;
    return data.pim;
  },

  async getLeaderboard(epoch?: number, limit = 100, offset = 0): Promise<{
    leaderboard: LeaderboardEntry[];
    total: number;
  }> {
    const { data, error } = await supabase.functions.invoke('memeping-pim', {
      body: { 
        action: 'get_leaderboard', 
        data: { epoch, limit, offset },
      },
    });
    
    if (error) throw error;
    return data;
  },
};

// Alerts Service
export const memePingAlertsService = {
  async createAlert(alert: {
    user_id?: string;
    passport_id?: string;
    alert_type: string;
    title: string;
    body: string;
    alert_data?: Record<string, unknown>;
    channels?: string[];
  }) {
    const { data, error } = await supabase.functions.invoke('memeping-alerts', {
      body: { action: 'create_alert', data: alert },
    });
    
    if (error) throw error;
    return data.alert;
  },

  async getAlerts(params?: {
    user_id?: string;
    alert_type?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<MemePingAlert[]> {
    const { data, error } = await supabase.functions.invoke('memeping-alerts', {
      body: { action: 'get_alerts', data: params || {} },
    });
    
    if (error) throw error;
    return data.alerts;
  },

  async markRead(alertId: string, userId?: string) {
    const { data, error } = await supabase.functions.invoke('memeping-alerts', {
      body: { action: 'mark_read', data: { alert_id: alertId, user_id: userId } },
    });
    
    if (error) throw error;
    return data;
  },

  async markAllRead(userId?: string) {
    const { data, error } = await supabase.functions.invoke('memeping-alerts', {
      body: { action: 'mark_all_read', data: { user_id: userId } },
    });
    
    if (error) throw error;
    return data;
  },

  async getUnreadCount(userId?: string): Promise<number> {
    const { data, error } = await supabase.functions.invoke('memeping-alerts', {
      body: { action: 'get_unread_count', data: { user_id: userId } },
    });
    
    if (error) throw error;
    return data.unread_count;
  },

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    const { data, error } = await supabase.functions.invoke('memeping-alerts', {
      body: { action: 'update_preferences', data: { user_id: userId, preferences } },
    });
    
    if (error) throw error;
    return data.preferences;
  },

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase.functions.invoke('memeping-alerts', {
      body: { action: 'get_preferences', data: { user_id: userId } },
    });
    
    if (error) throw error;
    return data.preferences;
  },

  async createDemoAlerts() {
    const { data, error } = await supabase.functions.invoke('memeping-alerts', {
      body: { action: 'create_demo_alerts', data: {} },
    });
    
    if (error) throw error;
    return data.alerts;
  },
};
