import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser } from '@/lib/auth-server'
import { validateBooking } from '@/lib/utils/validation'
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/utils/errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    
    // Validate input
    const bookingData = {
      ...body,
      party_size: parseInt(body.party_size) || 0
    }
    
    const validation = validateBooking(bookingData)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.errors?.[0]?.message || 'Invalid booking data',
          errors: validation.errors
        },
        { status: 400 }
      )
    }

    const { restaurant_id, date, time, party_size, special_requests } = validation.data

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
      return NextResponse.json(
        { 
          success: false,
          error: result.error, 
          available_times: result.available_times 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: { booking_id: result.booking_id }
    })

  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    const { data: bookings, error } = await supabaseAdmin
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ 
      success: true,
      data: bookings 
    })

  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    )
  }
}