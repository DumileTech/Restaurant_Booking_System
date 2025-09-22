import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Restaurant {
  id: string
  name: string
  location: string | null
  cuisine: string | null
  capacity: number | null
  description: string | null
  image_url: string | null
}

interface RestaurantCardProps {
  restaurant: Restaurant
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full">
        <Image
          src={restaurant.image_url || '/placeholder-restaurant.jpg'}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{restaurant.name}</CardTitle>
          {restaurant.cuisine && (
            <Badge variant="secondary">{restaurant.cuisine}</Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {restaurant.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {restaurant.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            {restaurant.location}
          </div>
        )}
        {restaurant.capacity && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            Capacity: {restaurant.capacity} guests
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/restaurant/${restaurant.id}`}>
              View Details
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href={`/book/${restaurant.id}`}>
              Book Now
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}