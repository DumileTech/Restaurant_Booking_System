// Client-side wrappers for auth actions

import { registerUser as registerUserServer, loginUser as loginUserServer, logoutUser as logoutUserServer } from '@/lib/actions/server/auth.actions'

export async function registerUser(formData: FormData) {
  return await registerUserServer(formData)
}

export async function loginUser(formData: FormData) {
  return await loginUserServer(formData)
}

export async function logoutUser() {
  return await logoutUserServer()
}