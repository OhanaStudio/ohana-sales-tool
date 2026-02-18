import type {
  FirstImpressionIndicators,
  NavigationFrictionIndicators,
  ScanabilityIndicators,
  ConversionPathIndicators,
  FormFrictionIndicators,
  TrustDepthIndicators,
  MobileFrictionIndicators,
  AdvancedUXIndicators,
} from "./types"

// ─── Helpers ────────────────────────────────────────────
// Modern HTML has verbose class names/attributes - 20k chars typically covers the hero/header
const ABOVE_FOLD_CHARS = 20000

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

// ─── Shared CTA keywords ───────────────────────────────
const CTA_KEYWORDS = [
  "book", "contact", "get", "enquire", "call", "start", "try",
  "schedule", "request", "buy", "shop", "quote", "demo", "free",
  "apply", "order", "subscribe", "learn more", "find out",
  "discover", "see", "view", "explore", "sales", "pricing",
  "sign up", "register", "download",
]

function isCta(text: string): boolean {
  const t = text.toLowerCase().trim()
  return t.length > 0 && t.length < 60 && CTA_KEYWORDS.some((kw) => t.includes(kw))
}

// Extract interactive-element text from Lighthouse audits.
// NOTE: link-name/button-name only list FAILING elements (those without accessible names).
// For well-built sites, these arrays are empty. We also check tap-targets and
// crawlable-anchors which may list more elements, plus node snippets from various audits.
// biome-ignore lint: audits is complex PSI shape
function extractLighthouseInteractiveTexts(audits: any): string[] {
  const texts: string[] = []
  const seen = new Set<string>()
  const addText = (raw: string) => {
    const t = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    if (t && t.length > 1 && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase())
      texts.push(t)
    }
  }

  // link-name / button-name: only FAILING items, but still useful
  for (const auditName of ["link-name", "button-name"]) {
    const items = audits?.[auditName]?.details?.items || []
    for (const item of items) {
      addText(item.text || item.node?.snippet || item.snippet || "")
    }
  }
  // tap-targets: lists targets that are too small - contains snippet HTML
  const tapItems = audits?.["tap-targets"]?.details?.items || []
  for (const item of tapItems) {
    addText(item.tapTarget?.snippet || item.node?.snippet || "")
    if (item.overlappingTarget) addText(item.overlappingTarget.snippet || "")
  }
  // crawlable-anchors: may have link info
  const crawlItems = audits?.["crawlable-anchors"]?.details?.items || []
  for (const item of crawlItems) {
    addText(item.text || item.node?.snippet || "")
  }
  return texts
}

// Extract heading data from Lighthouse's heading-order audit (rendered DOM)
// biome-ignore lint: audits is complex PSI shape
function extractLighthouseHeadings(audits: any): Array<{ level: number; text: string }> {
  const items = audits?.["heading-order"]?.details?.items || []
  return items.map((item: any) => ({
    level: item.headingLevel ?? 0,
    text: (item.headingText || "").trim(),
  })).filter((h: any) => h.level > 0)
}

