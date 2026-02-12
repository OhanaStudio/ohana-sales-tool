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
  note,
}: {
  label: string
  status: "pass" | "warn" | "fail"
  detail: string
  note?: string
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <StatusIcon status={status} />
      <div>
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
        {note && (
          <p className="text-xs text-muted-foreground italic mt-2 leading-relaxed">Note: {note}</p>
        )}
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

  const rows: { label: string; status: "pass" | "warn" | "fail"; detail: string; note?: string }[] = []

  // Core checks
  rows.push({
    label: "Image optimisation",
    status: totalImageIssues === 0 ? "pass" : totalImageIssues <= 3 ? "warn" : "fail",
    detail:
      totalImageIssues === 0
        ? "Images appear well-optimised for this page."
        : `${totalImageIssues} image issue(s) detected. ${img.details.slice(0, 3).join(" ")}`,
    note: totalImageIssues === 0
      ? "Well-optimised images keep the site fast and reduce hosting bandwidth costs."
      : "Unoptimised images are one of the biggest causes of slow page loads. Fixing this can dramatically improve mobile performance and search rankings.",
  })

  rows.push({
    label: "Colour contrast",
    status: indicators.contrastPassed ? "pass" : indicators.contrastIssues <= 2 ? "warn" : "fail",
    detail: indicators.contrastPassed
      ? "All text elements meet WCAG colour contrast guidelines."
      : `${indicators.contrastIssues} element(s) do not meet minimum contrast ratios.`,
    note: indicators.contrastPassed
      ? "Good contrast ensures text is readable for all users, including those with visual impairments."
      : "Poor contrast makes text hard to read, especially on mobile in bright light. This directly affects usability and is an accessibility compliance requirement.",
  })

  rows.push({
    label: "Spacing consistency",
    status: indicators.inconsistentSpacing ? "warn" : "pass",
    detail: indicators.spacingDetails,
    note: indicators.inconsistentSpacing
      ? "Inconsistent spacing makes a site look unprofessional and can erode trust. Consistent design signals attention to detail."
      : "Consistent spacing contributes to a polished, professional appearance that builds user confidence.",
  })

  // Breakdowns
  if (img.oversizedCount > 0)
    rows.push({ label: `${img.oversizedCount} oversized image(s)`, status: "fail", detail: "Larger than their display size, wasting bandwidth.", note: "Oversized images waste visitor bandwidth and slow page loads. This is especially impactful on mobile where data and speed matter most." })
  if (img.unoptimizedCount > 0)
    rows.push({ label: `${img.unoptimizedCount} unoptimised image(s)`, status: "warn", detail: "Could be better compressed to reduce file size.", note: "Compressing images without visible quality loss is one of the easiest performance wins. It can cut page weight by 50% or more." })
  if (img.unsizedCount > 0)
    rows.push({ label: `${img.unsizedCount} unsized image(s)`, status: "warn", detail: "Missing explicit width and height attributes.", note: "Images without dimensions cause layout shifts as the page loads. This looks janky and Google penalises it in Core Web Vitals." })
  if (img.incorrectAspectRatio > 0)
    rows.push({ label: `${img.incorrectAspectRatio} distorted image(s)`, status: "fail", detail: "Displayed at an incorrect aspect ratio.", note: "Distorted images look unprofessional and undermine the visual quality of the brand." })
  if (img.modernFormatMissing > 0)
    rows.push({ label: `${img.modernFormatMissing} legacy format image(s)`, status: "warn", detail: "Not using modern formats like WebP or AVIF.", note: "Modern image formats can reduce file sizes by 25-50% compared to JPEG/PNG while maintaining the same quality." })
  if (img.offscreenCount > 0)
    rows.push({ label: `${img.offscreenCount} off-screen image(s) not lazy-loaded`, status: "warn", detail: "Images below the fold loaded immediately.", note: "Loading all images upfront slows down the initial page render. Lazy loading defers off-screen images until they are needed." })
  if (img.totalSavingsKb > 50)
    rows.push({ label: `~${img.totalSavingsKb} KB potential savings`, status: "warn", detail: "Estimated data that could be saved by optimising images.", note: "Reducing image data directly speeds up page load and improves the experience on slower mobile connections." })

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
          <DesignRow key={row.label} label={row.label} status={row.status} detail={row.detail} note={row.note} />
        ))}
      </div>
    </div>
  )
}
