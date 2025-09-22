import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: restaurant, error } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ restaurant })

  } catch (error) {
    console.error('Get restaurant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}