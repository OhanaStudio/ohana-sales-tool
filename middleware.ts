import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page, API routes, and static files
  if (pathname === '/login' || pathname.startsWith('/api/') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('ohana-auth')?.value
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
