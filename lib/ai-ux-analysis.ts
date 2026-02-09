import { generateText, Output } from "ai"
import { z } from "zod"
import type { UXIndicators } from "./types"

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

export async function analyseScreenshotsWithAI(
  desktopScreenshot?: { data: string },
  mobileScreenshot?: { data: string },
): Promise<UXIndicators | null> {
  // Need at least one screenshot
  if (!desktopScreenshot?.data && !mobileScreenshot?.data) {
    return null
  }

  const imageContent: Array<{ type: "image"; image: URL | string; mediaType?: string } | { type: "text"; text: string }> = [
    {
      type: "text",
      text: `Analyze these website screenshots and identify UX indicators. Look carefully at BOTH the desktop and mobile views.

Identify:
1. **Call-to-action (CTA) buttons/links**: Look for ANY buttons or prominent links like "Get a Quote", "Contact Us", "Learn More", "Book Now", "Sign Up", "Buy Now", "Shop Now", etc. Include cookie consent buttons only if no real CTAs are found.
2. **Trust signals**: Client logos, testimonials, reviews, awards, certifications, "trusted by" sections, case studies.
3. **Social proof above the fold**: Any trust/social proof visible WITHOUT scrolling (the first screenful).
4. **Third-party review sources**: Trustpilot, Google Reviews, G2, Capterra, Yelp, BBB, etc.
5. **Phone number**: Any visible phone number on the page.
6. **Email address**: Any visible email address on the page.

Be thorough - check headers, footers, navigation bars, banners, hero sections, and body content.`,
    },
  ]

  if (desktopScreenshot?.data) {
    // PSI screenshots are base64 data URIs starting with "data:image/..."
    const base64Data = desktopScreenshot.data.startsWith("data:")
      ? desktopScreenshot.data
      : `data:image/jpeg;base64,${desktopScreenshot.data}`
    imageContent.push({
      type: "image",
      image: new URL(base64Data),
    })
  }

  if (mobileScreenshot?.data) {
    const base64Data = mobileScreenshot.data.startsWith("data:")
      ? mobileScreenshot.data
      : `data:image/jpeg;base64,${mobileScreenshot.data}`
    imageContent.push({
      type: "image",
      image: new URL(base64Data),
    })
  }

  try {
    const { output } = await generateText({
      model: "openai/gpt-4o-mini",
      output: Output.object({ schema: uxVisionSchema }),
      messages: [
        {
          role: "user",
          content: imageContent,
        },
      ],
    })

    if (!output) return null

    return {
      ...output,
      fetchBlocked: false, // AI vision always "sees" the page
    }
  } catch (error) {
    console.error("AI vision analysis failed:", error)
    return null
  }
}
