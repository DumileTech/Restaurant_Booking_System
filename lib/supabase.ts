import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'

// For client-side usage
export const supabase = createBrowserClient()

// For server-side usage
export const getServerSupabase = createServerClient

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          points: number
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          points?: number
          created_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          location: string | null
          cuisine: string | null
          capacity: number | null
          description: string | null
          image_url: string | null
          admin_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          cuisine?: string | null
          capacity?: number | null
          description?: string | null
          image_url?: string | null
          admin_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          cuisine?: string | null
          capacity?: number | null
          description?: string | null
          image_url?: string | null
          admin_id?: string | null
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string | null
          restaurant_id: string | null
          date: string
          time: string
          party_size: number | null
          status: string
          special_requests: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          restaurant_id?: string | null
          date: string
          time: string
          party_size?: number | null
          status?: string
          special_requests?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          restaurant_id?: string | null
          date?: string
          time?: string
          party_size?: number | null
          status?: string
          special_requests?: string | null
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          user_id: string | null
          booking_id: string | null
          points_change: number
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          booking_id?: string | null
          points_change: number
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          booking_id?: string | null
          points_change?: number
          reason?: string | null
          created_at?: string
        }
      }
    }
  }
}