// ─── 1. First-impression clarity ────────────────────────
// biome-ignore lint: audits is complex PSI shape
export function analyseFirstImpression(html: string, mobileAudits?: any, puppeteerH1s?: string[]): FirstImpressionIndicators {
  const lower = html.toLowerCase()
  const aboveFold = lower.slice(0, ABOVE_FOLD_CHARS)
  const htmlIsEmpty = !html || html.length < 500

  // --- Lighthouse SCORES: infer element presence even when we can't see HTML ---
  const headingOrderPasses = mobileAudits?.["heading-order"]?.score === 1
  const linkNamePasses = mobileAudits?.["link-name"]?.score === 1
  const buttonNamePasses = mobileAudits?.["button-name"]?.score === 1
  const lhCtasInferred = linkNamePasses || buttonNamePasses

  // --- H1 detection ---
  console.log("[v0] === H1 DETECTION START ===")
  console.log("[v0] htmlIsEmpty:", htmlIsEmpty, "| html.length:", html.length)
  
  // 1. Try Lighthouse heading-order detail items (present when audit fails, sometimes when passes)
  const lhHeadings = mobileAudits ? extractLighthouseHeadings(mobileAudits) : []
  const lhH1s = lhHeadings.filter((h) => h.level === 1)
  console.log("[v0] Lighthouse headings:", lhHeadings.length, "| H1s:", lhH1s.length)
  if (lhH1s.length > 0) console.log("[v0] Lighthouse H1 texts:", lhH1s.map(h => h.text))

  // 2. Try HTML regex
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi
  const htmlH1Matches = [...html.matchAll(h1Regex)]
  const htmlH1Texts = htmlH1Matches.map((m) => stripTags(m[1]).slice(0, 120))
  console.log("[v0] HTML H1 matches:", htmlH1Matches.length)
  if (htmlH1Texts.length > 0) console.log("[v0] HTML H1 texts:", htmlH1Texts)

  // 3. Try Puppeteer H1s (if provided - only used when HTML is blocked)
  const puppeteerH1Texts = puppeteerH1s || []
  console.log("[v0] Puppeteer H1 matches:", puppeteerH1Texts.length)
  if (puppeteerH1Texts.length > 0) console.log("[v0] Puppeteer H1 texts:", puppeteerH1Texts)

  // 4. Check if we found an H1
  // NOTE: We cannot infer H1 presence from Lighthouse heading-order audit passing.
  // That audit only checks sequential order (H1→H2→H3), not H1 presence.
  // A site with H2→H3 (no H1) would still pass heading-order.
  let h1Texts: string[]
  let h1Inferred = false
  if (lhH1s.length > 0) {
    // Lighthouse explicitly shows us H1s in the detail items
    h1Texts = lhH1s.map((h) => h.text.slice(0, 120))
    console.log("[v0] ✓ Using Lighthouse H1s")
  } else if (htmlH1Texts.length > 0) {
    // We found H1s in the HTML
    h1Texts = htmlH1Texts
    console.log("[v0] ✓ Using HTML H1s")
  } else if (puppeteerH1Texts.length > 0) {
    // Puppeteer found H1s (used when HTML blocked)
    h1Texts = puppeteerH1Texts
    console.log("[v0] ✓ Using Puppeteer H1s")
  } else if (htmlIsEmpty && lhHeadings.length === 0) {
    // We can't access HTML AND Lighthouse didn't give us heading data
    // AND Puppeteer didn't find anything (or wasn't run)
    // We can't definitively say if H1 exists or not - don't flag as an error
    h1Texts = ["(Unable to verify - site may block automated access)"]
    h1Inferred = true
    console.log("[v0] ✓ Cannot verify H1 - marking as inferred")
  } else {
    // No H1 found anywhere - this is legitimately a missing H1
    h1Texts = []
    console.log("[v0] ✗ No H1 found - htmlIsEmpty:", htmlIsEmpty, "lhHeadings:", lhHeadings.length)
  }
  
  console.log("[v0] Final: h1Count:", h1Texts.length, "| h1Inferred:", h1Inferred)
  console.log("[v0] === H1 DETECTION END ===")

  const h1Count = h1Texts.length
  const h1Text = h1Texts.length > 0 ? h1Texts[0] : null
  // H1 above fold detection:
  // - If Lighthouse gave us heading data and first heading is H1, it's above fold
  // - If we inferred H1 exists from passing audit, assume it's above fold (best practice)
  // - Otherwise check HTML (which may be empty if blocked)
  const h1AboveFold = lhH1s.length > 0
    ? (lhHeadings.length > 0 && lhHeadings[0].level === 1)
    : h1Inferred ? true : aboveFold.includes("<h1")

  const vaguePatterns = [
    "welcome", "we help", "solutions for", "your partner", "grow your",
    "innovate", "transform", "leading", "world-class", "next level",
    "better future", "home page", "homepage",
  ]
  const h1Lower = (h1Text || "").toLowerCase()
  const h1Vague = (h1Text && !h1Inferred) ? vaguePatterns.some((p) => h1Lower.includes(p)) : false

  // --- CTA detection ---
  // 1. Lighthouse detail items (only failing items, but still try)
  const lhTexts = mobileAudits ? extractLighthouseInteractiveTexts(mobileAudits) : []
  const lighthouseCtas = lhTexts.filter(isCta).map((t) => t.toLowerCase().slice(0, 40))

  // 2. HTML regex
  const htmlCtas: string[] = []
  const interactiveRegex = /<(?:button|a)[^>]*>([\s\S]*?)<\/(?:button|a)>/gi
  let ctaMatch: RegExpExecArray | null
  // biome-ignore lint: exec loop
  while ((ctaMatch = interactiveRegex.exec(html)) !== null) {
    const inner = stripTags(ctaMatch[1]).toLowerCase().trim()
    if (isCta(inner)) htmlCtas.push(inner.slice(0, 40))
  }

  // 3. Infer from Lighthouse scores
  const allCtaSet = new Set([...lighthouseCtas, ...htmlCtas])
  const uniqueCtas = [...allCtaSet]
  // If both sources are empty but Lighthouse confirms links/buttons exist with proper names,
  // the page DOES have interactive elements - we just can't see their text
  const ctaInferred = uniqueCtas.length === 0 && lhCtasInferred && htmlIsEmpty
  const primaryCtaAboveFold = uniqueCtas.length >= 1 || ctaInferred
  const competingCtasAboveFold = uniqueCtas.length

  // Autoplay above fold
  const autoplayAboveFold =
    aboveFold.includes("autoplay") &&
    (aboveFold.includes("<video") || aboveFold.includes("<iframe"))

  // Status
  const issues: string[] = []
  // Only flag missing H1 if we could actually verify it (not blocked/inferred)
  if (h1Count === 0 && !h1Inferred) issues.push("No H1 heading found on the page.")
  else if (h1Count > 1 && !h1Inferred) issues.push(`${h1Count} H1 headings found; pages should typically have one clear H1.`)
  if (h1Text && h1Vague) issues.push("The H1 text appears generic, which can reduce first-impression clarity.")
  if (!h1AboveFold && h1Count > 0 && !h1Inferred) issues.push("The H1 does not appear to be above the fold on mobile.")
  if (!primaryCtaAboveFold) issues.push("No clear call-to-action detected above the fold.")
  if (competingCtasAboveFold > 3) issues.push(`${competingCtasAboveFold} competing CTAs above the fold can create decision fatigue.`)
  if (autoplayAboveFold) issues.push("Autoplay video or animation detected above the fold, which can distract from the message.")

  const status = issues.length === 0 ? "clear" : issues.length <= 2 ? "mixed" : "unclear"

  return {
    h1Count, h1Text, h1AboveFold, h1Vague, primaryCtaAboveFold,
    competingCtasAboveFold, autoplayAboveFold, status, bullets: issues.slice(0, 3),
  }
}

