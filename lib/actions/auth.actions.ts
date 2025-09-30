'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { validateAuth } from '@/lib/utils/validation'
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/utils/errors'
import { sanitizeString, sanitizeEmail } from '@/lib/utils/validation'
import {SupabaseClient} from "@supabase/supabase-js";

export async function registerUser(formData: FormData) {
  try {
    const cookieStore = await cookies()
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
    const supabaseAdmin = await createClient({ useServiceRole: true })
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
          name: sanitizedName,
        role: 'customer'},
        app_metadata: { role : 'customer'},
    })

    if (authError) {
      throw new ValidationError(authError.message)
    }

    // Create user profile with default customer role
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email: sanitizedEmail,
        name: sanitizedName,
        role: 'customer', // Explicitly set role
        points: 0
      }, {
        onConflict: 'id'
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
    const cookieStore = await cookies()
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

    const supabase = await createClient() as SupabaseClient;
    
    // Sign in user with Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (error) {
      throw new AuthenticationError(error.message)
    }

    // Get user profile with role
    const supabaseAdmin = await createClient({ useServiceRole: true })
    const { data: profile } = await supabaseAdmin
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
    const supabase = await createClient() as SupabaseClient;
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