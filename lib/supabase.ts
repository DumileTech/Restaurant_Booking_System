import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = []
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}`)
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch {
  throw new Error('Invalid Supabase URL format')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'tablerewards-web'
    }
  }
})

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