import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `reports/${timestamp}-${file.name}`

    const blob = await put(filename, file, {
      access: "public",
      contentType: "application/pdf",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("PDF upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
