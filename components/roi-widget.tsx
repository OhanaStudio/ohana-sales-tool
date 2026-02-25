"use client"

import { useState } from "react"
import { INDUSTRY_BENCHMARKS, INDUSTRY_OPTIONS } from "@/lib/roi-benchmarks"
import { calculateROI } from "@/lib/roi-calculations"
import type { ROIInputs, ROICalculationResult } from "@/lib/roi-types"

interface ROIWidgetProps {
  reportId: string
  existingROI?: ROICalculationResult
  onSave?: (roiData: ROICalculationResult) => void
}

export function ROIWidget({ reportId, existingROI, onSave }: ROIWidgetProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inputs, setInputs] = useState<ROIInputs>(() => 
    existingROI?.inputs || {
      industry: "ecommerce",
      monthlySessions: 50000,
      currentConversionRate: 0.02,
      averageOrderValue: 95,
      projectCost: 10000,
    }
  )

  const result = calculateROI(inputs)

  const handleInputChange = (field: keyof ROIInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/report/${reportId}/roi`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      })

      if (res.ok) {
        onSave?.(result)
      }
    } catch (error) {
      console.error("[v0] Failed to save ROI:", error)
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-GB").format(Math.round(n))
  const fmtPct = (n: number, dec = 1) => 
    new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(n)

  return (
    <div>
      {/* Header - matching Platform detection style */}
      <h3 className="font-sans text-2xl font-bold text-foreground mb-2">
        Calculate Potential ROI
      </h3>
      <p className="text-sm text-muted-foreground italic mb-5">
        Add ROI projections to this report.
      </p>

      {/* Content */}
      <div className="space-y-4">
        {/* Industry Selector */}
        <div>
          <label htmlFor="roi-industry" className="block text-sm font-medium text-foreground mb-2">
            Select Your Industry
          </label>
          <select
            id="roi-industry"
            value={inputs.industry}
            onChange={(e) => handleInputChange("industry", e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
          >
            {INDUSTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Project Cost - Always Visible */}
        <div>
          <label htmlFor="roi-projectCost" className="block text-sm font-medium text-foreground mb-2">
            Project starts from ({"\u00A3"})
          </label>
          <input
            id="roi-projectCost"
            type="number"
            placeholder="e.g., 15000"
            value={inputs.projectCost || ""}
            onChange={(e) => handleInputChange("projectCost", parseFloat(e.target.value) || undefined)}
            className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
          />
        </div>

        {/* Toggle Advanced Inputs */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-foreground hover:text-foreground/80 underline min-h-[44px]"
        >
          {showAdvanced ? "Hide" : "Show"} advanced inputs (optional)
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roi-sessions" className="block text-sm font-medium text-foreground mb-2">
                  Monthly Sessions
                </label>
                <input
                  id="roi-sessions"
                  type="number"
                  placeholder={`e.g., ${INDUSTRY_BENCHMARKS[inputs.industry].monthlySessions}`}
                  value={inputs.monthlySessions || ""}
                  onChange={(e) => handleInputChange("monthlySessions", parseFloat(e.target.value) || undefined)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="roi-cr" className="block text-sm font-medium text-foreground mb-2">
                  Current Conversion Rate (%)
                </label>
                <input
                  id="roi-cr"
                  type="number"
                  step="0.01"
                  placeholder={`e.g., ${(INDUSTRY_BENCHMARKS[inputs.industry].conversionRate * 100).toFixed(2)}`}
                  value={inputs.currentConversionRate ? (inputs.currentConversionRate * 100).toFixed(2) : ""}
                  onChange={(e) => handleInputChange("currentConversionRate", (parseFloat(e.target.value) || 0) / 100)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="roi-aov" className="block text-sm font-medium text-foreground mb-2">
                  Average Order Value ({"\u00A3"})
                </label>
                <input
                  id="roi-aov"
                  type="number"
                  placeholder={`e.g., ${INDUSTRY_BENCHMARKS[inputs.industry].averageOrderValue}`}
                  value={inputs.averageOrderValue || ""}
                  onChange={(e) => handleInputChange("averageOrderValue", parseFloat(e.target.value) || undefined)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Calculation Assumptions */}
        <div className="bg-muted/30 border border-border rounded-lg p-4 mt-2">
          <h4 className="text-sm font-semibold text-foreground mb-3">Calculation Assumptions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Industry</p>
              <p className="text-foreground font-medium">
                {INDUSTRY_OPTIONS.find(opt => opt.value === inputs.industry)?.label || inputs.industry}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Monthly Sessions</p>
              <p className="text-foreground font-medium">{fmt(result.inputs.monthlySessions)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Conversion Rate</p>
              <p className="text-foreground font-medium">{fmtPct(result.inputs.currentConversionRate * 100, 2)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Average Order Value</p>
              <p className="text-foreground font-medium">{"\u00A3"}{fmt(result.inputs.averageOrderValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Project Cost</p>
              <p className="text-foreground font-medium">{"\u00A3"}{fmt(result.inputs.projectCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gross Margin</p>
              <p className="text-foreground font-medium">{fmtPct(result.benchmark.grossMargin * 100, 0)}%</p>
            </div>
          </div>
        </div>

        {/* Results Preview - Three Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.scenarios.map((scenario) => (
            <div key={scenario.scenario} className="bg-foreground rounded-lg p-4">
              <h4 className="text-sm font-semibold text-background mb-1">{scenario.label}</h4>
              <p className="text-xs text-background/50 mb-3">
                +{fmtPct(scenario.crImprovement * 100, 1)}% CR improvement
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-background/50">First Year ROI</p>
                  <p className="text-lg font-semibold text-green-400">
                    +{fmtPct(scenario.annualROI, 0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-background/50">Break-even</p>
                  <p className="text-sm font-medium text-background">
                    {scenario.breakEvenMonths.toFixed(1)} months
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Methodology */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Methodology</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Calculations assume conservative CR improvements based on industry research: +0.3% (conservative), +0.5% (moderate), 
            and +1.0% (optimistic). Revenue uplift is calculated as additional conversions {"\u00D7"} AOV {"\u00D7"} gross margin {"\u00D7"} (1 - return rate). 
            Break-even and ROI figures account for net profit margins specific to your industry.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-50"
          >
            {saving ? "Saving..." : existingROI ? "Update ROI" : "Save to Report"}
          </button>
        </div>
      </div>
    </div>
  )
}
