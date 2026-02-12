import { NextRequest, NextResponse } from "next/server"

// Authentication API handler - email as username, name for reports
/* GET /api/auth — check if the user is authenticated via the httpOnly cookie */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("ohana-auth")?.value
  const email = request.cookies.get("ohana-email")?.value
  const name = request.cookies.get("ohana-name")?.value
  if (token === "true") {
    return NextResponse.json({ 
      authenticated: true, 
      email: email || "ollie@ohana.studio",
      name: name || "Ollie Brown"
    })
  }
  return NextResponse.json({ authenticated: false }, { status: 401 })
}

export async function POST(request: Request) {
  const { password } = await request.json()

  if (!password || password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  const res = NextResponse.json({ 
    ok: true, 
    email: "ollie@ohana.studio",
    name: "Ollie Brown"
  })
  res.cookies.set("ohana-auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  res.cookies.set("ohana-email", "ollie@ohana.studio", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  res.cookies.set("ohana-name", "Ollie Brown", {
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
  res.cookies.set("ohana-email", "", { path: "/", maxAge: 0 })
  res.cookies.set("ohana-name", "", { path: "/", maxAge: 0 })
  return res
}
