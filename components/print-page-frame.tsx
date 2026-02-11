import React from "react"

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * PrintPageHeader — shown at the top of every print page (after cover).
 * Left: "Website Health Check" + URL
 * Right: date + risk pill count
 */
export function PrintPageHeader({
  url,
  timestamp,
  riskLabel,
}: {
  url: string
  timestamp: string
  riskLabel?: string
}) {
  return (
    <div className="hidden print:flex print-page-header">
      <div>
        <p className="print-header-title">Website Health Check</p>
        <p className="print-header-url">{url}</p>
      </div>
      <div className="print-header-right">
        <p className="print-header-date">{formatDate(timestamp)}</p>
        {riskLabel && <p className="print-header-risk">{riskLabel}</p>}
      </div>
    </div>
  )
}

/**
 * PrintPageFooter — shown at the bottom of every print page (after cover).
 * Left: Ohana logo
 * Right: www.ohana.studio
 */
export function PrintPageFooter() {
  return (
    <div className="hidden print:flex print-page-footer">
      <img src="/ohaha-logo.svg" alt="Ohana" className="print-footer-logo" />
      <p className="print-footer-url">www.ohana.studio</p>
    </div>
  )
}
