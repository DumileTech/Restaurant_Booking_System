'use server'

import { supabaseAdmin, getCurrentUser } from '@/lib/auth-server'
import { validateUser } from '@/lib/utils/validation'
import { handleApiError, AuthenticationError } from '@/lib/utils/errors'
import { sanitizeString } from '@/lib/utils/validation'
import { revalidatePath } from 'next/cache'

export async function getUserProfile() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    return {
      success: true,
      data: user
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function updateUserProfile(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    const name = formData.get('name') as string

    // Validate input
    const validation = validateUser({ name })
    if (!validation.success) {
      return {
        success: false,
        error: validation.errors?.[0]?.message || 'Invalid input'
      }
    }

    // Sanitize name
    const sanitizedName = sanitizeString(name)

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ name: sanitizedName })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/account')

    return {
      success: true,
      data: updated
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function getUserBookings() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        restaurants (
          name,
          location,
          cuisine,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: bookings
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}

export async function getUserRewards() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new AuthenticationError()
    }

    const { data: rewards, error } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: rewards
    }

  } catch (error) {
    const { message } = handleApiError(error)
    return {
      success: false,
      error: message
    }
  }
}