'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Users, Edit, Trash2, AlertCircle } from 'lucide-react'

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
  }
}

interface BookingManagementProps {
  booking: Booking
  onUpdate: () => void
}

export default function BookingManagement({ booking, onUpdate }: BookingManagementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: booking.date,
    time: booking.time,
    party_size: booking.party_size.toString(),
    special_requests: booking.special_requests || '',
  })

  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ]

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          date: formData.date,
          time: formData.time,
          party_size: parseInt(formData.party_size),
          special_requests: formData.special_requests || null,
        })
        .eq('id', booking.id)

      if (error) throw error

      setIsEditing(false)
      onUpdate()
    } catch (error: any) {
      alert('Error updating booking: ' + error.message)
    }
    setLoading(false)
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id)

      if (error) throw error
      onUpdate()
    } catch (error: any) {
      alert('Error cancelling booking: ' + error.message)
    }
    setLoading(false)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'pending': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const canModify = booking.status === 'pending' || booking.status === 'confirmed'
  const minDate = new Date().toISOString().split('T')[0]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.restaurants.name}</CardTitle>
            {booking.restaurants.location && (
              <p className="text-sm text-muted-foreground">{booking.restaurants.location}</p>
            )}
          </div>
          <Badge variant={getStatusBadgeVariant(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-2 text-sm">
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
          <div className="text-sm">
            <p className="font-medium">Special Requests:</p>
            <p className="text-muted-foreground">{booking.special_requests}</p>
          </div>
        )}

        {canModify && (
          <div className="flex gap-2 pt-2 border-t">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Modify
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modify Booking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        min={minDate}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Select 
                        value={formData.time} 
                        onValueChange={(value) => setFormData({ ...formData, time: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="party_size">Party Size</Label>
                    <Select 
                      value={formData.party_size} 
                      onValueChange={(value) => setFormData({ ...formData, party_size: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} {size === 1 ? 'person' : 'people'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleUpdate} disabled={loading} className="flex-1">
                      {loading ? 'Updating...' : 'Update Booking'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="destructive" size="sm" onClick={handleCancel} disabled={loading}>
              <Trash2 className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-red-50 p-2 rounded">
            <AlertCircle className="w-4 h-4" />
            This booking has been cancelled
          </div>
        )}
      </CardContent>
    </Card>
  )
}