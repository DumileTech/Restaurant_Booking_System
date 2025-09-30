'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BookingManagement from '@/components/bookings/BookingManagement'
import RewardsHistory from '@/components/rewards/RewardsHistory'
import { Award, Calendar } from 'lucide-react'
import Link from 'next/link'
import { getUserProfile, getUserBookings, getUserRewards } from '@/lib/actions/client/user.actions'

interface User {
  id: string
  email: string
  name: string | null
  points: number
  role: string
}

interface Booking {
  id: string
  date: string
  time: string
  party_size: number
  status: string
  special_requests: string | null
  restaurants: {
    name: string
    location: string | null
    cuisine: string | null
    image_url: string | null
  }
}

interface Reward {
  id: string
  points_change: number
  reason: string | null
  created_at: string
}

interface AccountPageProps {
  searchParams: { success?: string }
}

export default function AccountPage({ searchParams }: AccountPageProps) {
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        const [profileResponse, bookingsResponse, rewardsResponse] = await Promise.all([
          getUserProfile(),
          getUserBookings(),
          getUserRewards()
        ])

        if (profileResponse?.success && profileResponse.data) {
          setUser(profileResponse.data)
        } else {
          setError('Please sign in to view your account')
          return
        }

        if (bookingsResponse?.success && bookingsResponse.data) {
          setBookings(bookingsResponse.data)
        }

        if (rewardsResponse?.success && rewardsResponse.data) {
          setRewards(rewardsResponse.data)
        }

      } catch (error) {
        console.error('Error loading account data:', error)
        setError('Failed to load account data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view your account</p>
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    )
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
                <div className="text-3xl font-bold text-primary">{user.points || 0}</div>
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
            <RewardsHistory rewards={rewards} totalPoints={user.points || 0} />
          </TabsContent>
        </Tabs>
        
      </div>
    </div>
  )
}