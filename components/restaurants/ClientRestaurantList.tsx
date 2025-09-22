'use client'

import { useState } from 'react'
import RestaurantFilters from './RestaurantFilters'
import RestaurantCard from './RestaurantCard'

interface Restaurant {
  id: string
  name: string
  location: string | null
  cuisine: string | null
  capacity: number | null
  description: string | null
  image_url: string | null
}

interface FilterState {
  search: string
  cuisine: string
  location: string
  availability: string
}

interface ClientRestaurantListProps {
  restaurants: Restaurant[]
  cuisines: string[]
  locations: string[]
}

export default function ClientRestaurantList({ restaurants, cuisines, locations }: ClientRestaurantListProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    cuisine: '',
    location: '',
    availability: ''
  })

  const filteredRestaurants = restaurants.filter((restaurant) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesName = restaurant.name.toLowerCase().includes(searchLower)
      const matchesDescription = restaurant.description?.toLowerCase().includes(searchLower)
      if (!matchesName && !matchesDescription) return false
    }

    // Cuisine filter
    if (filters.cuisine && restaurant.cuisine !== filters.cuisine) {
      return false
    }

    // Location filter
    if (filters.location && restaurant.location !== filters.location) {
      return false
    }

    // Note: Availability filter is not implemented as we don't have real-time booking data
    // This would require additional database queries for restaurant hours and current bookings

    return true
  })

  return (
    <div>
      <RestaurantFilters 
        onFiltersChange={setFilters}
        cuisines={cuisines}
        locations={locations}
      />
      
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold mb-4">Featured Restaurants</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover exceptional dining experiences and earn rewards with every booking
        </p>
      </div>

      {filteredRestaurants.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No restaurants match your current filters.</p>
        </div>
      )}
    </div>
  )
}