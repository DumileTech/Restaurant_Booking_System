import BookingPage from '@/components/pages/BookingPage'
export default async function BookingPage({ params }: { params: { restaurantId:string } }) {


  return <BookingPage restaurantId={params.restaurantId} />
}