import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    await supabase.auth.signOut()

    return NextResponse.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}