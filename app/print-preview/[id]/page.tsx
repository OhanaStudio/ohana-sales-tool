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
  
  // Detect iOS/mobile and calculate scale for mobile
  const [isMobile, setIsMobile] = useState(false)
  const [mobileScale, setMobileScale] = useState(1)
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent
      const isIOS = /iPad|iPhone|iPod/.test(ua)
      const isAndroid = /Android/.test(ua)
      const isMobileWidth = window.innerWidth < 768
      setIsMobile(isIOS || isAndroid || isMobileWidth)
      
      // Calculate scale to fit A4 width (595px) into viewport with padding
      if (isMobileWidth) {
        const viewportWidth = window.innerWidth
        const padding = 24 // 12px on each side
        const availableWidth = viewportWidth - padding
        const scale = Math.min(availableWidth / 595, 1)
        setMobileScale(scale)
      } else {
        setMobileScale(1)
      }
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
    // ROI Estimation appears second-to-last when data exists and is not hidden
    ...(result.roiCalculation && !result.roiCalculation.hidden ? [{ label: "ROI Estimation", node: <ROIPage roiData={result.roiCalculation} url={result.url} date={date} /> }] : []),
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
          html, body { 
            margin: 0; 
            padding: 0; 
            background: white !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .print-chrome { display: none !important; }
          .print-page-wrapper {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
            align-items: flex-start !important;
            display: block !important;
          }
          .print-page-flow {
            width: 794px !important;
            height: 1123px !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: stretch !important;
            justify-content: stretch !important;
          }
          .print-page-flow:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .print-page {
            /* Scale up to fill A4 (794x1123px at 96dpi) */
            width: 794px !important;
            height: 1123px !important;
            min-height: 1123px !important;
            transform: none !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }
          /* Scale up the inner content proportionally */
          .print-page > * {
            transform: scale(${PRINT_SCALE});
            transform-origin: top left;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#d4d0cb", padding: isMobile ? "20px 12px" : "40px 0" }}>
        {/* Title bar */}
        <div className="print-chrome" style={{ maxWidth: isMobile ? "100%" : A4_W, margin: "0 auto 24px", padding: "0 0 0 0" }}>
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
        <div className="print-page-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isMobile ? 24 : 40 }}>
          {pages.map((page, i) => (
            <div 
              key={page.label} 
              className="print-page-flow"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Page label */}
              <p className="print-chrome" style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: isMobile ? 10 : 11,
                fontWeight: 600,
                color: "#737373",
                margin: "0 0 8px",
                textTransform: "uppercase" as const,
                letterSpacing: "0.08em",
                width: isMobile ? A4_W * mobileScale : A4_W,
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
                  transform: isMobile ? `scale(${mobileScale})` : "none",
                  transformOrigin: "top center",
                }}
              >
                {page.node}
              </div>
              {/* Spacer to account for scaled height */}
              {isMobile && <div style={{ marginTop: (A4_H * mobileScale) - A4_H }} />}
            </div>
          ))}
        </div>

        {/* Bottom spacing */}
        <div className="print-chrome" style={{ height: 60 }} />
      </div>
    </>
  )
}
