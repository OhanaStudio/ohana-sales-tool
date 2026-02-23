import { NextResponse } from "next/server"
import { getReport, updateReport } from "@/lib/store"
import type { ROICalculationResult } from "@/lib/roi-types"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const roiData: ROICalculationResult = await request.json()
    const report = await getReport(params.id)

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Update the report with ROI data
    report.roiCalculation = roiData
    await updateReport(params.id, report)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update ROI:", error)
    return NextResponse.json(
      { error: "Failed to update ROI" },
      { status: 500 }
    )
  }
}
