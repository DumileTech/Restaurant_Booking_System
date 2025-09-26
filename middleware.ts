import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from './utils/supabase/middleware'

export async function middleware(req: NextRequest) {
  const { supabase, response } = createClient(req)

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ['/account', '/admin', '/book']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Auth routes that should redirect if already logged in
  const authRoutes = ['/signin', '/signup']
  const isAuthRoute = authRoutes.includes(req.nextUrl.pathname)

  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/account', req.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}