import type { RiskCard as RiskCardType } from "@/lib/types"
import { cn } from "@/lib/utils"

const levelConfig = {
  red: {
    badge: "bg-red-100 text-red-800",
    border: "border-red-200",
    label: "High Risk",
  },
  amber: {
    badge: "bg-amber-100 text-amber-800",
    border: "border-amber-200",
    label: "Moderate",
  },
  green: {
    badge: "bg-emerald-100 text-emerald-800",
    border: "border-emerald-200",
    label: "Low Risk",
  },
}

export function RiskCard({ card }: { card: RiskCardType }) {
  const config = levelConfig[card.level]

  return (
    <div
      className={cn(
        "rounded-lg border p-5 md:p-6 bg-card",
        config.border
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-sans text-lg text-card-foreground">{card.label}</h3>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            config.badge
          )}
        >
          {config.label}
        </span>
      </div>
      <ul className="space-y-2 mb-4">
        {card.bullets.map((bullet, i) => (
          <li
            key={`bullet-${card.label}-${i}`}
            className="text-sm text-muted-foreground leading-relaxed flex gap-2"
          >
            <span className="text-muted-foreground shrink-0 mt-0.5">{"--"}</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground italic leading-relaxed">
        {card.whyItMatters}
      </p>
    </div>
  )
}
