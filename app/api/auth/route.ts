import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { password } = await request.json()

  if (!password || password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
