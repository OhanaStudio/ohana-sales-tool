"use client"

import { cn } from "@/lib/utils"

import React from "react"
import { useState } from "react"
import type { AuditResult } from "@/lib/types"
import { getMetricStatus, getScoreStatus } from "@/lib/metric-thresholds"
import { MetricTile } from "./metric-tile"
import { UXIndicatorsSection } from "./ux-indicators-section"
import { DesignIndicatorsSection } from "./design-indicators-section"
import { AccessibilitySection } from "./accessibility-section"
import { AdvancedUXSection } from "./advanced-ux-section"
import { SiteScreenshots } from "./site-screenshots"
import { ScoreDisplay } from "./score-display"
import type { RiskPill } from "./score-display"
import { PlatformInfoSection } from "./platform-info-section"
import { SectionToggle } from "./section-toggle"
import { RiskGroups } from "./risk-groups"
import { RecapSection } from "./recap-section"
import { PrintReport } from "./print-report"
import {
  Download,
  ArrowLeft,
  RefreshCw,
  ImageIcon,
  Paintbrush,
  Move,
  Clock,
  Gauge,
  Zap,
  Eye,
  ShieldCheck,
} from "lucide-react"
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

/** Count risk items across all indicator sections */
function countRisks(result: AuditResult) {
  let high = 0
  let moderate = 0

  // Risk cards
  const cards = [result.riskCards.visibility, result.riskCards.conversion, result.riskCards.trust]
  for (const c of cards) {
    if (c.level === "red") high += c.bullets.length
    else if (c.level === "amber") moderate += c.bullets.length
  }

  // Accessibility issues
  const a11y = result.accessibilityIndicators
  const a11yCount = a11y?.eaaIssues?.length ?? 0

  return { high, moderate, accessibility: a11yCount }
}


/** Wrapper: fades content when excluded, fully hidden in print.
 *  Toggle controls are rendered OUTSIDE the faded area so they stay at full opacity. */
function PrintSection({
  enabled,
  children,
  className = "",
  toggle,
}: {
  enabled: boolean
  children: React.ReactNode
  className?: string
  toggle?: React.ReactNode
}) {
  return (
    <div className={className}>
      {toggle && (
        <div className="no-print float-right ml-3 relative z-10">{toggle}</div>
      )}
      <div
        className={`transition-opacity duration-200 ${!enabled ? "no-print" : ""}`}
        style={{ opacity: enabled ? 1 : 0.35 }}
      >
        {children}
      </div>
    </div>
  )
}

