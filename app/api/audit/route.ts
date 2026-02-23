import { NextResponse } from "next/server"
import { v4 } from "./uuid"
import type {
  StrategyResult,
  LighthouseMetrics,
  UXIndicators,
  DesignIndicators,
  ImageIssues,
  AccessibilityIndicators,
  AuditResult,
  ScreenshotData,
  PlatformInfo,
} from "@/lib/types"
import { saveReport, getCachedReportForUrl } from "@/lib/store"
import {
  calculateOverallScore,
  generateVisibilityRisk,
  generateConversionRisk,
  generateTrustRisk,
  generateSummary,
  generateSalesTalkTrack,
} from "@/lib/scoring"
import { extractAdvancedUXIndicators } from "@/lib/ux-analysis"
import { analyseScreenshotsWithAI, type AIAnalysisResult } from "@/lib/ai-ux-analysis"

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function normalizeUrl(input: string): string {
  let url = input.trim()
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`
  }
  // Normalize: strip www., trailing slashes, lowercase hostname
  try {
    const parsed = new URL(url)
    parsed.hostname = parsed.hostname.replace(/^www\./, "").toLowerCase()
    // Remove trailing slash on path
    if (parsed.pathname === "/") parsed.pathname = ""
    return parsed.toString().replace(/\/$/, "")
  } catch {
    return url
  }
}

async function fetchPSI(
  url: string,
  strategy: "mobile" | "desktop"
  // biome-ignore lint: rawAudits is complex PSI shape
): Promise<{ result: StrategyResult; rawAudits: any }> {
  const apiKey = process.env.PAGESPEED_API_KEY
  if (!apiKey) {
    throw new Error("PAGESPEED_API_KEY is not configured")
  }

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&strategy=${strategy}&key=${apiKey}&category=performance&category=accessibility&category=seo&category=best-practices`

  let res = await fetch(endpoint, { cache: "no-store" })

  // Retry once on 500 errors (transient Lighthouse failures)
  if (res.status === 500) {
    console.warn(`PSI ${strategy} returned 500, retrying once...`)
    await new Promise((r) => setTimeout(r, 2000))
    res = await fetch(endpoint, { cache: "no-store" })
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`PageSpeed API error (${strategy}): ${res.status} - ${body}`)
  }

  const data = await res.json()
  const categories = data.lighthouseResult?.categories || {}
  const audits = data.lighthouseResult?.audits || {}
  const fieldData = data.loadingExperience?.metrics

  const metrics: LighthouseMetrics = {
    lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    tbt: audits["total-blocking-time"]?.numericValue ?? null,
    fcp: audits["first-contentful-paint"]?.numericValue ?? null,
    speedIndex: audits["speed-index"]?.numericValue ?? null,
  }

  const notes: string[] = []
  if (!fieldData || Object.keys(fieldData).length === 0) {
    notes.push("Field data is not available for this URL. Results are based on lab data only.")
  }

  // Extract screenshot — prefer full-page-screenshot (higher res), fall back to final-screenshot
  let screenshot: ScreenshotData | undefined
  const fullPageAudit = audits["full-page-screenshot"]
  const finalAudit = audits["final-screenshot"]
  if (fullPageAudit?.details?.screenshot?.data) {
    screenshot = {
      data: fullPageAudit.details.screenshot.data,
      width: fullPageAudit.details.screenshot.width ?? 0,
      height: fullPageAudit.details.screenshot.height ?? 0,
    }
  } else if (finalAudit?.details?.data) {
    screenshot = {
      data: finalAudit.details.data,
      width: finalAudit.details.width ?? 0,
      height: finalAudit.details.height ?? 0,
    }
  }

  return {
    result: {
      strategy,
      performanceScore: Math.round((categories.performance?.score ?? 0) * 100),
      accessibilityScore: Math.round((categories.accessibility?.score ?? 0) * 100),
      seoScore: Math.round((categories.seo?.score ?? 0) * 100),
      bestPracticesScore: Math.round((categories["best-practices"]?.score ?? 0) * 100),
      metrics,
      fieldDataAvailable: !!(fieldData && Object.keys(fieldData).length > 0),
      notes,
      screenshot,
    },
    rawAudits: audits,
  }
}

