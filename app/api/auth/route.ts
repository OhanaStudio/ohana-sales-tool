import { NextRequest, NextResponse } from "next/server"

// User database - username: password
const VALID_USERS: Record<string, { password: string; name: string }> = {
  ollie: {
    password: "notber-8syjvi-sivnaV",
    name: "Ollie Brown",
  },
}

export async function GET(request: NextRequest) {
  const username = request.cookies.get("ohana-auth")?.value
  if (username && VALID_USERS[username]) {
    return NextResponse.json({
      authenticated: true,
      username,
      name: VALID_USERS[username].name,
    })
  }
  return NextResponse.json({ authenticated: false }, { status: 401 })
}

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json(
      { error: "Missing username or password" },
      { status: 400 }
    )
  }

  const user = VALID_USERS[username]
  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    )
  }

  const res = NextResponse.json({
    ok: true,
    username,
    name: user.name,
  })

  res.cookies.set("ohana-auth", username, {
    httpOnly: true,
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
  return res
}
