import { supabase } from '@/lib/supabase'
import ClientRestaurantList from '@/components/restaurants/ClientRestaurantList'
import AuthButton from '@/components/auth/AuthButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Award, MapPin } from 'lucide-react'

async function getRestaurants() {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('name')
    
    if (error) throw error
    return restaurants || []
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return []
  }
}

async function getFilterOptions() {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('cuisine, location')
    
    if (error) throw error
    
    const cuisines = [...new Set(restaurants?.map((r: any) => r.cuisine).filter(Boolean))] as string[]
    const locations = [...new Set(restaurants?.map((r: any) => r.location).filter(Boolean))] as string[]

    return { cuisines, locations }
  } catch {
    return { cuisines: [], locations: [] }
  }
}

export default async function HomePage() {
  const restaurants = await getRestaurants()
  const { cuisines, locations } = await getFilterOptions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">TableRewards</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <a href="/admin">Admin</a>
              </Button>
              <AuthButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Dine & Earn Rewards
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Book tables at your favorite restaurants and earn 10 points for every confirmed reservation. 
            Turn dining into rewards!
          </p>
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>Premium Restaurants</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span>Instant Rewards</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-yellow-400" />
              <span>Prime Locations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurants Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <ClientRestaurantList
            restaurants={restaurants}
            cuisines={cuisines}
            locations={locations}
          />
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Choose Cape Town Restaurant</h4>
              <p className="text-muted-foreground">Browse our curated selection of Cape Town's finest dining establishments</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Book Table</h4>
              <p className="text-muted-foreground">Select your preferred date and time for your Cape Town dining experience</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Earn Rewards</h4>
              <p className="text-muted-foreground">Get 10 points automatically when your booking is confirmed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Award className="w-6 h-6" />
            <span className="text-xl font-bold">TableRewards</span>
          </div>
          <p className="text-slate-400">
            © 2024 TableRewards. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}