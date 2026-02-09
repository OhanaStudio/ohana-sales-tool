"use client"

import type { AuditResult } from "@/lib/types"
import { getMetricStatus, getScoreStatus } from "@/lib/metric-thresholds"
import { ScoreDisplay } from "./score-display"
import { RiskCard } from "./risk-card"
import { MetricTile } from "./metric-tile"
import { UXIndicatorsSection } from "./ux-indicators-section"
import { DesignIndicatorsSection } from "./design-indicators-section"
import { AccessibilitySection } from "./accessibility-section"
import { AdvancedUXSection } from "./advanced-ux-section"
import { FileText, Link2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function formatMs(val: number | null): string | null {
  if (val === null) return null
  if (val < 1000) return `${Math.round(val)}`
  return `${(val / 1000).toFixed(1)}`
}

function formatCls(val: number | null): string | null {
  if (val === null) return null
  return val.toFixed(3)
}

export function ResultsDashboard({ result }: { result: AuditResult }) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/report/${result.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-10 md:space-y-12">
      <div>
        <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-2 text-balance">
          Results.
        </h2>
        <p className="text-xs text-muted-foreground mb-6">{result.url}</p>
        <ScoreDisplay score={result.overallScore} summary={result.summaryText} />
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href={`/report/${result.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
          >
            <FileText className="h-4 w-4" />
            View full report
          </Link>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card text-card-foreground px-5 py-3 text-sm font-medium hover:bg-accent transition-colors min-h-[44px]"
          >
            <Link2 className="h-4 w-4" />
            {copied ? "Copied" : "Copy share link"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-serif text-xl text-foreground mb-4">Risk overview</h3>
        <div className="flex flex-col gap-4">
          <RiskCard card={result.riskCards.visibility} />
          <RiskCard card={result.riskCards.conversion} />
          <RiskCard card={result.riskCards.trust} />
        </div>
      </div>

      <div>
        <h3 className="font-serif text-xl text-foreground mb-4">Performance metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricTile
            label="LCP"
            mobileValue={formatMs(result.mobile.metrics.lcp)}
            desktopValue={formatMs(result.desktop.metrics.lcp)}
            unit={result.mobile.metrics.lcp && result.mobile.metrics.lcp >= 1000 ? "s" : "ms"}
            mobileStatus={getMetricStatus("lcp", result.mobile.metrics.lcp)}
            desktopStatus={getMetricStatus("lcp", result.desktop.metrics.lcp)}
          />
          <MetricTile
            label="FCP"
            mobileValue={formatMs(result.mobile.metrics.fcp)}
            desktopValue={formatMs(result.desktop.metrics.fcp)}
            unit={result.mobile.metrics.fcp && result.mobile.metrics.fcp >= 1000 ? "s" : "ms"}
            mobileStatus={getMetricStatus("fcp", result.mobile.metrics.fcp)}
            desktopStatus={getMetricStatus("fcp", result.desktop.metrics.fcp)}
          />
          <MetricTile
            label="CLS"
            mobileValue={formatCls(result.mobile.metrics.cls)}
            desktopValue={formatCls(result.desktop.metrics.cls)}
            mobileStatus={getMetricStatus("cls", result.mobile.metrics.cls)}
            desktopStatus={getMetricStatus("cls", result.desktop.metrics.cls)}
          />
          <MetricTile
            label="TBT"
            mobileValue={formatMs(result.mobile.metrics.tbt)}
            desktopValue={formatMs(result.desktop.metrics.tbt)}
            unit="ms"
            mobileStatus={getMetricStatus("tbt", result.mobile.metrics.tbt)}
            desktopStatus={getMetricStatus("tbt", result.desktop.metrics.tbt)}
          />
          <MetricTile
            label="Speed Index"
            mobileValue={formatMs(result.mobile.metrics.speedIndex)}
            desktopValue={formatMs(result.desktop.metrics.speedIndex)}
            unit={result.mobile.metrics.speedIndex && result.mobile.metrics.speedIndex >= 1000 ? "s" : "ms"}
            mobileStatus={getMetricStatus("speedIndex", result.mobile.metrics.speedIndex)}
            desktopStatus={getMetricStatus("speedIndex", result.desktop.metrics.speedIndex)}
          />
          <MetricTile
            label="Performance"
            mobileValue={String(result.mobile.performanceScore)}
            desktopValue={String(result.desktop.performanceScore)}
            mobileStatus={getScoreStatus(result.mobile.performanceScore)}
            desktopStatus={getScoreStatus(result.desktop.performanceScore)}
          />
        </div>
        {result.mobile.notes.length > 0 && (
          <p className="text-xs text-muted-foreground/60 mt-3 italic">
            {result.mobile.notes[0]}
          </p>
        )}
      </div>

      <UXIndicatorsSection indicators={result.uxIndicators} />

      {result.designIndicators && (
        <DesignIndicatorsSection indicators={result.designIndicators} />
      )}

      {result.advancedUX && (
        <AdvancedUXSection indicators={result.advancedUX} />
      )}

      {result.accessibilityIndicators && (
        <AccessibilitySection indicators={result.accessibilityIndicators} />
      )}

      <div>
        <h3 className="font-serif text-xl text-foreground mb-4">Summary</h3>
        <div className="space-y-4 rounded-lg border border-border bg-card p-5 md:p-6">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">What we found</p>
            <p className="text-sm text-card-foreground leading-relaxed">{result.salesTalkTrack.whatWeFound}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Why it matters</p>
            <p className="text-sm text-card-foreground leading-relaxed">{result.salesTalkTrack.whyItMatters}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Suggested next step</p>
            <p className="text-sm text-card-foreground leading-relaxed">{result.salesTalkTrack.suggestedNextStep}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/50 text-center pb-8">
        High-level diagnostic, not a full audit.
      </p>
    </div>
  )
}
