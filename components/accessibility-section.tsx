import React from "react"
import type { AccessibilityIndicators } from "@/lib/types"
import { Check, X, AlertTriangle } from "lucide-react"

function StatusIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass")
    return <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
  if (status === "warn")
    return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
  return <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
}

function A11yRow({
  label,
  status,
  detail,
  wcagRef,
}: {
  label: string
  status: "pass" | "warn" | "fail"
  detail: string
  wcagRef?: string
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <StatusIcon status={status} />
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">{label}</p>
          {wcagRef && (
            <span className="text-[10px] text-muted-foreground/60 font-medium">{wcagRef}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  )
}

export function AccessibilitySection({
  indicators,
}: {
  indicators: AccessibilityIndicators
}) {
  const a = indicators

  const rows: { label: string; status: "pass" | "warn" | "fail"; detail: string; wcagRef?: string }[] = []

  // Video controls
  if (a.videosFound > 0) {
    rows.push({
      label: "Video controls",
      status:
        a.videosWithControls >= a.videosFound && a.videosAutoplay === 0
          ? "pass"
          : a.videosAutoplay > 0
            ? "fail"
            : "warn",
      detail:
        a.videosWithControls >= a.videosFound && a.videosAutoplay === 0
          ? `${a.videosFound} video(s) found, all with controls and no autoplay.`
          : a.videosAutoplay > 0
            ? `${a.videosAutoplay} of ${a.videosFound} video(s) set to autoplay.`
            : `${a.videosFound - a.videosWithControls} of ${a.videosFound} video(s) missing controls.`,
      wcagRef: "WCAG 1.4.2",
    })
    if (a.videoCaptionIssues > 0) {
      rows.push({
        label: "Video captions",
        status: "fail",
        detail: `${a.videoCaptionIssues} video(s) missing captions.`,
        wcagRef: "WCAG 1.2.2",
      })
    }
  } else {
    rows.push({
      label: "Video controls",
      status: "pass",
      detail: "No video elements detected on the page.",
    })
  }

  rows.push({
    label: "Language attribute",
    status: a.htmlLangPresent ? "pass" : "fail",
    detail: a.htmlLangPresent
      ? "The page declares a language for screen readers."
      : "Missing lang attribute on <html>.",
    wcagRef: "WCAG 3.1.1",
  })

  rows.push({
    label: "Page title",
    status: a.documentTitlePresent ? "pass" : "fail",
    detail: a.documentTitlePresent
      ? "The page has a descriptive title."
      : "Missing or empty page title.",
    wcagRef: "WCAG 2.4.2",
  })

  rows.push({
    label: "Heading hierarchy",
    status: a.headingOrderValid ? "pass" : "warn",
    detail: a.headingOrderValid
      ? "Headings follow a logical order."
      : "Heading levels skip or are out of order.",
    wcagRef: "WCAG 1.3.1",
  })

  rows.push({
    label: "Image alt text",
    status: a.missingAltText === 0 ? "pass" : a.missingAltText <= 2 ? "warn" : "fail",
    detail: a.missingAltText === 0
      ? "All images have alt text."
      : `${a.missingAltText} image(s) missing alt text.`,
    wcagRef: "WCAG 1.1.1",
  })

  rows.push({
    label: "Form labels",
    status: a.missingFormLabels === 0 ? "pass" : "fail",
    detail: a.missingFormLabels === 0
      ? "All form inputs have associated labels."
      : `${a.missingFormLabels} form input(s) missing labels.`,
    wcagRef: "WCAG 4.1.2",
  })

  rows.push({
    label: "Link text",
    status: a.missingLinkNames === 0 ? "pass" : a.missingLinkNames <= 2 ? "warn" : "fail",
    detail: a.missingLinkNames === 0
      ? "All links have discernible text."
      : `${a.missingLinkNames} link(s) have no accessible name.`,
    wcagRef: "WCAG 2.4.4",
  })

  rows.push({
    label: "Skip navigation",
    status: a.skipNavFound ? "pass" : "warn",
    detail: a.skipNavFound
      ? "A skip navigation mechanism was detected."
      : "No skip navigation link found.",
    wcagRef: "WCAG 2.4.1",
  })

  rows.push({
    label: "ARIA landmarks",
    status: a.landmarksFound.length >= 3 ? "pass" : a.landmarksFound.length >= 1 ? "warn" : "fail",
    detail:
      a.landmarksFound.length >= 3
        ? `Landmarks found: ${a.landmarksFound.join(", ")}.`
        : a.landmarksFound.length > 0
          ? `Only ${a.landmarksFound.join(", ")} detected.`
          : "No semantic landmarks detected.",
    wcagRef: "WCAG 1.3.1",
  })

  rows.push({
    label: "Cookie consent (GDPR)",
    status: a.cookieConsentFound ? "pass" : "warn",
    detail: a.cookieConsentFound
      ? "A cookie consent mechanism was detected."
      : "No cookie consent banner detected.",
    wcagRef: "ePrivacy / GDPR",
  })

  const failCount = rows.filter((r) => r.status === "fail").length
  const warnCount = rows.filter((r) => r.status === "warn").length
  const issueCount = failCount + warnCount

  const badgeClass =
    failCount > 0
      ? "bg-red-50 text-red-700 border-red-200"
      : warnCount > 0
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
  const badgeLabel =
    issueCount === 0
      ? "All clear"
      : `${issueCount} Accessibility Risk${issueCount !== 1 ? "s" : ""}`

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-sans text-2xl font-bold text-foreground">
          Accessibility & EAA compliance
        </h3>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium shrink-0 ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 italic">
        Checks aligned to the European Accessibility Act (EAA) and WCAG 2.1 AA.
      </p>
      <div className="rounded-xl border border-border bg-card px-6 divide-y divide-border">
        {rows.map((row) => (
          <A11yRow
            key={row.label}
            label={row.label}
            status={row.status}
            detail={row.detail}
            wcagRef={row.wcagRef}
          />
        ))}
      </div>

      {a.eaaIssues.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
            EAA / WCAG issue summary
          </p>
          <div className="rounded-xl border border-border bg-card px-6 divide-y divide-border">
            {a.eaaIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3 py-4">
                <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-foreground">{issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
