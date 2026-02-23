export const defaultPSIResult = {
  result: {
    strategy: "mobile" as const,
    performanceScore: 0,
    accessibilityScore: 0,
    seoScore: 0,
    bestPracticesScore: 0,
    metrics: {
      lcp: null,
      cls: null,
      tbt: null,
      fcp: null,
      speedIndex: null,
    },
    fieldDataAvailable: false,
    notes: ["PageSpeed data unavailable"],
  },
  rawAudits: {},
}
