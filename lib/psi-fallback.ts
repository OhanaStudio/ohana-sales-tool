import type { StrategyResult } from "./types"

export function makePSIFallback(strategy: "mobile" | "desktop"): { result: StrategyResult; rawAudits: Record<string, unknown> } {
  return {
    result: {
      strategy,
      performanceScore: 0,
      accessibilityScore: 0,
      seoScore: 0,
      bestPracticesScore: 0,
      metrics: { lcp: null, cls: null, tbt: null, fcp: null, speedIndex: null },
      fieldDataAvailable: false,
      notes: ["Lighthouse analysis failed"],
    },
    rawAudits: {},
  }
}
