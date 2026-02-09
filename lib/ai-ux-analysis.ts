import { generateText, Output } from "ai"
import { z } from "zod"
import type { UXIndicators, AdvancedUXIndicators } from "./types"

// --- Schemas ---

const uxVisionSchema = z.object({
  ctaFound: z.boolean().describe("Whether any call-to-action buttons/links are visible on the page"),
  ctaKeywords: z.array(z.string()).describe("The actual CTA text found, e.g. 'Get a Quote', 'Contact Us', 'Learn More'"),
  trustSignalsFound: z.boolean().describe("Whether trust signals like reviews, testimonials, client logos, awards, or certifications are visible"),
  trustKeywords: z.array(z.string()).describe("Specific trust signals found, e.g. 'client logos', 'testimonials section', '5-star reviews'"),
  socialProofAboveFold: z.boolean().describe("Whether social proof (reviews, logos, stats) appears in the visible area before scrolling"),
  socialProofKeywordsAboveFold: z.array(z.string()).describe("Social proof elements visible above the fold"),
  testimonialsVerified: z.boolean().describe("Whether third-party review sources (Trustpilot, Google Reviews, G2, etc.) are visible"),
  verifiedSources: z.array(z.string()).describe("Names of third-party review platforms found"),
  phoneFound: z.boolean().describe("Whether a phone number is visible anywhere on the page"),
  emailFound: z.boolean().describe("Whether an email address is visible anywhere on the page"),
})

const frictionCategorySchema = z.object({
  status: z.string().describe("One of the allowed status values for this category"),
  bullets: z.array(z.string()).describe("1-3 short bullet points describing specific issues found, or empty if no issues"),
})

const advancedUXSchema = z.object({
  firstImpression: frictionCategorySchema.describe(
    "First-impression clarity: Is the hero clear? Is there a visible H1? Is a CTA above the fold? Status: clear | mixed | unclear"
  ),
  navigationFriction: frictionCategorySchema.describe(
    "Decision friction: Is there clear navigation? Too many or too few nav items? Generic labels? Status: low | medium | high"
  ),
  scanability: frictionCategorySchema.describe(
    "Scanability: Are there clear headings, bullet lists, short paragraphs? Or walls of text? Status: scannable | mixed | dense"
  ),
  conversionPath: frictionCategorySchema.describe(
    "Conversion path: Are there clear CTAs throughout the page? Consistent CTA labels? Dead-end sections? Status: clear_path | partial | broken"
  ),
  formFriction: frictionCategorySchema.describe(
    "Form friction: If forms are visible, are they short? Clear labels? Obvious submit button? Status: low | medium | high"
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
      text: `You are a UX auditor analysing website screenshots. You are given a DESKTOP screenshot and a MOBILE screenshot of the same page.

Analyse BOTH screenshots carefully and return two things:

## 1. UX Indicators
Identify what is visible on the page:
- **CTAs**: ALL buttons/links like "Get a Quote", "Contact Us", "Learn More", "Book Now", "Sign Up", etc. Ignore cookie-consent buttons unless no real CTAs exist.
- **Trust signals**: Client logos, testimonials, reviews, awards, certifications, "trusted by" sections.
- **Social proof above the fold**: Trust/social proof visible in the FIRST screenful (before scrolling).
- **Third-party reviews**: Trustpilot, Google Reviews, G2, Capterra, Yelp, BBB widgets/badges.
- **Phone number**: Any visible phone number.
- **Email address**: Any visible email address.

## 2. Advanced UX Friction Analysis
For each of the 7 categories, provide a status and 0-3 bullet points describing specific issues. If no issues, return an empty bullets array.
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
    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
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
      uxIndicators: {
        ...output.uxIndicators,
        fetchBlocked: false,
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