function extractDesignIndicators(
  // biome-ignore lint: audits is complex PSI shape
  mobileAudits: any,
  html: string
): DesignIndicators {
  // --- Image issues from Lighthouse ---
  const getItemCount = (audit: any) =>
    Array.isArray(audit?.details?.items) ? audit.details.items.length : 0

  const getKbSavings = (audit: any) => {
    const items = audit?.details?.items
    if (!Array.isArray(items)) return 0
    return items.reduce(
      (sum: number, item: any) =>
        sum + (item.wastedBytes ? item.wastedBytes / 1024 : 0),
      0
    )
  }

  const oversizedCount = getItemCount(mobileAudits["uses-responsive-images"])
  const unoptimizedCount = getItemCount(mobileAudits["uses-optimized-images"])
  const offscreenCount = getItemCount(mobileAudits["offscreen-images"])
  const unsizedCount = getItemCount(mobileAudits["unsized-images"])
  const modernFormatMissing = getItemCount(mobileAudits["modern-image-formats"])
  const incorrectAspectRatio = getItemCount(mobileAudits["image-aspect-ratio"])

  const totalSavingsKb = Math.round(
    getKbSavings(mobileAudits["uses-responsive-images"]) +
    getKbSavings(mobileAudits["uses-optimized-images"]) +
    getKbSavings(mobileAudits["offscreen-images"]) +
    getKbSavings(mobileAudits["modern-image-formats"])
  )

  const imageDetails: string[] = []
  if (oversizedCount > 0)
    imageDetails.push(`${oversizedCount} image(s) are significantly larger than their display size.`)
  if (unoptimizedCount > 0)
    imageDetails.push(`${unoptimizedCount} image(s) could be better compressed.`)
  if (offscreenCount > 0)
    imageDetails.push(`${offscreenCount} off-screen image(s) are loaded eagerly instead of lazy-loaded.`)
  if (unsizedCount > 0)
    imageDetails.push(`${unsizedCount} image(s) missing explicit width and height, causing layout shifts.`)
  if (modernFormatMissing > 0)
    imageDetails.push(`${modernFormatMissing} image(s) not using modern formats (WebP/AVIF).`)
  if (incorrectAspectRatio > 0)
    imageDetails.push(`${incorrectAspectRatio} image(s) displayed at an incorrect aspect ratio (may appear stretched or blurry).`)
  if (totalSavingsKb > 50)
    imageDetails.push(`Potential savings of ~${totalSavingsKb} KB from image optimisation.`)

  const imageIssues: ImageIssues = {
    oversizedCount,
    unoptimizedCount,
    offscreenCount,
    unsizedCount,
    modernFormatMissing,
    incorrectAspectRatio,
    totalSavingsKb,
    details: imageDetails,
  }

  // --- Colour contrast from Lighthouse ---
  const contrastAudit = mobileAudits["color-contrast"]
  const contrastPassed = contrastAudit?.score === 1
  const contrastIssues = getItemCount(contrastAudit)

  // --- Inconsistent spacing heuristic ---
  // Look for inline padding/margin styles and check for wildly mixed values
  const lowerHtml = html.toLowerCase()
  const paddingValues = new Set<string>()
  const paddingRegex = /(?:padding|margin)\s*:\s*([^;"]+)/gi
  let paddingMatch: RegExpExecArray | null
  // biome-ignore lint: using exec in a loop is intentional
  while ((paddingMatch = paddingRegex.exec(lowerHtml)) !== null) {
    paddingValues.add(paddingMatch[1].trim())
  }
  // Check for mixed unit types (px vs rem vs em) as a proxy for inconsistency
  const units = new Set<string>()
  for (const val of paddingValues) {
    if (val.includes("px")) units.add("px")
    if (val.includes("rem")) units.add("rem")
    if (val.includes("em") && !val.includes("rem")) units.add("em")
    if (val.includes("%")) units.add("%")
  }
  const inconsistentSpacing = units.size >= 3
  const spacingDetails = inconsistentSpacing
    ? `Found inline styles using ${Array.from(units).join(", ")} units, which may indicate inconsistent spacing.`
    : units.size > 0
      ? `Inline styles use ${Array.from(units).join(", ")} units.`
      : "No inline spacing styles detected (may use CSS classes)."

  return {
    contrastIssues,
    contrastPassed,
    imageIssues,
    inconsistentSpacing,
    spacingDetails,
  }
}

function extractAccessibilityIndicators(
  // biome-ignore lint: audits is complex PSI shape
  mobileAudits: any,
  html: string,
  aiCookieConsentVisible = false,
): AccessibilityIndicators {
  const getItemCount = (audit: any) =>
    Array.isArray(audit?.details?.items) ? audit.details.items.length : 0

  // Lighthouse audits
  const missingAltText = getItemCount(mobileAudits["image-alt"])
  const missingFormLabels = getItemCount(mobileAudits["label"])
  const missingLinkNames = getItemCount(mobileAudits["link-name"])
  const headingOrderValid = mobileAudits["heading-order"]?.score === 1
  const documentTitlePresent = mobileAudits["document-title"]?.score === 1
  const htmlLangPresent = mobileAudits["html-has-lang"]?.score === 1
  const videoCaptionIssues = getItemCount(mobileAudits["video-caption"])

  // HTML heuristic: video elements
  const lowerHtml = html.toLowerCase()
  const videoTagRegex = /<video[^>]*>/gi
  const videoTags = html.match(videoTagRegex) || []
  const videosFound = videoTags.length
  let videosWithControls = 0
  let videosAutoplay = 0
  for (const tag of videoTags) {
    const lower = tag.toLowerCase()
    if (lower.includes("controls")) videosWithControls++
    if (lower.includes("autoplay")) videosAutoplay++
  }
  // Also count iframes with video sources (YouTube, Vimeo)
  const iframeVideoRegex = /<iframe[^>]*(?:youtube|vimeo|wistia|dailymotion)[^>]*>/gi
  const iframeVideos = html.match(iframeVideoRegex) || []
  const totalVideos = videosFound + iframeVideos.length
  // Embedded iframes generally have their own controls, but autoplay is the concern
  const iframesAutoplay = iframeVideos.filter((tag) =>
    tag.toLowerCase().includes("autoplay")
  ).length
  const totalAutoplay = videosAutoplay + iframesAutoplay
  const totalWithControls = videosWithControls + iframeVideos.length // iframes have built-in controls

  // Skip navigation link
  const skipNavFound =
    lowerHtml.includes("skip to content") ||
    lowerHtml.includes("skip to main") ||
    lowerHtml.includes("skip navigation") ||
    lowerHtml.includes("#main-content") ||
    lowerHtml.includes("#content") ||
    (mobileAudits["bypass"]?.score === 1)

  // ARIA landmarks
  const landmarksFound: string[] = []
  if (lowerHtml.includes("<main") || lowerHtml.includes('role="main"'))
    landmarksFound.push("main")
  if (lowerHtml.includes("<nav") || lowerHtml.includes('role="navigation"'))
    landmarksFound.push("nav")
  if (lowerHtml.includes("<header") || lowerHtml.includes('role="banner"'))
    landmarksFound.push("header")
  if (lowerHtml.includes("<footer") || lowerHtml.includes('role="contentinfo"'))
    landmarksFound.push("footer")

  // When HTML is blocked, infer landmarks from Lighthouse scores
  // bypass audit passes = page has heading structure, landmarks, or skip links
  if (landmarksFound.length === 0 && (!html || html.length < 500)) {
    const bypassPasses = mobileAudits["bypass"]?.score === 1
    if (bypassPasses) {
      landmarksFound.push("main", "nav") // Lighthouse confirmed navigation bypass exists
    }
  }

  // Cookie consent / GDPR banner — check HTML source first, fall back to AI screenshot analysis
  const cookieConsentInCode =
    lowerHtml.includes("cookie") ||
    lowerHtml.includes("consent") ||
    lowerHtml.includes("gdpr") ||
    lowerHtml.includes("cookiebot") ||
    lowerHtml.includes("onetrust") ||
    lowerHtml.includes("cookie-consent") ||
    lowerHtml.includes("cookie-banner") ||
    lowerHtml.includes("cc-banner")
  const cookieConsentFound = cookieConsentInCode || aiCookieConsentVisible

  // Compile EAA issues
  const eaaIssues: string[] = []
  if (!htmlLangPresent)
    eaaIssues.push("Missing lang attribute on <html> element (WCAG 3.1.1).")
  if (!documentTitlePresent)
    eaaIssues.push("Missing or empty page title (WCAG 2.4.2).")
  if (!headingOrderValid)
    eaaIssues.push("Heading levels are not in a logical order (WCAG 1.3.1).")
  if (missingAltText > 0)
    eaaIssues.push(`${missingAltText} image(s) missing alt text (WCAG 1.1.1).`)
  if (missingFormLabels > 0)
    eaaIssues.push(`${missingFormLabels} form input(s) missing labels (WCAG 1.3.1).`)
  if (missingLinkNames > 0)
    eaaIssues.push(`${missingLinkNames} link(s) have no discernible text (WCAG 2.4.4).`)
  if (totalVideos > 0 && totalWithControls < totalVideos)
    eaaIssues.push(`${totalVideos - totalWithControls} video(s) missing play/pause controls (WCAG 1.4.2).`)
  if (totalAutoplay > 0)
    eaaIssues.push(`${totalAutoplay} video(s) set to autoplay, which can disorient users (WCAG 1.4.2).`)
  if (videoCaptionIssues > 0)
    eaaIssues.push(`${videoCaptionIssues} video(s) missing captions (WCAG 1.2.2).`)
  if (!skipNavFound)
    eaaIssues.push("No skip navigation link detected (WCAG 2.4.1).")
  if (landmarksFound.length < 2)
    eaaIssues.push(`Only ${landmarksFound.length} ARIA landmark(s) found. Pages should use semantic regions (WCAG 1.3.1).`)
  if (!cookieConsentFound)
    eaaIssues.push("No cookie consent mechanism detected (ePrivacy / GDPR requirement for EU sites).")

  const eaaScore: "pass" | "warn" | "fail" =
    eaaIssues.length === 0
      ? "pass"
      : eaaIssues.length <= 3
        ? "warn"
        : "fail"

  return {
    missingAltText,
    missingFormLabels,
    missingLinkNames,
    headingOrderValid,
    documentTitlePresent,
    htmlLangPresent,
    videoCaptionIssues,
    videosFound: totalVideos,
    videosWithControls: totalWithControls,
    videosAutoplay: totalAutoplay,
    skipNavFound,
    landmarksFound,
    cookieConsentFound,
    eaaIssues,
    eaaScore,
  }
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

async function fetchSiteHtml(url: string): Promise<{ html: string; blocked: boolean; responseHeaders: Record<string, string> }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    })
    // Capture response headers for platform detection
    const responseHeaders: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value.toLowerCase()
    })
    if (!res.ok) return { html: "", blocked: true, responseHeaders }
    const html = await res.text()
    return { html, blocked: false, responseHeaders }
  } catch {
    return { html: "", blocked: true, responseHeaders: {} }
  }
}