export function ReportContent({ result }: { result: AuditResult }) {
  const [sections, setSections] = useState({
    platform: true,
    performance: true,
    ux: true,
    design: true,
    advancedUx: true,
    accessibility: true,
  })

  const toggle = (key: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const [rerunning, setRerunning] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleRerun = async () => {
    setRerunning(true)
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url }),
      })
      const data = await res.json()
      if (data.id) {
        window.location.href = `/report/${data.id}`
      }
    } catch {
      setRerunning(false)
    }
  }

  const risks = countRisks(result)
  const riskLabel = [
    risks.high > 0 ? `${risks.high} High Risks` : "",
    risks.moderate > 0 ? `${risks.moderate} Moderate Risks` : "",
  ].filter(Boolean).join(" | ")

  const pills: RiskPill[] = [
    { label: "High Risks", count: risks.high, variant: "red", scrollTo: "risk-red" },
    { label: "Moderate Risks", count: risks.moderate, variant: "amber", scrollTo: "risk-amber" },
    { label: "Accessibility Risks", count: risks.accessibility, variant: "blue", scrollTo: "risk-accessibility" },
  ].filter((p) => p.count > 0)

  return (
    <div className="min-h-screen bg-background">
      {/* ══════════════ PRINT REPORT (self-contained A4 pages) ══════════════ */}
      <PrintReport result={result} />

      {/* Top bar: Back + Download -- hidden in print */}
      <div className="no-print flex items-center justify-between px-5 md:px-8 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRerun}
            disabled={rerunning}
            aria-label="Re-run check"
            title="Re-run check"
            className="inline-flex items-center justify-center w-10 h-10 border border-border bg-transparent text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${rerunning ? "animate-spin" : ""}`} />
          </button>
          <Link
            href={`/print-preview/${result.id}`}
            aria-label="Print preview"
            title="Print preview"
            className="inline-flex items-center justify-center w-10 h-10 border border-border bg-transparent text-foreground hover:bg-muted transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            aria-label="Download PDF"
            title="Download PDF"
            className="inline-flex items-center justify-center w-10 h-10 bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-5 md:px-8 pb-12 no-print">
        {/* ──────────────────────────────────────────────
            HEADER: Logo + Title + URL/Date
        ────────────────────────────────────────────── */}
        <div className="pt-8 md:pt-12 pb-6 border-b border-border mb-8">
          <img
            src="/ohaha-logo.svg"
            alt="Ohana"
            className="h-7 w-auto mb-1"
          />
          <h1 className="font-serif text-4xl md:text-[5.25rem] md:leading-[1.1] text-foreground mb-4 text-balance">
            Website Health Check
          </h1>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{result.url}</span>
            <span>
              {formatDate(result.timestamp)}, {formatTime(result.timestamp)}
            </span>
          </div>
        </div>

        {/* ──────────────────────────────────────────────
            SCORE + SUMMARY + RISK PILLS
        ────────────────────────────────────────────── */}
        <div className="mb-10 print-break-avoid print-compact">
          <ScoreDisplay
            score={result.overallScore}
            summary={result.summaryText}
            pills={pills}
          />
        </div>

        {/* ──────────────────────────────────────────────
            SCREENSHOTS
        ────────────────────────────────────────────── */}
        <div className="mb-10 print-break-avoid print-compact">
          <SiteScreenshots
            url={result.url}
            desktopScreenshot={result.desktop.screenshot}
            mobileScreenshot={result.mobile.screenshot}
          />
        </div>

        {/* ──────────────────────────────────────────────
            RISK CARDS -- grouped by severity
        ────────────────────────────────────────────── */}
        <div className="mb-10 print-break-before print-compact">
          <RiskGroups result={result} />
        </div>

        {/* ──────────────────────────────────────────────
            RECOMMENDED NEXT STEPS (AI-generated)
        ────────────────────────────────────────────── */}
        <RecapSection result={result} />

        {/* ──────────────────────────────────────────────
            FULL HEALTH CHECK DETAILS DIVIDER
        ────────────────────────────────────────────── */}
        <div className="mt-4 mb-10 print-break-before">
          <h2 className="font-serif text-5xl md:text-6xl text-foreground mb-4 print:text-4xl">
            Full Health Check Details
          </h2>
          <div className="border-t border-border" />
        </div>

        {/* ──────────────────────────────────────────────
            PLATFORM
        ────────────────────────────────────────────── */}
        {result.platformInfo && (
          <PrintSection
            enabled={sections.platform}
            className="mb-10 print-break-avoid print-compact"
            toggle={<SectionToggle label="Platform" enabled={sections.platform} onToggle={() => toggle("platform")} />}
          >
            <PlatformInfoSection info={result.platformInfo} />
          </PrintSection>
        )}

        {/* ──────────────────────────────────────────────
            PERFORMANCE OVERVIEW
        ────────────────────────────────────────────── */}
        <PrintSection
          enabled={sections.performance}
          className="mb-10 print-break-before print-compact"
          toggle={<SectionToggle label="Performance" enabled={sections.performance} onToggle={() => toggle("performance")} />}
        >
          <h2 className="font-sans text-2xl font-bold text-foreground mb-2 print:text-xl">
            Performance overview
          </h2>
          <p className="text-sm text-muted-foreground italic mb-6 leading-relaxed">
            Key metrics from Google Lighthouse, measured for both mobile and
            desktop experiences.
          </p>
          {/* Row 1: 2 cards */}
          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              label="Largest Contentful Paint"
              icon={<ImageIcon className="h-4 w-4" />}
              mobileValue={formatMs(result.mobile.metrics.lcp)}
              desktopValue={formatMs(result.desktop.metrics.lcp)}
              unit={
                result.mobile.metrics.lcp && result.mobile.metrics.lcp >= 1000
                  ? "s"
                  : "ms"
              }
              mobileStatus={getMetricStatus("lcp", result.mobile.metrics.lcp)}
              desktopStatus={getMetricStatus("lcp", result.desktop.metrics.lcp)}
            />
            <MetricTile
              label="First Contentful Paint"
              icon={<Paintbrush className="h-4 w-4" />}
              mobileValue={formatMs(result.mobile.metrics.fcp)}
              desktopValue={formatMs(result.desktop.metrics.fcp)}
              unit={
                result.mobile.metrics.fcp && result.mobile.metrics.fcp >= 1000
                  ? "s"
                  : "ms"
              }
              mobileStatus={getMetricStatus("fcp", result.mobile.metrics.fcp)}
              desktopStatus={getMetricStatus("fcp", result.desktop.metrics.fcp)}
            />
          </div>
          {/* Row 2: 3 cards */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <MetricTile
              compact
              label="Cumulative Layout Shift"
              icon={<Move className="h-4 w-4" />}
              mobileValue={formatCls(result.mobile.metrics.cls)}
              desktopValue={formatCls(result.desktop.metrics.cls)}
              mobileStatus={getMetricStatus("cls", result.mobile.metrics.cls)}
              desktopStatus={getMetricStatus("cls", result.desktop.metrics.cls)}
            />
            <MetricTile
              compact
              label="Total Blocking Time"
              icon={<Clock className="h-4 w-4" />}
              mobileValue={formatMs(result.mobile.metrics.tbt)}
              desktopValue={formatMs(result.desktop.metrics.tbt)}
              unit="ms"
              mobileStatus={getMetricStatus("tbt", result.mobile.metrics.tbt)}
              desktopStatus={getMetricStatus("tbt", result.desktop.metrics.tbt)}
            />
            <MetricTile
              compact
              label="Speed Index"
              icon={<Gauge className="h-4 w-4" />}
              mobileValue={formatMs(result.mobile.metrics.speedIndex)}
              desktopValue={formatMs(result.desktop.metrics.speedIndex)}
              unit={
                result.mobile.metrics.speedIndex &&
                result.mobile.metrics.speedIndex >= 1000
                  ? "s"
                  : "ms"
              }
              mobileStatus={getMetricStatus(
                "speedIndex",
                result.mobile.metrics.speedIndex
              )}
              desktopStatus={getMetricStatus(
                "speedIndex",
                result.desktop.metrics.speedIndex
              )}
            />
          </div>
          {/* Row 3: 3 cards */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <MetricTile
              compact
              label="Performance Score"
              icon={<Zap className="h-4 w-4" />}
              mobileValue={String(result.mobile.performanceScore)}
              desktopValue={String(result.desktop.performanceScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.performanceScore)}
              desktopStatus={getScoreStatus(result.desktop.performanceScore)}
            />
            <MetricTile
              compact
              label="Accessibility"
              icon={<Eye className="h-4 w-4" />}
              mobileValue={String(result.mobile.accessibilityScore)}
              desktopValue={String(result.desktop.accessibilityScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.accessibilityScore)}
              desktopStatus={getScoreStatus(result.desktop.accessibilityScore)}
            />
            <MetricTile
              compact
              label="Best Practices"
              icon={<ShieldCheck className="h-4 w-4" />}
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
        </PrintSection>

        {/* ──────────────────────────────────────────────
            UX INDICATORS
        ────────────────────────────────────────────── */}
        <PrintSection
          enabled={sections.ux}
          className="mb-10 print-break-before print-compact"
          toggle={<SectionToggle label="UX Indicators" enabled={sections.ux} onToggle={() => toggle("ux")} />}
        >
          <UXIndicatorsSection indicators={result.uxIndicators} />
        </PrintSection>

        {/* ──────────────────────────────────────────────
            DESIGN INDICATORS
        ────────────────────────────────────────────── */}
        {result.designIndicators && (
          <PrintSection
            enabled={sections.design}
            className="mb-10 print-break-before print-compact"
            toggle={<SectionToggle label="Design" enabled={sections.design} onToggle={() => toggle("design")} />}
          >
            <DesignIndicatorsSection indicators={result.designIndicators} />
          </PrintSection>
        )}

        {/* ──────────────────────────────────────────────
            UX FRICTION
        ────────────────────────────────────────────── */}
        {result.advancedUX && (
          <PrintSection
            enabled={sections.advancedUx}
            className="mb-10 print-break-before print-compact"
            toggle={<SectionToggle label="UX Friction" enabled={sections.advancedUx} onToggle={() => toggle("advancedUx")} />}
          >
            <AdvancedUXSection indicators={result.advancedUX} />
          </PrintSection>
        )}

        {/* ──────────────────────────────────────────────
            ACCESSIBILITY
        ────────────────────────────────────────────── */}
        {result.accessibilityIndicators && (
          <div id="risk-accessibility">
            <PrintSection
              enabled={sections.accessibility}
              className="mb-10 print-break-before print-compact"
              toggle={<SectionToggle label="Accessibility" enabled={sections.accessibility} onToggle={() => toggle("accessibility")} />}
            >
              <AccessibilitySection indicators={result.accessibilityIndicators} />
            </PrintSection>
          </div>
        )}

        {/* ──────────────────────────────────────────────
            FOOTER (web only)
        ────────────────────────────────────────────── */}
        <div className="border-t border-border pt-6 pb-8 no-print">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground text-center flex-1">
              High-level diagnostic, not a full audit. Generated by Ohana
              Website Health Check.
            </p>
          </div>
        </div>
      </div>

      
    </div>
  )
}
