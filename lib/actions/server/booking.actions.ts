'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { validateBooking } from '@/lib/utils/validation'
import { revalidatePath } from 'next/cache'
import { getUserById } from '@/lib/queries/user.queries'
import { getRestaurantById } from '@/lib/queries/restaurant.queries'
import { createBookingWithValidation, updateBooking as updateBookingQuery, getBookingById } from '@/lib/queries/booking.queries'

interface StandardResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// Get current user from session
async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient({ cookieStore })
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null
    
    // Get user profile with role
    const profile = await getUserById(user.id)
    return profile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function createBooking(formData: FormData): Promise<StandardResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      }
    }

    const restaurant_id = formData.get('restaurant_id') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const party_size = parseInt(formData.get('party_size') as string) || 0
    const special_requests = formData.get('special_requests') as string

    // Validate input
    const bookingData = {
      restaurant_id,
      date,
      time,
      party_size,
      special_requests
    }
    
    const validation = validateBooking(bookingData)
    if (!validation.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validation.errors?.[0]?.message || 'Invalid booking data'
      }
    }

    // Verify restaurant exists
    try {
      const restaurant = await getRestaurantById(restaurant_id)
      if (!restaurant) {
        return {
          success: false,
          message: 'Restaurant not found',
          error: 'Invalid restaurant ID'
        }
      }
    } catch (error) {
      console.error('Restaurant verification error:', error)
      return {
        success: false,
        message: 'Restaurant verification failed',
        error: 'Could not verify restaurant'
      }
    }

    // Create booking with validation
    const result = await createBookingWithValidation({
      user_id: user.id,
      restaurant_id,
      date,
      time,
      party_size,
      special_requests: special_requests?.trim() || undefined
    })

    if (!result.success) {
      return {
        success: false,
        message: 'Booking creation failed',
        error: result.error,
        data: { available_times: result.available_times }
      }
    }

    revalidatePath('/account')
    
    return {
      success: true,
      message: 'Booking created successfully',
      data: { booking_id: result.booking_id }
    }

  } catch (error) {
    console.error('Create booking error:', error)
    return {
      success: false,
      message: 'Failed to create booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled'): Promise<StandardResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      }
    }

    // Get booking to check permissions
    const booking = await getBookingById(bookingId)
    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
        error: 'Invalid booking ID'
      }
    }

    // Check permissions
    const isOwner = booking.user_id === user.id
    const isAdmin = user.role === 'admin'
    
    let canManageRestaurant = false
    if (booking.restaurant_id) {
      try {
        const restaurant = await getRestaurantById(booking.restaurant_id)
        canManageRestaurant = restaurant?.admin_id === user.id
      } catch (error) {
        console.error('Restaurant permission check error:', error)
      }
    }

    if (!isAdmin && !isOwner && !canManageRestaurant) {
      return {
        success: false,
        message: 'Permission denied',
        error: 'Insufficient permissions to modify this booking'
      }
    }

    const updated = await updateBookingQuery(bookingId, { status })

    revalidatePath('/account')
    revalidatePath('/admin')

    return {
      success: true,
      message: `Booking ${status} successfully`,
      data: updated
    }

  } catch (error) {
    console.error('Update booking status error:', error)
    return {
      success: false,
      message: 'Failed to update booking status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function cancelBooking(bookingId: string): Promise<StandardResponse> {
  return updateBookingStatus(bookingId, 'cancelled')
}

export async function confirmBooking(bookingId: string): Promise<StandardResponse> {
  return updateBookingStatus(bookingId, 'confirmed')
}

export async function updateBooking(bookingId: string, updates: {
  date?: string
  time?: string
  party_size?: number
  special_requests?: string
}): Promise<StandardResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      }
    }

    // Get booking to check permissions
    const booking = await getBookingById(bookingId)
    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
        error: 'Invalid booking ID'
      }
    }

    // Check permissions
    const isOwner = booking.user_id === user.id
    const isAdmin = user.role === 'admin'

    if (!isAdmin && !isOwner) {
      return {
        success: false,
        message: 'Permission denied',
        error: 'Insufficient permissions to modify this booking'
      }
    }

    const updated = await updateBookingQuery(bookingId, updates)

    revalidatePath('/account')

    return {
      success: true,
      message: 'Booking updated successfully',
      data: updated
    }

  } catch (error) {
    console.error('Update booking error:', error)
    return {
      success: false,
      message: 'Failed to update booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}