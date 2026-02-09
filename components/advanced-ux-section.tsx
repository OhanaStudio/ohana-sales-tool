"use client"

import React from "react"

import { useState } from "react"
import type { AdvancedUXIndicators } from "@/lib/types"
import {
  ChevronDown,
  Eye,
  Navigation,
  AlignLeft,
  MousePointerClick,
  FormInput,
  ShieldCheck,
  Smartphone,
} from "lucide-react"

type StatusColor = "emerald" | "amber" | "red"

function statusColor(
  status: string
): StatusColor {
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

function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status)
  const colorClasses: Record<StatusColor, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${colorClasses[color]}`}
    >
      {statusLabel(status)}
    </span>
  )
}

function CategorySection({
  icon,
  title,
  status,
  bullets,
  defaultOpen = false,
}: {
  icon: React.ReactNode
  title: string
  status: string
  bullets: string[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left gap-3 min-h-[44px] bg-transparent border-0 p-0"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-muted-foreground shrink-0">{icon}</span>
          <span className="text-sm font-medium text-foreground truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={status} />
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && bullets.length > 0 && (
        <ul className="mt-2 ml-7 space-y-1.5">
          {bullets.map((bullet, i) => (
            <li
              key={i}
              className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-border"
            >
              {bullet}
            </li>
          ))}
        </ul>
      )}

      {open && bullets.length === 0 && (
        <p className="mt-2 ml-7 text-xs text-muted-foreground italic">
          No issues detected in this area.
        </p>
      )}
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
    { key: "firstImpression", icon: <Eye className="h-4 w-4" />, title: "First-impression clarity", ...d.firstImpression },
    { key: "navigationFriction", icon: <Navigation className="h-4 w-4" />, title: "Decision friction", ...d.navigationFriction },
    { key: "scanability", icon: <AlignLeft className="h-4 w-4" />, title: "Scanability", ...d.scanability },
    { key: "conversionPath", icon: <MousePointerClick className="h-4 w-4" />, title: "Conversion path", ...d.conversionPath },
    { key: "formFriction", icon: <FormInput className="h-4 w-4" />, title: "Form friction", ...d.formFriction },
    { key: "trustDepth", icon: <ShieldCheck className="h-4 w-4" />, title: "Trust depth", ...d.trustDepth },
    { key: "mobileFriction", icon: <Smartphone className="h-4 w-4" />, title: "Mobile friction", ...d.mobileFriction },
  ]

  // Filter out n/a categories
  const visibleCategories = allCategories.filter((c) => isApplicable(c.status))

  if (visibleCategories.length === 0) return null

  const totalIssues = visibleCategories.reduce((sum, c) => sum + c.bullets.length, 0)
  const redCategories = visibleCategories.filter((c) => statusColor(c.status) === "red").length
  const amberCategories = visibleCategories.filter((c) => statusColor(c.status) === "amber").length

  const summaryColor =
    redCategories > 0
      ? "text-red-600"
      : amberCategories > 0
        ? "text-amber-600"
        : "text-emerald-600"

  const summaryText =
    redCategories > 0
      ? `${totalIssues} friction point(s) found across ${redCategories + amberCategories} area(s)`
      : amberCategories > 0
        ? `${totalIssues} minor issue(s) across ${amberCategories} area(s)`
        : "No significant friction detected"

  return (
    <div>
      <h3 className="font-sans text-xl text-foreground mb-1">
        UX friction analysis
      </h3>
      <p className="text-xs text-muted-foreground mb-2 italic leading-relaxed">
        AI-powered analysis of visual friction patterns based on page
        screenshots.
      </p>
      <div className={`text-xs font-medium mb-4 ${summaryColor}`}>
        {summaryText}
      </div>
      <div className="rounded-lg border border-border bg-card p-5 divide-y divide-border">
        {visibleCategories.map((cat) => (
          <CategorySection
            key={cat.key}
            icon={cat.icon}
            title={cat.title}
            status={cat.status}
            bullets={cat.bullets}
            defaultOpen={statusColor(cat.status) === "red"}
          />
        ))}
      </div>
    </div>
  )
}
