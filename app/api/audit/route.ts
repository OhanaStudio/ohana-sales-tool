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
  return url
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

  // Extract screenshot from final-screenshot audit
  let screenshot: ScreenshotData | undefined
  const screenshotAudit = audits["final-screenshot"]
  if (screenshotAudit?.details?.data) {
    screenshot = {
      data: screenshotAudit.details.data,
      width: screenshotAudit.details.width ?? 0,
      height: screenshotAudit.details.height ?? 0,
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
  html: string
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

  // Cookie consent / GDPR banner
  const cookieConsentFound =
    lowerHtml.includes("cookie") ||
    lowerHtml.includes("consent") ||
    lowerHtml.includes("gdpr") ||
    lowerHtml.includes("cookiebot") ||
    lowerHtml.includes("onetrust") ||
    lowerHtml.includes("cookie-consent") ||
    lowerHtml.includes("cookie-banner") ||
    lowerHtml.includes("cc-banner")

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

async function fetchSiteHtml(url: string): Promise<{ html: string; blocked: boolean }> {
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
    if (!res.ok) return { html: "", blocked: true }
    const html = await res.text()
    return { html, blocked: false }
  } catch {
    return { html: "", blocked: true }
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

function detectPlatform(html: string, url: string): PlatformInfo {
  const lower = html.toLowerCase()
  const details: string[] = []

  // --- CMS / Platform signatures (ordered by specificity) ---

  // WordPress
  if (lower.includes("wp-content") || lower.includes("wp-includes") || lower.includes("wordpress")) {
    details.push("WordPress signatures detected (wp-content, wp-includes)")
    // Check for common page builders
    if (lower.includes("elementor")) details.push("Elementor page builder detected")
    if (lower.includes("divi")) details.push("Divi theme/builder detected")
    if (lower.includes("wpbakery") || lower.includes("js_composer")) details.push("WPBakery page builder detected")
    if (lower.includes("woocommerce")) details.push("WooCommerce e-commerce plugin detected")
    if (lower.includes("yoast") || lower.includes("rank-math")) details.push("SEO plugin detected")
    return { platform: "WordPress", confidence: "high", details }
  }

  // Shopify
  if (lower.includes("shopify") || lower.includes("cdn.shopify.com") || lower.includes("myshopify.com")) {
    details.push("Shopify platform signatures detected")
    if (lower.includes("shopify-section")) details.push("Shopify Sections/Liquid templates in use")
    return { platform: "Shopify", confidence: "high", details }
  }

  // Wix
  if (lower.includes("wix.com") || lower.includes("_wix") || lower.includes("x-wix")) {
    details.push("Wix platform signatures detected")
    return { platform: "Wix", confidence: "high", details }
  }

  // Squarespace
  if (lower.includes("squarespace") || lower.includes("static.squarespace.com") || lower.includes("sqsp")) {
    details.push("Squarespace platform signatures detected")
    return { platform: "Squarespace", confidence: "high", details }
  }

  // Webflow
  if (lower.includes("webflow") || lower.includes("assets-global.website-files.com") || lower.includes("w-webflow")) {
    details.push("Webflow platform signatures detected")
    return { platform: "Webflow", confidence: "high", details }
  }

  // HubSpot CMS
  if (lower.includes("hubspot") || lower.includes("hs-scripts.com") || lower.includes("hbspt")) {
    details.push("HubSpot CMS/Marketing Hub detected")
    return { platform: "HubSpot", confidence: "high", details }
  }

  // Drupal
  if (lower.includes("drupal") || lower.includes("/sites/default/files") || lower.includes("drupal.js")) {
    details.push("Drupal CMS signatures detected")
    return { platform: "Drupal", confidence: "high", details }
  }

  // Joomla
  if (lower.includes("/media/jui/") || lower.includes("joomla") || lower.includes("/components/com_")) {
    details.push("Joomla CMS signatures detected")
    return { platform: "Joomla", confidence: "medium", details }
  }

  // Magento / Adobe Commerce
  if (lower.includes("magento") || lower.includes("mage/") || lower.includes("/static/version")) {
    details.push("Magento/Adobe Commerce signatures detected")
    return { platform: "Magento", confidence: "medium", details }
  }

  // Ghost
  if (lower.includes("ghost.org") || lower.includes("ghost-api") || lower.includes('content="ghost"')) {
    details.push("Ghost CMS signatures detected")
    return { platform: "Ghost", confidence: "high", details }
  }

  // Framer
  if (lower.includes("framer") || lower.includes("framerusercontent.com")) {
    details.push("Framer platform signatures detected")
    return { platform: "Framer", confidence: "high", details }
  }

  // GoDaddy Website Builder
  if (lower.includes("godaddy") || lower.includes("secureserver.net")) {
    details.push("GoDaddy platform signatures detected")
    return { platform: "GoDaddy", confidence: "medium", details }
  }

  // Weebly
  if (lower.includes("weebly") || lower.includes("editmysite.com")) {
    details.push("Weebly platform signatures detected")
    return { platform: "Weebly", confidence: "high", details }
  }

  // --- JavaScript frameworks (lower confidence, usually custom-built) ---

  // Next.js
  if (lower.includes("__next") || lower.includes("_next/static") || lower.includes("/_next/")) {
    details.push("Next.js framework signatures detected")
    return { platform: "Next.js", confidence: "medium", details }
  }

  // Nuxt.js
  if (lower.includes("__nuxt") || lower.includes("/_nuxt/")) {
    details.push("Nuxt.js framework signatures detected")
    return { platform: "Nuxt.js", confidence: "medium", details }
  }

  // Gatsby
  if (lower.includes("gatsby") || lower.includes("___gatsby")) {
    details.push("Gatsby framework signatures detected")
    return { platform: "Gatsby", confidence: "medium", details }
  }

  // Angular
  if (lower.includes("ng-version") || lower.includes("angular")) {
    details.push("Angular framework signatures detected")
    return { platform: "Angular", confidence: "medium", details }
  }

  // React (generic, lower confidence)
  if (lower.includes("react") && lower.includes("__reactfiber") || lower.includes("data-reactroot")) {
    details.push("React application signatures detected")
    return { platform: "React", confidence: "low", details }
  }

  // Laravel
  if (lower.includes("laravel") || lower.includes("csrf-token")) {
    details.push("Possible Laravel framework detected")
    return { platform: "Laravel", confidence: "low", details }
  }

  details.push("No recognisable CMS or framework signatures were detected in the page source.")
  return { platform: null, confidence: "low", details }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawUrl = body.url as string

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid URL." },
        { status: 400 }
      )
    }

    const url = normalizeUrl(rawUrl)

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "The URL provided is not valid. Please include the full address." },
        { status: 400 }
      )
    }

    // Check cache
  const cached = await getCachedReportForUrl(url)
  if (cached) {
  return NextResponse.json(cached.result)
  }

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
    const accessibilityIndicators = extractAccessibilityIndicators(mobileData.rawAudits, fetchedHtml)
    const advancedUX = aiResult?.advancedUX ?? extractAdvancedUXIndicators(fetchedHtml, mobileData.rawAudits)

    const overallScore = calculateOverallScore(mobile, desktop)
    const summaryText = generateSummary(overallScore)
    const platformInfo = detectPlatform(fetchedHtml, url)

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
