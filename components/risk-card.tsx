import React from "react"
import type { RiskCard as RiskCardType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Eye, MousePointerClick, ShieldCheck } from "lucide-react"

const levelConfig = {
  red: {
    badge: "bg-red-100 text-red-800",
    border: "border-[#fecaca]",
    label: "High Risk",
  },
  amber: {
    badge: "bg-amber-100 text-amber-800",
    border: "border-[#fde68a]",
    label: "Moderate",
  },
  green: {
    badge: "bg-emerald-100 text-emerald-800",
    border: "border-[#a7f3d0]",
    label: "Low Risk",
  },
}

const cardIcons: Record<string, React.ReactNode> = {
  Visibility: <Eye className="h-5 w-5" />,
  "Visibility Risk": <Eye className="h-5 w-5" />,
  Conversion: <MousePointerClick className="h-5 w-5" />,
  "Conversion Risk": <MousePointerClick className="h-5 w-5" />,
  Trust: <ShieldCheck className="h-5 w-5" />,
  "Trust Risk": <ShieldCheck className="h-5 w-5" />,
}

export function RiskCard({
  card,
  variant = "default",
  imageSlot,
}: {
  card: RiskCardType
  variant?: "featured" | "default"
  imageSlot?: React.ReactNode
}) {
  const config = levelConfig[card.level]
  const icon = cardIcons[card.label] ?? <Eye className="h-5 w-5" />

  if (variant === "featured") {
    return (
      <div
        className={cn(
          "rounded-xl border bg-card overflow-hidden print-break-avoid",
          config.border
        )}
      >
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 text-muted-foreground">
                {icon}
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  config.badge
                )}
              >
                {config.label}
              </span>
            </div>
            <h3 className="font-sans text-xl font-bold text-card-foreground mb-3">
              {card.label}
            </h3>
            <ul className="space-y-4 mb-4">
              {card.bullets.map((bullet, i) => (
                <li key={`bullet-${card.label}-${i}`}>
                  <div className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-muted-foreground shrink-0">{"--"}</span>
                    <span>{bullet}</span>
                  </div>
                  {card.bulletNotes?.[i] && (
                    <p className="text-xs text-muted-foreground italic ml-5 mt-1 leading-relaxed">
                      Note: {card.bulletNotes[i]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {card.whyItMatters}
            </p>
          </div>
          {imageSlot && (
            <div className="hidden md:flex items-center justify-center w-64 shrink-0 bg-muted/30 p-6">
              {imageSlot}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-6 bg-card h-full flex flex-col print-break-avoid",
        config.border
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 text-muted-foreground">
          {icon}
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            config.badge
          )}
        >
          {config.label}
        </span>
      </div>
      <h3 className="font-sans text-lg font-bold text-card-foreground mb-3">
        {card.label}
      </h3>
      <ul className="space-y-4 mb-4 flex-1">
        {card.bullets.map((bullet, i) => (
          <li key={`bullet-${card.label}-${i}`}>
            <div className="text-sm text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-muted-foreground shrink-0">{"--"}</span>
              <span>{bullet}</span>
            </div>
            {card.bulletNotes?.[i] && (
              <p className="text-xs text-muted-foreground italic ml-5 mt-1 leading-relaxed">
                Note: {card.bulletNotes[i]}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground italic leading-relaxed">
        {card.whyItMatters}
      </p>
    </div>
  )
}
