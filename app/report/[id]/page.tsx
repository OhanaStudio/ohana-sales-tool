"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { AuditResult } from "@/lib/types"
import { ReportContent } from "@/components/report-content"
import { TopBar } from "@/components/top-bar"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function ReportPage() {
  const params = useParams()
  const id = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${id}`)
        if (res.ok) {
          const data = await res.json()
          setResult(data)
          return
        }
      } catch {
        // API failed, try fallback
      }

      // Fallback: check sessionStorage (survives server restarts)
      try {
        const cached = sessionStorage.getItem(`ohana-report-${id}`)
        if (cached) {
          setResult(JSON.parse(cached))
          return
        }
      } catch {
        // sessionStorage unavailable
      }

      setError("Report not found. It may have expired.")
      setLoading(false)
    }
    fetchReport().finally(() => setLoading(false))
  }, [id, mounted])

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="font-serif text-4xl md:text-[5.25rem] md:leading-[1.1] text-foreground mb-2">Report not found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {error || "This report may have expired or the URL is incorrect."}
          </p>
          <a
            href="/"
            className="inline-flex items-center rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Run a new check
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <TopBar />
      <ReportContent result={result} userName={user?.name} />
    </>
  )
}
