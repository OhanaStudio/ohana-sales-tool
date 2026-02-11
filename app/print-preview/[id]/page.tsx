"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { AuditResult } from "@/lib/types"
import {
  formatDate,
  countRisks,
  CoverPage,
  IntroPage,
  RiskPage,
  PerfPage,
  UXPage,
  FrictionPage,
  A11yPage,
} from "@/components/print-report"
import { Loader2 } from "lucide-react"

/**
 * A4 at 72 dpi = 595 x 842 px (matches Figma frame).
 * The print-report components now use these exact pixel dimensions,
 * so we render them 1:1 inside matching containers.
 */

const A4_W = 595
const A4_H = 842

export default function PrintPreviewPage() {
  const params = useParams()
  const id = params.id as string
  const [result, setResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/report/${id}`)
        if (res.ok) {
          setResult(await res.json())
          return
        }
      } catch { /* fallback */ }

      try {
        const cached = sessionStorage.getItem(`ohana-report-${id}`)
        if (cached) { setResult(JSON.parse(cached)); return }
      } catch { /* noop */ }

      setLoading(false)
    }
    load().finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <p className="text-neutral-600">Report not found.</p>
      </div>
    )
  }

  const date = formatDate(result.timestamp)
  const risks = countRisks(result)
  const riskLabel = [
    risks.high > 0 ? `${risks.high} High Risks` : "",
    risks.moderate > 0 ? `${risks.moderate} Moderate Risks` : "",
  ].filter(Boolean).join(" | ")

  const pages = [
    { label: "Cover", node: <CoverPage url={result.url} date={date} /> },
    { label: "Introduction", node: <IntroPage r={result} date={date} riskLabel={riskLabel} risks={risks} /> },
    { label: "Risk Cards", node: <RiskPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "Performance", node: <PerfPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "UX Indicators", node: <UXPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "UX Friction", node: <FrictionPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "Accessibility", node: <A11yPage r={result} date={date} riskLabel={riskLabel} /> },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#d4d0cb", padding: "40px 0" }}>
      {/* Title bar */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: 18, fontWeight: 700, color: "#171717", margin: "0 0 4px" }}>
          Print Preview
        </h1>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#525252", margin: 0 }}>
          A4 ratio (595 x 842px) - Content area 405px wide
        </p>
      </div>

      {/* Pages */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        {pages.map((page, i) => (
          <div key={page.label}>
            {/* Page label */}
            <p style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: "#737373",
              margin: "0 0 8px",
              textTransform: "uppercase" as const,
              letterSpacing: "0.08em",
            }}>
              Page {i + 1} - {page.label}
            </p>

            {/* A4 frame — 1:1 rendering */}
            <div
              style={{
                width: A4_W,
                height: A4_H,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {page.node}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom spacing */}
      <div style={{ height: 60 }} />
    </div>
  )
}
