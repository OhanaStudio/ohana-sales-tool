import type { UXIndicators } from "@/lib/types"
import { Check, X, AlertTriangle } from "lucide-react"

function Indicator({
  found,
  label,
  detail,
  blocked,
}: {
  found: boolean
  label: string
  detail?: string
  blocked?: boolean
}) {
  if (blocked) {
    return (
      <div className="flex items-start gap-3 py-4">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 py-4">
      {found ? (
        <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-sm font-bold text-foreground">{label}</p>
        {detail && (
          <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  )
}

export function UXIndicatorsSection({
  indicators,
}: {
  indicators: UXIndicators
}) {
  const items: { found: boolean; label: string; detail?: string }[] = []

  if (indicators.ctaFound || !indicators.fetchBlocked) {
    items.push({
      found: indicators.ctaFound,
      label: "Call-to-action clarity",
      detail: indicators.ctaFound
        ? (() => {
            const displayCtas = indicators.ctaKeywords.filter(
              (k) => !k.startsWith("("),
            )
            return displayCtas.length > 0
              ? `Found: ${displayCtas.join(", ")}`
              : "Interactive elements detected (links and buttons with proper accessible names)"
          })()
        : "No clear CTA keywords detected in buttons or links",
    })
  }

  if (indicators.trustSignalsFound || !indicators.fetchBlocked) {
    items.push({
      found: indicators.trustSignalsFound,
      label: "Trust signals",
      detail: indicators.trustSignalsFound
        ? `Found: ${indicators.trustKeywords.join(", ")}`
        : "No obvious trust indicators detected",
    })
  }

  if (indicators.socialProofAboveFold || !indicators.fetchBlocked) {
    items.push({
      found: indicators.socialProofAboveFold,
      label: "Social proof above the fold",
      detail: indicators.socialProofAboveFold
        ? `Above the fold: ${indicators.socialProofKeywordsAboveFold.join(", ")}`
        : indicators.trustSignalsFound
          ? "Social proof was found, but appears to be below the fold"
          : "No social proof detected",
    })
  }

  if (indicators.testimonialsVerified || !indicators.fetchBlocked) {
    items.push({
      found: indicators.testimonialsVerified,
      label: "Verified third-party reviews",
      detail: indicators.testimonialsVerified
        ? `Sources: ${indicators.verifiedSources.join(", ")}`
        : indicators.trustSignalsFound
          ? "Testimonials appear self-hosted, not from a verified third-party source"
          : "No review sources detected",
    })
  }

  if (indicators.phoneFound || !indicators.fetchBlocked) {
    items.push({
      found: indicators.phoneFound,
      label: "Phone number visible",
    })
  }

  if (indicators.emailFound || !indicators.fetchBlocked) {
    items.push({
      found: indicators.emailFound,
      label: "Email address visible",
    })
  }

  if (items.length === 0) return null

  const failCount = items.filter((i) => !i.found).length
  const badgeClass =
    failCount === 0
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : failCount <= 3
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200"
  const badgeLabel =
    failCount === 0
      ? "All clear"
      : `${failCount} Moderate Risk${failCount !== 1 ? "s" : ""}`

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="font-sans text-xl font-bold text-foreground">
          UX indicators
        </h3>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium shrink-0 ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 italic">
        These indicators are based on an AI analysis of the page screenshots.
      </p>
      <div className="rounded-xl border border-border bg-card px-6 divide-y divide-border">
        {items.map((item) => (
          <Indicator
            key={item.label}
            found={item.found}
            label={item.label}
            detail={item.detail}
          />
        ))}
      </div>
    </div>
  )
}
