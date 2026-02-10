import { neon } from "@neondatabase/serverless"
import type { StoredReport } from "./types"

function getConnectionString() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_AUTHENTICATED_URL ||
    process.env.NEON_DATABASE_URL ||
    ""
  return url
}

function getDb() {
  const connStr = getConnectionString()
  if (!connStr) return null
  return neon(connStr)
}

// In-memory fallback when no DB is configured
const memoryStore = new Map<string, StoredReport>()

export async function saveReport(report: StoredReport): Promise<void> {
  const sql = getDb()
  if (!sql) {
    memoryStore.set(report.id, report)
    return
  }

  const versionRows = await sql`
    SELECT COALESCE(MAX(version), 0) AS max_version
    FROM reports
    WHERE url = ${report.url}
  `
  const nextVersion = (versionRows[0]?.max_version ?? 0) + 1

  await sql`
    INSERT INTO reports (id, url, timestamp, version, overall_score, summary_text, result_json)
    VALUES (
      ${report.id},
      ${report.url},
      ${report.timestamp},
      ${nextVersion},
      ${report.result.overallScore},
      ${report.result.executiveSummary || ""},
      ${JSON.stringify(report.result)}
    )
  `
}

/** Safely parse result_json -- Neon JSONB may come back as object or string */
function parseResultJson(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  if (typeof raw === "object" && raw !== null) return raw as Record<string, unknown>
  return {}
}

export async function getReport(id: string): Promise<StoredReport | undefined> {
  const sql = getDb()
  if (!sql) {
    return memoryStore.get(id)
  }

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
    result: parseResultJson(rows[0].result_json),
  }
}

export async function getCachedReportForUrl(url: string): Promise<StoredReport | undefined> {
  const sql = getDb()
  if (!sql) {
    for (const r of memoryStore.values()) {
      if (r.url === url) return r
    }
    return undefined
  }

  const rows = await sql`
    SELECT id, url, timestamp, result_json
    FROM reports
    WHERE url = ${url}
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY version DESC
    LIMIT 1
  `
  if (rows.length === 0) return undefined
  return {
    id: rows[0].id,
    url: rows[0].url,
    timestamp: rows[0].timestamp,
    result: parseResultJson(rows[0].result_json),
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
  if (!sql) {
    return Array.from(memoryStore.values()).map((r) => ({
      id: r.id,
      url: r.url,
      timestamp: r.timestamp,
      version: 1,
      overallScore: r.result.overallScore,
    }))
  }

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
  if (!sql) {
    return Array.from(memoryStore.values())
      .filter((r) => r.url === url)
      .map((r) => ({
        id: r.id,
        url: r.url,
        timestamp: r.timestamp,
        version: 1,
        overallScore: r.result.overallScore,
      }))
  }

  const rows = await sql`
    SELECT id, url, timestamp, version, overall_score
    FROM reports
    WHERE url = ${url}
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
  if (!sql) {
    memoryStore.delete(id)
    return
  }
  await sql`DELETE FROM reports WHERE id = ${id}`
}