// ─── 2. Navigation and decision friction ────────────────
// biome-ignore lint: audits is complex PSI shape
export function analyseNavigation(html: string, mobileAudits?: any): NavigationFrictionIndicators {
  const lower = html.toLowerCase()
  const htmlIsEmpty = !html || html.length < 500

  // Lighthouse score inference: bypass audit checks for skip-links, ARIA landmarks, headings
  // If it passes, the page has navigation structure even if HTML fetch was blocked
  const bypassPasses = mobileAudits?.["bypass"]?.score === 1
  const linkNamePasses = mobileAudits?.["link-name"]?.score === 1

  // Find primary nav from HTML
  const navRegex = /<nav[^>]*>([\s\S]*?)<\/nav>/gi
  const navMatches = [...html.matchAll(navRegex)]
  const primaryNav = navMatches.length > 0 ? navMatches[0][1] : ""
  const navLower = primaryNav.toLowerCase()

  // Count nav links
  const navLinkRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi
  const navLinks = [...primaryNav.matchAll(navLinkRegex)]
  let navItemCount = navLinks.length

  // If HTML was blocked but Lighthouse confirms bypass/navigation structure exists,
  // infer that navigation is present
  const navInferred = navItemCount === 0 && htmlIsEmpty && (bypassPasses || linkNamePasses)
  if (navInferred) navItemCount = -1 // sentinel: nav exists but we can't count items

  // Contact in nav
  const contactPatterns = ["contact", "book", "enquire", "get in touch", "call us"]
  const contactInNav = contactPatterns.some((p) => navLower.includes(p))

  // Generic labels
  const genericPatterns = ["services", "solutions", "what we do", "our work", "capabilities", "offerings"]
  const genericNavLabels: string[] = []
  for (const link of navLinks) {
    const text = stripTags(link[1]).toLowerCase().trim()
    if (genericPatterns.some((p) => text.includes(p))) {
      genericNavLabels.push(text.slice(0, 30))
    }
  }

  // Nested menus (look for sub-menu indicators)
  const nestedIndicators = ["sub-menu", "submenu", "dropdown", "mega-menu", "megamenu", "has-children"]
  let nestedMenuDepth = 0
  for (const ind of nestedIndicators) {
    if (navLower.includes(ind)) { nestedMenuDepth = Math.max(nestedMenuDepth, 2); break }
  }
  const nestedUl = (navLower.match(/<ul[^>]*>/g) || []).length
  if (nestedUl > 2) nestedMenuDepth = Math.max(nestedMenuDepth, nestedUl - 1)

  // Tap target issues from Lighthouse
  const tapTargetIssues = mobileAudits?.["tap-targets"]?.details?.items?.length ?? 0

  // Status
  const issues: string[] = []
  if (navItemCount > 7) issues.push(`Navigation has ${navItemCount} items, which can overwhelm visitors on mobile.`)
  if (navItemCount === 0 && !navInferred) issues.push("No primary navigation detected on the page.")
  // Don't report "no nav" if navInferred is true (Lighthouse confirmed it exists)
  if (!contactInNav && navItemCount > 0 && !navInferred) issues.push("No clear contact or enquiry link found in the main navigation.")
  if (genericNavLabels.length > 0) issues.push(`Generic navigation labels detected (${genericNavLabels.slice(0, 3).join(", ")}), which can create uncertainty.`)
  if (nestedMenuDepth >= 2) issues.push("Nested dropdown menus detected, which can increase friction on mobile devices.")
  if (tapTargetIssues > 0) issues.push(`${tapTargetIssues} tap target(s) are too small or too close together on mobile.`)

  const frictionCount = issues.length
  const status = frictionCount <= 1 ? "low" : frictionCount <= 3 ? "medium" : "high"

  return {
    navItemCount: navInferred ? 0 : navItemCount, contactInNav, genericNavLabels, nestedMenuDepth,
    tapTargetIssues, status, bullets: issues.slice(0, 3),
  }
}

