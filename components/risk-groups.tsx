"use client"

import React from "react"
import type { AuditResult, RiskCard as RiskCardType, RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Eye, MousePointerClick, ShieldCheck } from "lucide-react"

const cardIcons: Record<string, React.ReactNode> = {
  Visibility: <Eye className="h-5 w-5" />,
  "Visibility Risk": <Eye className="h-5 w-5" />,
  Conversion: <MousePointerClick className="h-5 w-5" />,
  "Conversion Risk": <MousePointerClick className="h-5 w-5" />,
  Trust: <ShieldCheck className="h-5 w-5" />,
  "Trust Risk": <ShieldCheck className="h-5 w-5" />,
}

interface GroupConfig {
  heading: string
  subtitle: string
  badgeClass: string
  badgeLabel: string
  borderClass: string
}

const groupConfig: Record<RiskLevel, GroupConfig> = {
  red: {
    heading: "High Risks",
    subtitle: "These issues are likely reducing conversions and trust.",
    badgeClass: "bg-red-100 text-red-800",
    badgeLabel: "High Risk",
    borderClass: "border-[#fecaca]",
  },
  amber: {
    heading: "Moderate Risks",
    subtitle: "Areas with room for improvement that could affect performance.",
    badgeClass: "bg-amber-100 text-amber-800",
    badgeLabel: "Moderate",
    borderClass: "border-[#fde68a]",
  },
  green: {
    heading: "Low Risks",
    subtitle: "These areas are performing well.",
    badgeClass: "bg-emerald-100 text-emerald-800",
    badgeLabel: "Low Risk",
    borderClass: "border-[#a7f3d0]",
  },
}

function GroupedCard({ card, config, isLast }: { card: RiskCardType; config: GroupConfig; isLast: boolean }) {
  const icon = cardIcons[card.label] ?? <Eye className="h-5 w-5" />

  return (
    <div className={cn("p-6 md:px-8", !isLast && "border-b border-border")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 text-muted-foreground">
            {icon}
          </div>
          <h3 className="font-sans text-lg font-bold text-card-foreground">
            {card.label} ({card.bullets.length} {card.bullets.length === 1 ? "Risk" : "Risks"})
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
            config.badgeClass
          )}
        >
          {config.badgeLabel}
        </span>
      </div>
      <ul className="space-y-4 mb-4">
        {card.bullets.map((bullet, i) => (
          <li key={`bullet-${card.label}-${i}`}>
            <div className="text-sm text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-muted-foreground shrink-0">{"--"}</span>
              <span>{bullet}</span>
            </div>
            {card.bulletNotes?.[i] && (
              <p className="text-xs text-muted-foreground italic ml-5 mt-1 leading-relaxed p-2 rounded bg-[#4040400f]">
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

export function RiskGroups({ result }: { result: AuditResult }) {
  const allCards: RiskCardType[] = [
    result.riskCards.visibility,
    result.riskCards.conversion,
    result.riskCards.trust,
  ]

  // Group cards by level
  const groups: { level: RiskLevel; cards: RiskCardType[] }[] = []
  const seen = new Map<RiskLevel, RiskCardType[]>()
  for (const card of allCards) {
    if (!seen.has(card.level)) seen.set(card.level, [])
    seen.get(card.level)!.push(card)
  }

  // Order: red first, then amber, then green
  const order: RiskLevel[] = ["red", "amber", "green"]
  for (const level of order) {
    const cards = seen.get(level)
    if (cards && cards.length > 0) {
      groups.push({ level, cards })
    }
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const config = groupConfig[group.level]
        return (
          <div key={group.level} id={`risk-${group.level}`}>
            <h2 className="font-sans text-2xl font-bold text-foreground mb-2 print:text-xl">
              {config.heading}
            </h2>
            <p className="text-sm text-muted-foreground italic mb-5 leading-relaxed">
              {config.subtitle}
            </p>
            <div className={cn("rounded-xl border bg-card overflow-hidden print-break-avoid", config.borderClass)}>
              {group.cards.map((card, i) => (
                <GroupedCard
                  key={card.label}
                  card={card}
                  config={config}
                  isLast={i === group.cards.length - 1}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
