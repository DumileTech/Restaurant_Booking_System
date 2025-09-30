import BookingForm from '@/components/bookings/BookingForm';
import AuthButton from '@/components/auth/AuthButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Users, Utensils } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server'

// This function tells Next.js which pages to build statically
// Required if you are using "output: 'export'" in next.config.js
export async function generateStaticParams() {
  try {
    const supabase = await createClient({ useServiceRole: true })
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id')
    
    if (error) throw error
    return restaurants?.map(({ id }: any) => ({
      restaurantId: id.toString(),
    })) || []
  } catch {
    return []
  }
}

async function getRestaurant(id: string) {
  try {
    const supabase = await createClient({ useServiceRole: true })
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return restaurant
  } catch {
    return null;
  }
}

async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient({ cookieStore })
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch {
    return null
  }
}
export default async function BookingPage({ params }: { params: { restaurantId:string } }) {
  const restaurant = await getRestaurant(params.restaurantId);
  
  // FIX 1: Robustly handle the "not found" case
  if (!restaurant) {
    redirect('/');
  }

  const user = await getCurrentUser()

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
  );
}