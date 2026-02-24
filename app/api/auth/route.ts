import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const VALID_USERS: Record<string, { password: string; name: string }> = {
  ollie: {
    password: "notber-8syjvi-sivnaV",
    name: "Ollie Brown",
  },
  mark: {
    password: "xelpar-4tyrwi-huvQax",
    name: "Mark Halliwell",
  },
  james: {
    password: "qonzev-3bemki-xyNfur",
    name: "James Brown-Clarke",
  },
}

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  console.log("[v0] [SERVER] Login attempt - username:", username)

  if (!username || !password) {
    console.log("[v0] [SERVER] Login failed - missing credentials")
    return NextResponse.json(
      { error: "Missing username or password" },
      { status: 400 }
    )
  }

  const user = VALID_USERS[username]
  if (!user || user.password !== password) {
    console.log("[v0] [SERVER] Login failed - invalid credentials for:", username)
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    )
  }

  console.log("[v0] [SERVER] Login successful - username:", username, "name:", user.name)
  const cookieStore = await cookies()
  cookieStore.set("auth", username, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  console.log("[v0] [SERVER] Auth cookie set for:", username)

  return NextResponse.json({
    ok: true,
    username,
    name: user.name,
  })
}

export async function GET() {
  console.log("[v0] [SERVER] Auth GET endpoint called")
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth")
  const username = authCookie?.value
  
  console.log("[v0] [SERVER] All cookies:", cookieStore.getAll())
  console.log("[v0] [SERVER] Auth cookie value:", username)
  console.log("[v0] [SERVER] User exists in VALID_USERS:", username ? !!VALID_USERS[username] : false)

  if (username && VALID_USERS[username]) {
    const userData = {
      authenticated: true,
      username,
      name: VALID_USERS[username].name,
    }
    console.log("[v0] [SERVER] Returning authenticated user:", userData)
    return NextResponse.json(userData)
  }

  console.log("[v0] [SERVER] No valid auth cookie, returning 401")
  return NextResponse.json({ authenticated: false }, { status: 401 })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("auth")
  return NextResponse.json({ ok: true })
}
