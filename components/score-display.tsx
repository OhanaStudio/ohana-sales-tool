"use client"

import { cn } from "@/lib/utils"

// Score-based arc color using muted palette
function arcStroke(score: number): string {
  if (score >= 75) return "hsl(142, 40%, 58%)"
  if (score >= 50) return "hsl(36, 60%, 62%)"
  return "hsl(0, 50%, 65%)"
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-700"
  if (score >= 50) return "text-amber-700"
  return "text-red-700"
}

// Convert polar to cartesian for SVG arc paths
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

// Build an SVG arc path from startAngle to endAngle
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  if (Math.abs(endAngle - startAngle) < 0.1) {
    return ""
  }
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export function ScoreDisplay({
  score,
  summary,
}: {
  score: number
  summary: string
}) {
  const cx = 120
  const cy = 120
  const radius = 90
  const strokeWidth = 20

  // Arc spans 240 degrees (from 150 to 390, i.e. bottom-left to bottom-right)
  const startAngle = 150
  const totalSweep = 240
  const endAngle = startAngle + totalSweep

  // Fill arc based on score
  const clamped = Math.max(0, Math.min(100, score))
  const fillEnd = startAngle + (clamped / 100) * totalSweep

  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
      <div className="shrink-0">
        <svg
          viewBox="0 0 240 200"
          className="w-[200px] md:w-[220px]"
          aria-label={`Score gauge showing ${score} out of 100`}
          role="img"
        >
          {/* Background track */}
          <path
            d={arcPath(cx, cy, radius, startAngle, endAngle)}
            fill="none"
            stroke="hsl(34, 18%, 88%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          {clamped > 0 && (
            <path
              d={arcPath(cx, cy, radius, startAngle, fillEnd)}
              fill="none"
              stroke={arcStroke(score)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Score number centered */}
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            className={cn("font-sans", scoreColor(score))}
            style={{ fontSize: "44px", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            {score}
          </text>

          {/* /100 below the number */}
          <text
            x={cx}
            y={cy + 34}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "14px", fontWeight: 500 }}
          >
            /100
          </text>

          {/* Min label */}
          <text
            x={polarToCartesian(cx, cy, radius + 18, startAngle).x}
            y={polarToCartesian(cx, cy, radius + 18, startAngle).y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "11px", fontWeight: 500 }}
          >
            0
          </text>

          {/* Max label */}
          <text
            x={polarToCartesian(cx, cy, radius + 18, endAngle).x}
            y={polarToCartesian(cx, cy, radius + 18, endAngle).y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "11px", fontWeight: 500 }}
          >
            100
          </text>
        </svg>
      </div>
      <div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          {summary}
        </p>
      </div>
    </div>
  )
}
