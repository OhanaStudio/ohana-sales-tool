import { NextRequest, NextResponse } from "next/server"

const VALID_USERS = {
  ollie: "notber-8syjvi-sivnaV",
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Check for auth cookie on protected routes
  const authCookie = request.cookies.get("ohana-auth")?.value
  if (!authCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
