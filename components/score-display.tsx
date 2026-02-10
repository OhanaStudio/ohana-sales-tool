"use client"

function ringColor(score: number): string {
  if (score >= 75) return "hsl(142, 40%, 58%)"
  if (score >= 50) return "hsl(36, 60%, 62%)"
  return "hsl(0, 50%, 65%)"
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Strong Performance"
  if (score >= 70) return "Good Performance"
  if (score >= 50) return "Moderate Performance"
  if (score >= 30) return "Needs Improvement"
  return "Critical Issues"
}

export interface RiskPill {
  label: string
  count: number
  variant: "red" | "amber" | "filled-red"
}

export function ScoreDisplay({
  score,
  summary,
  pills,
}: {
  score: number
  summary: string
  pills?: RiskPill[]
}) {
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const radius = 80
  const strokeWidth = 8

  const gapDeg = 20
  const circumference = 2 * Math.PI * radius
  const totalArc = circumference * ((360 - gapDeg) / 360)

  const clamped = Math.max(0, Math.min(100, score))
  const fillLength = (clamped / 100) * totalArc

  const rotationDeg = 90 + gapDeg / 2

  return (
    <div className="w-full flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-10">
      {/* Score circle */}
      <div className="shrink-0 relative">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-[160px] md:w-[200px]"
          aria-label={`Score gauge showing ${score} out of 100`}
          role="img"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
        >
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-sans leading-none text-foreground"
            style={{ fontSize: "4rem", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {score}
          </span>
          <span className="text-sm text-muted-foreground font-sans -mt-1">
            /100
          </span>
        </div>
      </div>

      {/* Text + pills */}
      <div className="flex-1 min-w-0">
        <h3 className="font-sans text-xl font-semibold text-foreground mb-2">
          {scoreLabel(score)}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {summary}
        </p>
        {pills && pills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pills.map((pill) => {
              const classes =
                pill.variant === "filled-red"
                  ? "bg-red-600 text-white border-red-600"
                  : pill.variant === "red"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
              return (
                <span
                  key={pill.label}
                  className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full border ${classes}`}
                >
                  {pill.count} {pill.label}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
