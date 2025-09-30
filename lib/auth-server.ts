import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

// Get current user from session
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const supabase = await createClient({ cookieStore })
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
  
    if (error || !user) return null
  
    // Get user profile with role
    const supabaseAdmin = await createClient({ useServiceRole: true })
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
  
    return profile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
// User roles
// Get server user by ID
export async function getServerUser(userId: string) {
  const supabaseAdmin = await createClient({ useServiceRole: true })
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
      const supabaseAdmin = await createClient({ useServiceRole: true })
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