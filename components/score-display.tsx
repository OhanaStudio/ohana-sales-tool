"use client"

import { cn } from "@/lib/utils"

function ringColor(score: number): string {
  if (score >= 75) return "hsl(142, 40%, 58%)"
  if (score >= 50) return "hsl(36, 60%, 62%)"
  return "hsl(0, 50%, 65%)"
}

function scoreTextColor(score: number): string {
  if (score >= 75) return "text-emerald-700"
  if (score >= 50) return "text-amber-700"
  return "text-red-700"
}

export function ScoreDisplay({
  score,
  summary,
}: {
  score: number
  summary: string
}) {
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const radius = 80
  const strokeWidth = 8

  // Full circle with a small 20-degree gap at the top
  const gapDeg = 20
  const circumference = 2 * Math.PI * radius
  // Total arc length excluding the gap
  const totalArc = circumference * ((360 - gapDeg) / 360)

  // Score fill
  const clamped = Math.max(0, Math.min(100, score))
  const fillLength = (clamped / 100) * totalArc
  const emptyLength = totalArc - fillLength

  // Rotation: start from just past the gap (top-center, rotated so gap is at top)
  // Gap centered at top means arc starts at (90 + gapDeg/2) degrees from 3-o'clock
  // In CSS rotation from top (12 o'clock): rotate by (90 + gapDeg/2) degrees
  const rotationDeg = 90 + gapDeg / 2

  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
      <div className="shrink-0 relative">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-[180px] md:w-[200px]"
          aria-label={`Score gauge showing ${score} out of 100`}
          role="img"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="hsl(34, 18%, 85%)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalArc} ${circumference - totalArc}`}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          {clamped > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={ringColor(score)}
              strokeWidth={strokeWidth}
              strokeDasharray={`${fillLength} ${circumference - fillLength}`}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Centered text overlay (not rotated) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-serif leading-none",
              scoreTextColor(score)
            )}
            style={{ fontSize: "4rem", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {score}
          </span>
          <span className="text-sm text-muted-foreground font-sans -mt-1">
            /100
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          {summary}
        </p>
      </div>
    </div>
  )
}