// biome-ignore lint: audits is complex PSI shape
function analyseUXIndicators(html: string, blocked: boolean, mobileAudits?: any): UXIndicators {
  const result: UXIndicators = {
    ctaFound: false,
    ctaKeywords: [],
    trustSignalsFound: false,
    trustKeywords: [],
    socialProofAboveFold: false,
    socialProofKeywordsAboveFold: [],
    testimonialsVerified: false,
    verifiedSources: [],
    phoneFound: false,
    emailFound: false,
    fetchBlocked: blocked,
  }

  const ctaPatterns = ["book", "contact", "enquire", "get a quote", "get quote", "request", "schedule", "call", "buy", "start", "try", "sign up", "quote", "demo", "free", "apply", "order", "subscribe", "learn more", "find out", "shop", "sales", "pricing"]

  // --- CTA detection: merge BOTH Lighthouse + HTML regex ---
  // NOTE: Lighthouse link-name/button-name only list FAILING elements (no accessible name).
  // For well-built sites, these are empty. So HTML regex is essential.
  const foundCtas = new Set<string>()

  // Lighthouse: check tap-targets, link-name, button-name, crawlable-anchors
  if (mobileAudits) {
    const lhSources = ["link-name", "button-name", "tap-targets", "crawlable-anchors"]
    for (const auditName of lhSources) {
      const items = mobileAudits[auditName]?.details?.items || []
      for (const item of items) {
        const text = (item.text || item.node?.snippet || item.snippet || item.tapTarget?.snippet || "")
          .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase().trim()
        for (const kw of ctaPatterns) {
          if (text.includes(kw)) foundCtas.add(kw)
        }
      }
    }
  }

  // HTML regex: ALWAYS run (not just as fallback) since Lighthouse may miss passing elements
  if (html) {
    const buttonLinkRegex = /<(?:button|a)[^>]*>([\s\S]*?)<\/(?:button|a)>/gi
    let match: RegExpExecArray | null
    // biome-ignore lint: using exec in a loop is intentional
    while ((match = buttonLinkRegex.exec(html)) !== null) {
      const inner = match[1].toLowerCase()
      for (const kw of ctaPatterns) {
        if (inner.includes(kw)) foundCtas.add(kw)
      }
    }
  }

  // Infer from Lighthouse scores: if link-name/button-name pass, elements exist
  const lhLinkPasses = mobileAudits?.["link-name"]?.score === 1
  const lhButtonPasses = mobileAudits?.["button-name"]?.score === 1
  if (foundCtas.size === 0 && (lhLinkPasses || lhButtonPasses)) {
    // We know interactive elements exist (Lighthouse confirmed they have proper names)
    // but we can't see the text. Mark as found with inferred flag.
    foundCtas.add("(detected by Lighthouse)")
  }

  result.ctaKeywords = Array.from(foundCtas)
  result.ctaFound = foundCtas.size > 0

  // --- Gather ALL text visible to Lighthouse (rendered DOM snippets) ---
  // This catches content on JS-rendered sites where raw HTML fetch returns empty/minimal HTML
  const allLighthouseText: string[] = []
  if (mobileAudits) {
    const textSources = ["link-name", "button-name", "tap-targets", "crawlable-anchors", "heading-order", "link-text"]
    for (const auditName of textSources) {
      const items = mobileAudits[auditName]?.details?.items || []
      for (const item of items) {
        const snippet = (item.text || item.node?.snippet || item.snippet || item.tapTarget?.snippet || item.headingText || "")
          .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase().trim()
        if (snippet) allLighthouseText.push(snippet)
      }
    }
  }
  const lighthouseTextBlob = allLighthouseText.join(" ")

  const lowerHtml = html ? html.toLowerCase() : ""
  // Combine raw HTML + Lighthouse rendered text for analysis
  const combinedText = lowerHtml + " " + lighthouseTextBlob

  // Trust keywords
  const trustPatterns = [
    "reviews",
    "testimonials",
    "case studies",
    "clients",
    "trusted by",
    "awards",
  ]
  const foundTrust = new Set<string>()
  for (const kw of trustPatterns) {
    if (combinedText.includes(kw)) foundTrust.add(kw)
  }
  result.trustKeywords = Array.from(foundTrust)
  result.trustSignalsFound = foundTrust.size > 0

  // Social proof above the fold heuristic:
  // Modern HTML has verbose class names/attributes, so use 20k chars
  // to reliably cover the header, hero, and first visible section.
  // Also check Lighthouse text since it represents rendered content
  const aboveFoldHtml = lowerHtml.slice(0, 20000) + " " + lighthouseTextBlob
  const aboveFoldTrust = new Set<string>()
  for (const kw of trustPatterns) {
    if (aboveFoldHtml.includes(kw)) aboveFoldTrust.add(kw)
  }
  result.socialProofKeywordsAboveFold = Array.from(aboveFoldTrust)
  result.socialProofAboveFold = aboveFoldTrust.size > 0

  // Verified third-party testimonial sources
  const thirdPartySources: Record<string, string> = {
    "trustpilot": "Trustpilot",
    "google.com/maps": "Google Reviews",
    "google reviews": "Google Reviews",
    "goog-gt-review": "Google Reviews",
    "yelp.com": "Yelp",
    "facebook.com/pg": "Facebook Reviews",
    "fb.com": "Facebook Reviews",
    "tripadvisor": "TripAdvisor",
    "g2.com": "G2",
    "capterra": "Capterra",
    "bbb.org": "BBB",
    "feefo": "Feefo",
    "reviews.io": "Reviews.io",
    "yotpo": "Yotpo",
    "birdeye": "Birdeye",
    "podium": "Podium",
    "elfsight": "Elfsight Widget",
    "schema.org/review": "Structured Review Data",
    "aggregaterating": "Structured Review Data",
  }
  const foundSources = new Set<string>()
  for (const [pattern, sourceName] of Object.entries(thirdPartySources)) {
    if (combinedText.includes(pattern)) foundSources.add(sourceName)
  }
  result.verifiedSources = Array.from(foundSources)
  result.testimonialsVerified = foundSources.size > 0

  // Phone regex - check both raw HTML and Lighthouse snippets
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
  const allTextForRegex = html + " " + allLighthouseText.join(" ")
  result.phoneFound = phoneRegex.test(allTextForRegex)

  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  result.emailFound = emailRegex.test(allTextForRegex)

  return result
}

