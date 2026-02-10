import React from "react"
import type { AdvancedUXIndicators } from "@/lib/types"
import { Check, X, AlertTriangle } from "lucide-react"

type StatusColor = "emerald" | "amber" | "red"

function statusColor(status: string): StatusColor {
  const green = ["clear", "low", "scannable", "clear_path", "strong"]
  const amber = ["mixed", "medium", "partial", "moderate"]
  if (green.includes(status)) return "emerald"
  if (amber.includes(status)) return "amber"
  return "red"
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    clear: "Clear",
    mixed: "Mixed",
    unclear: "Unclear",
    low: "Low friction",
    medium: "Medium friction",
    high: "High friction",
    scannable: "Scannable",
    dense: "Dense",
    clear_path: "Clear path",
    partial: "Partial",
    broken: "Broken",
    strong: "Strong",
    moderate: "Moderate",
    weak: "Weak",
  }
  return labels[status] || status
}

function StatusIcon({ color }: { color: StatusColor }) {
  if (color === "emerald")
    return <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
  if (color === "amber")
    return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
  return <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
}

function CategoryRow({
  title,
  status,
  bullets,
}: {
  title: string
  status: string
  bullets: string[]
}) {
  const color = statusColor(status)
  const label = statusLabel(status)
  const detail = bullets.length > 0 ? bullets.join(" ") : label

  return (
    <div className="flex items-start gap-3 py-4">
      <StatusIcon color={color} />
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {detail}
        </p>
      </div>
    </div>
  )
}

function isApplicable(status: string): boolean {
  const na = status.toLowerCase().replace(/[\s_-]/g, "")
  return na !== "na" && na !== "n/a" && na !== "notapplicable"
}

export function AdvancedUXSection({
  indicators,
}: {
  indicators: AdvancedUXIndicators
}) {
  const d = indicators

  const allCategories = [
    { key: "firstImpression", title: "First-impression clarity", ...d.firstImpression },
    { key: "navigationFriction", title: "Decision friction", ...d.navigationFriction },
    { key: "scanability", title: "Scanability", ...d.scanability },
    { key: "conversionPath", title: "Conversion path", ...d.conversionPath },
    { key: "formFriction", title: "Form friction", ...d.formFriction },
    { key: "trustDepth", title: "Trust depth", ...d.trustDepth },
    { key: "mobileFriction", title: "Mobile friction", ...d.mobileFriction },
  ]

  const visibleCategories = allCategories.filter((c) => isApplicable(c.status))
  if (visibleCategories.length === 0) return null

  const redCount = visibleCategories.filter((c) => statusColor(c.status) === "red").length
  const amberCount = visibleCategories.filter((c) => statusColor(c.status) === "amber").length
  const issueCount = redCount + amberCount

  const badgeClass =
    redCount > 0
      ? "bg-red-50 text-red-700 border-red-200"
      : amberCount > 0
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
  const badgeLabel =
    issueCount === 0
      ? "All clear"
      : redCount > 0
        ? `${issueCount} High Risk${issueCount !== 1 ? "s" : ""}`
        : `${issueCount} Moderate Risk${issueCount !== 1 ? "s" : ""}`

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-sans text-2xl font-bold text-foreground">
          UX friction analysis
        </h3>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium shrink-0 ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 italic leading-relaxed">
        AI-powered analysis of visual friction patterns based on page screenshots.
      </p>
      <div className="rounded-xl border border-border bg-card px-6 divide-y divide-border">
        {visibleCategories.map((cat) => (
          <CategoryRow
            key={cat.key}
            title={cat.title}
            status={cat.status}
            bullets={cat.bullets}
          />
        ))}
      </div>
    </div>
  )
}
