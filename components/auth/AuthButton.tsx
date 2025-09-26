'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getUserProfile } from '@/lib/actions/user.actions'
import { logoutUser } from '@/lib/actions/auth.actions'
import type { User } from '@/lib/types'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'


export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await getUserProfile()
        if (response.success && response.data) {
          setUser(response.data)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setInitialLoading(false)
      }
    }
    
    getProfile()
  }, [])

  const handleSignOut = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      await logoutUser()
      setUser(null)
    } catch (error) {
      // Still clear user state even if logout request fails
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state during initial profile fetch
  if (initialLoading) {
    return (
      <Button size="sm" disabled>
        Loading...
      </Button>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/account">
            <UserIcon className="w-4 h-4 mr-1" />
            Account ({user.points} pts)
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={handleSignOut} disabled={loading}>
          <LogOut className="w-4 h-4 mr-1" />
          {loading ? 'Signing Out...' : 'Sign Out'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href="/signin">
          <LogIn className="w-4 h-4 mr-1" />
          Sign In
        </a>
      </Button>
      <Button size="sm" asChild>
        <a href="/signup">
          Sign Up
        </a>
      </Button>
    </div>
  )
}