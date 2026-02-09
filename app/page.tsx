"use client"

import React from "react"

import { useState } from "react"
import type { AuditResult } from "@/lib/types"
import { TopBar } from "@/components/top-bar"
import { LoadingSteps } from "@/components/loading-steps"
import { ResultsDashboard } from "@/components/results-dashboard"
import { Search } from "lucide-react"

export default function Page() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }

      const auditResult = data as AuditResult
      setResult(auditResult)
      // Cache in sessionStorage so the report page can access it after server restarts
      try {
        sessionStorage.setItem(`ohana-report-${auditResult.id}`, JSON.stringify(auditResult))
      } catch {
        // sessionStorage full or unavailable
      }
    } catch {
      setError("Unable to connect. Please check your internet and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <main className="px-5 md:px-8 max-w-3xl mx-auto pb-12">
        {/* Hero */}
        {!result && !loading && (
          <div className="pt-12 md:pt-20 pb-8 md:pb-12">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight text-balance mb-4">
              Website health check.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
              A high-level diagnostic using Lighthouse data and simple UX indicators.
            </p>
          </div>
        )}

        {/* URL Input */}
        {!result && (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter a website URL"
                  className="w-full rounded-lg border border-border bg-card text-foreground pl-12 pr-4 py-3.5 text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[48px]"
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
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSteps />}

        {/* Results */}
        {result && (
          <div className="pt-8 md:pt-12">
            <button
              type="button"
              onClick={() => {
                setResult(null)
                setUrl("")
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              {"<-"} Run another check
            </button>
            <ResultsDashboard result={result} />
          </div>
        )}
      </main>
    </div>
  )
}
