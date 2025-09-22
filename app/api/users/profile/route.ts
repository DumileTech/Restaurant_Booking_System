import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser } from '@/lib/auth-server'
import { validateUser } from '@/lib/utils/validation'
import { handleApiError, AuthenticationError } from '@/lib/utils/errors'
import { sanitizeString } from '@/lib/utils/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    return NextResponse.json({ 
      success: true,
      data: user 
    })

  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    
    // Validate input
    const validation = validateUser(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.errors?.[0]?.message || 'Invalid input' 
        },
        { status: 400 }
      )
    }

    const updates = validation.data
    
    // Sanitize name if provided
    const sanitizedUpdates: any = {}
    if (updates.name) {
      sanitizedUpdates.name = sanitizeString(updates.name)
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ 
      success: true,
      data: updated 
    })

  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    )
  }
}