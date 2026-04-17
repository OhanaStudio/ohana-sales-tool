"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import type { AuditResult } from "@/lib/types"
import type { ROICalculationResult } from "@/lib/roi-types"
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
import { Loader2, Printer, Download } from "lucide-react"
import Image from "next/image"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

interface SharedReportData {
  id: string
  url: string
  result: AuditResult
  created_at: string
  roi_data?: ROICalculationResult
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
  const [generating, setGenerating] = useState(false)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

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

  // Mobile PDF generation using html2canvas + jsPDF (avoids iOS Safari print bugs)
  const generateMobilePDF = async () => {
    if (!data) return
    setGenerating(true)
    
    try {
      const pdfWidth = 210
      const pdfHeight = 297
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })
      
      const validRefs = pageRefs.current.filter((ref): ref is HTMLDivElement => ref !== null)
      
      for (let i = 0; i < validRefs.length; i++) {
        const pageEl = validRefs[i]
        
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#F0ECE5",
          logging: false,
        })
        
        const imgData = canvas.toDataURL("image/jpeg", 0.95)
        
        if (i > 0) {
          pdf.addPage()
        }
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight)
      }
      
      const siteName = data.url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").substring(0, 30)
      pdf.save(`Website-Audit-${siteName}.pdf`)
    } catch (err) {
      console.error("[v0] PDF generation failed:", err)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

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

  // Merge ROI data if available
  const resultWithROI = data.roi_data 
    ? { ...result, roiCalculation: data.roi_data }
    : result

  const pages = [
    { label: "Cover", node: <CoverPage url={result.url} date={date} preparedBy="Ohana Studio" /> },
    { label: "Introduction", node: <IntroPage r={resultWithROI} date={date} riskLabel={riskLabel} risks={risks} recapText={recapText} /> },
    { label: "Risk Cards", node: <RiskPage r={resultWithROI} date={date} riskLabel={riskLabel} /> },
    { label: "Performance", node: <PerfPage r={resultWithROI} date={date} riskLabel={riskLabel} /> },
    { label: "UX Indicators", node: <UXPage r={resultWithROI} date={date} riskLabel={riskLabel} /> },
    { label: "UX Friction", node: <FrictionPage r={resultWithROI} date={date} riskLabel={riskLabel} /> },
    { label: "Accessibility", node: <A11yPage r={resultWithROI} date={date} riskLabel={riskLabel} /> },
    ...(resultWithROI.roiCalculation ? [{ label: "ROI Estimation", node: <ROIPage roiData={resultWithROI.roiCalculation} url={result.url} date={date} /> }] : []),
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

      <div style={{ minHeight: "100vh", background: "#d4d0cb", padding: "40px 0" }}>
        {/* Header for client view */}
        <div className="print-chrome" style={{ maxWidth: A4_W, margin: "0 auto 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Image src="/ohaha-logo.svg" alt="Ohana" width={85} height={44} className="h-8 w-auto" />
            {isMobile ? (
              <button
                onClick={generateMobilePDF}
                disabled={generating}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 500,
                  color: "#fff", backgroundColor: generating ? "#737373" : "#171717", border: "none", padding: "8px 12px",
                  borderRadius: 4, cursor: generating ? "wait" : "pointer", minHeight: 44,
                }}
              >
                {generating ? (
                  <>
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download style={{ width: 14, height: 14 }} />
                    Save PDF
                  </>
                )}
              </button>
            ) : (
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

              <div
                ref={(el) => { pageRefs.current[i] = el }}
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

        <div className="print-chrome" style={{ height: 60 }} />
      </div>
    </>
  )
}
