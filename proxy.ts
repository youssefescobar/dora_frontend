import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const role = request.cookies.get('role')?.value
  const path = request.nextUrl.pathname

  // Protected routes
  if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  // Admin only routes
  if (path.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Login/Register redirect if already logged in
  if (path === '/auth' && token) {
     if (role === 'admin') {
       return NextResponse.redirect(new URL('/admin', request.url))
     }
     return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth'],
}
