import React from "react"
import type { DesignIndicators } from "@/lib/types"
import { Check, X, AlertTriangle } from "lucide-react"

function StatusIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass")
    return <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
  if (status === "warn")
    return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
  return <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
}

function DesignRow({
  label,
  status,
  detail,
}: {
  label: string
  status: "pass" | "warn" | "fail"
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <StatusIcon status={status} />
      <div>
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  )
}

export function DesignIndicatorsSection({
  indicators,
}: {
  indicators: DesignIndicators
}) {
  const img = indicators.imageIssues
  const totalImageIssues =
    img.oversizedCount +
    img.unoptimizedCount +
    img.unsizedCount +
    img.incorrectAspectRatio +
    img.modernFormatMissing

  const rows: { label: string; status: "pass" | "warn" | "fail"; detail: string }[] = []

  // Core checks
  rows.push({
    label: "Image optimisation",
    status: totalImageIssues === 0 ? "pass" : totalImageIssues <= 3 ? "warn" : "fail",
    detail:
      totalImageIssues === 0
        ? "Images appear well-optimised for this page."
        : `${totalImageIssues} image issue(s) detected. ${img.details.slice(0, 3).join(" ")}`,
  })

  rows.push({
    label: "Colour contrast",
    status: indicators.contrastPassed ? "pass" : indicators.contrastIssues <= 2 ? "warn" : "fail",
    detail: indicators.contrastPassed
      ? "All text elements meet WCAG colour contrast guidelines."
      : `${indicators.contrastIssues} element(s) do not meet minimum contrast ratios.`,
  })

  rows.push({
    label: "Spacing consistency",
    status: indicators.inconsistentSpacing ? "warn" : "pass",
    detail: indicators.spacingDetails,
  })

  // Breakdowns
  if (img.oversizedCount > 0)
    rows.push({ label: `${img.oversizedCount} oversized image(s)`, status: "fail", detail: "Larger than their display size, wasting bandwidth." })
  if (img.unoptimizedCount > 0)
    rows.push({ label: `${img.unoptimizedCount} unoptimised image(s)`, status: "warn", detail: "Could be better compressed to reduce file size." })
  if (img.unsizedCount > 0)
    rows.push({ label: `${img.unsizedCount} unsized image(s)`, status: "warn", detail: "Missing explicit width and height attributes." })
  if (img.incorrectAspectRatio > 0)
    rows.push({ label: `${img.incorrectAspectRatio} distorted image(s)`, status: "fail", detail: "Displayed at an incorrect aspect ratio." })
  if (img.modernFormatMissing > 0)
    rows.push({ label: `${img.modernFormatMissing} legacy format image(s)`, status: "warn", detail: "Not using modern formats like WebP or AVIF." })
  if (img.offscreenCount > 0)
    rows.push({ label: `${img.offscreenCount} off-screen image(s) not lazy-loaded`, status: "warn", detail: "Images below the fold loaded immediately." })
  if (img.totalSavingsKb > 50)
    rows.push({ label: `~${img.totalSavingsKb} KB potential savings`, status: "warn", detail: "Estimated data that could be saved by optimising images." })

  const failCount = rows.filter((r) => r.status === "fail").length
  const warnCount = rows.filter((r) => r.status === "warn").length
  const issueCount = failCount + warnCount
  const badgeClass =
    failCount > 0
      ? "bg-red-50 text-red-700 border-red-200"
      : warnCount > 0
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
  const badgeLabel =
    issueCount === 0
      ? "All clear"
      : failCount > 0
        ? `${issueCount} High Risk${issueCount !== 1 ? "s" : ""}`
        : `${issueCount} Moderate Risk${issueCount !== 1 ? "s" : ""}`

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-sans text-2xl font-bold text-foreground">
          Design & image quality
        </h3>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium shrink-0 ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 italic">
        Checks based on Lighthouse audits and page analysis.
      </p>
      <div className="rounded-xl border border-border bg-card px-6 divide-y divide-border">
        {rows.map((row) => (
          <DesignRow key={row.label} label={row.label} status={row.status} detail={row.detail} />
        ))}
      </div>
    </div>
  )
}
