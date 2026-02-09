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
      <div className="flex items-start gap-3 py-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 py-2">
      {found ? (
        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {detail && (
          <p className="text-xs text-muted-foreground">{detail}</p>
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
  // Build the list of indicators that have reliable data.
  // If fetch was blocked AND the indicator wasn't detected, skip it entirely.
  const items: { found: boolean; label: string; detail?: string }[] = []

  // CTA
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

  // Trust signals
  if (indicators.trustSignalsFound || !indicators.fetchBlocked) {
    items.push({
      found: indicators.trustSignalsFound,
      label: "Trust signals",
      detail: indicators.trustSignalsFound
        ? `Found: ${indicators.trustKeywords.join(", ")}`
        : "No obvious trust indicators detected",
    })
  }

  // Social proof above the fold
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

  // Verified third-party reviews
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

  // Phone
  if (indicators.phoneFound || !indicators.fetchBlocked) {
    items.push({
      found: indicators.phoneFound,
      label: "Phone number visible",
    })
  }

  // Email
  if (indicators.emailFound || !indicators.fetchBlocked) {
    items.push({
      found: indicators.emailFound,
      label: "Email address visible",
    })
  }

  // If nothing could be reliably detected, hide the entire section
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="font-sans text-xl text-foreground mb-1">
        UX indicators
      </h3>
      <p className="text-xs text-muted-foreground/60 mb-4 italic">
        These indicators are based on an AI analysis of the page screenshots.
      </p>
      <div className="rounded-lg border border-border bg-card p-5 divide-y divide-border">
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
