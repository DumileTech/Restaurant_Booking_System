'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerUser } from '@/lib/actions/auth.actions'
import { validateAuth } from '@/lib/utils/validation'
import { logError } from '@/lib/utils/errors'
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Eye, EyeOff, User, Mail, Lock } from 'lucide-react'

export default function SignUpForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {}
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required'
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters'
        } else if (value.trim().length > 100) {
          errors.name = 'Name cannot exceed 100 characters'
        }
        break
      
      case 'email':
        if (!value) {
          errors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address'
        }
        break
      
      case 'password':
        if (!value) {
          errors.password = 'Password is required'
        } else if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters'
        } else if (value.length > 128) {
          errors.password = 'Password cannot exceed 128 characters'
        }
        break
      
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password'
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match'
        }
        break
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [field]: errors[field] || ''
    }))
    
    return !errors[field]
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setMessage('') // Clear general message when user types
    
    // Validate field on change
    validateField(field, value)
    
    // Also validate confirm password if password changes
    if (field === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return
    
    // Validate all fields
    const isNameValid = validateField('name', formData.name)
    const isEmailValid = validateField('email', formData.email)
    const isPasswordValid = validateField('password', formData.password)
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword)
    
    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      setMessage('Please fix the errors above')
      setMessageType('error')
      return
    }
    
    setLoading(true)
    setMessage('')

    try {
      // Validate with Zod schema
      const validation = validateAuth({
        email: formData.email,
        password: formData.password,
        name: formData.name
      })
      
      if (!validation.success) {
        const errorMessage = validation.errors?.[0]?.message || 'Invalid input'
        setMessage(errorMessage)
        setMessageType('error')
        return
      }

      const formDataObj = new FormData()
      formDataObj.append('email', formData.email.trim())
      formDataObj.append('password', formData.password)
      formDataObj.append('name', formData.name.trim())
      
      const response = await registerUser(formDataObj)
      
      if (response.success) {
        setMessage('Account created successfully! You can now sign in.')
        setMessageType('success')
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        setFieldErrors({})
        
        // Redirect to sign in page after a short delay
        setTimeout(() => {
          router.push('/signin?message=Account created successfully')
        }, 2000)
      } else {
        setMessage(response.error || 'Registration failed')
        setMessageType('error')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setMessage(errorMessage)
      setMessageType('error')
      logError(error, 'Registration')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.name.trim() && 
                     formData.email && 
                     formData.password && 
                     formData.confirmPassword &&
                     Object.values(fieldErrors).every(error => !error)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={loading}
            className={`pl-10 ${fieldErrors.name ? 'border-red-500' : ''}`}
            maxLength={100}
            autoComplete="name"
          />
        </div>
        {fieldErrors.name && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {fieldErrors.name}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={loading}
            className={`pl-10 ${fieldErrors.email ? 'border-red-500' : ''}`}
            autoComplete="email"
          />
        </div>
        {fieldErrors.email && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {fieldErrors.email}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            disabled={loading}
            className={`pl-10 pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
            maxLength={128}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {fieldErrors.password}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Password must be at least 6 characters long
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            disabled={loading}
            className={`pl-10 pr-10 ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
            maxLength={128}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!isFormValid || loading}
        size="lg"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}