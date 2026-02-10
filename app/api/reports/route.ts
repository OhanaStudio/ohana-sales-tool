import { NextResponse } from "next/server"
import { getAllReports, getReportsForUrl, deleteReport } from "@/lib/store"

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

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  await deleteReport(id)
  return NextResponse.json({ success: true })
}
