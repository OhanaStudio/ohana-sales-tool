"use client"

import { useEffect, useState, useCallback } from "react"
import { TopBar } from "@/components/top-bar"
import { HistoryList } from "@/components/history-list"
import { Loader2, Trash2 } from "lucide-react"

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchHistory = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/reports?all=true", { method: "DELETE" })
      if (res.ok) {
        setItems([])
        setShowDeleteModal(false)
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="px-5 md:px-8 max-w-4xl mx-auto pb-12">
        <div className="pt-8 md:pt-12 pb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl md:text-[5.25rem] md:leading-[1.1] text-foreground text-balance">
              History.
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              All health checks with version tracking per URL.
            </p>
          </div>
          {!loading && items.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-red-600 transition-colors min-h-[44px] px-3 py-2 border border-border rounded-lg hover:border-red-300 bg-transparent shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden md:inline">Delete All</span>
            </button>
          )}
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

      {/* Delete All Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deleting && setShowDeleteModal(false)}
            onKeyDown={(e) => e.key === "Escape" && !deleting && setShowDeleteModal(false)}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          />
          <div className="relative bg-card border border-border rounded-xl shadow-lg max-w-sm w-full mx-5 p-6" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <h2 id="delete-modal-title" className="text-lg font-medium text-foreground">
              Delete all reports?
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              This will permanently delete {items.length} report{items.length !== 1 ? "s" : ""} from the database. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-transparent border border-border rounded-lg hover:bg-muted transition-colors min-h-[44px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors min-h-[44px] disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
