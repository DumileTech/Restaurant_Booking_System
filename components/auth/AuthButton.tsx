'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api-client'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  points: number
}
export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { user } = await apiClient.getProfile()
        setUser(user)
      } catch {
        setUser(null)
      }
    }
    
    getProfile()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isRegistering) {
        await apiClient.register(email, password, name)
        setMessage('Registration successful! Please sign in.')
        setIsRegistering(false)
        setName('')
        setPassword('')
      } else {
        const { user } = await apiClient.login(email, password)
        setUser(user)
        setIsOpen(false)
        setMessage('')
      }
    } catch (error: any) {
      setMessage(error.message)
    }
    
    setLoading(false)
  }

  const handleSignOut = async () => {
    try {
      await apiClient.logout()
      setUser(null)
    } catch (error: any) {
      console.error('Logout error:', error)
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/account">
            <UserIcon className="w-4 h-4 mr-1" />
            Account
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-1" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <LogIn className="w-4 h-4 mr-1" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRegistering ? 'Create Account' : 'Sign In to Your Account'}
          </DialogTitle>
        </DialogHeader>
        <Card className="p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
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
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </Button>
            {message && (
              <p className={`text-sm ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  )
}