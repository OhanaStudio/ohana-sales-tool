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
          <p className="text-sm font-bold text-foreground">{label}</p>
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
      <p className="text-xs text-muted-foreground mb-4 italic">
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

        {/* Image issue breakdown - same row style as above */}
        {img.oversizedCount > 0 && (
          <DesignRow
            icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            label={`${img.oversizedCount} oversized image(s)`}
            status="fail"
            detail="Larger than their display size, wasting bandwidth and slowing page load."
          />
        )}
        {img.unoptimizedCount > 0 && (
          <DesignRow
            icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            label={`${img.unoptimizedCount} unoptimised image(s)`}
            status="warn"
            detail="Could be better compressed to reduce file size without visible quality loss."
          />
        )}
        {img.unsizedCount > 0 && (
          <DesignRow
            icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            label={`${img.unsizedCount} unsized image(s)`}
            status="warn"
            detail="Missing explicit width and height attributes, which can cause layout shifts."
          />
        )}
        {img.incorrectAspectRatio > 0 && (
          <DesignRow
            icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            label={`${img.incorrectAspectRatio} distorted image(s)`}
            status="fail"
            detail="Displayed at an incorrect aspect ratio, appearing stretched or squashed."
          />
        )}
        {img.modernFormatMissing > 0 && (
          <DesignRow
            icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            label={`${img.modernFormatMissing} legacy format image(s)`}
            status="warn"
            detail="Not using modern formats like WebP or AVIF, which offer better compression."
          />
        )}
        {img.offscreenCount > 0 && (
          <DesignRow
            icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
            label={`${img.offscreenCount} off-screen image(s) not lazy-loaded`}
            status="warn"
            detail="Images below the fold are loaded immediately, delaying the initial page render."
          />
        )}
        {img.totalSavingsKb > 50 && (
          <DesignRow
            icon={<AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />}
            label={`~${img.totalSavingsKb} KB potential savings`}
            status="warn"
            detail="Estimated data that could be saved by optimising the images listed above."
          />
        )}
      </div>
    </div>
  )
}
