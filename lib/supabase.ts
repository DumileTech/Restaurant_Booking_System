import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
  throw new Error('Missing Supabase environment variables')
}

// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key exists:', !!supabaseAnonKey)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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