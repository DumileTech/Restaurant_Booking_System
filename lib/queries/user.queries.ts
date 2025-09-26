import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

// Get user by ID
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Get user dashboard data
export async function getUserDashboard(userId: string) {
  const { data, error } = await supabase.rpc('get_user_dashboard', {
    user_id_param: userId
  })

  if (error) throw error
  return data
}

// Create or update user profile
export async function upsertUserProfile(user: UserInsert) {
  const { data, error } = await supabase
    .from('users')
    .upsert(user)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update user profile
export async function updateUserProfile(id: string, updates: UserUpdate) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update user points
export async function updateUserPoints(id: string, points: number) {
  const { data, error } = await supabase
    .from('users')
    .update({ points })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Add points to user
export async function addPointsToUser(id: string, pointsToAdd: number) {
  const { data, error } = await supabase.rpc('add_user_points', {
    user_id: id,
    points_to_add: pointsToAdd
  })

  if (error) throw error
  return data
}

// Get user rewards history
export async function getUserRewards(userId: string) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all users (admin only)
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Delete user
export async function deleteUser(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Search users
export async function searchUsers(query: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('name')

  if (error) throw error
  return data
}