// ─── 3. Content structure and scanability ───────────────
export function analyseScanability(html: string): ScanabilityIndicators {
  const lower = html.toLowerCase()

  // Extract text paragraphs
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  const paragraphs = [...html.matchAll(pRegex)].map((m) => stripTags(m[1]))
  const nonEmpty = paragraphs.filter((p) => p.length > 20)

  const avgParagraphLength = nonEmpty.length > 0
    ? Math.round(nonEmpty.reduce((s, p) => s + p.split(/\s+/).length, 0) / nonEmpty.length)
    : 0

  const longParagraphs = nonEmpty.filter((p) => p.split(/\s+/).length > 80).length

  // Bullet lists
  const bulletListsFound = (lower.match(/<(?:ul|ol)[^>]*>/g) || []).length

  // Subheading frequency: count H2/H3 tags relative to content sections
  const h2h3Count = (lower.match(/<h[23][^>]*>/g) || []).length
  const sectionCount = Math.max(1, nonEmpty.length / 3) // rough estimate
  const subheadingFrequency = Math.round(h2h3Count / sectionCount * 10) / 10

  // Heading hierarchy skips
  const headingRegex = /<h([1-6])[^>]*>/gi
  const headingLevels: number[] = []
  let headingMatch: RegExpExecArray | null
  // biome-ignore lint: exec loop
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    headingLevels.push(Number.parseInt(headingMatch[1]))
  }
  let headingSkips = 0
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) headingSkips++
  }

  // Line length estimate for mobile (paragraphs with very long runs without breaks)
  const longLineEstimate = nonEmpty.some((p) => {
    const words = p.split(/\s+/).length
    const sentences = p.split(/[.!?]+/).length
    return words > 40 && sentences <= 1
  })

  // Status
  const issues: string[] = []
  if (avgParagraphLength > 60) issues.push(`Average paragraph length is ${avgParagraphLength} words, which can feel dense on mobile.`)
  if (longParagraphs > 0) issues.push(`${longParagraphs} paragraph(s) exceed 80 words, creating walls of text.`)
  if (bulletListsFound === 0 && nonEmpty.length > 3) issues.push("No bullet or numbered lists detected, which often help scanability.")
  if (h2h3Count < 2 && nonEmpty.length > 5) issues.push("Few subheadings found, making it harder for visitors to scan the content.")
  if (headingSkips > 0) issues.push(`${headingSkips} heading level skip(s) detected (e.g. H2 to H4), which can affect structure.`)
  if (longLineEstimate) issues.push("Some paragraphs appear to have very long unbroken sentences, reducing readability on mobile.")

  const status = issues.length === 0 ? "scannable" : issues.length <= 2 ? "mixed" : "dense"

  return {
    avgParagraphLength, longParagraphs, bulletListsFound, subheadingFrequency,
    headingSkips, longLineEstimate, status, bullets: issues.slice(0, 3),
  }
}

