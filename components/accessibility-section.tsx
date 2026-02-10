import React from "react"
import type { AccessibilityIndicators } from "@/lib/types"
import { Check, X, AlertTriangle } from "lucide-react"

const EAA_ISSUE_NOTES: Record<string, string> = {
  "3.1.1": "Without a language declaration, screen readers may mispronounce content, making the site difficult for visually impaired visitors.",
  "2.4.2": "The page title appears in browser tabs, search results, and bookmarks. Missing titles look unprofessional and hurt search rankings.",
  "1.3.1": "Proper document structure helps screen readers and search engines understand your content. This is a foundational accessibility and SEO requirement.",
  "1.1.1": "Images without alt text are invisible to screen reader users and search engines. This is both an accessibility violation and a missed SEO opportunity.",
  "4.1.2": "Unlabelled form fields are confusing for screen reader users and can reduce form completion rates on mobile devices.",
  "2.4.4": "Links without descriptive text are meaningless for screen reader users who navigate by link list. This reduces clarity for all visitors.",
  "1.4.2": "Videos without user controls frustrate visitors and violate accessibility standards. Autoplay can disorient users with cognitive disabilities.",
  "1.2.2": "Captions are essential for deaf and hard-of-hearing users, and also help visitors in sound-sensitive environments like offices.",
  "2.4.1": "Without skip navigation, keyboard users must tab through every menu item on every page load. This is a simple fix with major impact.",
  "gdpr": "EU regulations require consent before setting non-essential cookies. Non-compliance can result in significant fines under GDPR.",
}

