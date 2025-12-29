export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      engagement_snapshots: {
        Row: {
          comments: number | null
          id: string
          likes: number | null
          saves: number | null
          shares: number | null
          snapshot_at: string | null
          tracked_post_id: string
          views: number | null
        }
        Insert: {
          comments?: number | null
          id?: string
          likes?: number | null
          saves?: number | null
          shares?: number | null
          snapshot_at?: string | null
          tracked_post_id: string
          views?: number | null
        }
        Update: {
          comments?: number | null
          id?: string
          likes?: number | null
          saves?: number | null
          shares?: number | null
          snapshot_at?: string | null
          tracked_post_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_snapshots_tracked_post_id_fkey"
            columns: ["tracked_post_id"]
            isOneToOne: false
            referencedRelation: "tracked_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          hamming_distance: number | null
          has_credit: boolean | null
          id: string
          is_authorized: boolean | null
          match_type: Database["public"]["Enums"]["match_type"]
          matched_at: string | null
          passport_id: string
          tracked_post_id: string
        }
        Insert: {
          hamming_distance?: number | null
          has_credit?: boolean | null
          id?: string
          is_authorized?: boolean | null
          match_type?: Database["public"]["Enums"]["match_type"]
          matched_at?: string | null
          passport_id: string
          tracked_post_id: string
        }
        Update: {
          hamming_distance?: number | null
          has_credit?: boolean | null
          id?: string
          is_authorized?: boolean | null
          match_type?: Database["public"]["Enums"]["match_type"]
          matched_at?: string | null
          passport_id?: string
          tracked_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_passport_id_fkey"
            columns: ["passport_id"]
            isOneToOne: false
            referencedRelation: "passports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tracked_post_id_fkey"
            columns: ["tracked_post_id"]
            isOneToOne: false
            referencedRelation: "tracked_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      memeping_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          body: string
          channels_sent: string[] | null
          created_at: string | null
          data: Json | null
          id: string
          passport_id: string | null
          read: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          body: string
          channels_sent?: string[] | null
          created_at?: string | null
          data?: Json | null
          id?: string
          passport_id?: string | null
          read?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          body?: string
          channels_sent?: string[] | null
          created_at?: string | null
          data?: Json | null
          id?: string
          passport_id?: string | null
          read?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memeping_alerts_passport_id_fkey"
            columns: ["passport_id"]
            isOneToOne: false
            referencedRelation: "passports"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channels: string[] | null
          created_at: string | null
          id: string
          infringement_alerts: boolean | null
          ranking_alerts: boolean | null
          repost_alerts: boolean | null
          revenue_alerts: boolean | null
          telegram_chat_id: string | null
          updated_at: string | null
          user_id: string | null
          viral_alerts: boolean | null
          viral_threshold: number | null
          webhook_url: string | null
        }
        Insert: {
          channels?: string[] | null
          created_at?: string | null
          id?: string
          infringement_alerts?: boolean | null
          ranking_alerts?: boolean | null
          repost_alerts?: boolean | null
          revenue_alerts?: boolean | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          viral_alerts?: boolean | null
          viral_threshold?: number | null
          webhook_url?: string | null
        }
        Update: {
          channels?: string[] | null
          created_at?: string | null
          id?: string
          infringement_alerts?: boolean | null
          ranking_alerts?: boolean | null
          repost_alerts?: boolean | null
          revenue_alerts?: boolean | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          viral_alerts?: boolean | null
          viral_threshold?: number | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      passports: {
        Row: {
          acp_id: string
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string
          id: string
          metadata: Json | null
          minted_at: string | null
          preview_url: string | null
          prompt: string
          source_ai: Database["public"]["Enums"]["ai_service"]
          status: Database["public"]["Enums"]["asset_status"]
          trust_level: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          acp_id: string
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          minted_at?: string | null
          preview_url?: string | null
          prompt: string
          source_ai: Database["public"]["Enums"]["ai_service"]
          status?: Database["public"]["Enums"]["asset_status"]
          trust_level?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          acp_id?: string
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          minted_at?: string | null
          preview_url?: string | null
          prompt?: string
          source_ai?: Database["public"]["Enums"]["ai_service"]
          status?: Database["public"]["Enums"]["asset_status"]
          trust_level?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pim_calculations: {
        Row: {
          calculated_at: string | null
          epoch: number
          id: string
          normalized_score: number
          passport_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          post_count: number | null
          raw_score: number
        }
        Insert: {
          calculated_at?: string | null
          epoch?: number
          id?: string
          normalized_score?: number
          passport_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          post_count?: number | null
          raw_score?: number
        }
        Update: {
          calculated_at?: string | null
          epoch?: number
          id?: string
          normalized_score?: number
          passport_id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          post_count?: number | null
          raw_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "pim_calculations_passport_id_fkey"
            columns: ["passport_id"]
            isOneToOne: false
            referencedRelation: "passports"
            referencedColumns: ["id"]
          },
        ]
      }
      scanned_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string
          id: string
          preview_url: string | null
          prompt: string
          source_ai: Database["public"]["Enums"]["ai_service"]
          status: Database["public"]["Enums"]["asset_status"]
          user_id: string | null
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          id?: string
          preview_url?: string | null
          prompt: string
          source_ai: Database["public"]["Enums"]["ai_service"]
          status?: Database["public"]["Enums"]["asset_status"]
          user_id?: string | null
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          id?: string
          preview_url?: string | null
          prompt?: string
          source_ai?: Database["public"]["Enums"]["ai_service"]
          status?: Database["public"]["Enums"]["asset_status"]
          user_id?: string | null
        }
        Relationships: []
      }
      tracked_posts: {
        Row: {
          author_handle: string | null
          author_id: string | null
          content: string | null
          created_at: string | null
          id: string
          media_urls: string[] | null
          phash: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_post_id: string
          posted_at: string | null
          tracked_at: string | null
        }
        Insert: {
          author_handle?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          phash?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_post_id: string
          posted_at?: string | null
          tracked_at?: string | null
        }
        Update: {
          author_handle?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          phash?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_post_id?: string
          posted_at?: string | null
          tracked_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_acp_id: { Args: never; Returns: string }
    }
    Enums: {
      ai_service:
        | "midjourney"
        | "dalle"
        | "stable"
        | "runway"
        | "sora"
        | "firefly"
        | "veo"
        | "chatgpt"
      alert_type: "viral" | "repost" | "infringement" | "revenue" | "ranking"
      asset_status: "scanning" | "captured" | "minted"
      asset_type: "image" | "video" | "text"
      match_type: "exact" | "variant" | "derivative"
      social_platform:
        | "farcaster"
        | "twitter"
        | "reddit"
        | "tiktok"
        | "instagram"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_service: [
        "midjourney",
        "dalle",
        "stable",
        "runway",
        "sora",
        "firefly",
        "veo",
        "chatgpt",
      ],
      alert_type: ["viral", "repost", "infringement", "revenue", "ranking"],
      asset_status: ["scanning", "captured", "minted"],
      asset_type: ["image", "video", "text"],
      match_type: ["exact", "variant", "derivative"],
      social_platform: [
        "farcaster",
        "twitter",
        "reddit",
        "tiktok",
        "instagram",
      ],
    },
  },
} as const
