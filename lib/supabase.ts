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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string | null
          date: string
          id: string
          party_size: number | null
          restaurant_id: string | null
          special_requests: string | null
          status: string | null
          time: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          party_size?: number | null
          restaurant_id?: string | null
          special_requests?: string | null
          status?: string | null
          time: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          party_size?: number | null
          restaurant_id?: string | null
          special_requests?: string | null
          status?: string | null
          time?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          subject: string
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          subject: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: Database["public"]["Enums"]["menu_item_category"]
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          restaurant_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["menu_item_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price: number
          restaurant_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["menu_item_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          admin_id: string | null
          capacity: number | null
          created_at: string | null
          cuisine: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
        }
        Insert: {
          admin_id?: string | null
          capacity?: number | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
        }
        Update: {
          admin_id?: string | null
          capacity?: number | null
          created_at?: string | null
          cuisine?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          points_change: number
          reason: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          points_change: number
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          points_change?: number
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_engagement_metrics: {
        Row: {
          cancelled_bookings: number | null
          confirmed_bookings: number | null
          engagement_score: number | null
          last_booking_date: string | null
          total_bookings: number | null
          total_points_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_bookings?: number | null
          confirmed_bookings?: number | null
          engagement_score?: number | null
          last_booking_date?: string | null
          total_bookings?: number | null
          total_points_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_bookings?: number | null
          confirmed_bookings?: number | null
          engagement_score?: number | null
          last_booking_date?: string | null
          total_bookings?: number | null
          total_points_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_engagement_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          points: number | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          points?: number | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          points?: number | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_booking_with_validation: {
        Args: {
          date_param: string
          party_size_param: number
          restaurant_id_param: string
          special_requests_param?: string
          time_param: string
          user_id_param: string
        }
        Returns: Json
      }
      generate_weekly_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_restaurant_analytics: {
        Args: {
          end_date?: string
          restaurant_id_param: string
          start_date?: string
        }
        Returns: Json
      }
      get_restaurant_availability: {
        Args: {
          date_param: string
          party_size_param?: number
          restaurant_id_param: string
        }
        Returns: {
          available_times: string[]
          current_bookings: number
          total_capacity: number
        }[]
      }
      get_scheduled_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          command: string
          database: string
          jobid: number
          jobname: string
          nodename: string
          nodeport: number
          schedule: string
          username: string
        }[]
      }
      get_user_dashboard: {
        Args: { user_id_param: string }
        Returns: Json
      }
      manage_cron_job: {
        Args: {
          action: string
          job_command?: string
          job_name?: string
          job_schedule?: string
        }
        Returns: string
      }
      optimize_database_performance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_email_queue: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_booking_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_monthly_rewards_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_engagement_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      menu_item_category:
        | "Appetizer"
        | "Main Course"
        | "Dessert"
        | "Side"
        | "Drink"
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
      menu_item_category: [
        "Appetizer",
        "Main Course",
        "Dessert",
        "Side",
        "Drink",
      ],
    },
  },
} as const
