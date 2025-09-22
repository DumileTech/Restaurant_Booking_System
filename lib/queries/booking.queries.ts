import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Booking = Database['public']['Tables']['bookings']['Row']
type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingUpdate = Database['public']['Tables']['bookings']['Update']

// Get all bookings for a user
export async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      restaurants (
        name,
        location,
        cuisine,
        image_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all bookings for a restaurant
export async function getRestaurantBookings(restaurantId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      users (
        email,
        name
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get booking by ID
export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      restaurants (
        name,
        location,
        cuisine
      ),
      users (
        email,
        name
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create booking with validation
export async function createBookingWithValidation(booking: {
  user_id: string
  restaurant_id: string
  date: string
  time: string
  party_size: number
  special_requests?: string
}) {
  const { data, error } = await supabase.rpc('create_booking_with_validation', {
    user_id_param: booking.user_id,
    restaurant_id_param: booking.restaurant_id,
    date_param: booking.date,
    time_param: booking.time,
    party_size_param: booking.party_size,
    special_requests_param: booking.special_requests || null
  })

  if (error) throw error
  return data
}

// Create simple booking
export async function createBooking(booking: BookingInsert) {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update booking
export async function updateBooking(id: string, updates: BookingUpdate) {
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update booking status
export async function updateBookingStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled') {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete booking
export async function deleteBooking(id: string) {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get upcoming bookings
export async function getUpcomingBookings(userId?: string, restaurantId?: string) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      restaurants (
        name,
        location
      ),
      users (
        email,
        name
      )
    `)
    .gte('date', new Date().toISOString().split('T')[0])
    .in('status', ['pending', 'confirmed'])

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  const { data, error } = await query.order('date').order('time')

  if (error) throw error
  return data
}

// Get bookings by date range
export async function getBookingsByDateRange(
  startDate: string,
  endDate: string,
  restaurantId?: string
) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      restaurants (
        name,
        location
      ),
      users (
        email,
        name
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate)

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  const { data, error } = await query.order('date').order('time')

  if (error) throw error
  return data
}