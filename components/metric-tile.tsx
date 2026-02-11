import type { RiskLevel } from "@/lib/types"
import type { ReactNode } from "react"

interface MetricTileProps {
  label: string
  mobileValue: string | null
  desktopValue: string | null
  unit?: string
  maxScore?: number
  mobileStatus?: RiskLevel
  desktopStatus?: RiskLevel
  icon?: ReactNode
  compact?: boolean
}

const dotColor: Record<RiskLevel, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
}

const borderColor: Record<RiskLevel, string> = {
  green: "border-emerald-400",
  amber: "border-amber-400",
  red: "border-red-400",
}

function worstStatus(a?: RiskLevel, b?: RiskLevel): RiskLevel | undefined {
  if (!a && !b) return undefined
  const order: RiskLevel[] = ["red", "amber", "green"]
  for (const level of order) {
    if (a === level || b === level) return level
  }
  return undefined
}

function ValueDisplay({
  value,
  unit,
  maxScore,
  status,
}: {
  value: string | null
  unit?: string
  maxScore?: number
  status?: RiskLevel
}) {
  return (
    <div className="flex items-center gap-1.5">
      {status && (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${dotColor[status]}`}
        />
      )}
      <p className="text-xl font-sans font-semibold text-card-foreground leading-tight">
        {value ?? "N/A"}
        {value && maxScore ? (
          <span className="text-sm font-normal text-muted-foreground">
            /{maxScore}
          </span>
        ) : null}
        {value && unit && !maxScore ? (
          <span className="text-sm font-normal text-muted-foreground ml-0.5">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  )
}

export function MetricTile({
  label,
  mobileValue,
  desktopValue,
  unit = "",
  maxScore,
  mobileStatus,
  desktopStatus,
  icon,
  compact = false,
}: MetricTileProps) {
  const tileBorder = worstStatus(mobileStatus, desktopStatus)

  return (
    <div
      className={`rounded-xl border bg-card p-5 print-break-avoid ${tileBorder ? borderColor[tileBorder] : "border-border"
        }`}
    >
      {/* Icon + Title */}
      <div className={`flex items-center ${compact ? "gap-2 mb-3" : "gap-3 mb-4"}`}>
        {icon && (
          <div
            className={`flex items-center justify-center rounded-lg bg-muted/60 text-muted-foreground shrink-0 ${compact
              ? "h-7 w-7 [&>svg]:h-3.5 [&>svg]:w-3.5"
              : "h-9 w-9 [&>svg]:h-5 [&>svg]:w-5"
              }`}
          >
            {icon}
          </div>
        )}
        <h4 className={`font-sans font-bold text-card-foreground leading-snug ${compact ? "text-sm" : "text-base"}`}>
          {label}
        </h4>
      </div>

      {/* Mobile | Desktop split */}
      <div className="rounded-lg bg-muted/40 p-3">
        <div className="grid grid-cols-2 gap-0">
          <div className="pr-3 border-r border-border/60">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Mobile
            </p>
            <ValueDisplay
              value={mobileValue}
              unit={unit}
              maxScore={maxScore}
              status={mobileStatus}
            />
          </div>
          <div className="pl-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Desktop
            </p>
            <ValueDisplay
              value={desktopValue}
              unit={unit}
              maxScore={maxScore}
              status={desktopStatus}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
