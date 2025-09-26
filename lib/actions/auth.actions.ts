'use server'

import { supabaseAdmin, createServerSupabaseClient } from '@/lib/auth-server'
import { validateAuth } from '@/lib/utils/validation'
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/utils/errors'
import { sanitizeString, sanitizeEmail } from '@/lib/utils/validation'

export async function registerUser(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    // Validate input
    const validation = validateAuth({ email, password, name })
    if (!validation.success) {
      return {
        success: false,
        error: validation.errors?.[0]?.message || 'Invalid input'
      }
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedName = name ? sanitizeString(name) : ''

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
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
      throw new Error(profileError.message || 'Failed to create user profile')
    }

    return {
      success: true,
      message: 'User created successfully',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        name: sanitizedName,
        role: 'customer',
        points: 0
      }
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function loginUser(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate input
    const validation = validateAuth({ email, password })
    if (!validation.success) {
      return {
        success: false,
        error: validation.errors?.[0]?.message || 'Invalid input'
      }
    }

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

    return {
      success: true,
      message: 'Login successful',
      data: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || '',
        role: profile?.role || 'customer',
        points: profile?.points || 0
      }
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function logoutUser() {
  try {
    const supabase = createServerSupabaseClient()
    await supabase.auth.signOut()
    
    return {
      success: true,
      message: 'Logout successful'
    }
  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}