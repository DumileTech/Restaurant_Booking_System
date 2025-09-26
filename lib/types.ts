// Centralized type definitions
import type { Database } from './supabase'

// Extract types from Database schema
export type User = Database['public']['Tables']['users']['Row']
export type Restaurant = Database['public']['Tables']['restaurants']['Row'] 
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Reward = Database['public']['Tables']['rewards']['Row']

// Legacy types for backward compatibility
export interface User {
  id: string
  email: string
  name: string | null
  points: number
  role: 'customer' | 'restaurant_manager' | 'admin'
  created_at: string
}

export interface Restaurant {
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

export interface Booking {
  id: string
  user_id: string | null
  restaurant_id: string | null
  date: string
  time: string
  party_size: number | null
  status: 'pending' | 'confirmed' | 'cancelled'
  special_requests: string | null
  created_at: string
  restaurants?: Restaurant
  users?: User
}

export interface Reward {
  id: string
  user_id: string | null
  booking_id: string | null
  points_change: number
  reason: string | null
  created_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface BookingFormData {
  date: string
  time: string
  party_size: string
  special_requests: string
}

export interface FilterState {
  search: string
  cuisine: string
  location: string
  availability: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}