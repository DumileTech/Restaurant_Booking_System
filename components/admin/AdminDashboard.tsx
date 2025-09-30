'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { confirmBooking, cancelBooking } from '@/lib/actions/client/booking.actions'
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Users, Calendar, MapPin } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  location: string | null
  cuisine: string | null
}

interface Booking {
  id: string
  user_id: string
  date: string
  time: string
  party_size: number
  status: string
  special_requests: string | null
  created_at: string
  users: {
    email: string
    name: string | null
  }
}

interface AdminDashboardProps {
  restaurants: Restaurant[]
}

export default function AdminDashboard({ restaurants }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState(restaurants[0]?.id)

  useEffect(() => {
    if (selectedRestaurant) {
      fetchBookings()
    }
  }, [selectedRestaurant])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      // TODO: Replace with server action call
      // This needs to be refactored to use a server action
      console.log('Fetching bookings for restaurant:', selectedRestaurant)
      setBookings([])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
    setLoading(false)
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      let response
      if (status === 'confirmed') {
        response = await confirmBooking(bookingId)
      } else if (status === 'cancelled') {
        response = await cancelBooking(bookingId)
      } else {
        throw new Error('Invalid status')
      }

      if (!response.success) {
        throw new Error(response.error)
      }
      
      await fetchBookings() // Refresh the list
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'pending': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled')

  const selectedRestaurantData = restaurants.find(r => r.id === selectedRestaurant)

  return (
    <div className="space-y-6">
      {/* Restaurant Selection */}
      {restaurants.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {restaurants.map((restaurant) => (
                <Button
                  key={restaurant.id}
                  variant={selectedRestaurant === restaurant.id ? 'default' : 'outline'}
                  onClick={() => setSelectedRestaurant(restaurant.id)}
                >
                  {restaurant.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingBookings.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{confirmedBookings.length}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{cancelledBookings.length}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Bookings for {selectedRestaurantData?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({confirmedBookings.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({cancelledBookings.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingBookings.length > 0 ? (
                pendingBookings.map((booking) => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onStatusUpdate={updateBookingStatus}
                    showActions
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No pending bookings</p>
              )}
            </TabsContent>
            
            <TabsContent value="confirmed" className="space-y-4 mt-4">
              {confirmedBookings.length > 0 ? (
                confirmedBookings.map((booking) => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onStatusUpdate={updateBookingStatus}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No confirmed bookings</p>
              )}
            </TabsContent>
            
            <TabsContent value="cancelled" className="space-y-4 mt-4">
              {cancelledBookings.length > 0 ? (
                cancelledBookings.map((booking) => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onStatusUpdate={updateBookingStatus}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No cancelled bookings</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function BookingCard({ 
  booking, 
  onStatusUpdate, 
  showActions = false 
}: { 
  booking: Booking
  onStatusUpdate: (id: string, status: string) => void
  showActions?: boolean 
}) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'pending': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">
            {booking.users?.name || booking.users?.email}
          </h4>
          <p className="text-sm text-muted-foreground">{booking.users?.email}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(booking.status)}>
          {booking.status}
        </Badge>
      </div>
      
      <div className="grid md:grid-cols-3 gap-2 text-sm mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(booking.date).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {booking.time}
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {booking.party_size} guests
        </div>
      </div>

      {booking.special_requests && (
        <div className="mb-3 text-sm">
          <p className="font-medium">Special Requests:</p>
          <p className="text-muted-foreground">{booking.special_requests}</p>
        </div>
      )}

      {showActions && booking.status === 'pending' && (
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            onClick={() => onStatusUpdate(booking.id, 'confirmed')}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirm
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onStatusUpdate(booking.id, 'cancelled')}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}