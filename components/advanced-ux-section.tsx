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

const categoryNotes: Record<string, { good: string; bad: string }> = {
  firstImpression: {
    good: "A clear first impression keeps visitors engaged and reduces bounce rates.",
    bad: "Visitors decide in 3-5 seconds whether to stay. If the value proposition isn't immediately clear, they leave for a competitor.",
  },
  navigationFriction: {
    good: "Low decision friction means visitors can easily find what they need and take action.",
    bad: "Confusing navigation overwhelms visitors with choices. Every extra click or unclear path is a chance for them to give up and leave.",
  },
  scanability: {
    good: "Scannable content structure helps visitors quickly find the information they need.",
    bad: "Dense text walls cause visitors to bounce. Breaking content into clear, scannable sections can significantly increase time on page.",
  },
  conversionPath: {
    good: "A clear conversion path guides visitors smoothly from interest to action.",
    bad: "A broken conversion path with dead ends or inconsistent CTAs means potential customers get lost before completing an enquiry.",
  },
  formFriction: {
    good: "Low form friction means more visitors will complete enquiry forms.",
    bad: "Complex or lengthy forms are the number one conversion killer. Reducing fields to essentials can double form completion rates.",
  },
  trustDepth: {
    good: "Strong trust depth with verified credentials helps convert hesitant visitors.",
    bad: "Weak trust signals mean visitors have no evidence to support choosing this business. Named testimonials and case studies are far more convincing than anonymous quotes.",
  },
  mobileFriction: {
    good: "Low mobile friction ensures the growing majority of mobile visitors have a smooth experience.",
    bad: "Over 60% of web traffic is mobile. High mobile friction means the majority of potential customers are having a frustrating experience.",
  },
}

function CategoryRow({
  title,
  status,
  bullets,
  catKey,
}: {
  title: string
  status: string
  bullets: string[]
  catKey: string
}) {
  const color = statusColor(status)
  const label = statusLabel(status)
  const detail = bullets.length > 0 ? bullets.join(" ") : label
  const isGood = color === "emerald"
  const note = categoryNotes[catKey]?.[isGood ? "good" : "bad"]

  return (
    <div className="flex items-start gap-3 py-4">
      <StatusIcon color={color} />
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {detail}
        </p>
        {note && (
          <p className="text-xs text-muted-foreground italic mt-1 leading-relaxed">Note: {note}</p>
        )}
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
            catKey={cat.key}
            title={cat.title}
            status={cat.status}
            bullets={cat.bullets}
          />
        ))}
      </div>
    </div>
  )
}