function parseEaaIssue(issue: string): { label: string; detail: string; wcagRef?: string; note?: string } {
  const wcagMatch = issue.match(/\(([^)]+)\)/)
  const wcagRef = wcagMatch ? wcagMatch[1].replace(" requirement for EU sites", "").trim() : undefined
  const detail = issue.replace(/\s*\([^)]+\)\.?/, "").replace(/\.$/, "").trim()
  const label = detail.replace(/^\d+\s+/, "").replace(/\.$/, "").trim()
  let note: string | undefined
  if (wcagRef) {
    const refNumber = wcagRef.replace("WCAG ", "").trim()
    note = EAA_ISSUE_NOTES[refNumber]
    if (!note && wcagRef.toLowerCase().includes("gdpr")) {
      note = EAA_ISSUE_NOTES["gdpr"]
    }
  }
  return { label, detail, wcagRef, note }
}

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
  note,
}: {
  label: string
  status: "pass" | "warn" | "fail"
  detail: string
  wcagRef?: string
  note?: string
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <StatusIcon status={status} />
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">{label}</p>
          {wcagRef && (
            <span className="text-[10px] text-muted-foreground font-semibold">{wcagRef}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
        {note && (
          <p className="text-xs text-muted-foreground italic mt-1 leading-relaxed">Note: {note}</p>
        )}
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

  const rows: { label: string; status: "pass" | "warn" | "fail"; detail: string; wcagRef?: string; note?: string }[] = []

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
      note: "Videos without user controls frustrate visitors and violate accessibility standards. This is a quick fix that improves both UX and compliance.",
    })
    if (a.videoCaptionIssues > 0) {
      rows.push({
        label: "Video captions",
        status: "fail",
        detail: `${a.videoCaptionIssues} video(s) missing captions.`,
        wcagRef: "WCAG 1.2.2",
        note: "Captions are essential for deaf and hard-of-hearing users, but also help all visitors in sound-sensitive environments like offices.",
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
    note: a.htmlLangPresent
      ? "Properly declared language helps screen readers pronounce content correctly for visually impaired users."
      : "Without a language declaration, screen readers may mispronounce content, making the site unusable for visually impaired visitors.",
  })

  rows.push({
    label: "Page title",
    status: a.documentTitlePresent ? "pass" : "fail",
    detail: a.documentTitlePresent
      ? "The page has a descriptive title."
      : "Missing or empty page title.",
    wcagRef: "WCAG 2.4.2",
    note: a.documentTitlePresent
      ? "A descriptive title helps users and search engines understand the page at a glance."
      : "The page title appears in browser tabs, search results, and bookmarks. Without one, the site looks unprofessional and ranks poorly.",
  })

  rows.push({
    label: "Heading hierarchy",
    status: a.headingOrderValid ? "pass" : "warn",
    detail: a.headingOrderValid
      ? "Headings follow a logical order."
      : "Heading levels skip or are out of order.",
    wcagRef: "WCAG 1.3.1",
    note: a.headingOrderValid
      ? "A logical heading structure helps both screen readers and search engines understand the page content."
      : "Skipped headings confuse screen reader users who navigate by heading level. It also weakens SEO as search engines use headings to understand page structure.",
  })

  rows.push({
    label: "Image alt text",
    status: a.missingAltText === 0 ? "pass" : a.missingAltText <= 2 ? "warn" : "fail",
    detail: a.missingAltText === 0
      ? "All images have alt text."
      : `${a.missingAltText} image(s) missing alt text.`,
    wcagRef: "WCAG 1.1.1",
    note: a.missingAltText === 0
      ? "Alt text ensures images are accessible and improves image search rankings."
      : "Images without alt text are invisible to screen reader users and search engines. This is both an accessibility violation and a missed SEO opportunity.",
  })

  rows.push({
    label: "Form labels",
    status: a.missingFormLabels === 0 ? "pass" : "fail",
    detail: a.missingFormLabels === 0
      ? "All form inputs have associated labels."
      : `${a.missingFormLabels} form input(s) missing labels.`,
    wcagRef: "WCAG 4.1.2",
    note: a.missingFormLabels === 0
      ? "Labelled form fields ensure all users can complete enquiry forms successfully."
      : "Unlabelled form fields are confusing for screen reader users and can also frustrate sighted users on mobile. This directly reduces form completion rates.",
  })

  rows.push({
    label: "Link text",
    status: a.missingLinkNames === 0 ? "pass" : a.missingLinkNames <= 2 ? "warn" : "fail",
    detail: a.missingLinkNames === 0
      ? "All links have discernible text."
      : `${a.missingLinkNames} link(s) have no accessible name.`,
    wcagRef: "WCAG 2.4.4",
    note: a.missingLinkNames === 0
      ? "Descriptive link text helps all users understand where links lead before clicking."
      : "Links without descriptive text (like bare 'click here') are meaningless for screen reader users who navigate by link list. It also reduces clarity for all visitors.",
  })

  rows.push({
    label: "Skip navigation",
    status: a.skipNavFound ? "pass" : "warn",
    detail: a.skipNavFound
      ? "A skip navigation mechanism was detected."
      : "No skip navigation link found.",
    wcagRef: "WCAG 2.4.1",
    note: a.skipNavFound
      ? "Skip navigation helps keyboard and screen reader users quickly reach the main content."
      : "Without skip navigation, keyboard users must tab through every menu item on every page load. This is a simple addition that significantly improves the experience for disabled users.",
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
    note: a.landmarksFound.length >= 3
      ? "Proper landmark regions let assistive technology users jump between page sections efficiently."
      : "Without proper landmarks, screen reader users cannot efficiently navigate the page. This is a code-level fix that makes a big difference for accessibility.",
  })

  rows.push({
    label: "Cookie consent (GDPR)",
    status: a.cookieConsentFound ? "pass" : "warn",
    detail: a.cookieConsentFound
      ? "A cookie consent mechanism was detected."
      : "No cookie consent banner detected.",
    wcagRef: "ePrivacy / GDPR",
    note: a.cookieConsentFound
      ? "Having a cookie consent mechanism helps ensure compliance with EU privacy regulations."
      : "EU regulations require websites to obtain consent before setting non-essential cookies. Non-compliance can result in significant fines.",
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
            note={row.note}
          />
        ))}
      </div>

      {a.eaaIssues.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
            EAA / WCAG issue summary
          </p>
          <div className="rounded-xl border border-border bg-card px-6 divide-y divide-border">
            {a.eaaIssues.map((issue, i) => {
              const parsed = parseEaaIssue(issue)
              return (
                <A11yRow
                  key={i}
                  label={parsed.label}
                  status="fail"
                  detail={parsed.detail}
                  wcagRef={parsed.wcagRef}
                  note={parsed.note}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
