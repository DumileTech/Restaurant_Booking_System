import AccountPage from '@/components/pages/AccountPage'

export default async function AccountPage({ searchParams }: { searchParams: { success?: string } }) {
  return <AccountPage searchParams={searchParams} />
}