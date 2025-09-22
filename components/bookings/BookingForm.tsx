'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  location: string | null
  cuisine: string | null
}

interface BookingFormProps {
  restaurant: Restaurant
}

export default function BookingForm({ restaurant }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    party_size: '2',
    special_requests: '',
  })

  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.createBooking({
        restaurant_id: restaurant.id,
        date: formData.date,
        time: formData.time,
        party_size: parseInt(formData.party_size),
        special_requests: formData.special_requests || undefined,
      })

      router.push('/account?success=booking')
    } catch (error: any) {
      if (error.message.includes('available_times')) {
        alert('Time slot not available. Please choose a different time.')
      } else {
        alert('Error creating booking: ' + error.message)
      }
    }

    setLoading(false)
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Book a Table at {restaurant.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={minDate}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select 
                value={formData.time} 
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {time}
                      </div>
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
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {size} {size === 1 ? 'person' : 'people'}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_requests">Special Requests (Optional)</Label>
            <Textarea
              id="special_requests"
              placeholder="Any dietary restrictions, special occasions, or other requests..."
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Booking...' : 'Book Table'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}