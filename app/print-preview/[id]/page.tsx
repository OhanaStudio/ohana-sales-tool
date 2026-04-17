"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { TopBar } from "@/components/top-bar"
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
  ROIPage,
  CTAPage,
  } from "@/components/print-report"
import { ArrowLeft, Loader2, Printer } from "lucide-react"


/**
 * A4 at 72 dpi = 595 x 842 px (matches Figma frame).
 * The print-report components now use these exact pixel dimensions,
 * so we render them 1:1 inside matching containers.
 */

const A4_W = 595
const A4_H = 842
const CONTENT_W = A4_W - 97.5 - 92 // matches print-report: PAD_L + PAD_R

export default function PrintPreviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const id = params.id as string
  const [result, setResult] = useState<AuditResult | null>(null)
  const [recapText, setRecapText] = useState<string>("")
  const [loading, setLoading] = useState(true)
  
  // Detect iOS/mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent
      const isIOS = /iPad|iPhone|iPod/.test(ua)
      const isAndroid = /Android/.test(ua)
      const isMobileWidth = window.innerWidth < 768
      setIsMobile(isIOS || isAndroid || isMobileWidth)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    async function load() {
      let r: AuditResult | null = null
      try {
        const res = await fetch(`/api/report/${id}`)
        if (res.ok) { r = await res.json() }
      } catch { /* fallback */ }

      if (!r) {
        try {
          const cached = sessionStorage.getItem(`ohana-report-${id}`)
          if (cached) { r = JSON.parse(cached) }
        } catch { /* noop */ }
      }

      if (r) {
        setResult(r)
        // Fetch AI recap (same as RecapSection on the report page)
        try {
          const recapRes = await fetch("/api/recap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ result: r }),
          })
          if (recapRes.ok) {
            const data = await recapRes.json()
            if (data.recap) setRecapText(data.recap)
          }
        } catch { /* use fallback salesTalkTrack */ }
      }

      setLoading(false)
    }
    load()
  }, [id])

  // Auto-trigger print dialog when arriving from the report page's "Download PDF" button
  useEffect(() => {
    if (!loading && result && searchParams.get('auto') === 'print') {
      // Small delay to ensure fonts/images are loaded and paint is complete
      const timer = setTimeout(() => window.print(), 600)
      return () => clearTimeout(timer)
    }
  }, [loading, result, searchParams])

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

  // Build pages array with ROI second-to-last when available
  const pages = [
    { label: "Cover", node: <CoverPage url={result.url} date={date} preparedBy={user?.name} /> },
    { label: "Introduction", node: <IntroPage r={result} date={date} riskLabel={riskLabel} risks={risks} recapText={recapText} /> },
    { label: "Risk Cards", node: <RiskPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "Performance", node: <PerfPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "UX Indicators", node: <UXPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "UX Friction", node: <FrictionPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "Accessibility", node: <A11yPage r={result} date={date} riskLabel={riskLabel} /> },
    // ROI Estimation appears second-to-last when data exists
    ...(result.roiCalculation ? [{ label: "ROI Estimation", node: <ROIPage roiData={result.roiCalculation} url={result.url} date={date} /> }] : []),
    // CTA page always last
    { label: "Let's Talk", node: <CTAPage url={result.url} date={date} /> },
  ]

  /*
   * Scale factor: browser print at 96 dpi renders A4 as ~794px wide.
   * Our pages are designed at 595px, so we scale them up to fill the sheet.
   */
  const PRINT_SCALE = 794 / A4_W // ≈ 1.3345

  return (
    <>
      <TopBar />
      {/* Print-specific styles: hide UI chrome, scale pages to fill A4 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-chrome { display: none !important; }
          .print-page-wrapper {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
            align-items: flex-start !important;
          }
          .print-page {
            /* The content is designed at ${A4_W}x595px.
               A4 at 96dpi = ~794x1123px.
               We scale the 595px content to fill the full 794px page width. */
            width: ${A4_W}px !important;
            /* Remove fixed height to allow content to flow across pages */
            min-height: ${A4_H}px !important;
            height: auto !important;
            transform: scale(${PRINT_SCALE}) !important;
            transform-origin: top left !important;
            /* Reserve the SCALED dimensions in flow so the browser
               lays out each page correctly on the A4 sheet. */
            margin-right: -${A4_W}px !important;
            padding: 0 !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            /* Allow overflow to naturally create pages */
            overflow: visible !important;
            box-shadow: none !important;
          }
          /* Each page wrapper allows natural overflow to create new pages */
          .print-page-flow {
            width: ${Math.round(A4_W * PRINT_SCALE)}px !important;
            height: auto !important;
            min-height: ${Math.round(A4_H * PRINT_SCALE)}px !important;
            overflow: visible !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          .print-page-flow:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          /* Content break rules for tables and lists */
          table {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          /* Allow divs containing lists to break across pages */
          div[style*="border"] {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
          /* Individual check/item rows should avoid breaking but allow page breaks between them */
          div[style*="borderTop"] {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: auto !important;
            page-break-after: auto !important;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#d4d0cb", padding: "40px 0" }}>
        {/* Title bar */}
        <div className="print-chrome" style={{ maxWidth: A4_W, margin: "0 auto 32px", padding: "0 0 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <a
              href={`/report/${id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500,
                color: "#525252", textDecoration: "none",
                minHeight: 44,
              }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              Back to report
            </a>
            {!isMobile && (
              <button
                onClick={() => window.print()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500,
                  color: "#fff", backgroundColor: "#171717", border: "none", padding: "8px 12px",
                  borderRadius: 4, cursor: "pointer", minHeight: 44,
                }}
              >
                <Printer style={{ width: 14, height: 14 }} />
                Print / Save PDF
              </button>
            )}
          </div>
        </div>

        {/* Pages */}
        <div className="print-page-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          {pages.map((page, i) => (
            <div key={page.label} className="print-page-flow">
              {/* Page label */}
              <p className="print-chrome" style={{
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

              {/* A4 frame — 1:1 on screen, scaled up to fill A4 for print */}
              <div
                className="print-page"
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
        <div className="print-chrome" style={{ height: 60 }} />
      </div>
    </>
  )
}
