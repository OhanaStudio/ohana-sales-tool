"use client"

import React from "react"
import { useState } from "react"
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
import type { RiskPill } from "./score-display"
import { PlatformInfoSection } from "./platform-info-section"
import { SectionToggle } from "./section-toggle"
import {
  Download,
  ArrowLeft,
  ImageIcon,
  Paintbrush,
  Move,
  Clock,
  Gauge,
  Zap,
  Eye,
  Search,
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
      {toggle && <div className="no-print">{toggle}</div>}
      <div
        className={`transition-opacity duration-200 ${!enabled ? "no-print" : ""}`}
        style={{ opacity: enabled ? 1 : 0.15 }}
      >
        {children}
      </div>
    </div>
  )
}

export function ReportContent({ result }: { result: AuditResult }) {
  const [sections, setSections] = useState({
    score: true,
    screenshots: true,
    riskCards: true,
    platform: true,
    performance: true,
    ux: true,
    design: true,
    advancedUx: true,
    accessibility: true,
    nextStep: true,
  })

  const toggle = (key: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const handlePrint = () => {
    window.print()
  }

  const risks = countRisks(result)
  const pills: RiskPill[] = [
    { label: "High Risks", count: risks.high, variant: "red" },
    { label: "Moderate Risks", count: risks.moderate, variant: "amber" },
    { label: "Accessibility Risks", count: risks.accessibility, variant: "filled-red" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar: Back + Download -- hidden in print */}
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

      <div className="max-w-3xl mx-auto px-5 md:px-8 pb-12 print:px-0 print:max-w-none">
        {/* ──────────────────────────────────────────────
            HEADER: Logo + Title + URL/Date
        ────────────────────────────────────────────── */}
        <div className="pt-8 md:pt-12 pb-6 border-b border-border mb-8 print:pt-4 print:pb-4 print:mb-6 print-break-avoid">
          <img
            src="/ohaha-logo.svg"
            alt="Ohana"
            className="h-7 w-auto mb-1 print:h-6"
          />
          <h1 className="font-serif text-4xl md:text-[5.25rem] md:leading-[1.1] text-foreground mb-4 text-balance print:text-4xl print:leading-tight print:mb-3">
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
        <PrintSection
          enabled={sections.score}
          className="mb-10 print-break-avoid print-compact"
          toggle={
            <div className="flex items-center justify-end mb-3">
              <SectionToggle
                label="Score"
                enabled={sections.score}
                onToggle={() => toggle("score")}
              />
            </div>
          }
        >
          <ScoreDisplay
            score={result.overallScore}
            summary={result.summaryText}
            pills={pills}
          />
        </PrintSection>

        {/* ──────────────────────────────────────────────
            SCREENSHOTS
        ────────────────────────────────────────────── */}
        <PrintSection
          enabled={sections.screenshots}
          className="mb-10 print-break-avoid print-compact"
          toggle={
            <div className="flex items-center justify-end mb-3">
              <SectionToggle
                label="Screenshots"
                enabled={sections.screenshots}
                onToggle={() => toggle("screenshots")}
              />
            </div>
          }
        >
          <SiteScreenshots
            url={result.url}
            desktopScreenshot={result.desktop.screenshot}
            mobileScreenshot={result.mobile.screenshot}
          />
        </PrintSection>

        {/* ──────────────────────────────────────────────
            RISK CARDS
        ────────────────────────────────────────────── */}
        <PrintSection
          enabled={sections.riskCards}
          className="mb-10 print-break-before print-compact"
          toggle={
            <div className="flex items-center justify-end mb-3">
              <SectionToggle
                label="Risk cards"
                enabled={sections.riskCards}
                onToggle={() => toggle("riskCards")}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <RiskCard card={result.riskCards.visibility} variant="featured" />
            <RiskCard card={result.riskCards.conversion} variant="featured" />
            <RiskCard card={result.riskCards.trust} variant="featured" />
          </div>
        </PrintSection>

        {/* ──────────────────────────────────────────────
            PLATFORM
        ────────────────────────────────────────────── */}
        {result.platformInfo && (
          <PrintSection
            enabled={sections.platform}
            className="mb-10 print-break-avoid print-compact"
            toggle={
              <div className="flex items-center justify-end mb-3">
                <SectionToggle
                  label="Platform"
                  enabled={sections.platform}
                  onToggle={() => toggle("platform")}
                />
              </div>
            }
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
          toggle={
            <div className="flex items-center justify-end mb-3">
              <SectionToggle
                label="Performance"
                enabled={sections.performance}
                onToggle={() => toggle("performance")}
              />
            </div>
          }
        >
          <h2 className="font-sans text-2xl text-foreground mb-2 print:text-xl">
            Performance overview
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-lg">
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
              label="Cumulative Layout Shift"
              icon={<Move className="h-4 w-4" />}
              mobileValue={formatCls(result.mobile.metrics.cls)}
              desktopValue={formatCls(result.desktop.metrics.cls)}
              mobileStatus={getMetricStatus("cls", result.mobile.metrics.cls)}
              desktopStatus={getMetricStatus("cls", result.desktop.metrics.cls)}
            />
            <MetricTile
              label="Total Blocking Time"
              icon={<Clock className="h-4 w-4" />}
              mobileValue={formatMs(result.mobile.metrics.tbt)}
              desktopValue={formatMs(result.desktop.metrics.tbt)}
              unit="ms"
              mobileStatus={getMetricStatus("tbt", result.mobile.metrics.tbt)}
              desktopStatus={getMetricStatus("tbt", result.desktop.metrics.tbt)}
            />
            <MetricTile
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
          {/* Row 3: 2 cards */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MetricTile
              label="Performance"
              icon={<Zap className="h-4 w-4" />}
              mobileValue={String(result.mobile.performanceScore)}
              desktopValue={String(result.desktop.performanceScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.performanceScore)}
              desktopStatus={getScoreStatus(result.desktop.performanceScore)}
            />
            <MetricTile
              label="Accessibility"
              icon={<Eye className="h-4 w-4" />}
              mobileValue={String(result.mobile.accessibilityScore)}
              desktopValue={String(result.desktop.accessibilityScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.accessibilityScore)}
              desktopStatus={getScoreStatus(result.desktop.accessibilityScore)}
            />
          </div>
          {/* Row 4: 2 cards */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MetricTile
              label="SEO"
              icon={<Search className="h-4 w-4" />}
              mobileValue={String(result.mobile.seoScore)}
              desktopValue={String(result.desktop.seoScore)}
              maxScore={100}
              mobileStatus={getScoreStatus(result.mobile.seoScore)}
              desktopStatus={getScoreStatus(result.desktop.seoScore)}
            />
            <MetricTile
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
          toggle={
            <div className="flex items-center justify-end mb-3">
              <SectionToggle
                label="UX Indicators"
                enabled={sections.ux}
                onToggle={() => toggle("ux")}
              />
            </div>
          }
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
            toggle={
              <div className="flex items-center justify-end mb-3">
                <SectionToggle
                  label="Design"
                  enabled={sections.design}
                  onToggle={() => toggle("design")}
                />
              </div>
            }
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
            toggle={
              <div className="flex items-center justify-end mb-3">
                <SectionToggle
                  label="UX Friction"
                  enabled={sections.advancedUx}
                  onToggle={() => toggle("advancedUx")}
                />
              </div>
            }
          >
            <AdvancedUXSection indicators={result.advancedUX} />
          </PrintSection>
        )}

        {/* ──────────────────────────────────────────────
            ACCESSIBILITY
        ────────────────────────────────────────────── */}
        {result.accessibilityIndicators && (
          <PrintSection
            enabled={sections.accessibility}
            className="mb-10 print-break-before print-compact"
            toggle={
              <div className="flex items-center justify-end mb-3">
                <SectionToggle
                  label="Accessibility"
                  enabled={sections.accessibility}
                  onToggle={() => toggle("accessibility")}
                />
              </div>
            }
          >
            <AccessibilitySection
              indicators={result.accessibilityIndicators}
            />
          </PrintSection>
        )}

        {/* ──────────────────────────────────────────────
            RECOMMENDED NEXT STEP
        ────────────────────────────────────────────── */}
        <PrintSection
          enabled={sections.nextStep}
          className="mb-10 print-break-before print-compact"
          toggle={
            <div className="flex items-center justify-end mb-3">
              <SectionToggle
                label="Next step"
                enabled={sections.nextStep}
                onToggle={() => toggle("nextStep")}
              />
            </div>
          }
        >
          <h2 className="font-sans text-2xl text-foreground mb-4 print:text-xl">
            Recommended next step
          </h2>
          <div className="rounded-lg border-2 border-border bg-card p-6 md:p-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  What we found
                </p>
                <p className="text-sm text-card-foreground leading-relaxed">
                  {result.salesTalkTrack.whatWeFound}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Why it matters
                </p>
                <p className="text-sm text-card-foreground leading-relaxed">
                  {result.salesTalkTrack.whyItMatters}
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="font-sans text-lg text-card-foreground mb-2">
                  Book a clarity review
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.salesTalkTrack.suggestedNextStep}
                </p>
              </div>
            </div>
          </div>
        </PrintSection>

        {/* ──────────────────────────────────────────────
            FOOTER
        ────────────────────────────────────────────── */}
        <div className="border-t border-border pt-6 pb-8 print:pt-4 print:pb-4 print:mt-8">
          <div className="flex items-center justify-between">
            <img
              src="/ohaha-logo.svg"
              alt="Ohana"
              className="h-5 w-auto hidden print:block opacity-50"
            />
            <p className="text-xs text-muted-foreground text-center print:text-right flex-1">
              High-level diagnostic, not a full audit. Generated by Ohana
              Website Health Check.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
