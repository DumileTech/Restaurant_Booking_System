'use client'

import { useState, useEffect } from 'react'
import BookingForm from '@/components/bookings/BookingForm'
import AuthButton from '@/components/auth/AuthButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Users, Utensils } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getRestaurant } from '@/lib/actions/client/restaurant.actions'
import { getUserProfile } from '@/lib/actions/client/user.actions'

interface Restaurant {
  id: string
  name: string
  location: string | null
  cuisine: string | null
  capacity: number | null
  description: string | null
  image_url: string | null
}

interface User {
  id: string
  email: string
  name: string | null
  points: number
  role: string
}

interface BookingPageProps {
  restaurantId: string
}

export default function BookingPage({ restaurantId }: BookingPageProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        const [restaurantResponse, userResponse] = await Promise.all([
          getRestaurant(restaurantId),
          getUserProfile()
        ])

        if (restaurantResponse?.success && restaurantResponse.data) {
          setRestaurant(restaurantResponse.data)
        } else {
          setError('Restaurant not found')
          return
        }

        if (userResponse?.success && userResponse.data) {
          setUser(userResponse.data)
        }

      } catch (error) {
        console.error('Error loading booking page data:', error)
        setError('Failed to load page data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [restaurantId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Restaurant not found'}</p>
          <Button asChild>
            <Link href="/">Back to Restaurants</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Restaurants
              </Link>
            </Button>
            <AuthButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Restaurant Info */}
          <div className="space-y-6">
            <Card>
              <div className="relative h-64 w-full">
                <Image
                  src={restaurant.image_url || '/placeholder-restaurant.jpg'}
                  alt={restaurant.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
                  {restaurant.cuisine && (
                    <Badge variant="secondary" className="ml-2">
                      <Utensils className="w-3 h-3 mr-1" />
                      {restaurant.cuisine}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurant.description && (
                  <p className="text-muted-foreground">{restaurant.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm">
                  {restaurant.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      {restaurant.location}
                    </div>
                  )}
                  {restaurant.capacity && (
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      Up to {restaurant.capacity} guests
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium text-sm">
                    🎉 Earn 10 reward points when your booking is confirmed!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            {user ? (
              <BookingForm restaurant={restaurant} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Sign In Required</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Please sign in to book a table and start earning rewards.
                  </p>
                  <AuthButton />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}