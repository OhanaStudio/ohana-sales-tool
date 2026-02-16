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

  const cookieStore = await cookies()
  cookieStore.set("auth", username, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.json({
    ok: true,
    username,
    name: user.name,
  })
}

export async function GET() {
  const cookieStore = await cookies()
  const username = cookieStore.get("auth")?.value
  
  console.log("[v0] Auth GET called")
  console.log("[v0] Auth cookie username:", username)

  if (username && VALID_USERS[username]) {
    const userData = {
      authenticated: true,
      username,
      name: VALID_USERS[username].name,
    }
    console.log("[v0] Returning user data:", userData)
    return NextResponse.json(userData)
  }

  console.log("[v0] No valid user, returning 401")
  return NextResponse.json({ authenticated: false }, { status: 401 })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("auth")
  return NextResponse.json({ ok: true })
}
