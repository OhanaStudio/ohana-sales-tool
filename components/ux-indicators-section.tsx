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
  return (
    <div>
      <h3 className="font-serif text-xl text-foreground mb-1">UX indicators</h3>
      <p className="text-xs text-muted-foreground/60 mb-4 italic">
        These are indicators based on a lightweight scan, not proof.
      </p>
      <div className="rounded-lg border border-border bg-card p-5 divide-y divide-border">
        <Indicator
          found={indicators.ctaFound}
          label="Call-to-action clarity"
          detail={
            indicators.ctaFound
              ? (() => {
                  const displayCtas = indicators.ctaKeywords.filter(k => !k.startsWith("("))
                  return displayCtas.length > 0
                    ? `Found: ${displayCtas.join(", ")}`
                    : "Interactive elements detected via Lighthouse (links and buttons have proper accessible names)"
                })()
              : indicators.fetchBlocked
                ? undefined
                : "No clear CTA keywords detected in buttons or links"
          }
          blocked={!indicators.ctaFound && indicators.fetchBlocked}
        />
        <Indicator
          found={indicators.trustSignalsFound}
          label="Trust signals"
          detail={
            indicators.fetchBlocked
              ? undefined
              : indicators.trustSignalsFound
                ? `Found: ${indicators.trustKeywords.join(", ")}`
                : "No obvious trust indicators detected"
          }
          blocked={indicators.fetchBlocked}
        />
        <Indicator
          found={indicators.socialProofAboveFold}
          label="Social proof above the fold"
          detail={
            indicators.fetchBlocked
              ? undefined
              : indicators.socialProofAboveFold
                ? `Above the fold: ${indicators.socialProofKeywordsAboveFold.join(", ")}`
                : indicators.trustSignalsFound
                  ? "Social proof was found, but appears to be below the fold"
                  : "No social proof detected"
          }
          blocked={indicators.fetchBlocked}
        />
        <Indicator
          found={indicators.testimonialsVerified}
          label="Verified third-party reviews"
          detail={
            indicators.fetchBlocked
              ? undefined
              : indicators.testimonialsVerified
                ? `Sources: ${indicators.verifiedSources.join(", ")}`
                : indicators.trustSignalsFound
                  ? "Testimonials appear self-hosted, not from a verified third-party source"
                  : "No review sources detected"
          }
          blocked={indicators.fetchBlocked}
        />
        <Indicator
          found={indicators.phoneFound}
          label="Phone number visible"
          blocked={indicators.fetchBlocked}
        />
        <Indicator
          found={indicators.emailFound}
          label="Email address visible"
          blocked={indicators.fetchBlocked}
        />
      </div>
    </div>
  )
}
