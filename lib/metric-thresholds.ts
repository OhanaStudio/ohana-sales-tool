import type { RiskLevel, LighthouseMetrics } from "./types"

interface Threshold {
  green: number
  amber: number
}

// Standard Web Vitals thresholds
const thresholds: Record<string, Threshold> = {
  lcp: { green: 2500, amber: 4000 },        // ms: <2.5s good, <4s needs work, >4s poor
  fcp: { green: 1800, amber: 3000 },        // ms
  cls: { green: 0.1, amber: 0.25 },         // unitless
  tbt: { green: 200, amber: 600 },          // ms
  speedIndex: { green: 3400, amber: 5800 }, // ms
}

// Category score thresholds
const scoreThreshold: Threshold = { green: 90, amber: 50 }

function getStatus(value: number, threshold: Threshold, lowerIsBetter = true): RiskLevel {
  if (lowerIsBetter) {
    if (value <= threshold.green) return "green"
    if (value <= threshold.amber) return "amber"
    return "red"
  }
  // Higher is better (for scores)
  if (value >= threshold.green) return "green"
  if (value >= threshold.amber) return "amber"
  return "red"
}

export function getMetricStatus(
  metricName: keyof LighthouseMetrics,
  value: number | null
): RiskLevel | undefined {
  if (value === null) return undefined
  const t = thresholds[metricName]
  if (!t) return undefined
  return getStatus(value, t, true)
}

export function getScoreStatus(score: number): RiskLevel {
  return getStatus(score, scoreThreshold, false)
}
