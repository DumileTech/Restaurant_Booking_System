import { createClient } from '@supabase/supabase-js'
import * as SupabaseAuthHelpers from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './supabase'

// Server-side Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create server client for handling user sessions
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables for server client')
  }
  
  return SupabaseAuthHelpers.createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Get current user from session
export async function getCurrentUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) return null
  
  // Get user profile with role
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}
// User roles
// Get server user by ID
export async function getServerUser(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  return profile
}

export type UserRole = 'customer' | 'restaurant_manager' | 'admin'

// Check if user has required role
export async function hasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  try {
    const user = await getServerUser(userId)
    if (!user) return false
    
    const userRole = (user.role || 'customer') as UserRole
    
    // Admin has access to everything
    if (userRole === 'admin') return true
    
    // Check specific role
    return userRole === requiredRole
  } catch {
    return false
  }
}

// Check if user can access restaurant
export async function canAccessRestaurant(userId: string, restaurantId: string): Promise<boolean> {
  try {
    const user = await getServerUser(userId)
    if (!user) return false
    
    const userRole = (user.role || 'customer') as UserRole
    
    // Admin has access to all restaurants
    if (userRole === 'admin') return true
    
    // Restaurant manager can only access their restaurant
    if (userRole === 'restaurant_manager') {
      const { data: restaurant } = await supabaseAdmin
        .from('restaurants')
        .select('admin_id')
        .eq('id', restaurantId)
        .single()
      
      return restaurant?.admin_id === user.id
    }
    
    return false
  } catch {
    return false
  }
}