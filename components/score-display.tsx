"use client"

import { cn } from "@/lib/utils"

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-700"
  if (score >= 50) return "text-amber-700"
  return "text-red-700"
}

// Map score (0-100) to angle in degrees for the half-circle
// 0 = far left (-180°), 100 = far right (0°)
function scoreToAngle(score: number): number {
  const clamped = Math.max(0, Math.min(100, score))
  return -180 + (clamped / 100) * 180
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
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

// Gauge segments with muted colors matching our design system
const segments = [
  { start: 0, end: 25, color: "hsl(0, 50%, 72%)" },      // muted red
  { start: 25, end: 50, color: "hsl(36, 60%, 72%)" },     // muted amber
  { start: 50, end: 75, color: "hsl(48, 50%, 72%)" },     // muted yellow-green
  { start: 75, end: 100, color: "hsl(142, 40%, 68%)" },   // muted green
]

export function ScoreDisplay({
  score,
  summary,
}: {
  score: number
  summary: string
}) {
  const cx = 150
  const cy = 140
  const radius = 110
  const strokeWidth = 22
  const needleAngle = scoreToAngle(score)

  // Needle tip coordinates
  const needleLength = radius - 12
  const needleTip = polarToCartesian(cx, cy, needleLength, needleAngle)

  // Tick marks at 0, 25, 50, 75, 100
  const ticks = [0, 25, 50, 75, 100]

  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
      <div className="shrink-0">
        <svg
          viewBox="0 0 300 175"
          className="w-[220px] md:w-[260px]"
          aria-label={`Score gauge showing ${score} out of 100`}
          role="img"
        >
          {/* Background track */}
          <path
            d={arcPath(cx, cy, radius, -180, 0)}
            fill="none"
            stroke="hsl(34, 18%, 86%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored segments */}
          {segments.map((seg) => {
            const startAngle = -180 + (seg.start / 100) * 180
            const endAngle = -180 + (seg.end / 100) * 180
            return (
              <path
                key={seg.start}
                d={arcPath(cx, cy, radius, startAngle, endAngle)}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
            )
          })}

          {/* Round caps on start and end */}
          <path
            d={arcPath(cx, cy, radius, -180, -179)}
            fill="none"
            stroke={segments[0].color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={arcPath(cx, cy, radius, -1, 0)}
            fill="none"
            stroke={segments[segments.length - 1].color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Tick labels */}
          {ticks.map((tick) => {
            const angle = -180 + (tick / 100) * 180
            const labelPos = polarToCartesian(cx, cy, radius + 20, angle)
            return (
              <text
                key={tick}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                style={{ fontSize: "11px", fontWeight: 500 }}
              >
                {tick}
              </text>
            )
          })}

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="hsl(0, 0%, 9%)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx={cx} cy={cy} r={5} fill="hsl(0, 0%, 9%)" />

          {/* Score text */}
          <text
            x={cx}
            y={cy + 35}
            textAnchor="middle"
            dominantBaseline="middle"
            className={cn("font-sans", scoreColor(score))}
            style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "0.02em" }}
          >
            {score}
          </text>
          <text
            x={cx + 28}
            y={cy + 35}
            textAnchor="start"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "16px", fontWeight: 500 }}
          >
            /100
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
