export interface IndustryBenchmark {
  industry: string
  conversionRate: number // as decimal (e.g., 0.025 = 2.5%)
  averageOrderValue: number
  grossMargin: number // as decimal (e.g., 0.40 = 40%)
  returnRate: number // as decimal (e.g., 0.08 = 8%)
}

export interface ROIInputs {
  industry: string
  // Optional manual overrides
  monthlyRevenue?: number
  monthlySessions?: number
  currentConversionRate?: number
  averageOrderValue?: number
  projectCost?: number
}

export interface ScenarioResult {
  scenario: "conservative" | "moderate" | "optimistic"
  label: string
  crImprovement: number // as decimal (e.g., 0.003 = 0.3%)
  newConversionRate: number
  additionalConversions: number
  monthlyRevenueUplift: number
  annualRevenueUplift: number
  breakEvenMonths: number
  annualROI: number // as percentage
  roiMultiple: number
}

export interface ROICalculationResult {
  inputs: {
    industry: string
    monthlyRevenue: number
    monthlySessions: number
    currentConversionRate: number
    averageOrderValue: number
    projectCost: number
  }
  benchmark: IndustryBenchmark
  sanityCheck: {
    calculatedRevenue: number
    providedRevenue: number
    variance: number
    isValid: boolean
  }
  scenarios: ScenarioResult[]
}
