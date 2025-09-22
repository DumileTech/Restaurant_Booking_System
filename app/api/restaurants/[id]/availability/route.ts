import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const partySize = parseInt(searchParams.get('party_size') || '2')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const { data: availability, error } = await supabaseAdmin
      .rpc('get_restaurant_availability', {
        restaurant_id_param: params.id,
        date_param: date,
        party_size_param: partySize
      })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      availability: availability?.[0] || { 
        available_times: [], 
        total_capacity: 0, 
        current_bookings: 0 
      }
    })

  } catch (error) {
    console.error('Get availability error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}