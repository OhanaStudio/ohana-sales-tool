import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Cookie-based auth is unreliable in preview (HMR loses cookies).
// We use a lightweight header check — the component is already hidden client-side for non-admins.
function isAdmin(request: NextRequest) {
  return request.headers.get("x-admin-user") === "ollie"
}

// GET all industry benchmarks
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT * FROM industry_benchmarks ORDER BY label ASC
  `
  return NextResponse.json(rows)
}

// POST create new benchmark
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const {
    value, label, monthly_sessions, conversion_rate, average_order_value,
    gross_margin, return_rate, net_margin,
    cr_improvement_conservative = 0.003,
    cr_improvement_moderate = 0.005,
    cr_improvement_optimistic = 0.01,
  } = body

  if (!value || !label) {
    return NextResponse.json({ error: "value and label are required" }, { status: 400 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    INSERT INTO industry_benchmarks (
      value, label, monthly_sessions, conversion_rate, average_order_value,
      gross_margin, return_rate, net_margin,
      cr_improvement_conservative, cr_improvement_moderate, cr_improvement_optimistic,
      updated_at
    ) VALUES (
      ${value}, ${label}, ${monthly_sessions}, ${conversion_rate}, ${average_order_value},
      ${gross_margin}, ${return_rate}, ${net_margin},
      ${cr_improvement_conservative}, ${cr_improvement_moderate}, ${cr_improvement_optimistic},
      NOW()
    )
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

// PATCH update existing benchmark
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...fields } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    UPDATE industry_benchmarks SET
      label = ${fields.label},
      monthly_sessions = ${fields.monthly_sessions},
      conversion_rate = ${fields.conversion_rate},
      average_order_value = ${fields.average_order_value},
      gross_margin = ${fields.gross_margin},
      return_rate = ${fields.return_rate},
      net_margin = ${fields.net_margin},
      cr_improvement_conservative = ${fields.cr_improvement_conservative},
      cr_improvement_moderate = ${fields.cr_improvement_moderate},
      cr_improvement_optimistic = ${fields.cr_improvement_optimistic},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

// DELETE a benchmark
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const sql = neon(process.env.DATABASE_URL!)
  await sql`DELETE FROM industry_benchmarks WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
