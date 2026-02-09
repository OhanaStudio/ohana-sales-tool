import { cn } from "@/lib/utils"

function scoreColor(score: number): string {
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
  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
      <div
        className={cn(
          "text-7xl md:text-8xl font-serif tabular-nums shrink-0",
          scoreColor(score)
        )}
      >
        {score}
      </div>
      <div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          {summary}
        </p>
      </div>
    </div>
  )
}
