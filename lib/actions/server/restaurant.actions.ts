'use server'

import { getAllRestaurants, getRestaurantById, getRestaurantAvailability as getRestaurantAvailabilityQuery } from '@/lib/queries/restaurant.queries'

interface StandardResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export async function getRestaurants(filters?: {
  cuisine?: string
  location?: string
  search?: string
}): Promise<StandardResponse> {
  try {
    const restaurants = await getAllRestaurants(filters)

    return {
      success: true,
      message: 'Restaurants retrieved successfully',
      data: restaurants
    }

  } catch (error) {
    console.error('Get restaurants error:', error)
    return {
      success: false,
      message: 'Failed to get restaurants',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getRestaurant(id: string): Promise<StandardResponse> {
  try {
    if (!id) {
      return {
        success: false,
        message: 'Restaurant ID is required',
        error: 'Missing restaurant ID'
      }
    }

    const restaurant = await getRestaurantById(id)

    if (!restaurant) {
      return {
        success: false,
        message: 'Restaurant not found',
        error: 'Restaurant does not exist'
      }
    }

    return {
      success: true,
      message: 'Restaurant retrieved successfully',
      data: restaurant
    }

  } catch (error) {
    console.error('Get restaurant error:', error)
    return {
      success: false,
      message: 'Failed to get restaurant',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getRestaurantAvailability(
  id: string,
  date: string,
  partySize: number = 2
): Promise<StandardResponse> {
  try {
    if (!id || !date) {
      return {
        success: false,
        message: 'Restaurant ID and date are required',
        error: 'Missing required parameters'
      }
    }

    if (partySize < 1 || partySize > 20) {
      return {
        success: false,
        message: 'Invalid party size',
        error: 'Party size must be between 1 and 20'
      }
    }

    const availability = await getRestaurantAvailabilityQuery(id, date, partySize)

    return {
      success: true,
      message: 'Availability retrieved successfully',
      data: availability
    }

  } catch (error) {
    console.error('Get restaurant availability error:', error)
    return {
      success: false,
      message: 'Failed to check availability',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getFilterOptions(): Promise<StandardResponse> {
  try {
    const restaurants = await getAllRestaurants()
    
    const cuisines = [...new Set(restaurants.map(r => r.cuisine).filter(Boolean))] as string[]
    const locations = [...new Set(restaurants.map(r => r.location).filter(Boolean))] as string[]

    return {
      success: true,
      message: 'Filter options retrieved successfully',
      data: { cuisines, locations }
    }

  } catch (error) {
    console.error('Get filter options error:', error)
    return {
      success: false,
      message: 'Failed to get filter options',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}