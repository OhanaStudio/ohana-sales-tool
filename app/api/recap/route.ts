import { generateText, Output } from "ai"
import { z } from "zod"

const recapSchema = z.object({
  recap: z
    .string()
    .describe(
      "A short 2-4 sentence paragraph summarising the key issues found and what the business should prioritise fixing. Written in a direct, consultative tone suitable for a salesperson to share with a prospect. Do not use bullet points."
    ),
})

export async function POST(req: Request) {
  try {
    const { result } = await req.json()

    if (!result) {
      return Response.json({ error: "No result provided" }, { status: 400 })
    }

    // Build a concise context from the audit result
    const riskCards = result.riskCards ?? {}
    const visibilityBullets = riskCards.visibility?.bullets?.join("; ") ?? ""
    const conversionBullets = riskCards.conversion?.bullets?.join("; ") ?? ""
    const trustBullets = riskCards.trust?.bullets?.join("; ") ?? ""

    const ux = result.uxIndicators ?? {}
    const a11y = result.accessibilityIndicators ?? {}

    const contextLines = [
      `URL: ${result.url}`,
      `Overall score: ${result.overallScore}/100`,
      `Mobile performance: ${result.mobile?.performanceScore}/100`,
      `Mobile accessibility: ${result.mobile?.accessibilityScore}/100`,
      `Visibility issues: ${visibilityBullets || "None"}`,
      `Conversion issues: ${conversionBullets || "None"}`,
      `Trust issues: ${trustBullets || "None"}`,
      `CTA found: ${ux.ctaFound ? "Yes" : "No"}`,
      `Trust signals: ${ux.trustSignalsFound ? "Yes" : "No"}`,
      `Social proof above fold: ${ux.socialProofAboveFold ? "Yes" : "No"}`,
      `Phone visible: ${ux.phoneFound ? "Yes" : "No"}`,
      `Email visible: ${ux.emailFound ? "Yes" : "No"}`,
      `EAA/WCAG issues: ${a11y.eaaIssues?.length ?? 0}`,
    ]

    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: recapSchema,
      system: "You are a concise sales consultant writing a short paragraph that summarises a website audit for a potential client. Be direct and focus on actionable issues that affect their business performance.",
      prompt: contextLines.join("\n"),
    })

    return Response.json({ recap: object?.recap ?? "" })
  } catch (error) {
    console.error("Recap generation failed:", error)
    return Response.json(
      { error: "Failed to generate recap" },
      { status: 500 }
    )
  }
}
