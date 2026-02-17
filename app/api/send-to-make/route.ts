import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Make.com webhook URL not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()

    const {
      pdfUrl,
      companyName,
      contactName,
      email,
      phone,
      reportUrl,
      websiteUrl,
      overallScore,
      preparedBy,
      date,
    } = body

    if (!pdfUrl || !companyName || !contactName || !email) {
      return NextResponse.json(
        { error: "Missing required fields: pdfUrl, companyName, contactName, email" },
        { status: 400 }
      )
    }

    // Send to Make.com webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdfUrl,
        companyName,
        contactName,
        email,
        phone: phone || "",
        reportUrl: reportUrl || "",
        websiteUrl: websiteUrl || "",
        overallScore: overallScore ?? null,
        preparedBy: preparedBy || "",
        date: date || new Date().toISOString(),
      }),
    })

    if (!webhookResponse.ok) {
      const text = await webhookResponse.text()
      console.error("Make.com webhook error:", text)
      return NextResponse.json(
        { error: "Failed to send to Make.com" },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Send to Make.com error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
