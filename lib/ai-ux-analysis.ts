import { generateText, Output } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"
import type { UXIndicators, AdvancedUXIndicators } from "./types"

// --- Schemas ---

const uxVisionSchema = z.object({
  ctaFound: z.boolean().describe("Whether any ACTUAL clickable call-to-action buttons/links are visible (not just words in body text). Must be styled buttons or clearly clickable links with action-oriented text."),
  ctaKeywords: z.array(z.string()).describe("The actual CTA button/link text found, e.g. 'Get a Quote', 'Contact Us', 'Learn More'. Only include text from actual buttons/links, NOT words found in paragraphs."),
  trustSignalsFound: z.boolean().describe("Whether THIRD-PARTY trust signals like external client logos (not the site's own logo), testimonials, reviews from real customers, awards, or certifications are visible"),
  trustKeywords: z.array(z.string()).describe("Specific third-party trust signals found. Only include genuine external validation like 'Google Reviews', 'client logos section', 'customer testimonials'. Do NOT include the site's own branding/logo."),
  socialProofAboveFold: z.boolean().describe("Whether genuine third-party social proof (real customer reviews, external client logos, stats from real customers) appears above the fold. The site's own logo/branding does NOT count."),
  socialProofKeywordsAboveFold: z.array(z.string()).describe("Genuine third-party social proof elements visible above the fold"),
  testimonialsVerified: z.boolean().describe("Whether third-party review sources (Trustpilot, Google Reviews, G2, etc.) are visible - must be actual widgets/badges, not just mentions"),
  verifiedSources: z.array(z.string()).describe("Names of third-party review platforms actually integrated (widgets/badges visible)"),
  phoneFound: z.boolean().describe("Whether a phone number is visible anywhere on the page"),
  emailFound: z.boolean().describe("Whether an email address is visible anywhere on the page"),
  cookieConsentVisible: z.boolean().describe("Whether a cookie consent banner, popup, or dialog is visible in either screenshot"),
  heroHasHeadline: z.boolean().describe("Whether the hero section has actual readable headline TEXT (H1 or large text). A hero that is just a large image/logo with no text headline should return false."),
  heroIssues: z.array(z.string()).describe("Issues with the hero section, e.g. 'Hero is just a logo image with no headline', 'No clear value proposition text', 'Hero text is unreadable'"),
})

const frictionCategorySchema = z.object({
  status: z.string().describe("One of the allowed status values for this category"),
  bullets: z.array(z.string()).describe("1-3 short bullet points describing specific issues found, or empty if no issues"),
})

const advancedUXSchema = z.object({
  firstImpression: frictionCategorySchema.describe(
    "First-impression clarity: Is there a clear headline (not just an image/logo)? Is the value proposition obvious? Is a CTA above the fold? If the hero is just a large image/logo with no text headline, status should be 'unclear'. Status: clear | mixed | unclear"
  ),
  navigationFriction: frictionCategorySchema.describe(
    "Decision friction: Is there clear navigation? If NO navigation menu is detected, that is HIGH friction and a major red flag. Status: low | medium | high"
  ),
  scanability: frictionCategorySchema.describe(
    "Scanability: Are there clear headings, bullet lists, short paragraphs? Or walls of text? Status: scannable | mixed | dense"
  ),
  conversionPath: frictionCategorySchema.describe(
    "Conversion path: Are there clear CTAs throughout the page? Consistent CTA labels? Dead-end sections? Status: clear_path | partial | broken"
  ),
  formFriction: frictionCategorySchema.describe(
    "Form friction: If NO contact/enquiry form exists on a business site, that is HIGH friction - visitors have no way to enquire. If forms exist, check if they are short with clear labels. Status: low | medium | high"
  ),
  trustDepth: frictionCategorySchema.describe(
    "Trust depth: Are there named testimonials with roles? Case studies? About page link? Physical address? Status: strong | moderate | weak"
  ),
  mobileFriction: frictionCategorySchema.describe(
    "Mobile friction (from mobile screenshot): Tap target sizes, sticky elements, cookie banners covering content, horizontal scroll? Status: low | medium | high"
  ),
})

const combinedSchema = z.object({
  uxIndicators: uxVisionSchema,
  advancedUX: advancedUXSchema,
})

export interface AIAnalysisResult {
  cookieConsentVisible: boolean
  uxIndicators: UXIndicators
  advancedUX: AdvancedUXIndicators
}

