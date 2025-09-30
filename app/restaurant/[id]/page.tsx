// app/restaurant/[id]/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Users, Clock, Star, Utensils, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {SupabaseClient} from "@supabase/supabase-js";
import { getRestaurant as getRestaurantAction } from "@/lib/actions/restaurant.actions";

// 1. IMPORT THE NEW MENU CARD COMPONENT
import MenuCard from '@/components/ui/menu-card';

export async function generateStaticParams() {
  try {
    const supabase = await createClient({ useServiceRole: true }) as SupabaseClient;
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id')

    if (error) throw error

    if (!restaurants || restaurants.length === 0) {
      console.warn('generateStaticParams for /restaurant/[id]/page.tsx returned no restaurants. Check database seeding.')
      return []
    }

    const params = restaurants.map((restaurant: any) => ({
      id: restaurant.id.toString(),
    }))

    console.log('Generated static params for /restaurant/[id]:', params.map(p => p.id))
    return params
  } catch (error) {
    console.error('Error in generateStaticParams:', error)
    return []
  }
}

// This local function is no longer needed and will be removed.
// async function getRestaurant(id: string) { ... }

async function getRestaurantBookings(id: string) {
  try {
    // This would require admin access, so we'll skip it for now
    // In a real app, this would be a separate API endpoint
    return []
  } catch {
    return []
  }
}

export default async function RestaurantDetailPage({ params }: { params: { id: string } }) {
  // Use the imported server action to fetch the restaurant data
  const response = await getRestaurantAction(params.id)

  // If the action was not successful or returned no data, redirect
  if (!response.success || !response.data) {
    redirect('/')
  }

  const restaurant = response.data

  const bookings = await getRestaurantBookings(params.id)
  const totalBookings = bookings.length
  const avgPartySize = bookings.length > 0
    ? Math.round(bookings.reduce((sum, b) => sum + (b.party_size || 0), 0) / bookings.length)
    : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Restaurants
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative h-96 w-full rounded-xl overflow-hidden mb-8">
          <Image
            src={restaurant.image_url || '/placeholder-restaurant.jpg'}
            alt={restaurant.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{restaurant.name}</h1>
              {restaurant.cuisine && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Utensils className="w-3 h-3 mr-1" />
                  {restaurant.cuisine}
                </Badge>
              )}
            </div>
            {restaurant.location && (
              <div className="flex items-center gap-1 text-white/90">
                <MapPin className="w-4 h-4" />
                {restaurant.location}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Card */}
            <Card>
              <CardHeader>
                <CardTitle>About {restaurant.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {restaurant.description || 'Experience exceptional dining at this wonderful restaurant.'}
                </p>
              </CardContent>
            </Card>

            {/* 2. REMOVE the old "Sample Menu" Card and ADD the new one */}
            <MenuCard restaurantId={restaurant.id} />

            {/* Reviews Placeholder Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Customer Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm font-medium">Sarah M.</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      &#34;Absolutely wonderful experience! The food was exceptional and the service was top-notch. Will definitely be returning.&#34;
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm font-medium">James R.</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      &#34;Great atmosphere and delicious food. The booking process was seamless and I earned points too!&#34;
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking CTA */}
            <Card className="border-primary">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary mb-1">Book Now</div>
                  <p className="text-sm text-muted-foreground">Earn 10 reward points</p>
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link href={`/book/${restaurant.id}`}>
                    Reserve Your Table
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Restaurant Info */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurant.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{restaurant.location}</p>
                    </div>
                  </div>
                )}

                {restaurant.capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-sm text-muted-foreground">Up to {restaurant.capacity} guests</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <div className="text-sm text-muted-foreground">
                      <p>Mon-Thu: 11:00 AM - 10:00 PM</p>
                      <p>Fri-Sat: 11:00 AM - 11:00 PM</p>
                      <p>Sunday: 12:00 PM - 9:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Contact</p>
                    <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            {totalBookings > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Popular Choice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recent Bookings</span>
                    <span className="font-semibold">{totalBookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Party Size</span>
                    <span className="font-semibold">{avgPartySize} people</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}