'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { validateUser } from '@/lib/utils/validation'
import { sanitizeString } from '@/lib/utils/validation'
import { revalidatePath } from 'next/cache'
import { getUserById, updateUserProfile as updateUserProfileQuery, getUserRewards as getUserRewardsQuery } from '@/lib/queries/user.queries'
import { getUserBookings as getUserBookingsQuery } from '@/lib/queries/booking.queries'

interface StandardResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// Get current user from session
async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient({ cookieStore })
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null
    
    // Get user profile with role
    const profile = await getUserById(user.id)
    return profile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getUserProfile(): Promise<StandardResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      }
    }

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    }

  } catch (error) {
    console.error('Get user profile error:', error)
    return {
      success: false,
      message: 'Failed to get user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function updateUserProfile(formData: FormData): Promise<StandardResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      }
    }

    const name = formData.get('name') as string

    // Validate input
    const validation = validateUser({ name })
    if (!validation.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validation.errors?.[0]?.message || 'Invalid input'
      }
    }

    // Sanitize name
    const sanitizedName = sanitizeString(name)

    const updated = await updateUserProfileQuery(user.id, { name: sanitizedName })

    revalidatePath('/account')

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updated
    }

  } catch (error) {
    console.error('Update user profile error:', error)
    return {
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getUserBookings(): Promise<StandardResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      }
    }

    const bookings = await getUserBookingsQuery(user.id)

    return {
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings
    }

  } catch (error) {
    console.error('Get user bookings error:', error)
    return {
      success: false,
      message: 'Failed to get bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getUserRewards(): Promise<StandardResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      }
    }

    const rewards = await getUserRewardsQuery(user.id)

    return {
      success: true,
      message: 'Rewards retrieved successfully',
      data: rewards
    }

  } catch (error) {
    console.error('Get user rewards error:', error)
    return {
      success: false,
      message: 'Failed to get rewards',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}