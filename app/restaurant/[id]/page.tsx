import RestaurantDetailPage from '@/components/pages/RestaurantDetailPage'

export default async function RestaurantDetailPage({ params }: { params: { id: string } }) {




  return <RestaurantDetailPage restaurantId={params.id} />
}