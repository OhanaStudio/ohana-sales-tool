import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Empty middleware - auth is handled in components
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
