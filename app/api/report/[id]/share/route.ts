import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Extract clean site name from URL (removes www, protocol, TLD, paths)
function extractSiteName(url: string): string {
  try {
    let hostname = url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0] // Remove path
      .split("?")[0] // Remove query string
    
    // Remove common TLDs
    hostname = hostname
      .replace(/\.(com|co\.uk|org|net|io|app|dev|studio|shop|store|uk|us|eu|de|fr|es|it|nl|be|au|ca|nz)$/i, "")
    
    // Clean up: lowercase, replace dots/special chars with hyphens, limit length
    return hostname
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
      .substring(0, 30)
  } catch {
    return "report"
  }
}

// Format date as DDMMYY
function formatDateToken(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = String(date.getFullYear()).slice(-2)
  return `${day}${month}${year}`
}

// POST: Generate or retrieve share token for a report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Check if report already has a share token
    const existing = await sql`
      SELECT share_token, url, created_at FROM reports WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    if (existing[0].share_token) {
      // Return existing token
      return NextResponse.json({ token: existing[0].share_token })
    }

    // Generate vanity token: sitename-ddmmyy
    const siteName = extractSiteName(existing[0].url)
    const dateStr = formatDateToken(new Date(existing[0].created_at))
    let token = `${siteName}-${dateStr}`

    // Check for uniqueness, add suffix if needed
    const duplicates = await sql`
      SELECT share_token FROM reports WHERE share_token LIKE ${token + '%'}
    `
    if (duplicates.length > 0) {
      token = `${token}-${duplicates.length + 1}`
    }

    await sql`
      UPDATE reports SET share_token = ${token} WHERE id = ${id}
    `

    return NextResponse.json({ token })
  } catch (e) {
    console.error("[v0] Error generating share token:", e)
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 })
  }
}
