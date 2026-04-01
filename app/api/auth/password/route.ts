import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

// Get current user from cookie
async function getCurrentUser() {
  const cookieStore = await cookies()
  const username = cookieStore.get("auth")?.value
  if (!username) return null
  
  // Also check localStorage fallback via header
  return username
}

// PUT - Update password
export async function PUT(request: NextRequest) {
  // Get username from cookie or header (localStorage fallback)
  const cookieStore = await cookies()
  let username = cookieStore.get("auth")?.value
  
  // Fallback to header if cookie not available (preview environment issue)
  if (!username) {
    username = request.headers.get("x-auth-user") || null
  }
  
  if (!username) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
    }

    // Get user from database
    const users = await sql`SELECT * FROM users WHERE username = ${username}`
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Check current password
    // If password_hash is 'placeholder', accept the hardcoded password for migration
    const LEGACY_PASSWORDS: Record<string, string> = {
      ollie: "Ohana2025!",
      mark: "Sales2025!",
      james: "Design2025!",
    }

    let passwordValid = false
    if (user.password_hash === "placeholder") {
      // Legacy: check against hardcoded password
      passwordValid = currentPassword === LEGACY_PASSWORDS[username]
    } else {
      // Check against hashed password
      passwordValid = await bcrypt.compare(currentPassword, user.password_hash)
    }

    if (!passwordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 })
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 10)
    await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE username = ${username}`

    return NextResponse.json({ ok: true, message: "Password updated successfully" })
  } catch (e) {
    console.error("[v0] Password update error:", e)
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
  }
}
