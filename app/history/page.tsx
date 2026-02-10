"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/top-bar"
import { HistoryList } from "@/components/history-list"
import { Loader2 } from "lucide-react"

interface HistoryItem {
  id: string
  url: string
  timestamp: string
  version: number
  overallScore: number
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/reports")
        if (res.ok) {
          const data = await res.json()
          setItems(data)
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="px-5 md:px-8 max-w-4xl mx-auto pb-12">
        <div className="pt-8 md:pt-12 pb-6">
          <h1 className="font-serif text-4xl md:text-[5.25rem] md:leading-[1.1] text-foreground text-balance">
            History.
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            All health checks with version tracking per URL.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground mb-4">
              No checks have been run yet.
            </p>
            <a
              href="/"
              className="inline-flex items-center rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
            >
              Run your first check
            </a>
          </div>
        )}

        {!loading && items.length > 0 && <HistoryList items={items} />}
      </main>
    </div>
  )
}
