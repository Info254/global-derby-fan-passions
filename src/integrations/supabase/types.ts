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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      circle_members: {
        Row: {
          circle_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          circle_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      loyalty_history: {
        Row: {
          created_at: string
          event: string
          id: string
          nation_code: string | null
          nation_name: string | null
          note: string | null
          previous_nation_code: string | null
          role: Database["public"]["Enums"]["stamp_role"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          nation_code?: string | null
          nation_name?: string | null
          note?: string | null
          previous_nation_code?: string | null
          role?: Database["public"]["Enums"]["stamp_role"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          nation_code?: string | null
          nation_name?: string | null
          note?: string | null
          previous_nation_code?: string | null
          role?: Database["public"]["Enums"]["stamp_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      points: {
        Row: {
          circle_id: string | null
          created_at: string
          delta: number
          id: string
          match_id: string | null
          reason: string | null
          source: string
          user_id: string
        }
        Insert: {
          circle_id?: string | null
          created_at?: string
          delta: number
          id?: string
          match_id?: string | null
          reason?: string | null
          source: string
          user_id: string
        }
        Update: {
          circle_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          match_id?: string | null
          reason?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          primary_nation_code: string | null
          primary_nation_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          primary_nation_code?: string | null
          primary_nation_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          primary_nation_code?: string | null
          primary_nation_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reaction_templates: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          label: string
          text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          label: string
          text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          label?: string
          text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          circle_id: string
          created_at: string
          emoji: string | null
          id: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          match_id: string
          match_label: string | null
          minute: number | null
          text: string | null
          user_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          emoji?: string | null
          id?: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          match_id: string
          match_label?: string | null
          minute?: number | null
          text?: string | null
          user_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          emoji?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          match_id?: string
          match_label?: string | null
          minute?: number | null
          text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      solidarity: {
        Row: {
          against_nation_code: string | null
          against_nation_name: string | null
          circle_id: string | null
          created_at: string
          id: string
          match_id: string | null
          note: string | null
          user_id: string
          with_nation_code: string
          with_nation_name: string
        }
        Insert: {
          against_nation_code?: string | null
          against_nation_name?: string | null
          circle_id?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
          note?: string | null
          user_id: string
          with_nation_code: string
          with_nation_name: string
        }
        Update: {
          against_nation_code?: string | null
          against_nation_name?: string | null
          circle_id?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
          note?: string | null
          user_id?: string
          with_nation_code?: string
          with_nation_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "solidarity_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      stamps: {
        Row: {
          created_at: string
          id: string
          nation_code: string
          nation_name: string
          note: string | null
          role: Database["public"]["Enums"]["stamp_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nation_code: string
          nation_name: string
          note?: string | null
          role: Database["public"]["Enums"]["stamp_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nation_code?: string
          nation_name?: string
          note?: string | null
          role?: Database["public"]["Enums"]["stamp_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_global_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          display_name: string
          nation_codes: string[]
          primary_nation_code: string
          primary_nation_name: string
          total: number
          user_id: string
        }[]
      }
      is_circle_member: {
        Args: { _circle: string; _user: string }
        Returns: boolean
      }
      shares_circle_with: {
        Args: { _me: string; _other: string }
        Returns: boolean
      }
    }
    Enums: {
      reaction_kind:
        | "goal"
        | "miss"
        | "var"
        | "red_card"
        | "elimination"
        | "penalty"
        | "assist"
        | "sub"
        | "roast"
        | "hype"
      stamp_role:
        | "primary"
        | "second_home"
        | "underdog"
        | "family_pick"
        | "wildcard"
        | "bandwagon"
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
      reaction_kind: [
        "goal",
        "miss",
        "var",
        "red_card",
        "elimination",
        "penalty",
        "assist",
        "sub",
        "roast",
        "hype",
      ],
      stamp_role: [
        "primary",
        "second_home",
        "underdog",
        "family_pick",
        "wildcard",
        "bandwagon",
      ],
    },
  },
} as const
