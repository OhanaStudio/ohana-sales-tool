import React from "react"
import type { DesignIndicators } from "@/lib/types"
import { Check, X, AlertTriangle, ImageIcon, Palette, AlignLeft } from "lucide-react"

function StatusIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass")
    return <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
  if (status === "warn")
    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
  return <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
}

function DesignRow({
  icon,
  label,
  status,
  detail,
}: {
  icon: React.ReactNode
  label: string
  status: "pass" | "warn" | "fail"
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <StatusIcon status={status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {icon}
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
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

  const imageStatus: "pass" | "warn" | "fail" =
    totalImageIssues === 0 ? "pass" : totalImageIssues <= 3 ? "warn" : "fail"

  const imageDetail =
    totalImageIssues === 0
      ? "Images appear well-optimised for this page."
      : `${totalImageIssues} image issue(s) detected. ${img.details.slice(0, 3).join(" ")}`

  const contrastStatus: "pass" | "warn" | "fail" = indicators.contrastPassed
    ? "pass"
    : indicators.contrastIssues <= 2
      ? "warn"
      : "fail"

  const contrastDetail = indicators.contrastPassed
    ? "All text elements meet WCAG colour contrast guidelines."
    : `${indicators.contrastIssues} element(s) do not meet minimum contrast ratios. This can make text hard to read, especially for users with visual impairments.`

  const spacingStatus: "pass" | "warn" | "fail" = indicators.inconsistentSpacing
    ? "warn"
    : "pass"

  return (
    <div>
      <h3 className="font-sans text-xl text-foreground mb-1">
        Design & image quality
      </h3>
      <p className="text-xs text-muted-foreground/60 mb-4 italic">
        Checks based on Lighthouse audits and page analysis.
      </p>
      <div className="rounded-lg border border-border bg-card p-5 divide-y divide-border">
        <DesignRow
          icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Image optimisation"
          status={imageStatus}
          detail={imageDetail}
        />
        <DesignRow
          icon={<Palette className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Colour contrast"
          status={contrastStatus}
          detail={contrastDetail}
        />
        <DesignRow
          icon={<AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Spacing consistency"
          status={spacingStatus}
          detail={indicators.spacingDetails}
        />

        {/* Image issue breakdown */}
        {totalImageIssues > 0 && (
          <div className="pt-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Image breakdown
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {img.oversizedCount > 0 && (
                <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2">
                  <p className="text-xs font-medium text-red-800">
                    {img.oversizedCount} oversized
                  </p>
                  <p className="text-[10px] text-red-600">Larger than display size</p>
                </div>
              )}
              {img.unoptimizedCount > 0 && (
                <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-xs font-medium text-amber-800">
                    {img.unoptimizedCount} unoptimised
                  </p>
                  <p className="text-[10px] text-amber-600">Could be better compressed</p>
                </div>
              )}
              {img.unsizedCount > 0 && (
                <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-xs font-medium text-amber-800">
                    {img.unsizedCount} unsized
                  </p>
                  <p className="text-[10px] text-amber-600">Missing width/height</p>
                </div>
              )}
              {img.incorrectAspectRatio > 0 && (
                <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2">
                  <p className="text-xs font-medium text-red-800">
                    {img.incorrectAspectRatio} distorted
                  </p>
                  <p className="text-[10px] text-red-600">Wrong aspect ratio</p>
                </div>
              )}
              {img.modernFormatMissing > 0 && (
                <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-xs font-medium text-amber-800">
                    {img.modernFormatMissing} legacy format
                  </p>
                  <p className="text-[10px] text-amber-600">Not WebP/AVIF</p>
                </div>
              )}
              {img.offscreenCount > 0 && (
                <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-xs font-medium text-amber-800">
                    {img.offscreenCount} not lazy-loaded
                  </p>
                  <p className="text-[10px] text-amber-600">Off-screen images</p>
                </div>
              )}
            </div>
            {img.totalSavingsKb > 50 && (
              <p className="text-xs text-muted-foreground mt-2">
                Estimated savings: ~{img.totalSavingsKb} KB
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
