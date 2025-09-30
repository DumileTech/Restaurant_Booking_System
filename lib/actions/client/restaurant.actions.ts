// Client-side wrappers for restaurant actions

import { getRestaurants as getRestaurantsServer, getRestaurant as getRestaurantServer, getRestaurantAvailability as getRestaurantAvailabilityServer, getFilterOptions as getFilterOptionsServer } from '@/lib/actions/server/restaurant.actions'

export async function getRestaurants(filters?: {
  cuisine?: string
  location?: string
  search?: string
}) {
  return await getRestaurantsServer(filters)
}

export async function getRestaurant(id: string) {
  return await getRestaurantServer(id)
}

export async function getRestaurantAvailability(id: string, date: string, partySize: number = 2) {
  return await getRestaurantAvailabilityServer(id, date, partySize)
}

export async function getFilterOptions() {
  return await getFilterOptionsServer()
}