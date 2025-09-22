import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, canAccessRestaurant } from '@/lib/auth-server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('supabase-auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decode token to get user ID (simplified - in production use proper JWT verification)
    const decoded = jwt.decode(token) as any
    const userId = decoded?.sub

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user can access this restaurant's bookings
    const hasAccess = await canAccessRestaurant(userId, params.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        users (
          email,
          name
        )
      `)
      .eq('restaurant_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ bookings })

  } catch (error) {
    console.error('Get restaurant bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}