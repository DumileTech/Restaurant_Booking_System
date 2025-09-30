// lib/types.ts

// This import will now work because lib/supabase.ts exists.
import type { Database } from './supabase'

// =================================================================
//  TYPES AUTOMATICALLY DERIVED FROM YOUR SUPABASE DATABASE SCHEMA
// =================================================================

export type User = Database['public']['Tables']['users']['Row']
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Reward = Database['public']['Tables']['rewards']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']

// =================================================================
//  APPLICATION-SPECIFIC TYPES
// =================================================================

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

// ... and so on for your other application types