"use client"

import { useEffect, useState } from "react"
import type { AuditResult } from "@/lib/types"
import { Calendar, ArrowRight, Loader2 } from "lucide-react"

const BOOKING_URL = "https://calendar.notion.so/meet/ollie-ohana/ohana-30min"

export function RecapSection({ result }: { result: AuditResult }) {
  const [recap, setRecap] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchRecap() {
      try {
        const res = await fetch("/api/recap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result }),
        })

        if (!res.ok) throw new Error("Failed")

        const data = await res.json()
        if (!cancelled) {
          setRecap(data.recap || "")
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    fetchRecap()
    return () => {
      cancelled = true
    }
  }, [result])

  // Fallback text if AI fails
  const fallbackRecap = result.salesTalkTrack
    ? `${result.salesTalkTrack.whatWeFound} ${result.salesTalkTrack.whyItMatters}`
    : ""

  const displayText = error ? fallbackRecap : recap

  return (
    <div className="mb-10 print-break-before print-compact">
      <h2 className="font-sans text-2xl font-bold text-foreground mb-2 print:text-xl">
        Recommended next steps
      </h2>

      <div className="rounded-xl bg-foreground text-background p-6 md:p-8">
        {loading ? (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-background/60" />
            <p className="text-sm text-background/60">
              Generating personalised recommendations...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-background/90">
              {displayText}
            </p>

            <div className="pt-4 border-t border-background/20">
              <p className="font-sans text-lg font-bold text-background mb-2">
                Let{"'"}s talk about what we found
              </p>
              <p className="text-sm leading-relaxed text-background/70 mb-4">
                Book a free 30-minute clarity call to walk through your results
                and discuss quick wins.
              </p>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-background text-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
              >
                <Calendar className="h-4 w-4" />
                Book a meeting
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
