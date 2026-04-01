import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

// Legacy passwords for migration - will be replaced when users change password
const LEGACY_PASSWORDS: Record<string, string> = {
  ollie: "notber-8syjvi-sivnaV",
  mark: "xelpar-4tyrwi-huvQax",
  james: "qonzev-3bemki-xyNfur",
}

const VALID_USERS: Record<string, { name: string }> = {
  ollie: { name: "Ollie Brown" },
  mark: { name: "Mark Halliwell" },
  james: { name: "James Brown-Clarke" },
}

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json(
      { error: "Missing username or password" },
      { status: 400 }
    )
  }

  // Check if user exists in allowed list
  if (!VALID_USERS[username]) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    )
  }

  // Try to get user from database for updated password
  let passwordValid = false
  try {
    const users = await sql`SELECT * FROM users WHERE username = ${username}`
    if (users.length > 0 && users[0].password_hash !== "placeholder") {
      // Check against hashed password in DB
      passwordValid = await bcrypt.compare(password, users[0].password_hash)
    } else {
      // Fallback to legacy hardcoded password
      passwordValid = password === LEGACY_PASSWORDS[username]
    }
  } catch {
    // DB error - fallback to legacy
    passwordValid = password === LEGACY_PASSWORDS[username]
  }

  if (!passwordValid) {
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
    name: VALID_USERS[username].name,
  })
}

export async function GET() {
  const cookieStore = await cookies()
  const username = cookieStore.get("auth")?.value

  if (username && VALID_USERS[username]) {
    return NextResponse.json({
      authenticated: true,
      username,
      name: VALID_USERS[username].name,
    })
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("auth")
  return NextResponse.json({ ok: true })
}
