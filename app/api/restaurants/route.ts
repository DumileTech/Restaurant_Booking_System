import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get('cuisine')
    const location = searchParams.get('location')
    const search = searchParams.get('search')

    let query = supabaseAdmin.from('restaurants').select('*')

    if (cuisine) {
      query = query.eq('cuisine', cuisine)
    }

    if (location) {
      query = query.eq('location', location)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: restaurants, error } = await query.order('name')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ restaurants })

  } catch (error) {
    console.error('Get restaurants error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}