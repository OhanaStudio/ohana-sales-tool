import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { ROICalculationResult } from "@/lib/roi-types"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const roiData: ROICalculationResult = await request.json()

    const sql = neon(process.env.DATABASE_URL!)

    // Get the current report
    const rows = await sql`
      SELECT result_json
      FROM reports
      WHERE id = ${id}
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Update the result_json with ROI data
    const currentResult = rows[0].result_json
    currentResult.roiCalculation = roiData

    await sql`
      UPDATE reports
      SET result_json = ${JSON.stringify(currentResult)}
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] ROI update error:", error)
    return NextResponse.json({ error: "Failed to save ROI calculation" }, { status: 500 })
  }
}
