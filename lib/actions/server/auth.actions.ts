'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { validateAuth } from '@/lib/utils/validation'
import { sanitizeString, sanitizeEmail } from '@/lib/utils/validation'
import { createUserProfile, getUserByEmail } from '@/lib/queries/user.queries'

interface StandardResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export async function registerUser(formData: FormData): Promise<StandardResponse> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    // Validate input
    const validation = validateAuth({ email, password, name })
    if (!validation.success) {
      return {
        success: false,
        message: 'Validation failed',
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
      user_metadata: { name: sanitizedName }
    })

    if (authError) {
      console.error('Auth registration error:', authError)
      return {
        success: false,
        message: 'Registration failed',
        error: authError.message
      }
    }

    // Create user profile
    try {
      const profile = await createUserProfile({
        id: authData.user.id,
        email: sanitizedEmail,
        name: sanitizedName,
        role: 'customer',
        points: 0
      })

      return {
        success: true,
        message: 'User created successfully',
        data: profile
      }
    } catch (profileError) {
      console.error('Profile creation error:', profileError)
      
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return {
        success: false,
        message: 'Failed to create user profile',
        error: profileError instanceof Error ? profileError.message : 'Unknown error'
      }
    }

  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function loginUser(formData: FormData): Promise<StandardResponse> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate input
    const validation = validateAuth({ email, password })
    if (!validation.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validation.errors?.[0]?.message || 'Invalid input'
      }
    }

    const cookieStore = await cookies()
    const supabase = await createClient({ cookieStore })
    
    // Sign in user with Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: 'Login failed',
        error: error.message
      }
    }

    // Get user profile with role
    try {
      const profile = await getUserByEmail(data.user.email!)
      
      return {
        success: true,
        message: 'Login successful',
        data: profile
      }
    } catch (profileError) {
      console.error('Profile fetch error:', profileError)
      return {
        success: false,
        message: 'Login successful but failed to fetch profile',
        error: profileError instanceof Error ? profileError.message : 'Unknown error'
      }
    }

  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function logoutUser(): Promise<StandardResponse> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient({ cookieStore })
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        message: 'Logout failed',
        error: error.message
      }
    }
    
    return {
      success: true,
      message: 'Logout successful'
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}