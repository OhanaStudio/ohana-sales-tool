"use client"

import React from "react"
import type { AuditResult } from "@/lib/types"
import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/top-bar"
import { LoadingSteps } from "@/components/loading-steps"
import { AuthGuard } from "@/components/auth-guard"
import { Search, Clock } from "lucide-react"


export default function Page() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AuditResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleCancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }

      // Cache in sessionStorage so the report page can access it immediately
      try {
        sessionStorage.setItem(`ohana-report-${data.id}`, JSON.stringify(data))
      } catch {
        // sessionStorage full or unavailable
      }
      router.push(`/report/${data.id}`)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError("Unable to connect. Please check your internet and try again.")
    } finally {
      abortRef.current = null
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />

        <main className="px-5 md:px-8 max-w-[900px] mx-auto pb-12 w-full flex-1 flex flex-col">
        {/* Hero */}
        {!loading && (
          <div className="pt-12 md:pt-20 pb-8 md:pb-12 text-center">
            <h1 className="font-serif text-4xl md:text-[5.25rem] md:leading-[1.1] text-foreground leading-tight text-balance mb-4">
              Website health check.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed mx-auto">
              A high-level diagnostic using Lighthouse data and simple UX indicators.
            </p>
          </div>
        )}

        {/* URL Input */}
        {!loading && (
          <>
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter a website URL"
                    className="w-full rounded-lg border border-border bg-card text-foreground pl-12 pr-4 py-3.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[48px]"
                    disabled={loading}
                    autoComplete="url"
                    aria-label="Website URL"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="rounded-lg bg-foreground text-background px-6 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 min-h-[48px] sm:w-auto"
                >
                  {loading ? "Running..." : "Run health check"}
                </button>
              </div>
            </form>
            <div className="flex justify-center mb-6">
              <a
                href="/history"
                className="inline-flex items-center gap-1.5 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-4 py-2"
              >
                <Clock className="h-3.5 w-3.5" />
                Health check history
              </a>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSteps onCancel={handleCancel} />
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  )
}
