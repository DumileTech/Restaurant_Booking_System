import AdminDashboard from '@/components/admin/AdminDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

  // Check if user is an admin of any restaurant
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .eq('admin_id', user.id)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Restaurant Admin Dashboard</h1>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {restaurants && restaurants.length > 0 ? (
          <AdminDashboard restaurants={restaurants} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Restaurant Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You don't have admin access to any restaurants. Contact support if you believe this is an error.
              </p>
              <Button asChild>
                <Link href="/">Browse Restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}