function detectPlatform(html: string, url: string, responseHeaders: Record<string, string> = {}): PlatformInfo {
  const lower = html.toLowerCase()
  const details: string[] = []

  // Flatten all header values into a single string for matching
  const headerValues = Object.entries(responseHeaders).map(([k, v]) => `${k}: ${v}`).join(" | ")

  // --- Extract STRUCTURAL parts of HTML to avoid false positives from body text ---
  // Body text like "We work with Sitecore, WordPress, and Optimizely" should NOT trigger detection.
  // We extract: <html> tag attributes, <head> content, all src/href/class/data- attributes, and inline styles.
  const htmlTagMatch = lower.match(/<html[^>]*>/)
  const htmlTag = htmlTagMatch ? htmlTagMatch[0] : ""
  const headMatch = lower.match(/<head[\s\S]*?<\/head>/)
  const head = headMatch ? headMatch[0] : ""
  // Extract all attribute values: src="...", href="...", class="...", data-*="...", style="..."
  const attrValues = (lower.match(/(?:src|href|class|id|data-[\w-]+|style|name|content|property)\s*=\s*"[^"]*"/g) || []).join(" ")
  // Combine structural signals only (NOT body text)
  const struct = htmlTag + " " + head + " " + attrValues

  // --- CMS / Platform signatures (ordered by specificity) ---

  // Webflow — check FIRST. Dead giveaways: data-wf-* attributes, webflow CDN, webflow.js
  const webflowSignals = [
    "data-wf-domain",     // <html data-wf-domain="...">
    "data-wf-page",       // <html data-wf-page="...">
    "data-wf-site",       // <html data-wf-site="...">
    "webflow.js",         // Webflow runtime JS
    "website-files.com",  // Webflow CDN (assets-global.website-files.com, cdn.prod.website-files.com)
    "uploads-ssl.webflow.com", // Webflow uploads CDN
    " w-nav",             // Webflow nav class (space prefix to match in class lists)
    " w-dropdown",        // Webflow dropdown class
    " w-richtext",        // Webflow richtext class
    " w-button",          // Webflow button class
    " w-slider",          // Webflow slider class
    " w-form",            // Webflow form class
    " w-embed",           // Webflow embed class
    " w-dyn-",            // Webflow CMS dynamic content
    '"w-nav',             // Webflow class at start of attribute
    '"w-dropdown',
    '"w-richtext',
    '"w-button',
    '"w-slider',
    '"w-form',
    '"w-embed',
    '"w-dyn-',
  ]
  if (webflowSignals.some(sig => struct.includes(sig))) {
    details.push("Webflow platform signatures detected")
    if (struct.includes("data-wf-site")) details.push("Webflow site ID attribute found")
    if (struct.includes("website-files.com")) details.push("Webflow CDN assets detected")
    if (struct.includes("w-dyn")) details.push("Webflow CMS dynamic content in use")
    if (struct.includes("w-commerce")) details.push("Webflow E-commerce detected")
    return { platform: "Webflow", confidence: "high", details }
  }

  // Sitecore — /sitecore/ paths, /-/media/, SC_ cookies/globals, JSS headless
  const sitecoreSignals = [
    "/sitecore/",              // Admin/API path (dead giveaway)
    "/sitecore/api/",          // Sitecore API
    "/sitecore/shell/",        // Sitecore admin shell
    "/-/media/",               // Sitecore media library
    "/~/media/",               // Sitecore media library (older)
    "/-/jssmedia/",            // Sitecore JSS media
    "sc_analytics_global_cookie", // Sitecore analytics cookie
    "sc_itemid",               // SC_ITEMID in comments/attrs
    "sc_lang",                 // SC_LANG marker
    "sc_mode",                 // SC_MODE marker
    "scanalytics",             // JS global
    "__sitecore_context__",    // Headless JSS context
    "scjss",                   // Sitecore JSS SDK
    "sitecore-jss",            // Sitecore JSS package
    "/api/layout/render/jss",  // Headless layout service
  ]
  const sitecoreHeaders = headerValues.includes("sitecore") || headerValues.includes("sc_analytics") || headerValues.includes("x-sitecore")
  if (sitecoreSignals.some(sig => struct.includes(sig)) || sitecoreHeaders) {
    details.push("Sitecore CMS signatures detected")
    if (struct.includes("/-/media/") || struct.includes("/~/media/")) details.push("Sitecore media library URLs found")
    if (struct.includes("sc_analytics") || headerValues.includes("sc_analytics")) details.push("Sitecore Analytics tracking detected")
    if (headerValues.includes("asp.net")) details.push("ASP.NET infrastructure detected")
    if (struct.includes("sitecore-jss") || struct.includes("__sitecore_context__")) details.push("Sitecore JSS (headless) detected")
    return { platform: "Sitecore", confidence: "high", details }
  }

  // WordPress — /wp-content/, /wp-includes/, /wp-admin/, wp-json API
  const wpSignals = [
    "/wp-content/",       // Theme and plugin assets
    "/wp-includes/",      // Core WordPress JS/CSS
    "/wp-admin/",         // Admin path
    "/wp-json/",          // REST API endpoint
    "wp-embed.min.js",    // WP embed script
  ]
  const wpMeta = head.includes('content="wordpress')
  if (wpSignals.some(sig => struct.includes(sig)) || wpMeta) {
    details.push("WordPress signatures detected")
    if (struct.includes("/wp-content/themes/")) details.push("WordPress theme assets found")
    if (struct.includes("/wp-content/plugins/")) details.push("WordPress plugins detected")
    if (struct.includes("elementor")) details.push("Elementor page builder detected")
    if (struct.includes("divi")) details.push("Divi theme/builder detected")
    if (struct.includes("woocommerce")) details.push("WooCommerce e-commerce plugin detected")
    if (struct.includes("yoast") || struct.includes("rank-math")) details.push("SEO plugin detected")
    return { platform: "WordPress", confidence: "high", details }
  }

  // Shopify — /cdn/shop/, cdn.shopify.com, Shopify.theme, shopify-checkout-api-token
  const shopifySignals = [
    "cdn.shopify.com",
    "/cdn/shop/",
    "/cdn/s/files/",
    "myshopify.com",
    "shopify-checkout-api-token",
    "shopify.theme",
    "shopifyanalytics",
    "shopify.routes",
  ]
  if (shopifySignals.some(sig => struct.includes(sig))) {
    details.push("Shopify platform signatures detected")
    if (struct.includes("shopify-section")) details.push("Shopify Sections/Liquid templates in use")
    if (struct.includes("/cart.js")) details.push("Shopify cart API detected")
    return { platform: "Shopify", confidence: "high", details }
  }

  // Wix — static.wixstatic.com, parastorage.com, wix-code-sdk, X-Wix headers
  const wixSignals = [
    "static.wixstatic.com",
    "parastorage.com",
    "wix-code-sdk",
    "_wixcidx",
  ]
  const wixMeta = head.includes('content="wix.com')
  if (wixSignals.some(sig => struct.includes(sig)) || wixMeta || headerValues.includes("x-wix-request-id")) {
    details.push("Wix platform signatures detected")
    return { platform: "Wix", confidence: "high", details }
  }

  // Squarespace — static.squarespace.com, assets.squarespace.com, collection IDs
  const sqspSignals = [
    "static.squarespace.com",
    "assets.squarespace.com",
    "sqsp.net",
    "<!-- this is squarespace",
  ]
  const sqspMeta = head.includes("squarespace")
  if (sqspSignals.some(sig => struct.includes(sig)) || sqspMeta || lower.includes("<!-- this is squarespace")) {
    details.push("Squarespace platform signatures detected")
    return { platform: "Squarespace", confidence: "high", details }
  }

  // Adobe Experience Manager (AEM) — /content/dam/, /etc.clientlibs/, data-cmp-*, cq- classes, Granite
  const aemSignals = [
    "/content/dam/",           // AEM DAM asset paths (dead giveaway)
    "/etc.clientlibs/",        // AEM client libraries
    "/etc/designs/",           // AEM design paths
    "/libs/granite/",          // Adobe Granite framework
    "/apps/",                  // AEM apps path
    "data-cmp-",               // AEM Core Components attributes
    "cq-placeholder",          // AEM editor placeholder classes
    "/graphql/execute.json/",  // AEM headless GraphQL
    "/api/assets/",            // AEM headless assets API
    "aem-react-editable",      // AEM React SDK
    "modelmanager",            // AEM SPA Model Manager
  ]
  const aemHeaders = headerValues.includes("x-dispatcher")
  if (aemSignals.some(sig => struct.includes(sig)) || aemHeaders) {
    details.push("Adobe Experience Manager (AEM) signatures detected")
    if (struct.includes("/content/dam/")) details.push("AEM DAM asset paths found")
    if (struct.includes("/etc.clientlibs/")) details.push("AEM client libraries detected")
    if (struct.includes("data-cmp-")) details.push("AEM Core Components in use")
    if (struct.includes("/graphql/execute.json/") || struct.includes("aem-react-editable")) details.push("AEM headless mode detected")
    return { platform: "Adobe AEM", confidence: "high", details }
  }

  // Optimizely (Episerver) — /episerver/, /contentassets/, EPi cookies, headless /content/v2/
  const optimizelySignals = [
    "/episerver/",             // Episerver admin path (dead giveaway)
    "/episerver",              // Episerver path variant
    "/contentassets/",         // Episerver content assets
    "/util/javascript/",       // Episerver utility scripts
    "epi-contentarea",         // Episerver content area class
    "epi:numberofvisits",      // Episerver visit tracking cookie
    "episerverlogin",          // Episerver login cookie
    "episerverapi",            // Episerver API
    "/content/v2/",            // Optimizely headless content delivery
    "/api/episerver/",         // Headless Optimizely API
  ]
  if (optimizelySignals.some(sig => struct.includes(sig))) {
    details.push("Optimizely (Episerver) CMS signatures detected")
    if (struct.includes("/content/v2/") || struct.includes("/api/episerver/")) details.push("Optimizely headless mode detected")
    return { platform: "Optimizely", confidence: "high", details }
  }

  // Kentico — /CMSPages/, /CMSModules/, /cmsscripts/, CMSPreferredCulture cookie
  const kenticoSignals = [
    "/cmspages/",              // Kentico CMS pages path (dead giveaway)
    "/cmsmodules/",            // Kentico modules path
    "/cmsscripts/",            // Kentico scripts path
    "/getmedia/",              // Kentico media handler
    "cmspreferredculture",     // Kentico culture cookie
    "cmscurrenttheme",         // Kentico theme cookie
  ]
  if (kenticoSignals.some(sig => struct.includes(sig))) {
    details.push("Kentico CMS signatures detected")
    return { platform: "Kentico", confidence: "high", details }
  }

  // Contentful
  if (struct.includes("ctfassets.net") || struct.includes("cdn.contentful.com")) {
    details.push("Contentful headless CMS signatures detected")
    return { platform: "Contentful", confidence: "high", details }
  }

  // Sanity
  if (struct.includes("api.sanity.io") || struct.includes("cdn.sanity.io")) {
    details.push("Sanity headless CMS signatures detected")
    return { platform: "Sanity", confidence: "high", details }
  }

  // Prismic
  if (struct.includes("prismic.io") || struct.includes("cdn.prismic.io")) {
    details.push("Prismic headless CMS signatures detected")
    return { platform: "Prismic", confidence: "high", details }
  }

  // Hygraph (formerly GraphCMS)
  if (struct.includes("graphql.hygraph.com") || struct.includes("media.graphassets.com") || struct.includes("media.graphcms.com")) {
    details.push("Hygraph headless CMS signatures detected")
    return { platform: "Hygraph", confidence: "high", details }
  }

  // Bloomreach (formerly Hippo CMS)
  const bloomreachSignals = [
    "/binaries/",              // Bloomreach binary assets
    "/content/documents/",     // Bloomreach document paths
    "/hippo/",                 // Hippo CMS admin
  ]
  if (bloomreachSignals.some(sig => struct.includes(sig))) {
    details.push("Bloomreach CMS signatures detected")
    return { platform: "Bloomreach", confidence: "medium", details }
  }

  // Storyblok
  if (struct.includes("storyblok.com") || struct.includes("a.storyblok.com")) {
    details.push("Storyblok headless CMS signatures detected")
    return { platform: "Storyblok", confidence: "high", details }
  }

  // Strapi
  if (struct.includes("/uploads/") && struct.includes("/api/") && headerValues.includes("strapi")) {
    details.push("Strapi headless CMS signatures detected")
    return { platform: "Strapi", confidence: "medium", details }
  }

  // Umbraco
  if (struct.includes("/umbraco/") || head.includes("umbraco")) {
    details.push("Umbraco CMS signatures detected")
    return { platform: "Umbraco", confidence: "high", details }
  }

  // HubSpot CMS
  if (struct.includes("hs-scripts.com") || struct.includes("hbspt.") || head.includes("hubspot")) {
    details.push("HubSpot CMS/Marketing Hub detected")
    return { platform: "HubSpot", confidence: "high", details }
  }

  // Drupal — /sites/default/files/, /core/, drupalSettings
  if (
    struct.includes("/sites/default/files/") ||
    struct.includes("drupalsettings") ||
    struct.includes("/core/misc/drupal") ||
    head.includes('content="drupal')
  ) {
    details.push("Drupal CMS signatures detected")
    return { platform: "Drupal", confidence: "high", details }
  }

  // Joomla — /media/jui/, /components/com_, generator meta
  if (struct.includes("/media/jui/") || struct.includes("/components/com_") || head.includes('content="joomla')) {
    details.push("Joomla CMS signatures detected")
    return { platform: "Joomla", confidence: "medium", details }
  }

  // Magento / Adobe Commerce
  if (struct.includes("/static/version") || struct.includes("mage/cookies")) {
    details.push("Magento/Adobe Commerce signatures detected")
    return { platform: "Magento", confidence: "medium", details }
  }

  // Ghost — /ghost/ admin, ghost.min.js, generator meta
  if (struct.includes("ghost.min.js") || struct.includes("ghost-api") || head.includes('content="ghost') || struct.includes("data-ghost")) {
    details.push("Ghost CMS signatures detected")
    return { platform: "Ghost", confidence: "high", details }
  }

  // Framer
  if (struct.includes("framerusercontent.com") || struct.includes("framer.com/m/")) {
    details.push("Framer platform signatures detected")
    return { platform: "Framer", confidence: "high", details }
  }

  // GoDaddy Website Builder
  if (struct.includes("secureserver.net") || struct.includes("godaddy.com/websites")) {
    details.push("GoDaddy platform signatures detected")
    return { platform: "GoDaddy", confidence: "medium", details }
  }

  // Weebly
  if (struct.includes("editmysite.com") || head.includes("weebly")) {
    details.push("Weebly platform signatures detected")
    return { platform: "Weebly", confidence: "high", details }
  }

  // --- JavaScript frameworks (lower confidence, usually custom-built) ---

  // Next.js
  if (struct.includes("__next") || struct.includes("_next/static") || struct.includes("/_next/")) {
    details.push("Next.js framework signatures detected")
    return { platform: "Next.js", confidence: "medium", details }
  }

  // Nuxt.js
  if (struct.includes("__nuxt") || struct.includes("/_nuxt/")) {
    details.push("Nuxt.js framework signatures detected")
    return { platform: "Nuxt.js", confidence: "medium", details }
  }

  // Gatsby
  if (struct.includes("___gatsby") || struct.includes("gatsby-")) {
    details.push("Gatsby framework signatures detected")
    return { platform: "Gatsby", confidence: "medium", details }
  }

  // Angular
  if (struct.includes("ng-version") || struct.includes("ng-app")) {
    details.push("Angular framework signatures detected")
    return { platform: "Angular", confidence: "medium", details }
  }

  // React (generic, lower confidence)
  if (struct.includes("data-reactroot") || struct.includes("__reactfiber")) {
    details.push("React application signatures detected")
    return { platform: "React", confidence: "low", details }
  }

  // Laravel
  if (struct.includes("csrf-token") && headerValues.includes("laravel")) {
    details.push("Possible Laravel framework detected")
    return { platform: "Laravel", confidence: "low", details }
  }

  // --- Header-based fallback detection ---
  // ASP.NET without a specific CMS match could still indicate Sitecore or similar enterprise CMS
  if (headerValues.includes("asp.net") || headerValues.includes("x-aspnet-version") || headerValues.includes("x-powered-by: asp.net")) {
    details.push("ASP.NET server infrastructure detected via response headers. This commonly indicates an enterprise .NET CMS such as Sitecore, Umbraco or Kentico.")
    return { platform: "ASP.NET (likely enterprise CMS)", confidence: "low", details }
  }

  // PHP headers
  if (headerValues.includes("x-powered-by: php")) {
    details.push("PHP server detected via response headers. May indicate WordPress, Drupal, Joomla or a custom PHP application.")
    return { platform: "PHP Application", confidence: "low", details }
  }

  details.push("No recognisable CMS or framework signatures were detected in the page source or response headers.")
  return { platform: null, confidence: "low", details }
}

export async function POST(request: Request) {
  console.log("[v0] ========== AUDIT API POST CALLED ==========")
  try {
    const body = await request.json()
    const rawUrl = body.url as string
    console.log("[v0] Received URL:", rawUrl)

    if (!rawUrl || typeof rawUrl !== "string") {
      console.log("[v0] Invalid URL provided")
      return NextResponse.json(
        { error: "Please provide a valid URL." },
        { status: 400 }
      )
    }

    const url = normalizeUrl(rawUrl)
    console.log("[v0] Normalized URL:", url)

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "The URL provided is not valid. Please include the full address." },
        { status: 400 }
      )
    }

    console.log("[v0] Running FRESH audit for:", url)

    // CACHE REMOVED: Every POST /api/audit now runs a fresh audit for accurate before/after comparisons

    // Run PSI (both strategies) + HTML fetch in parallel, handle individual failures
    const emptyResult: StrategyResult = {
      strategy: "mobile",
      performanceScore: 0,
      accessibilityScore: 0,
      seoScore: 0,
      bestPracticesScore: 0,
      metrics: { lcp: null, cls: null, tbt: null, fcp: null, speedIndex: null },
      fieldDataAvailable: false,
      notes: ["Lighthouse analysis failed for this strategy. Results may be incomplete."],
      screenshot: undefined,
    }

    const [mobileResult, desktopResult, siteHtml] = await Promise.all([
      fetchPSI(url, "mobile").catch((err) => {
        console.error("Mobile PSI failed:", err.message)
        return { result: { ...emptyResult, strategy: "mobile" as const }, rawAudits: {} }
      }),
      fetchPSI(url, "desktop").catch((err) => {
        console.error("Desktop PSI failed:", err.message)
        return { result: { ...emptyResult, strategy: "desktop" as const }, rawAudits: {} }
      }),
      fetchSiteHtml(url),
    ])

    const mobileData = mobileResult
    const desktopData = desktopResult

    // If BOTH strategies failed, we can't produce a useful report
    const mobileFailed = mobileData.result.notes?.some((n: string) => n.includes("Lighthouse analysis failed"))
    const desktopFailed = desktopData.result.notes?.some((n: string) => n.includes("Lighthouse analysis failed"))
    if (mobileFailed && desktopFailed) {
      return NextResponse.json(
        { error: "Lighthouse could not analyse this site. The site may be blocking automated testing, require authentication, or be temporarily unavailable. Please try again in a moment." },
        { status: 502 }
      )
    }

    const mobile = mobileData.result
    const desktop = desktopData.result
    const fetchedHtml = siteHtml.html

    // Try AI vision analysis first (uses screenshots), fall back to HTML/Lighthouse parsing
    const aiResult = await analyseScreenshotsWithAI(
      desktopData.result.screenshot,
      mobileData.result.screenshot,
    )
    const uxIndicators = aiResult?.uxIndicators ?? analyseUXIndicators(fetchedHtml, siteHtml.blocked, mobileData.rawAudits)
    const designIndicators = extractDesignIndicators(mobileData.rawAudits, fetchedHtml)
    const accessibilityIndicators = extractAccessibilityIndicators(mobileData.rawAudits, fetchedHtml, aiResult?.cookieConsentVisible ?? false)
    const advancedUX = aiResult?.advancedUX ?? extractAdvancedUXIndicators(fetchedHtml, mobileData.rawAudits)

    const overallScore = calculateOverallScore(mobile, desktop)
    const summaryText = generateSummary(overallScore)
    const platformInfo = detectPlatform(fetchedHtml, url, siteHtml.responseHeaders)

    const result: AuditResult = {
      id: v4(),
      url,
      timestamp: new Date().toISOString(),
      overallScore,
      summaryText,
      mobile,
      desktop,
      uxIndicators,
      designIndicators,
      accessibilityIndicators,
      advancedUX,
      platformInfo,
      riskCards: {
        visibility: generateVisibilityRisk(mobile, advancedUX),
        conversion: generateConversionRisk(mobile, uxIndicators, designIndicators, advancedUX),
        trust: generateTrustRisk(mobile, uxIndicators, accessibilityIndicators, advancedUX),
      },
      salesTalkTrack: generateSalesTalkTrack(overallScore, mobile, uxIndicators, designIndicators, accessibilityIndicators, advancedUX),
    }

    await saveReport({
      id: result.id,
      url: result.url,
      timestamp: result.timestamp,
      result,
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred."

    if (message.includes("PageSpeed API error")) {
      return NextResponse.json(
        { error: `The PageSpeed Insights API returned an error. ${message}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
