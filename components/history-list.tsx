"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ExternalLink, RotateCcw, Trash2 } from "lucide-react"

interface HistoryItem {
  id: string
  url: string
  timestamp: string
  version: number
  overallScore: number
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-700"
  if (score >= 50) return "text-amber-700"
  return "text-red-700"
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function truncateUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "")
  } catch {
    return url
  }
}

export function HistoryList({ items }: { items: HistoryItem[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return
    setDeletingId(id)
    try {
      await fetch(`/api/reports?id=${id}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-sm text-card-foreground font-medium truncate">
                  {truncateUrl(item.url)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  v{item.version} -- {formatDate(item.timestamp)}, {formatTime(item.timestamp)}
                </p>
              </div>
              <span
                className={cn(
                  "text-2xl font-sans tabular-nums shrink-0",
                  scoreColor(item.overallScore)
                )}
              >
                {item.overallScore}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/report/${item.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card text-card-foreground px-3 py-2 text-xs font-medium hover:bg-accent transition-colors min-h-[44px] flex-1 justify-center"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View report
              </Link>
              <Link
                href={`/?rerun=${encodeURIComponent(item.url)}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card text-card-foreground px-3 py-2 text-xs font-medium hover:bg-accent transition-colors min-h-[44px] flex-1 justify-center"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Rerun
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-card text-red-600 px-3 py-2 text-xs font-medium hover:bg-red-50 transition-colors min-h-[44px] disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  URL
                </th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Version
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Score
                </th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">
                    {truncateUrl(item.url)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground text-center tabular-nums">
                    v{item.version}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(item.timestamp)}, {formatTime(item.timestamp)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-sans text-lg tabular-nums",
                      scoreColor(item.overallScore)
                    )}
                  >
                    {item.overallScore}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/report/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Report
                      </Link>
                      <Link
                        href={`/?rerun=${encodeURIComponent(item.url)}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Rerun
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors min-h-[44px] disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
