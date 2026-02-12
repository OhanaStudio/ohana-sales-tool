import { NextRequest, NextResponse } from "next/server"

// Authentication API handler - tracks logged-in user as "Ollie Brown"
/* GET /api/auth — check if the user is authenticated via the httpOnly cookie */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("ohana-auth")?.value
  const username = request.cookies.get("ohana-user")?.value
  if (token === "true") {
    return NextResponse.json({ authenticated: true, username: username || "Ollie Brown" })
  }
  return NextResponse.json({ authenticated: false }, { status: 401 })
}

export async function POST(request: Request) {
  const { password } = await request.json()

  if (!password || password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, username: "Ollie Brown" })
  res.cookies.set("ohana-auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  res.cookies.set("ohana-user", "Ollie Brown", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("ohana-auth", "", { path: "/", maxAge: 0 })
  res.cookies.set("ohana-user", "", { path: "/", maxAge: 0 })
  return res
}
