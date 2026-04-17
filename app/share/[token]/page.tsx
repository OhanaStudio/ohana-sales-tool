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
  ROIPage,
  CTAPage,
} from "@/components/print-report"
import { Loader2, Printer } from "lucide-react"
import Image from "next/image"

interface SharedReportData {
  id: string
  url: string
  result: AuditResult
  created_at: string
}

const A4_W = 595
const A4_H = 842

export default function SharePage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<SharedReportData | null>(null)
  const [recapText, setRecapText] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
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
      try {
        const res = await fetch(`/api/share/${token}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("This report link is invalid or has expired.")
          } else {
            setError("Failed to load report.")
          }
          return
        }
        const json = await res.json()
        setData(json)

        // Fetch AI recap
        try {
          const recapRes = await fetch("/api/recap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ result: json.result }),
          })
          if (recapRes.ok) {
            const recapData = await recapRes.json()
            if (recapData.recap) setRecapText(recapData.recap)
          }
        } catch { /* use fallback */ }
      } catch {
        setError("Failed to load report.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Report Not Found</h1>
          <p className="text-neutral-600">{error}</p>
        </div>
      </div>
    )
  }

  const result = data.result
  const date = formatDate(result.timestamp)
  const risks = countRisks(result)
  const riskLabel = [
    risks.high > 0 ? `${risks.high} High Risks` : "",
    risks.moderate > 0 ? `${risks.moderate} Moderate Risks` : "",
  ].filter(Boolean).join(" | ")

  const pages = [
    { label: "Cover", node: <CoverPage url={result.url} date={date} preparedBy="Ohana Studio" /> },
    { label: "Introduction", node: <IntroPage r={result} date={date} riskLabel={riskLabel} risks={risks} recapText={recapText} /> },
    { label: "Risk Cards", node: <RiskPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "Performance", node: <PerfPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "UX Indicators", node: <UXPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "UX Friction", node: <FrictionPage r={result} date={date} riskLabel={riskLabel} /> },
    { label: "Accessibility", node: <A11yPage r={result} date={date} riskLabel={riskLabel} /> },
    ...(result.roiCalculation ? [{ label: "ROI Estimation", node: <ROIPage roiData={result.roiCalculation} url={result.url} date={date} /> }] : []),
    { label: "Let's Talk", node: <CTAPage url={result.url} date={date} /> },
  ]

  const PRINT_SCALE = 794 / A4_W

  return (
    <>
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
            width: ${A4_W}px !important;
            min-height: ${A4_H}px !important;
            height: auto !important;
            transform: scale(${PRINT_SCALE}) !important;
            transform-origin: top left !important;
            margin-right: -${A4_W}px !important;
            padding: 0 !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
          }
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
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#d4d0cb", padding: isMobile ? "20px 12px" : "40px 0" }}>
        {/* Header for client view */}
        <div className="print-chrome" style={{ maxWidth: isMobile ? "100%" : A4_W, margin: "0 auto 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Image src="/ohaha-logo.svg" alt="Ohana" width={85} height={44} className="h-8 w-auto" />
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

        <div className="print-chrome" style={{ height: 60 }} />
      </div>
    </>
  )
}
