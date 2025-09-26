'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { handleApiError } from '@/lib/utils/errors'

export async function getRestaurants(filters?: {
  cuisine?: string
  location?: string
  search?: string
}) {
  try {
    const supabase = await createClient({ useServiceRole: true })
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

    const { data: restaurants, error } = await query.order('name')

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: restaurants
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function getRestaurant(id: string) {
  try {
    const supabase = await createClient({ useServiceRole: true })
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: restaurant
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function getRestaurantAvailability(
  id: string,
  date: string,
  partySize: number = 2
) {
  try {
    if (!id || !date) {
      throw new Error('Restaurant ID and date are required')
    }

    if (partySize < 1 || partySize > 20) {
      throw new Error('Party size must be between 1 and 20')
    }

    const supabase = await createClient({ useServiceRole: true })
    const { data: availability, error } = await supabase
      .rpc('get_restaurant_availability', {
        restaurant_id_param: id,
        date_param: date,
        party_size_param: partySize
      })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: availability?.[0] || {
        available_times: [],
        total_capacity: 0,
        current_bookings: 0
      }
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}