"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PrintReport } from "@/components/print-report"
import type { AuditResult } from "@/lib/types"
import type { ROICalculationResult } from "@/lib/roi-types"

interface SharedReportData {
  id: string
  url: string
  result: AuditResult
  created_at: string
  roi_data?: ROICalculationResult
}

export default function SharePage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<SharedReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
      <div className="min-h-screen bg-[#F0ECE5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#171717] mx-auto mb-4" />
          <p className="text-[#171717]/60">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F0ECE5] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#171717] mb-2">Report Not Found</h1>
          <p className="text-[#171717]/60">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0ECE5]">
      {/* Print-only report - this is what the client sees */}
      <div className="print-only-show">
        <PrintReport 
          result={data.result} 
          preparedBy="Ohana Studio" 
          roiData={data.roi_data}
        />
      </div>

      {/* Screen view - also show the print report but styled for screen */}
      <div className="no-print">
        <PrintReport 
          result={data.result} 
          preparedBy="Ohana Studio" 
          roiData={data.roi_data}
        />
      </div>
    </div>
  )
}
