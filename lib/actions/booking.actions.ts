'use server'

import { supabaseAdmin, getCurrentUser } from '@/lib/auth-server'
import { validateBooking } from '@/lib/utils/validation'
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/utils/errors'
import { sendBookingConfirmationEmail } from '@/lib/email-triggers'
import { revalidatePath } from 'next/cache'

export async function createBooking(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
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
        error: validation.errors?.[0]?.message || 'Invalid booking data',
        errors: validation.errors
      }
    }

    // Verify restaurant exists
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('id, name, capacity')
      .eq('id', restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      throw new ValidationError('Restaurant not found')
    }

    // Use the validation function
    const { data: result, error } = await supabaseAdmin
      .rpc('create_booking_with_validation', {
        user_id_param: user.id,
        restaurant_id_param: restaurant_id,
        date_param: date,
        time_param: time,
        party_size_param: party_size,
        special_requests_param: special_requests?.trim() || null
      })

    if (error) {
      throw new Error(error.message)
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        available_times: result.available_times
      }
    }

    // Send confirmation email if booking was auto-confirmed
    if (result.booking_id) {
      const { data: createdBooking } = await supabaseAdmin
        .from('bookings')
        .select('status')
        .eq('id', result.booking_id)
        .single()

      if (createdBooking?.status === 'confirmed') {
        sendBookingConfirmationEmail(result.booking_id).catch(error => {
          console.error('Failed to send booking confirmation email:', error)
        })
      }
    }

    revalidatePath('/account')
    
    return {
      success: true,
      message: 'Booking created successfully',
      data: { booking_id: result.booking_id }
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    // Get booking to check permissions
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('user_id, restaurant_id')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      throw new ValidationError('Booking not found')
    }

    // Check permissions
    const isOwner = booking.user_id === user.id
    const isAdmin = user.role === 'admin'
    const canManageRestaurant = await supabaseAdmin
      .from('restaurants')
      .select('admin_id')
      .eq('id', booking.restaurant_id)
      .eq('admin_id', user.id)
      .single()
      .then(({ data }) => !!data)

    if (!isAdmin && !isOwner && !canManageRestaurant) {
      throw new ValidationError('Forbidden')
    }

    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/account')
    revalidatePath('/admin')

    return {
      success: true,
      message: `Booking ${status} successfully`,
      data: updated
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function cancelBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'cancelled')
}

export async function confirmBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'confirmed')
}

export async function updateBooking(bookingId: string, updates: {
  date?: string
  time?: string
  party_size?: number
  special_requests?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    // Get booking to check permissions
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('user_id, restaurant_id')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      throw new ValidationError('Booking not found')
    }

    // Check permissions
    const isOwner = booking.user_id === user.id
    const isAdmin = user.role === 'admin'

    if (!isAdmin && !isOwner) {
      throw new ValidationError('Forbidden')
    }

    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/account')

    return {
      success: true,
      message: 'Booking updated successfully',
      data: updated
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}