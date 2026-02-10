import { NextResponse } from "next/server"
import { getAllReports, getReportsForUrl } from "@/lib/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (url) {
    // Get version history for a specific URL
    const reports = await getReportsForUrl(url)
    return NextResponse.json(reports)
  }

  // Get all reports
  const reports = await getAllReports()
  return NextResponse.json(reports)
}
