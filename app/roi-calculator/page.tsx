"use client"

import { useState } from "react"
import { TopBar } from "@/components/top-bar"
import { calculateROI, formatCurrency, formatPercent, formatNumber } from "@/lib/roi-calculations"
import { INDUSTRY_OPTIONS } from "@/lib/roi-benchmarks"
import type { ROIInputs, ROICalculationResult } from "@/lib/roi-types"
import { TrendingUp, Calculator, AlertCircle } from "lucide-react"

export default function ROICalculatorPage() {
  const [inputs, setInputs] = useState<ROIInputs>({
    industry: "retail-general",
  })
  const [result, setResult] = useState<ROICalculationResult | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleCalculate = () => {
    const calculatedResult = calculateROI(inputs)
    setResult(calculatedResult)
  }

  const handleInputChange = (field: keyof ROIInputs, value: string | number) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="px-5 md:px-8 max-w-5xl mx-auto pb-20">
        <div className="pt-8 md:pt-12 pb-8">
          <h1 className="font-serif text-4xl md:text-[5.25rem] md:leading-[1.1] text-foreground text-balance">
            ROI Calculator.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Estimate the potential return on investment from UX improvements. Enter your site data or use industry
            benchmarks to see three scenarios.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-medium text-foreground">Calculator Inputs</h2>
          </div>

          {/* Industry Selector */}
          <div className="mb-6">
            <label htmlFor="industry" className="block text-sm font-medium text-foreground mb-2">
              Select Your Industry
            </label>
            <select
              id="industry"
              value={inputs.industry}
              onChange={(e) => handleInputChange("industry", e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
            >
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              We'll use industry benchmarks unless you provide your own data below.
            </p>
          </div>

          {/* Project Cost - Always Visible */}
          <div className="mb-6">
            <label htmlFor="projectCost" className="block text-sm font-medium text-foreground mb-2">
              Project starts from (£)
            </label>
            <input
              id="projectCost"
              type="number"
              placeholder="e.g., 15000"
              value={inputs.projectCost || ""}
              onChange={(e) => handleInputChange("projectCost", parseFloat(e.target.value) || undefined)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the estimated project cost to calculate ROI and break-even timeline.
            </p>
          </div>

          {/* Toggle Advanced Inputs */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-foreground hover:text-foreground/80 underline mb-4"
          >
            {showAdvanced ? "Hide" : "Show"} advanced inputs (optional)
          </button>

          {/* Advanced Inputs */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
              <div>
                <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-foreground mb-2">
                  Monthly Revenue (£)
                </label>
                <input
                  id="monthlyRevenue"
                  type="number"
                  placeholder="e.g., 50000"
                  value={inputs.monthlyRevenue || ""}
                  onChange={(e) => handleInputChange("monthlyRevenue", parseFloat(e.target.value) || undefined)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="monthlySessions" className="block text-sm font-medium text-foreground mb-2">
                  Monthly Sessions
                </label>
                <input
                  id="monthlySessions"
                  type="number"
                  placeholder="e.g., 100000"
                  value={inputs.monthlySessions || ""}
                  onChange={(e) => handleInputChange("monthlySessions", parseFloat(e.target.value) || undefined)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="currentConversionRate" className="block text-sm font-medium text-foreground mb-2">
                  Current Conversion Rate (%)
                </label>
                <input
                  id="currentConversionRate"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2.3"
                  value={inputs.currentConversionRate ? inputs.currentConversionRate * 100 : ""}
                  onChange={(e) =>
                    handleInputChange("currentConversionRate", parseFloat(e.target.value) / 100 || undefined)
                  }
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="averageOrderValue" className="block text-sm font-medium text-foreground mb-2">
                  Average Order Value (£)
                </label>
                <input
                  id="averageOrderValue"
                  type="number"
                  placeholder="e.g., 95"
                  value={inputs.averageOrderValue || ""}
                  onChange={(e) => handleInputChange("averageOrderValue", parseFloat(e.target.value) || undefined)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleCalculate}
            className="w-full md:w-auto px-8 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Calculate ROI
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Sanity Check Warning */}
            {!result.sanityCheck.isValid && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Data Inconsistency</p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                    Your revenue ({formatCurrency(result.sanityCheck.providedRevenue)}) doesn't match the calculated
                    revenue from sessions × CR × AOV ({formatCurrency(result.sanityCheck.calculatedRevenue)}). Results
                    may be inaccurate.
                  </p>
                </div>
              </div>
            )}

            {/* Assumptions */}
            <div className="bg-muted/30 border border-border rounded-lg p-6 mb-8">
              <h3 className="text-sm font-medium text-foreground mb-4">Calculation Assumptions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Industry</p>
                  <p className="font-medium text-foreground">{result.inputs.industry}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Sessions</p>
                  <p className="font-medium text-foreground">{formatNumber(result.inputs.monthlySessions)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Conversion Rate</p>
                  <p className="font-medium text-foreground">
                    {formatPercent(result.inputs.currentConversionRate, 2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Average Order Value</p>
                  <p className="font-medium text-foreground">{formatCurrency(result.inputs.averageOrderValue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Project Cost</p>
                  <p className="font-medium text-foreground">{formatCurrency(result.inputs.projectCost)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gross Margin</p>
                  <p className="font-medium text-foreground">{formatPercent(result.benchmark.grossMargin, 0)}</p>
                </div>
              </div>
            </div>

            {/* Scenarios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.scenarios.map((scenario) => (
                <div
                  key={scenario.scenario}
                  className="bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-colors"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-foreground">{scenario.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      +{formatPercent(scenario.crImprovement, 1)} CR improvement
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Revenue Uplift</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {formatCurrency(scenario.monthlyRevenueUplift)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Annual Revenue Uplift</p>
                      <p className="text-lg font-medium text-foreground">
                        {formatCurrency(scenario.annualRevenueUplift)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Break-even Timeline</p>
                      <p className="text-sm font-medium text-foreground">
                        {scenario.breakEvenMonths < 12
                          ? `${scenario.breakEvenMonths.toFixed(1)} months`
                          : `${(scenario.breakEvenMonths / 12).toFixed(1)} years`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">First Year ROI</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {scenario.annualROI > 0 ? "+" : ""}
                        {new Intl.NumberFormat("en-GB", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(scenario.annualROI)}
                        %
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ROI Multiple</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Intl.NumberFormat("en-GB", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }).format(scenario.roiMultiple)}
                        x
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Methodology Note */}
            <div className="mt-8 p-6 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-2">Methodology</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculations assume conservative CR improvements based on industry research: +0.3% (conservative), +0.5%
                (moderate), and +1.0% (optimistic). Revenue uplift is calculated as additional conversions × AOV ×
                gross margin × (1 - return rate). Break-even and ROI figures account for net profit margins specific to
                your industry.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
