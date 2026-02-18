import { neon } from "@neondatabase/serverless"
import type { StoredReport } from "./types"

let cachedDb: ReturnType<typeof neon> | null = null

function getDb() {
  // Use cached connection if available
  if (cachedDb) return cachedDb
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error("[v0] DATABASE_URL not found in environment. Database operations will fail.")
    console.error("[v0] This may be temporary during environment reload. Please check Vars section.")
    throw new Error(
      "DATABASE_URL environment variable is not set. Please check the Vars section in v0 sidebar."
    )
  }
  
  // Cache the connection for reuse
  cachedDb = neon(databaseUrl)
  return cachedDb
}

/** Strip www., trailing slashes, lowercase hostname so variants match */
function normalizeUrl(input: string): string {
  try {
    const parsed = new URL(input)
    parsed.hostname = parsed.hostname.replace(/^www\./, "").toLowerCase()
    if (parsed.pathname === "/") parsed.pathname = ""
    return parsed.toString().replace(/\/$/, "")
  } catch {
    return input.replace(/^www\./, "").toLowerCase().replace(/\/$/, "")
  }
}

export async function saveReport(report: StoredReport): Promise<void> {
  const sql = getDb()
  const normalizedUrl = normalizeUrl(report.url)

  // Calculate the next version for this URL
  const versionRows = await sql`
    SELECT COALESCE(MAX(version), 0) AS max_version
    FROM reports
    WHERE url = ${normalizedUrl}
  `
  const nextVersion = (versionRows[0]?.max_version ?? 0) + 1

  await sql`
    INSERT INTO reports (id, url, timestamp, version, overall_score, summary_text, result_json)
    VALUES (
      ${report.id},
      ${normalizedUrl},
      ${report.timestamp},
      ${nextVersion},
      ${report.result.overallScore},
      ${report.result.executiveSummary || ""},
      ${JSON.stringify(report.result)}
    )
  `
}

export async function getReport(id: string): Promise<StoredReport | undefined> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, url, timestamp, result_json
    FROM reports
    WHERE id = ${id}
  `
  if (rows.length === 0) return undefined
  return {
    id: rows[0].id,
    url: rows[0].url,
    timestamp: rows[0].timestamp,
    result: rows[0].result_json,
  }
}

export async function getCachedReportForUrl(url: string): Promise<StoredReport | undefined> {
  const sql = getDb()
  const normalizedUrl = normalizeUrl(url)
  // Return most recent report for this URL within last 1 hour
  const rows = await sql`
    SELECT id, url, timestamp, result_json
    FROM reports
    WHERE url = ${normalizedUrl}
      AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY version DESC
    LIMIT 1
  `
  if (rows.length === 0) return undefined
  return {
    id: rows[0].id,
    url: rows[0].url,
    timestamp: rows[0].timestamp,
    result: rows[0].result_json,
  }
}

export async function getAllReports(): Promise<{
  id: string
  url: string
  timestamp: string
  version: number
  overallScore: number
}[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, url, timestamp, version, overall_score
    FROM reports
    ORDER BY created_at DESC
    LIMIT 100
  `
  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    timestamp: r.timestamp,
    version: r.version,
    overallScore: r.overall_score,
  }))
}

export async function getReportsForUrl(url: string): Promise<{
  id: string
  url: string
  timestamp: string
  version: number
  overallScore: number
}[]> {
  const sql = getDb()
  const normalizedUrl = normalizeUrl(url)
  const rows = await sql`
    SELECT id, url, timestamp, version, overall_score
    FROM reports
    WHERE url = ${normalizedUrl}
    ORDER BY version DESC
  `
  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    timestamp: r.timestamp,
    version: r.version,
    overallScore: r.overall_score,
  }))
}

export async function deleteReport(id: string): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM reports WHERE id = ${id}`
}
