import { generateText, Output } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
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

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.openai.com/v1",
    })

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

    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema: recapSchema }),
      messages: [
        {
          role: "system",
          content: `You are a digital marketing consultant writing a brief recap for a salesperson to share with a prospect after a website health check. 

Rules:
- Write 2-4 sentences maximum in a single paragraph
- Be specific about the issues found on THIS website
- Use plain business language, not technical jargon
- Focus on the impact on the business (lost customers, lower search rankings, etc.)
- End with an encouraging tone about what can be improved
- Wrap the most important phrases and key findings in **double asterisks** for emphasis (e.g. **slow mobile loading times**, **no visible trust signals**). Use this sparingly on 3-5 key phrases only.
- Do NOT use bullet points, headers, or any other formatting besides **bold**
- Do NOT mention scores or numbers`,
        },
        {
          role: "user",
          content: `Here are the health check findings for this website:\n\n${contextLines.join("\n")}\n\nWrite a short recap paragraph of the key issues and why they matter.`,
        },
      ],
    })

    return Response.json({ recap: output?.recap ?? "" })
  } catch (error) {
    console.error("Recap generation failed:", error)
    return Response.json(
      { error: "Failed to generate recap" },
      { status: 500 }
    )
  }
}
