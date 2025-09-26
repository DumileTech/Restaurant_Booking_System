import { createClient } from '@/utils/supabase/server'

// Get all restaurants with optional filters
export async function getAllRestaurants(filters?: {
  cuisine?: string
  location?: string
  search?: string
}) {
  const supabase = await createClient()
  let query = supabase.from('restaurants').select('*')

  if (filters?.cuisine) {
    query = query.eq('cuisine', filters.cuisine)
  }

  if (filters?.location) {
    query = query.eq('location', filters.location)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('name')
  
  if (error) throw error
  return data
}

// Get restaurant by ID
export async function getRestaurantById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create new restaurant
export async function createRestaurant(restaurant: RestaurantInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurant)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update restaurant
export async function updateRestaurant(id: string, updates: RestaurantUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete restaurant
export async function deleteRestaurant(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get restaurant availability
export async function getRestaurantAvailability(
  restaurantId: string,
  date: string,
  partySize: number = 2
) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_restaurant_availability', {
    restaurant_id_param: restaurantId,
    date_param: date,
    party_size_param: partySize
  })

  if (error) throw error
  return data?.[0] || { available_times: [], total_capacity: 0, current_bookings: 0 }
}

// Get restaurant analytics
export async function getRestaurantAnalytics(
  restaurantId: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_restaurant_analytics', {
    restaurant_id_param: restaurantId,
    start_date: startDate,
    end_date: endDate
  })

  if (error) throw error
  return data
}

// Get restaurants by admin
export async function getRestaurantsByAdmin(adminId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('admin_id', adminId)
    .order('name')

  if (error) throw error
  return data
}