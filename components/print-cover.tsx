import React from "react"

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function PrintCover({
  url,
  timestamp,
}: {
  url: string
  timestamp: string
}) {
  const hostname = (() => {
    try {
      return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
    } catch {
      return url
    }
  })()

  return (
    <div className="hidden print:block print-cover">
      {/* Background SVG */}
      <img
        src="/cover-background.svg"
        alt=""
        aria-hidden="true"
        className="print-cover-bg"
      />

      {/* Logo top-left */}
      <div className="print-cover-logo">
        <img src="/ohaha-logo.svg" alt="Ohana" />
      </div>

      {/* Title area bottom-left */}
      <div className="print-cover-content">
        <p className="print-cover-title">
          Website<br />Health Check
        </p>
        <p className="print-cover-url">{hostname}</p>
        <p className="print-cover-date">{formatDate(timestamp)}</p>
      </div>

      {/* Studio URL bottom-right */}
      <p className="print-cover-studio">www.ohana.studio</p>
    </div>
  )
}
