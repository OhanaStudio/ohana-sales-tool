"use client"

import type { AuditResult } from "@/lib/types"
import { getMetricStatus, getScoreStatus } from "@/lib/metric-thresholds"
import { RiskCard } from "./risk-card"
import { MetricTile } from "./metric-tile"
import { UXIndicatorsSection } from "./ux-indicators-section"
import { DesignIndicatorsSection } from "./design-indicators-section"
import { AccessibilitySection } from "./accessibility-section"
import { AdvancedUXSection } from "./advanced-ux-section"
import { SiteScreenshots } from "./site-screenshots"
import { ScoreDisplay } from "./score-display"
import { PlatformInfoSection } from "./platform-info-section"
import { Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

function formatMs(val: number | null): string | null {
  if (val === null) return null
  if (val < 1000) return `${Math.round(val)}`
  return `${(val / 1000).toFixed(1)}`
}

function formatCls(val: number | null): string | null {
  if (val === null) return null
  return val.toFixed(3)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ReportContent({ result }: { result: AuditResult }) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print flex items-center justify-between px-5 md:px-8 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-5 md:px-8 pb-12">
        <div className="pt-8 md:pt-12 pb-8 border-b border-border mb-8">
          <img src="/ohaha-logo.svg" alt="Ohana" className="h-7 w-auto mb-1" />
          <h1 className="font-serif text-4xl md:text-[5.25rem] md:leading-[1.1] text-foreground mb-4 text-balance">
            Website Health Check
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>{result.url}</span>
            <span>{formatDate(result.timestamp)}, {formatTime(result.timestamp)}</span>
          </div>
        </div>

          {result.platformInfo && (
            <div className="mb-10 print:break-inside-avoid">
              <PlatformInfoSection info={result.platformInfo} />
            </div>
          )}

          <div className="mb-10 print:break-inside-avoid">
            <SiteScreenshots
            url={result.url}
            desktopScreenshot={result.desktop.screenshot}
            mobileScreenshot={result.mobile.screenshot}
          />
        </div>

        <div className="mb-10 print:break-inside-avoid">
          <h2 className="font-sans text-2xl text-foreground mb-6">Executive summary</h2>
          <ScoreDisplay score={result.overallScore} summary={result.summaryText} />
          <div className="flex flex-col gap-4 mt-8">
            <RiskCard card={result.riskCards.visibility} variant="featured" />
            <RiskCard card={result.riskCards.conversion} variant="featured" />
            <RiskCard card={result.riskCards.trust} variant="featured" />
          </div>
        </div>

        <div className="mb-10 print:break-inside-avoid">
          <h2 className="font-sans text-2xl text-foreground mb-4">Performance overview</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-lg">
            Key metrics from Google Lighthouse, measured for both mobile and desktop experiences.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricTile
              label="Largest Contentful Paint"
              mobileValue={formatMs(result.mobile.metrics.lcp)}
              desktopValue={formatMs(result.desktop.metrics.lcp)}
              unit={result.mobile.metrics.lcp && result.mobile.metrics.lcp >= 1000 ? "s" : "ms"}
              mobileStatus={getMetricStatus("lcp", result.mobile.metrics.lcp)}
              desktopStatus={getMetricStatus("lcp", result.desktop.metrics.lcp)}
            />
            <MetricTile
              label="First Contentful Paint"
              mobileValue={formatMs(result.mobile.metrics.fcp)}
              desktopValue={formatMs(result.desktop.metrics.fcp)}
              unit={result.mobile.metrics.fcp && result.mobile.metrics.fcp >= 1000 ? "s" : "ms"}
              mobileStatus={getMetricStatus("fcp", result.mobile.metrics.fcp)}
              desktopStatus={getMetricStatus("fcp", result.desktop.metrics.fcp)}
            />
            <MetricTile
              label="Cumulative Layout Shift"
              mobileValue={formatCls(result.mobile.metrics.cls)}
              desktopValue={formatCls(result.desktop.metrics.cls)}
              mobileStatus={getMetricStatus("cls", result.mobile.metrics.cls)}
              desktopStatus={getMetricStatus("cls", result.desktop.metrics.cls)}
            />
            <MetricTile
              label="Total Blocking Time"
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
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <MetricTile
              label="Performance"
              mobileValue={String(result.mobile.performanceScore)}
              desktopValue={String(result.desktop.performanceScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.performanceScore)}
              desktopStatus={getScoreStatus(result.desktop.performanceScore)}
            />
            <MetricTile
              label="Accessibility"
              mobileValue={String(result.mobile.accessibilityScore)}
              desktopValue={String(result.desktop.accessibilityScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.accessibilityScore)}
              desktopStatus={getScoreStatus(result.desktop.accessibilityScore)}
            />
            <MetricTile
              label="SEO"
              mobileValue={String(result.mobile.seoScore)}
              desktopValue={String(result.desktop.seoScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.seoScore)}
              desktopStatus={getScoreStatus(result.desktop.seoScore)}
            />
            <MetricTile
              label="Best Practices"
              mobileValue={String(result.mobile.bestPracticesScore)}
              desktopValue={String(result.desktop.bestPracticesScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.bestPracticesScore)}
              desktopStatus={getScoreStatus(result.desktop.bestPracticesScore)}
            />
          </div>

          {result.mobile.notes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 italic">
              {result.mobile.notes[0]}
            </p>
          )}
        </div>

        <div className="mb-10 print:break-inside-avoid">
          <UXIndicatorsSection indicators={result.uxIndicators} />
        </div>

        {result.designIndicators && (
          <div className="mb-10 print:break-inside-avoid">
            <DesignIndicatorsSection indicators={result.designIndicators} />
          </div>
        )}

        {result.advancedUX && (
          <div className="mb-10 print:break-inside-avoid">
            <AdvancedUXSection indicators={result.advancedUX} />
          </div>
        )}

        {result.accessibilityIndicators && (
          <div className="mb-10 print:break-inside-avoid">
            <AccessibilitySection indicators={result.accessibilityIndicators} />
          </div>
        )}

        <div className="mb-10 print:break-inside-avoid">
          <h2 className="font-sans text-2xl text-foreground mb-4">Recommended next step</h2>
          <div className="rounded-lg border-2 border-border bg-card p-6 md:p-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">What we found</p>
                <p className="text-sm text-card-foreground leading-relaxed">{result.salesTalkTrack.whatWeFound}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Why it matters</p>
                <p className="text-sm text-card-foreground leading-relaxed">{result.salesTalkTrack.whyItMatters}</p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="font-sans text-lg text-card-foreground mb-2">Book a clarity review</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.salesTalkTrack.suggestedNextStep}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 pb-8">
          <p className="text-xs text-muted-foreground text-center">
            High-level diagnostic, not a full audit. Generated by Ohana Website Health Check.
          </p>
        </div>
      </div>
    </div>
  )
}
