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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          disabled={loading}
        >
          <LogOut className="w-4 h-4 mr-1" />
          {loading ? 'Signing Out...' : 'Sign Out'}
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <LogIn className="w-4 h-4 mr-1" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRegistering ? 'Create Account' : 'Sign In to Your Account'}
          </DialogTitle>
        </DialogHeader>
        <Card className="p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegistering}
                  disabled={loading}
                  maxLength={100}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                autoComplete={isRegistering ? "new-password" : "current-password"}
              />
              {isRegistering && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email || !password || (isRegistering && !name)}
            >
              {loading 
                ? (isRegistering ? 'Creating Account...' : 'Signing In...') 
                : (isRegistering ? 'Create Account' : 'Sign In')
              }
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => {
                setIsRegistering(!isRegistering)
                setMessage('')
              }}
              disabled={loading}
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </Button>
            
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('successful') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  )
}