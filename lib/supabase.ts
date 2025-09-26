import { createClient as createBrowserClient } from '../utils/supabase/client'

export const supabase = createBrowserClient()

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'customer' | 'restaurant_manager' | 'admin'
          points: number
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'customer' | 'restaurant_manager' | 'admin'
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'customer' | 'restaurant_manager' | 'admin'
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
          status: 'pending' | 'confirmed' | 'cancelled'
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
          status?: 'pending' | 'confirmed' | 'cancelled'
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
          status?: 'pending' | 'confirmed' | 'cancelled'
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