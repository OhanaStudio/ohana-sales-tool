"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ExternalLink, RotateCcw, Trash2, ChevronDown, ChevronRight, Send } from "lucide-react"
import { SendToMakeDialog } from "./send-to-make-dialog"

interface HistoryItem {
  id: string
  url: string
  timestamp: string
  version: number
  overallScore: number
}

interface GroupedUrl {
  url: string
  displayUrl: string
  items: HistoryItem[]
  latestScore: number
  latestDate: string
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-700"
  if (score >= 50) return "text-amber-700"
  return "text-red-700"
}

function scoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-50 border-emerald-200"
  if (score >= 50) return "bg-amber-50 border-amber-200"
  return "bg-red-50 border-red-200"
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

function groupByUrl(items: HistoryItem[]): GroupedUrl[] {
  const map = new Map<string, HistoryItem[]>()

  for (const item of items) {
    const key = truncateUrl(item.url)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }

  const groups: GroupedUrl[] = []
  for (const [displayUrl, groupItems] of map) {
    // Sort versions descending by date (newest first)
    groupItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    groups.push({
      url: groupItems[0].url,
      displayUrl,
      items: groupItems,
      latestScore: groupItems[0].overallScore,
      latestDate: groupItems[0].timestamp,
    })
  }

  // Sort groups by latest date descending
  groups.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
  return groups
}

export function HistoryList({ items }: { items: HistoryItem[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [rerunningId, setRerunningId] = useState<string | null>(null)
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set())
  const [sendItem, setSendItem] = useState<HistoryItem | null>(null)

  const groups = groupByUrl(items)

  const toggleExpand = (url: string) => {
    setExpandedUrls((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const handleRerun = async (id: string, url: string) => {
    setRerunningId(id)
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.id) {
        window.location.href = `/report/${data.id}`
      }
    } catch {
      setRerunningId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return
    setDeletingId(id)
    try {
      await fetch(`/api/reports?id=${id}`, { method: "DELETE" })
      router.refresh()
      window.location.reload()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedUrls.has(group.displayUrl)
        const hasMultiple = group.items.length > 1
        const latest = group.items[0]

        return (
          <div
            key={group.displayUrl}
            className="border border-border bg-card overflow-hidden"
          >
            {/* Group header — always shows latest version */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Expand toggle */}
              {hasMultiple ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(group.displayUrl)}
                  className="flex items-center justify-center w-6 h-6 shrink-0 text-muted-foreground hover:text-foreground transition-colors bg-transparent min-h-[44px] min-w-[44px] -m-2"
                  aria-label={isExpanded ? "Collapse versions" : "Expand versions"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="w-6 shrink-0" />
              )}

              {/* URL and meta */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground font-medium truncate">
                  {group.displayUrl}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasMultiple
                    ? `${group.items.length} versions -- latest: ${formatDate(latest.timestamp)}, ${formatTime(latest.timestamp)}`
                    : `v${latest.version} -- ${formatDate(latest.timestamp)}, ${formatTime(latest.timestamp)}`}
                </p>
              </div>

              {/* Latest score */}
              <span
                className={cn(
                  "text-xl font-sans tabular-nums shrink-0 font-medium",
                  scoreColor(latest.overallScore)
                )}
              >
                {latest.overallScore}
              </span>

              {/* Actions for latest */}
              <div className="hidden md:flex items-center gap-1 shrink-0">
                <a
                  href={`/report/${latest.id}`}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Report
                </a>
                <button
                  type="button"
                  onClick={() => setSendItem(latest)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 bg-transparent"
                  title="Send to Drive & Notion"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => handleRerun(latest.id, latest.url)}
                  disabled={rerunningId === latest.id}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 disabled:opacity-50 bg-transparent"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${rerunningId === latest.id ? "animate-spin" : ""}`} />
                  {rerunningId === latest.id ? "Running..." : "Rerun"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(latest.id)}
                  disabled={deletingId === latest.id}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors min-h-[44px] px-2 disabled:opacity-50 bg-transparent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Mobile actions for latest */}
              <div className="flex md:hidden items-center gap-1 shrink-0">
                <a
                  href={`/report/${latest.id}`}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSendItem(latest)}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors bg-transparent"
                  title="Send to Drive & Notion"
                >
                  <Send className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRerun(latest.id, latest.url)}
                  disabled={rerunningId === latest.id}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 bg-transparent"
                >
                  <RotateCcw className={`h-4 w-4 ${rerunningId === latest.id ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(latest.id)}
                  disabled={deletingId === latest.id}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Expanded version history */}
            {isExpanded && hasMultiple && (
              <div className="border-t border-border bg-muted/30">
                {group.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 pl-14",
                      idx !== group.items.length - 1 && "border-b border-border/50"
                    )}
                  >
                    {/* Version badge */}
                    <span className={cn(
                      "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 border shrink-0",
                      scoreBg(item.overallScore),
                      scoreColor(item.overallScore)
                    )}>
                      v{item.version}
                    </span>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground flex-1">
                      {formatDate(item.timestamp)}, {formatTime(item.timestamp)}
                    </span>

                    {/* Score */}
                    <span
                      className={cn(
                        "text-sm font-sans tabular-nums font-medium",
                        scoreColor(item.overallScore)
                      )}
                    >
                      {item.overallScore}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <a
                        href={`/report/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="hidden md:inline">Report</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors min-h-[44px] px-2 disabled:opacity-50 bg-transparent"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      </div>

      {sendItem && (
        <SendToMakeDialog
          open={!!sendItem}
          onOpenChange={(open) => { if (!open) setSendItem(null) }}
          reportId={sendItem.id}
          reportUrl={sendItem.url}
          reportScore={sendItem.overallScore}
          reportDate={sendItem.timestamp}
        />
      )}
    </>
  )
}
