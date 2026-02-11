import { NextRequest, NextResponse } from "next/server"

/* GET /api/auth — check if the user is authenticated via the httpOnly cookie */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("ohana-auth")?.value
  if (token === "true") {
    return NextResponse.json({ authenticated: true })
  }
  return NextResponse.json({ authenticated: false }, { status: 401 })
}

export async function POST(request: Request) {
  const { password } = await request.json()

  if (!password || password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  // Set an HTTP-only cookie that persists across tabs / browser restarts (7 days)
  res.cookies.set("ohana-auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("ohana-auth", "", { path: "/", maxAge: 0 })
  return res
}
