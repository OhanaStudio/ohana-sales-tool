"use client"

import dynamic from "next/dynamic"

const ReportPageClient = dynamic(
  () => import("@/components/report-page-client"),
  { ssr: false }
)

export default function ReportPage() {
  return <ReportPageClient />
}