function buildImageContent(
  desktopScreenshot?: { data: string },
  mobileScreenshot?: { data: string },
) {
  const content: Array<{ type: "image"; image: URL } | { type: "text"; text: string }> = [
    {
      type: "text",
      text: `You are a strict UX auditor analysing website screenshots. You are given a DESKTOP screenshot and a MOBILE screenshot of the same page.

Be RIGOROUS and CRITICAL in your analysis. If something is missing or poor, flag it clearly.

Analyse BOTH screenshots carefully and return two things:

## 1. UX Indicators
Identify what is ACTUALLY visible on the page:

- **CTAs**: ONLY count actual styled buttons or clearly clickable links with action text (e.g. "Get a Quote", "Contact Us", "Book Now"). Do NOT count generic words like "contact" or "book" that appear in body text paragraphs. A CTA must be a CLICKABLE ELEMENT.

- **Trust signals**: ONLY count THIRD-PARTY validation. The site's own logo/branding does NOT count. Look for:
  - Logos of EXTERNAL clients/partners (e.g. "Trusted by Microsoft, Google")
  - Testimonials with real customer names
  - Review widgets from Trustpilot, Google, G2, etc.
  - Award badges, certifications
  - If you only see the company's own logo/branding, trustSignalsFound should be FALSE.

- **Social proof above the fold**: Only genuine third-party proof. The site's own branding does NOT count.

- **Third-party reviews**: Must be actual embedded widgets/badges from Trustpilot, Google Reviews, etc. - not just text saying "5 stars".

- **Hero section**: Check if the hero has actual headline TEXT (H1 or prominent text). If the hero is dominated by a large image/logo with little or no readable headline text, set heroHasHeadline to false and describe the issue.

- **Phone/Email**: Any visible contact information.

- **Cookie consent**: Any cookie consent banner visible.

## 2. Advanced UX Friction Analysis
For each of the 7 categories, provide a status and 0-3 bullet points describing specific issues. Be CRITICAL:
- If navigation is missing, that's HIGH friction (major red flag).
- If there's no contact form on a business site, that's HIGH form friction.
- If the hero is just an image with no headline, that's UNCLEAR first impression.
- Be specific: reference actual text, buttons, or sections you can see.
- Only flag real issues you observe, not hypothetical ones.
- Each bullet should be 1 short sentence.
- Use the EXACT status values specified in each category description.`,
    },
  ]

  if (desktopScreenshot?.data) {
    const base64Data = desktopScreenshot.data.startsWith("data:")
      ? desktopScreenshot.data
      : `data:image/jpeg;base64,${desktopScreenshot.data}`
    content.push({ type: "image", image: new URL(base64Data) })
  }

  if (mobileScreenshot?.data) {
    const base64Data = mobileScreenshot.data.startsWith("data:")
      ? mobileScreenshot.data
      : `data:image/jpeg;base64,${mobileScreenshot.data}`
    content.push({ type: "image", image: new URL(base64Data) })
  }

  return content
}

function mapFrictionCategory(raw: { status: string; bullets: string[] }, defaults: { status: string }) {
  return {
    ...raw,
    status: raw.status || defaults.status,
    bullets: raw.bullets || [],
  }
}

export async function analyseScreenshotsWithAI(
  desktopScreenshot?: { data: string },
  mobileScreenshot?: { data: string },
): Promise<AIAnalysisResult | null> {
  if (!desktopScreenshot?.data && !mobileScreenshot?.data) {
    return null
  }

  try {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.openai.com/v1",
      compatibility: "strict",
    })

    const { output } = await generateText({
      model: openai.chat("gpt-4o-mini"),
      output: Output.object({ schema: combinedSchema }),
      messages: [
        {
          role: "user",
          content: buildImageContent(desktopScreenshot, mobileScreenshot),
        },
      ],
    })

    if (!output) return null

    return {
      cookieConsentVisible: output.uxIndicators.cookieConsentVisible ?? false,
      uxIndicators: {
        ...output.uxIndicators,
        fetchBlocked: false,
        heroHasHeadline: output.uxIndicators.heroHasHeadline ?? true,
        heroIssues: output.uxIndicators.heroIssues ?? [],
      },
      advancedUX: {
        firstImpression: {
          h1Count: 0, h1Text: null, h1AboveFold: false, h1Vague: false,
          primaryCtaAboveFold: false, competingCtasAboveFold: 0, autoplayAboveFold: false,
          ...mapFrictionCategory(output.advancedUX.firstImpression, { status: "clear" }),
        },
        navigationFriction: {
          navItemCount: 0, contactInNav: false, genericNavLabels: [],
          nestedMenuDepth: 0, tapTargetIssues: 0,
          ...mapFrictionCategory(output.advancedUX.navigationFriction, { status: "low" }),
        },
        scanability: {
          avgParagraphLength: 0, longParagraphs: 0, bulletListsFound: 0,
          subheadingFrequency: 0, headingSkips: 0, longLineEstimate: false,
          ...mapFrictionCategory(output.advancedUX.scanability, { status: "scannable" }),
        },
        conversionPath: {
          ctaLabels: output.uxIndicators.ctaKeywords || [], ctaConsistency: true,
          deadEndSections: 0, inlineCtasFound: 0, externalLinkCount: 0,
          ...mapFrictionCategory(output.advancedUX.conversionPath, { status: "clear_path" }),
        },
        formFriction: {
          formsFound: 0, avgFieldCount: 0, highFieldCountForms: 0,
          placeholderOnlyLabels: 0, submitButtonLabels: [], genericSubmitButtons: 0,
          ...mapFrictionCategory(output.advancedUX.formFriction, { status: "low" }),
        },
        trustDepth: {
          namedTestimonials: 0, anonymousTestimonials: 0, testimonialsWithRoles: 0,
          caseStudiesFound: false, stockImagerySignals: 0, aboutPageLinked: false,
          physicalAddressFound: false,
          ...mapFrictionCategory(output.advancedUX.trustDepth, { status: "moderate" }),
        },
        mobileFriction: {
          tapTargetIssues: 0, stickyElementsFound: 0, cookieBannerOverCta: false,
          horizontalScrollRisk: false, viewportConfigured: true, stickyCtaFound: false,
          ...mapFrictionCategory(output.advancedUX.mobileFriction, { status: "low" }),
        },
      },
    }
  } catch (error) {
    console.error("AI vision analysis failed:", error)
    return null
  }
}
