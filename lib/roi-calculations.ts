import type { ROIInputs, ROICalculationResult, ScenarioResult, IndustryBenchmark } from "./roi-types"
import { INDUSTRY_BENCHMARKS } from "./roi-benchmarks"

const DEFAULT_PROJECT_COST = 15000

const SCENARIOS = [
  { key: "conservative" as const, label: "Conservative", crImprovement: 0.003 }, // +0.3%
  { key: "moderate" as const, label: "Moderate", crImprovement: 0.005 }, // +0.5%
  { key: "optimistic" as const, label: "Optimistic", crImprovement: 0.010 }, // +1.0%
]

export function calculateROI(inputs: ROIInputs): ROICalculationResult {
  const benchmark = INDUSTRY_BENCHMARKS[inputs.industry] || INDUSTRY_BENCHMARKS.other

  // Use provided values or derive from benchmark
  const projectCost = inputs.projectCost || DEFAULT_PROJECT_COST
  const currentCR = inputs.currentConversionRate || benchmark.conversionRate
  const aov = inputs.averageOrderValue || benchmark.averageOrderValue

  // If monthly revenue provided, derive sessions
  let monthlySessions: number
  let monthlyRevenue: number

  if (inputs.monthlyRevenue && !inputs.monthlySessions) {
    monthlyRevenue = inputs.monthlyRevenue
    // Derive sessions: Revenue = Sessions × CR × AOV
    // Sessions = Revenue / (CR × AOV)
    monthlySessions = monthlyRevenue / (currentCR * aov)
  } else if (inputs.monthlySessions) {
    monthlySessions = inputs.monthlySessions
    monthlyRevenue = inputs.monthlyRevenue || monthlySessions * currentCR * aov
  } else {
    // Ballpark defaults if nothing provided
    monthlySessions = 50000
    monthlyRevenue = monthlySessions * currentCR * aov
  }

  // Sanity check
  const calculatedRevenue = monthlySessions * currentCR * aov
  const variance = monthlyRevenue > 0 ? Math.abs(calculatedRevenue - monthlyRevenue) / monthlyRevenue : 0
  const isValid = variance < 0.20 // Within 20% tolerance

  // Calculate scenarios
  const scenarios: ScenarioResult[] = SCENARIOS.map((scenario) => {
    const newCR = currentCR + scenario.crImprovement
    const additionalConversions = monthlySessions * scenario.crImprovement
    const monthlyRevenueUplift = additionalConversions * aov
    const annualRevenueUplift = monthlyRevenueUplift * 12

    // Account for gross margin and return rate
    const netMargin = benchmark.grossMargin * (1 - benchmark.returnRate)
    const netAnnualProfit = annualRevenueUplift * netMargin

    const breakEvenMonths = projectCost / (monthlyRevenueUplift * netMargin)
    const annualROI = ((netAnnualProfit - projectCost) / projectCost) * 100
    const roiMultiple = netAnnualProfit / projectCost

    return {
      scenario: scenario.key,
      label: scenario.label,
      crImprovement: scenario.crImprovement,
      newConversionRate: newCR,
      additionalConversions,
      monthlyRevenueUplift,
      annualRevenueUplift,
      breakEvenMonths,
      annualROI,
      roiMultiple,
    }
  })

  return {
    inputs: {
      industry: benchmark.industry,
      monthlyRevenue,
      monthlySessions,
      currentConversionRate: currentCR,
      averageOrderValue: aov,
      projectCost,
    },
    benchmark,
    sanityCheck: {
      calculatedRevenue,
      providedRevenue: monthlyRevenue,
      variance,
      isValid,
    },
    scenarios,
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(Math.round(value))
}
