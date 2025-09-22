'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Utensils, X } from 'lucide-react'

interface FilterState {
  search: string
  cuisine: string
  location: string
  availability: string
}

interface RestaurantFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  cuisines: string[]
  locations: string[]
}

export default function RestaurantFilters({ onFiltersChange, cuisines, locations }: RestaurantFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    cuisine: '',
    location: '',
    availability: ''
  })

  const updateFilter = (key: keyof FilterState, value: string) => {
    // Convert 'all' back to empty string for filtering logic
    const filterValue = value === 'all' ? '' : value
    const newFilters = { ...filters, [key]: filterValue }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = { search: '', cuisine: '', location: '', availability: '' }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Find Your Perfect Restaurant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search restaurants..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filters.cuisine} onValueChange={(value) => updateFilter('cuisine', value)}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                <SelectValue placeholder="All Cuisines" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {cuisines.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <SelectValue placeholder="All Cape Town Areas" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cape Town Areas</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.availability} onValueChange={(value) => updateFilter('availability', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Time</SelectItem>
              <SelectItem value="today">Available Today</SelectItem>
              <SelectItem value="tomorrow">Available Tomorrow</SelectItem>
              <SelectItem value="weekend">Available This Weekend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
                <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('search', '')} />
              </Badge>
            )}
            {filters.cuisine && (
              <Badge variant="secondary" className="gap-1">
                {filters.cuisine}
                <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('cuisine', '')} />
              </Badge>
            )}
            {filters.location && (
              <Badge variant="secondary" className="gap-1">
                {filters.location}
                <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('location', '')} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}