// ─── 4. Conversion path continuity ──────────────────────
// biome-ignore lint: audits is complex PSI shape
export function analyseConversionPath(html: string, mobileAudits?: any): ConversionPathIndicators {
  const lower = html.toLowerCase()

  // --- CTA detection: merge Lighthouse + HTML regex (both may have partial data) ---
  const lhTexts = mobileAudits ? extractLighthouseInteractiveTexts(mobileAudits) : []
  const lighthouseCtas = lhTexts.filter(isCta).map((t) => t.trim().slice(0, 40))

  // HTML regex
  const ctaRegex = /<(?:button|a)[^>]*>([\s\S]*?)<\/(?:button|a)>/gi
  const htmlCtas: string[] = []
  let ctaMatch: RegExpExecArray | null
  // biome-ignore lint: exec loop
  while ((ctaMatch = ctaRegex.exec(html)) !== null) {
    const text = stripTags(ctaMatch[1]).trim()
    if (isCta(text)) htmlCtas.push(text.slice(0, 40))
  }

  // Merge both sources (deduplicate)
  const allCtaSet = new Set([...lighthouseCtas, ...htmlCtas])
  const ctaLabels = [...allCtaSet]
  const htmlIsEmpty = !html || html.length < 500

  // Lighthouse score inference: link-name/button-name PASSING = elements exist with proper names
  const linkNamePasses = mobileAudits?.["link-name"]?.score === 1
  const buttonNamePasses = mobileAudits?.["button-name"]?.score === 1
  const ctaInferred = ctaLabels.length === 0 && htmlIsEmpty && (linkNamePasses || buttonNamePasses)

  // CTA consistency (are they using the same label?)
  const normalised = ctaLabels.map((l) => l.toLowerCase().trim())
  const unique = new Set(normalised)
  const ctaConsistency = unique.size <= 2 && (ctaLabels.length > 0 || ctaInferred)

  // Dead-end sections: look for <section> tags that don't contain a CTA
  const sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>/gi
  const sections = [...html.matchAll(sectionRegex)]
  let deadEndSections = 0
  for (const sec of sections) {
    const secLower = sec[1].toLowerCase()
    const hasAction = CTA_KEYWORDS.some((kw) => secLower.includes(kw)) || secLower.includes("<button") || secLower.includes("href=")
    if (!hasAction) deadEndSections++
  }

  // Inline CTAs within content areas (CTAs inside <p>, <div> content blocks, not just headers/footers)
  const inlineCtaRegex = /<(?:p|div)[^>]*>[\s\S]*?<a[^>]*>[\s\S]*?(?:book|contact|enquire|get|call|start)[\s\S]*?<\/a>[\s\S]*?<\/(?:p|div)>/gi
  const inlineCtasFound = (html.match(inlineCtaRegex) || []).length

  // External links
  const extLinkRegex = /<a[^>]*href\s*=\s*["']https?:\/\/(?!(?:[^"']*\.)?(?:javascript|#))[^"']*["'][^>]*>/gi
  const allLinks = html.match(extLinkRegex) || []
  const domain = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i)?.[1] || ""
  const domainHost = domain ? new URL(domain).hostname : ""
  const externalLinkCount = domainHost
    ? allLinks.filter((l) => !l.includes(domainHost)).length
    : 0

  // Status - don't report false negatives when Lighthouse confirms elements exist
  const issues: string[] = []
  if (ctaLabels.length === 0 && !ctaInferred) issues.push("No clear action-oriented CTAs detected on the page.")
  if (!ctaConsistency && ctaLabels.length > 2) issues.push(`${unique.size} different CTA labels found, which can create mixed messaging.`)
  if (deadEndSections > 1) issues.push(`${deadEndSections} content section(s) appear to have no clear next step or CTA.`)
  if (inlineCtasFound === 0 && ctaLabels.length > 0) issues.push("CTAs appear only in headers or footers. Inline CTAs within content often improve conversion.")
  if (externalLinkCount > 5) issues.push(`${externalLinkCount} external links detected, which can pull visitors away from the conversion path.`)

  const status = issues.length === 0 ? "clear_path" : issues.length <= 2 ? "partial" : "broken"

  return {
    ctaLabels: ctaLabels.slice(0, 6), ctaConsistency, deadEndSections,
    inlineCtasFound, externalLinkCount, status, bullets: issues.slice(0, 3),
  }
}

