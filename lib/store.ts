import type { StoredReport } from "./types"

// In-memory store - swap to Supabase later
const reports = new Map<string, StoredReport>()
const urlCache = new Map<string, { id: string; timestamp: number }>()

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export function saveReport(report: StoredReport): void {
  reports.set(report.id, report)
  urlCache.set(report.url, {
    id: report.id,
    timestamp: Date.now(),
  })
}

export function getReport(id: string): StoredReport | undefined {
  return reports.get(id)
}

export function getCachedReportForUrl(url: string): StoredReport | undefined {
  const cached = urlCache.get(url)
  if (!cached) return undefined
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    urlCache.delete(url)
    return undefined
  }
  return reports.get(cached.id)
}

export function getAllReports(): StoredReport[] {
  return Array.from(reports.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export function deleteReport(id: string): void {
  const report = reports.get(id)
  if (report) {
    reports.delete(id)
    const cached = urlCache.get(report.url)
    if (cached?.id === id) {
      urlCache.delete(report.url)
    }
  }
}
