import type { RiskLevel } from "@/lib/types"

interface MetricTileProps {
  label: string
  mobileValue: string | null
  desktopValue: string | null
  unit?: string
  maxScore?: number
  mobileStatus?: RiskLevel
  desktopStatus?: RiskLevel
}

const statusDotColor: Record<RiskLevel, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
}

const statusBorderColor: Record<RiskLevel, string> = {
  green: "border-emerald-500",
  amber: "border-amber-500",
  red: "border-red-500",
}

function worstStatus(
  a?: RiskLevel,
  b?: RiskLevel
): RiskLevel | undefined {
  if (!a && !b) return undefined
  const order: RiskLevel[] = ["red", "amber", "green"]
  for (const level of order) {
    if (a === level || b === level) return level
  }
  return undefined
}

export function MetricTile({
  label,
  mobileValue,
  desktopValue,
  unit = "",
  maxScore,
  mobileStatus,
  desktopStatus,
}: MetricTileProps) {
  const tileBorder = worstStatus(mobileStatus, desktopStatus)

  return (
    <div
      className={`rounded-lg border bg-card p-4 ${
        tileBorder ? statusBorderColor[tileBorder] : "border-border"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">
        {label}
      </p>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
            Mobile
          </p>
          <div className="flex items-center gap-1.5">
            {mobileStatus && (
              <span
                className={`inline-block h-2 w-2 rounded-full ${statusDotColor[mobileStatus]}`}
                aria-label={`Mobile status: ${mobileStatus}`}
              />
            )}
            <p className="text-lg font-sans text-card-foreground">
              {mobileValue ?? "N/A"}
              {mobileValue && unit ? (
                <span className="text-xs text-muted-foreground ml-0.5">
                  {unit}
                </span>
              ) : null}
              {mobileValue && maxScore ? (
                <span className="text-xs text-muted-foreground">/{maxScore}</span>
              ) : null}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
            Desktop
          </p>
          <div className="flex items-center gap-1.5">
            {desktopStatus && (
              <span
                className={`inline-block h-2 w-2 rounded-full ${statusDotColor[desktopStatus]}`}
                aria-label={`Desktop status: ${desktopStatus}`}
              />
            )}
            <p className="text-lg font-sans text-card-foreground">
              {desktopValue ?? "N/A"}
              {desktopValue && unit ? (
                <span className="text-xs text-muted-foreground ml-0.5">
                  {unit}
                </span>
              ) : null}
              {desktopValue && maxScore ? (
                <span className="text-xs text-muted-foreground">/{maxScore}</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
