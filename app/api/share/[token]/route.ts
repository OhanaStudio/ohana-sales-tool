import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// GET: Retrieve report data by share token (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const reports = await sql`
      SELECT * FROM reports WHERE share_token = ${token}
    `

    if (reports.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const report = reports[0]

    return NextResponse.json({
      id: report.id,
      url: report.url,
      result: report.result,
      created_at: report.created_at,
      roi_data: report.roi_data,
    })
  } catch (e) {
    console.error("[v0] Error fetching shared report:", e)
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 })
  }
}
