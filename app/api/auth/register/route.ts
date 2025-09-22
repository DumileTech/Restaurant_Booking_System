import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { validateAuth } from '@/lib/utils/validation'
import { handleApiError, ValidationError } from '@/lib/utils/errors'
import { sanitizeString, sanitizeEmail } from '@/lib/utils/validation'

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

    const { email, password, name } = validation.data
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedName = name ? sanitizeString(name) : ''

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true, // Auto-confirm for demo
      user_metadata: { name: sanitizedName }
    })

    if (authError) {
      throw new ValidationError(authError.message)
    }

    // Create user profile with default customer role
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: sanitizedEmail,
        name: sanitizedName,
        role: 'customer',
        points: 0
      })

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error('Failed to create user profile')
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        name: sanitizedName,
        role: 'customer',
        points: 0
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