// ─── 5. Form UX and friction ────────────────────────────
export function analyseFormFriction(html: string): FormFrictionIndicators {
  const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi
  const forms = [...html.matchAll(formRegex)]
  const formsFound = forms.length

  let totalFields = 0
  let highFieldCountForms = 0
  let placeholderOnlyLabels = 0
  const submitButtonLabels: string[] = []

  for (const form of forms) {
    const formHtml = form[1]
    const formLower = formHtml.toLowerCase()

    // Count input fields (excluding hidden)
    const inputs = (formHtml.match(/<input[^>]*>/gi) || []).filter(
      (i) => !i.toLowerCase().includes('type="hidden"') && !i.toLowerCase().includes("type='hidden'")
    )
    const textareas = (formLower.match(/<textarea/g) || []).length
    const selects = (formLower.match(/<select/g) || []).length
    const fieldCount = inputs.length + textareas + selects
    totalFields += fieldCount
    if (fieldCount > 6) highFieldCountForms++

    // Placeholder-only labels: inputs with placeholder but no associated <label>
    for (const input of inputs) {
      if (input.toLowerCase().includes("placeholder") && !formLower.includes("<label")) {
        placeholderOnlyLabels++
      }
    }

    // Submit buttons
    const submitRegex = /<(?:button|input)[^>]*(?:type\s*=\s*["']submit["'])[^>]*>([\s\S]*?)<\/(?:button|input)>/gi
    const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi
    let submitMatch: RegExpExecArray | null
    // biome-ignore lint: exec loop
    while ((submitMatch = submitRegex.exec(formHtml)) !== null) {
      const label = stripTags(submitMatch[1] || "").trim() || "Submit"
      submitButtonLabels.push(label.slice(0, 30))
    }
    // Also check regular buttons at end of form
    let btnMatch: RegExpExecArray | null
    // biome-ignore lint: exec loop
    while ((btnMatch = buttonRegex.exec(formHtml)) !== null) {
      const text = stripTags(btnMatch[1]).trim()
      if (text && !submitButtonLabels.includes(text)) submitButtonLabels.push(text.slice(0, 30))
    }
  }

  const avgFieldCount = formsFound > 0 ? Math.round(totalFields / formsFound) : 0
  const genericLabels = ["submit", "send", "go", "ok"]
  const genericSubmitButtons = submitButtonLabels.filter(
    (l) => genericLabels.includes(l.toLowerCase())
  ).length

  // Status
  const issues: string[] = []
  if (formsFound === 0) {
    issues.push("No forms detected on this page.")
  } else {
    if (highFieldCountForms > 0) issues.push(`${highFieldCountForms} form(s) have more than 6 fields, which can reduce completion rates.`)
    if (placeholderOnlyLabels > 0) issues.push(`${placeholderOnlyLabels} field(s) appear to use placeholder text as the only label, which disappears on focus.`)
    if (genericSubmitButtons > 0) issues.push(`Submit button uses a generic label ("${submitButtonLabels[0]}"). Action-led labels often convert better.`)
    if (avgFieldCount > 4) issues.push(`Average of ${avgFieldCount} fields per form. Shorter forms tend to see higher completion.`)
  }

  const status = formsFound === 0 ? "low" : issues.length <= 1 ? "low" : issues.length <= 2 ? "medium" : "high"

  return {
    formsFound, avgFieldCount, highFieldCountForms, placeholderOnlyLabels,
    submitButtonLabels: submitButtonLabels.slice(0, 4), genericSubmitButtons,
    status, bullets: issues.slice(0, 3),
  }
}

// ─── 6. Trust depth and credibility quality ─────────────
export function analyseTrustDepth(html: string): TrustDepthIndicators {
  const lower = html.toLowerCase()

  // Testimonials: look for quote-like structures
  const quoteRegex = /<(?:blockquote|q|div[^>]*class[^>]*(?:testimonial|quote|review))[^>]*>([\s\S]*?)<\/(?:blockquote|q|div)>/gi
  const quotes = [...html.matchAll(quoteRegex)]

  let namedTestimonials = 0
  let anonymousTestimonials = 0
  let testimonialsWithRoles = 0

  for (const q of quotes) {
    const quoteText = q[1].toLowerCase()
    // Look for name patterns (text followed by dash or comma with a name)
    const hasName = /[-\u2014]\s*[A-Z][a-z]+/i.test(q[1]) ||
      quoteText.includes("class=\"name") || quoteText.includes("class=\"author") ||
      quoteText.includes("class='name") || quoteText.includes("class='author")
    const hasRole = /(?:ceo|founder|director|manager|owner|head of|vp|president|lead)/i.test(q[1]) ||
      quoteText.includes("class=\"role") || quoteText.includes("class=\"title") ||
      quoteText.includes("class=\"position")

    if (hasName) { namedTestimonials++; if (hasRole) testimonialsWithRoles++ }
    else anonymousTestimonials++
  }

  // Also check generic testimonial text patterns
  if (quotes.length === 0) {
    // Fallback: count "testimonial" class containers
    const testContainers = (lower.match(/class\s*=\s*["'][^"']*(?:testimonial|review-card|client-quote)[^"']*["']/g) || []).length
    anonymousTestimonials = testContainers
  }

  // Case studies
  const caseStudiesFound = lower.includes("case study") || lower.includes("case studies") ||
    lower.includes("success story") || lower.includes("success stories")

  // Stock imagery heuristic
  const stockPatterns = ["shutterstock", "istockphoto", "adobe stock", "unsplash", "pexels", "stock-photo", "gettyimages"]
  const stockImagerySignals = stockPatterns.filter((p) => lower.includes(p)).length

  // About page linked
  const aboutPageLinked = lower.includes('href="about') || lower.includes('href="/about') ||
    lower.includes('href="./about') || lower.includes(">about us<") || lower.includes(">about<")

  // Physical address
  const addressPatterns = [
    /\b\d{1,5}\s+\w+\s+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct)\b/i,
    /\b[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}\b/, // UK postcode
    /\b\d{5}(?:-\d{4})?\b/, // US ZIP
  ]
  const physicalAddressFound = addressPatterns.some((r) => r.test(html))

  // Status
  const totalTestimonials = namedTestimonials + anonymousTestimonials
  const issues: string[] = []
  if (totalTestimonials === 0) issues.push("No testimonials or client quotes detected.")
  if (anonymousTestimonials > 0 && namedTestimonials === 0) issues.push("Testimonials appear anonymous. Named quotes with roles carry significantly more weight.")
  if (namedTestimonials > 0 && testimonialsWithRoles === 0) issues.push("Testimonials have names but no roles or companies, which can reduce credibility.")
  if (!caseStudiesFound && totalTestimonials > 0) issues.push("No case studies detected. Detailed examples often build more trust than short quotes.")
  if (stockImagerySignals > 0) issues.push("Stock photography indicators detected, which can reduce perceived authenticity.")
  if (!aboutPageLinked) issues.push("No link to an About page detected, which is often important for building trust.")
  if (!physicalAddressFound) issues.push("No physical address or company location found on the page.")

  const status = issues.length <= 1 ? "strong" : issues.length <= 3 ? "moderate" : "weak"

  return {
    namedTestimonials, anonymousTestimonials, testimonialsWithRoles, caseStudiesFound,
    stockImagerySignals, aboutPageLinked, physicalAddressFound, status,
    bullets: issues.slice(0, 3),
  }
}

// ─── 7. Mobile-specific UX friction ─────────────────────
// biome-ignore lint: audits is complex PSI shape
export function analyseMobileFriction(html: string, mobileAudits?: any): MobileFrictionIndicators {
  const lower = html.toLowerCase()

  // Tap targets from Lighthouse
  const tapTargetIssues = mobileAudits?.["tap-targets"]?.details?.items?.length ?? 0

  // Sticky/fixed elements
  const stickyRegex = /(?:position\s*:\s*(?:fixed|sticky))/gi
  const stickyElements = (html.match(stickyRegex) || []).length
  const stickyElementsFound = stickyElements

  // Cookie banner covering CTA heuristic
  const cookieBannerOverCta =
    (lower.includes("cookie") || lower.includes("consent")) &&
    (lower.includes("position: fixed") || lower.includes("position:fixed") ||
     lower.includes("position: sticky") || lower.includes("position:sticky"))

  // Horizontal scroll risk (viewport meta, wide elements)
  const viewportMeta = lower.includes('name="viewport"') || lower.includes("name='viewport'")
  const viewportConfigured = viewportMeta && lower.includes("width=device-width")
  const horizontalScrollRisk = !viewportConfigured ||
    lower.includes("overflow-x: scroll") || lower.includes("overflow-x:scroll") ||
    lower.includes("min-width: 1") // e.g. min-width: 1000px

  // Sticky CTA (a fixed/sticky button or bar at bottom)
  const stickyCtaPatterns = ["sticky-cta", "fixed-cta", "floating-cta", "sticky-bar", "fixed-bar", "float-btn"]
  const stickyCtaFound = stickyCtaPatterns.some((p) => lower.includes(p))

  // Status
  const issues: string[] = []
  if (tapTargetIssues > 0) issues.push(`${tapTargetIssues} element(s) have tap targets that are too small or too close together.`)
  if (stickyElementsFound > 3) issues.push(`${stickyElementsFound} fixed or sticky elements detected, which can reduce visible content area on mobile.`)
  if (cookieBannerOverCta) issues.push("A cookie banner appears to use fixed positioning, which can obscure CTAs on mobile.")
  if (horizontalScrollRisk) issues.push("Horizontal scrolling may occur on mobile due to layout or viewport configuration issues.")
  if (!viewportConfigured) issues.push("Viewport meta tag not properly configured for mobile devices.")
  if (!stickyCtaFound && tapTargetIssues === 0) issues.push("No sticky mobile CTA detected. A persistent call-to-action can improve mobile conversion.")

  const status = issues.length <= 1 ? "low" : issues.length <= 3 ? "medium" : "high"

  return {
    tapTargetIssues, stickyElementsFound, cookieBannerOverCta, horizontalScrollRisk,
    viewportConfigured, stickyCtaFound, status, bullets: issues.slice(0, 3),
  }
}

// ─── Master extraction ──────────────────────────────────
// biome-ignore lint: audits is complex PSI shape
export function extractAdvancedUXIndicators(html: string, mobileAudits?: any, puppeteerH1s?: string[]): AdvancedUXIndicators {
  return {
    firstImpression: analyseFirstImpression(html, mobileAudits, puppeteerH1s),
    navigationFriction: analyseNavigation(html, mobileAudits),
    scanability: analyseScanability(html),
    conversionPath: analyseConversionPath(html, mobileAudits),
    formFriction: analyseFormFriction(html),
    trustDepth: analyseTrustDepth(html),
    mobileFriction: analyseMobileFriction(html, mobileAudits),
  }
}
