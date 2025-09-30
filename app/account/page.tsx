import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BookingManagement from '@/components/bookings/BookingManagement'
import RewardsHistory from '@/components/rewards/RewardsHistory'
import { Award, Calendar, Clock, MapPin, Star } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

async function getUserData(userId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient({ useServiceRole: true })
  const [userResult, bookingsResult, rewardsResult] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single(),
    supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  ])

  return {
    user: userResult.data,
    bookings: bookingsResult.data || [],
    rewards: rewardsResult.data || [],
  }
}

export default async function AccountPage({ searchParams }: { searchParams: { success?: string } }) {
  const cookieStore = await cookies()
  const supabase = await createClient({ cookieStore })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

  const { user: profile, bookings, rewards } = await getUserData(user.id)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'pending': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Account</h1>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {searchParams.success === 'booking' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✅ Booking created successfully! You'll earn 10 points once the restaurant confirms your reservation.
            </p>
          </div>
        )}

        {/* Profile Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome back!</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{profile?.points || 0}</div>
                <p className="text-sm text-muted-foreground">Reward Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings" className="space-y-4 mt-6">
            {bookings.length > 0 ? (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <BookingManagement 
                    key={booking.id} 
                    booking={booking} 
                    onUpdate={() => window.location.reload()}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No bookings yet</p>
                  <Button asChild>
                    <Link href="/">Browse Restaurants</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="rewards" className="mt-6">
            <RewardsHistory rewards={rewards} totalPoints={profile?.points || 0} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}