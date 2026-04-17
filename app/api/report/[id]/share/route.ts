import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

// POST: Generate or retrieve share token for a report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Check if report already has a share token
    const existing = await sql`
      SELECT share_token FROM reports WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    if (existing[0].share_token) {
      // Return existing token
      return NextResponse.json({ token: existing[0].share_token })
    }

    // Generate new token
    const token = crypto.randomBytes(16).toString("hex")

    await sql`
      UPDATE reports SET share_token = ${token} WHERE id = ${id}
    `

    return NextResponse.json({ token })
  } catch (e) {
    console.error("[v0] Error generating share token:", e)
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 })
  }
}
