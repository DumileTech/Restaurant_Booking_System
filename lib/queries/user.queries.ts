import { createClient } from '@/utils/supabase/server'

// Type definitions for user operations
export interface UserInsert {
  id: string
  email: string
  name?: string
  role?: 'customer' | 'restaurant_manager' | 'admin'
  points?: number
}

export interface UserUpdate {
  name?: string
  email?: string
  points?: number
}

// Get user by ID
export async function getUserById(id: string) {
  const supabase = await createClient({ useServiceRole: true })
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Get user by email
export async function getUserByEmail(email: string) {
  const supabase = await createClient({ useServiceRole: true })
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) throw error
  return data
}

// Get user dashboard data
export async function getUserDashboard(userId: string) {
  const supabase = await createClient({ useServiceRole: true })
  const { data, error } = await supabase.rpc('get_user_dashboard', {
    user_id_param: userId
  })

  if (error) throw error
  return data
}

// Create or update user profile
export async function createUserProfile(user: UserInsert) {
  const supabase = await createClient({ useServiceRole: true })
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update user profile
export async function updateUserProfile(id: string, updates: UserUpdate) {
  const supabase = await createClient({ useServiceRole: true })
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
  const supabase = await createClient({ useServiceRole: true })
  const { data, error } = await supabase
    .from('users')
    .update({ points })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get user rewards history
export async function getUserRewards(userId: string) {
  const supabase = await createClient({ useServiceRole: true })
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
  const supabase = await createClient({ useServiceRole: true })
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Delete user
export async function deleteUser(id: string) {
  const supabase = await createClient({ useServiceRole: true })
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Search users
export async function searchUsers(query: string) {
  const supabase = await createClient({ useServiceRole: true })
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('name')

  if (error) throw error
  return data
}