import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-server'
import { validateAuth } from '@/lib/utils/validation'
import { handleApiError, AuthenticationError } from '@/lib/utils/errors'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = validateAuth(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.errors?.[0]?.message || 'Invalid input' 
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    const supabase = createServerSupabaseClient()
    
    // Sign in user with Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (error) {
      throw new AuthenticationError(error.message)
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || '',
        role: profile?.role || 'customer',
        points: profile?.points || 0
      }
    })

  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    )
  }
}