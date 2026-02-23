import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}
const sql = neon(databaseUrl)

const rows = await sql`SELECT id, url, created_at, result FROM reports ORDER BY created_at DESC LIMIT 1`

if (rows.length === 0) {
  console.log("No reports found")
  process.exit(0)
}

const report = rows[0]
const result = typeof report.result === "string" ? JSON.parse(report.result) : report.result

console.log("Report ID:", report.id)
console.log("URL:", report.url)
console.log("Created:", report.created_at)
console.log("")
console.log("=== ADVANCED UX - FIRST IMPRESSION ===")
console.log(JSON.stringify(result.advancedUX?.firstImpression, null, 2))
console.log("")
console.log("=== SALES TALK TRACK (H1 mentions) ===")
const talkTrack = JSON.stringify(result.salesTalkTrack)
if (talkTrack && talkTrack.includes("H1")) {
  console.log("H1 mentioned in sales talk track")
}
console.log("")
console.log("=== RISK CARDS (H1 mentions) ===")
const riskCards = JSON.stringify(result.riskCards)
if (riskCards && riskCards.includes("H1")) {
  const h1Idx = riskCards.indexOf("H1")
  console.log("H1 found in risk cards at:", riskCards.substring(Math.max(0, h1Idx - 100), h1Idx + 100))
}
