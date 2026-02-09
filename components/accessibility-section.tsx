import React from "react"
import type { AccessibilityIndicators } from "@/lib/types"
import {
  Check,
  X,
  AlertTriangle,
  Video,
  Globe,
  SkipForward,
  Landmark,
  Cookie,
  Eye,
  FileText,
  Heading,
  FormInput,
  Link as LinkIcon,
  Captions,
} from "lucide-react"

function StatusIcon({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass")
    return <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
  if (status === "warn")
    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
  return <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
}

function A11yRow({
  icon,
  label,
  status,
  detail,
  wcagRef,
}: {
  icon: React.ReactNode
  label: string
  status: "pass" | "warn" | "fail"
  detail: string
  wcagRef?: string
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <StatusIcon status={status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {icon}
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
        {wcagRef && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">{wcagRef}</p>
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

  const overallColor =
    a.eaaScore === "pass"
      ? "text-emerald-600"
      : a.eaaScore === "warn"
        ? "text-amber-600"
        : "text-red-600"

  const overallLabel =
    a.eaaScore === "pass"
      ? "No major issues detected"
      : a.eaaScore === "warn"
        ? `${a.eaaIssues.length} issue(s) to review`
        : `${a.eaaIssues.length} issue(s) need attention`

  return (
    <div>
      <h3 className="font-serif text-xl text-foreground mb-1">
        Accessibility & EAA compliance
      </h3>
      <p className="text-xs text-muted-foreground/60 mb-2 italic">
        Checks aligned to the European Accessibility Act (EAA) and WCAG 2.1 AA.
      </p>
      <div className={`text-xs font-medium mb-4 ${overallColor}`}>
        {overallLabel}
      </div>
      <div className="rounded-lg border border-border bg-card p-5 divide-y divide-border">
        {/* Video controls */}
        {a.videosFound > 0 ? (
          <A11yRow
            icon={<Video className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Video controls"
            status={
              a.videosWithControls >= a.videosFound && a.videosAutoplay === 0
                ? "pass"
                : a.videosAutoplay > 0
                  ? "fail"
                  : "warn"
            }
            detail={
              a.videosWithControls >= a.videosFound && a.videosAutoplay === 0
                ? `${a.videosFound} video(s) found, all with play/pause controls and no autoplay.`
                : a.videosAutoplay > 0
                  ? `${a.videosAutoplay} of ${a.videosFound} video(s) set to autoplay. All videos must have user-activated play/pause controls.`
                  : `${a.videosFound - a.videosWithControls} of ${a.videosFound} video(s) missing visible controls.`
            }
            wcagRef="WCAG 1.4.2 Audio Control / 2.2.2 Pause, Stop, Hide"
          />
        ) : (
          <A11yRow
            icon={<Video className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Video controls"
            status="pass"
            detail="No video elements detected on the page."
            wcagRef="WCAG 1.4.2"
          />
        )}

        {/* Video captions */}
        {a.videosFound > 0 && (
          <A11yRow
            icon={<Captions className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Video captions"
            status={a.videoCaptionIssues === 0 ? "pass" : "fail"}
            detail={
              a.videoCaptionIssues === 0
                ? "Video captions appear to be provided."
                : `${a.videoCaptionIssues} video(s) missing captions. Captions are required for deaf and hard-of-hearing users.`
            }
            wcagRef="WCAG 1.2.2 Captions (Prerecorded)"
          />
        )}

        {/* Language attribute */}
        <A11yRow
          icon={<Globe className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Language attribute"
          status={a.htmlLangPresent ? "pass" : "fail"}
          detail={
            a.htmlLangPresent
              ? "The page declares a language, helping screen readers pronounce content correctly."
              : "The <html> element is missing a lang attribute. Screen readers need this to pronounce content correctly."
          }
          wcagRef="WCAG 3.1.1 Language of Page"
        />

        {/* Document title */}
        <A11yRow
          icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Page title"
          status={a.documentTitlePresent ? "pass" : "fail"}
          detail={
            a.documentTitlePresent
              ? "The page has a descriptive title."
              : "Missing or empty page title. Users and screen readers rely on the title to understand page purpose."
          }
          wcagRef="WCAG 2.4.2 Page Titled"
        />

        {/* Heading order */}
        <A11yRow
          icon={<Heading className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Heading hierarchy"
          status={a.headingOrderValid ? "pass" : "warn"}
          detail={
            a.headingOrderValid
              ? "Headings follow a logical order (h1 then h2 then h3 etc.)."
              : "Heading levels skip or are out of order, which can confuse screen reader navigation."
          }
          wcagRef="WCAG 1.3.1 Info and Relationships"
        />

        {/* Alt text */}
        <A11yRow
          icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Image alt text"
          status={a.missingAltText === 0 ? "pass" : a.missingAltText <= 2 ? "warn" : "fail"}
          detail={
            a.missingAltText === 0
              ? "All images have alt text."
              : `${a.missingAltText} image(s) missing alt text. Screen readers cannot describe these to visually impaired users.`
          }
          wcagRef="WCAG 1.1.1 Non-text Content"
        />

        {/* Form labels */}
        <A11yRow
          icon={<FormInput className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Form labels"
          status={a.missingFormLabels === 0 ? "pass" : "fail"}
          detail={
            a.missingFormLabels === 0
              ? "All form inputs have associated labels."
              : `${a.missingFormLabels} form input(s) missing labels, making them unusable for screen reader users.`
          }
          wcagRef="WCAG 1.3.1 / 4.1.2 Name, Role, Value"
        />

        {/* Link names */}
        <A11yRow
          icon={<LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Link text"
          status={a.missingLinkNames === 0 ? "pass" : a.missingLinkNames <= 2 ? "warn" : "fail"}
          detail={
            a.missingLinkNames === 0
              ? "All links have discernible text."
              : `${a.missingLinkNames} link(s) have no accessible name (e.g. icon-only links without aria-label).`
          }
          wcagRef="WCAG 2.4.4 Link Purpose"
        />

        {/* Skip navigation */}
        <A11yRow
          icon={<SkipForward className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Skip navigation"
          status={a.skipNavFound ? "pass" : "warn"}
          detail={
            a.skipNavFound
              ? "A skip navigation mechanism was detected."
              : "No skip navigation link found. Keyboard users must tab through the entire navigation to reach main content."
          }
          wcagRef="WCAG 2.4.1 Bypass Blocks"
        />

        {/* ARIA landmarks */}
        <A11yRow
          icon={<Landmark className="h-3.5 w-3.5 text-muted-foreground" />}
          label="ARIA landmarks"
          status={a.landmarksFound.length >= 3 ? "pass" : a.landmarksFound.length >= 1 ? "warn" : "fail"}
          detail={
            a.landmarksFound.length >= 3
              ? `Semantic landmarks found: ${a.landmarksFound.join(", ")}.`
              : a.landmarksFound.length > 0
                ? `Only ${a.landmarksFound.join(", ")} detected. Consider adding main, nav, header, and footer landmarks.`
                : "No semantic landmarks detected. Screen readers use these to navigate page regions."
          }
          wcagRef="WCAG 1.3.1 Info and Relationships"
        />

        {/* Cookie consent / GDPR */}
        <A11yRow
          icon={<Cookie className="h-3.5 w-3.5 text-muted-foreground" />}
          label="Cookie consent (GDPR)"
          status={a.cookieConsentFound ? "pass" : "warn"}
          detail={
            a.cookieConsentFound
              ? "A cookie consent mechanism was detected on the page."
              : "No cookie consent banner detected. EU sites must obtain consent before setting non-essential cookies."
          }
          wcagRef="ePrivacy Directive / GDPR"
        />
      </div>

      {/* EAA summary issues */}
      {a.eaaIssues.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
            EAA / WCAG issue summary
          </p>
          <ul className="space-y-1.5">
            {a.eaaIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                <X className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
