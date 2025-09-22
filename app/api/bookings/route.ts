import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { restaurant_id, date, time, party_size, special_requests } = await request.json()

    if (!restaurant_id || !date || !time || !party_size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use the validation function
    const { data: result, error } = await supabaseAdmin
      .rpc('create_booking_with_validation', {
        user_id_param: user.id,
        restaurant_id_param: restaurant_id,
        date_param: date,
        time_param: time,
        party_size_param: party_size,
        special_requests_param: special_requests || null
      })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, available_times: result.available_times },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Booking created successfully',
      booking_id: result.booking_id
    })

  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ bookings })

  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}