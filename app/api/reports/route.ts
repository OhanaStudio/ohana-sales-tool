import { NextResponse } from "next/server"
import { getAllReports } from "@/lib/store"

export async function GET() {
  const reports = getAllReports()
  return NextResponse.json(
    reports.map((r) => ({
      id: r.id,
      url: r.url,
      timestamp: r.timestamp,
      overallScore: r.result.overallScore,
    }))
  )
}
