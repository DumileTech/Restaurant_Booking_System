import { createClient } from '@/utils/supabase/client'

export const signInWithEmail = async (email: string) => {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) throw error
}

export const signOut = async () => {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const createUserProfile = async (user: any) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || '',
    })
  
  if (error) throw error
}