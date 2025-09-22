'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api-client'
import { validateAuth } from '@/lib/utils/validation'
import { logError } from '@/lib/utils/errors'
import type { User } from '@/lib/types'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'


export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await apiClient.getProfile()
        if (response.success && response.data) {
          setUser(response.data)
        }
      } catch (error) {
        logError(error, 'Get Profile')
        setUser(null)
      } finally {
        setInitialLoading(false)
      }
    }
    
    getProfile()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return
    
    setLoading(true)
    setMessage('')

    try {
      // Validate input
      const validation = validateAuth({ 
        email, 
        password, 
        ...(isRegistering && { name }) 
      })
      
      if (!validation.success) {
        const errorMessage = validation.errors?.[0]?.message || 'Invalid input'
        setMessage(errorMessage)
        return
      }

      if (isRegistering) {
        const response = await apiClient.register(email, password, name)
        if (response.success) {
          setMessage('Registration successful! Please sign in.')
          setIsRegistering(false)
          setName('')
          setPassword('')
        } else {
          setMessage(response.error || 'Registration failed')
        }
      } else {
        const response = await apiClient.login(email, password)
        if (response.success && response.data) {
          setUser(response.data)
          setIsOpen(false)
          setMessage('')
          setEmail('')
          setPassword('')
        } else {
          setMessage(response.error || 'Login failed')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setMessage(errorMessage)
      logError(error, isRegistering ? 'Registration' : 'Login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      await apiClient.logout()
      setUser(null)
    } catch (error) {
      logError(error, 'Logout')
      // Still clear user state even if logout request fails
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setMessage('')
    setIsRegistering(false)
  }

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
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
        <Button variant="outline" size="sm" asChild>
          <a href="/account">
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
    )
  }
}