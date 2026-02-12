"use client"

import React from "react"

import type { AuditResult, RiskCard, RiskLevel } from "@/lib/types"
import { getMetricStatus, getScoreStatus } from "@/lib/metric-thresholds"
import { ImageIcon, Paintbrush, Move, Clock, Gauge, Zap, Eye, ShieldCheck, Globe, HelpCircle } from "lucide-react"

/* ── Platform icons for print ── */
/* Platforms with dedicated SVG files in /public/icons/ */
const SVG_ICON_MAP: Record<string, string> = {
  WordPress: 'wordpress',
  Shopify: 'shopify',
  Squarespace: 'squarespace',
  Webflow: 'webflow',
  Wix: 'wix',
  Sitecore: 'sitecore',
  'Adobe AEM': 'adobe aem',
  Contentful: 'contentful',
  Prismic: 'prismic',
  DatoCMS: 'datocms',
  'Craft CMS': 'craftcms',
}

/* Inline SVGs only for platforms that have NO file in /public/icons/ */
function InlinePlatformSvg({ name, size }: { name: string; size: number }) {
  const s = { width: size, height: size }
  const svgProps = { viewBox: '0 0 24 24', fill: 'currentColor', style: s } as const
  switch (name) {
    case 'HubSpot': return <svg {...svgProps}><path d="M16.8 9.677V7.05a2.16 2.16 0 0 0 1.247-1.947v-.065a2.16 2.16 0 0 0-2.159-2.158h-.064a2.16 2.16 0 0 0-2.16 2.158v.065c0 .846.49 1.576 1.2 1.928v2.648a4.673 4.673 0 0 0-2.135 1.123l-5.657-4.398a2.363 2.363 0 0 0 .072-.562A2.346 2.346 0 1 0 4.8 8.19l5.498 4.278a4.706 4.706 0 0 0-.076.804c0 .324.034.64.098.946l-1.946.993A1.8 1.8 0 0 0 7.02 14.4a1.8 1.8 0 1 0 1.015 3.285l2.065-1.054a4.722 4.722 0 0 0 5.76-.576 4.717 4.717 0 0 0-.078-6.709A4.692 4.692 0 0 0 16.8 9.677Zm-1.003 6.656a2.422 2.422 0 0 1-1.718.71 2.434 2.434 0 0 1-2.427-2.427 2.435 2.435 0 0 1 2.427-2.427 2.434 2.434 0 0 1 2.427 2.427 2.42 2.42 0 0 1-.71 1.717Z" /></svg>
    case 'Drupal': return <svg {...svgProps}><path d="M12 2C9.4 5 7.2 5.5 5 7.2c-3 2.3-3.5 6.6-1.2 9.6A7.08 7.08 0 0 0 12 20.5a7.08 7.08 0 0 0 8.2-3.7c2.3-3 1.8-7.3-1.2-9.6C17 5.5 14.6 5 12 2Zm4.5 14.7c-.2.2-.4.2-.6.1-.2-.2-.2-.4-.1-.6.8-1 .5-2.4-.5-3.2-.2-.2-.2-.4-.1-.6.2-.2.4-.2.6-.1 1.3 1.1 1.6 3 .7 4.4Zm-7.1 1.6c-.7.2-1.4-.2-1.6-.9-.2-.7.2-1.4.9-1.6.7-.2 1.4.2 1.6.9.2.7-.2 1.4-.9 1.6Z" /></svg>
    case 'Framer': return <svg {...svgProps}><path d="M5 2h14v7h-7l7 7H5v-7h7L5 2Zm0 14h7v7L5 16Z" /></svg>
    case 'Next.js': return <svg {...svgProps}><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm4.97 14.47L9.5 7.3V16h1.2V9.38l6.13 7.57a8.477 8.477 0 0 1-.86.52ZM14.4 16V9.6h1.2V16h-1.2Z" /></svg>
    default: return null
  }
}

function PrintPlatformIcon({ name, size = 14 }: { name?: string | null; size?: number }) {
  if (!name) return <HelpCircle style={{ width: size, height: size }} />
  const svgFilename = SVG_ICON_MAP[name]
  if (svgFilename) {
    return <img src={`/icons/${svgFilename}.svg`} alt={`${name} logo`} style={{ width: size, height: size, objectFit: 'contain' }} />
  }
  const inline = <InlinePlatformSvg name={name} size={size} />
  if (inline) return inline
  return <Globe style={{ width: size, height: size }} />
}

function ConfidenceBadge({ level }: { level: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    high: { bg: '#ecfdf5', color: '#065f46' },
    medium: { bg: '#fffbeb', color: '#92400e' },
    low: { bg: '#f5f5f4', color: '#737373' },
  }
  const s = styles[level] || styles.low
  const labels: Record<string, string> = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }
  return (
    <span style={{ fontSize: 7, fontWeight: 500, color: s.color, background: s.bg, borderRadius: 3, padding: '2px 6px', whiteSpace: 'nowrap' as const }}>
      {labels[level] || `${level} confidence`}
    </span>
  )
}

/* ── shared inline-style constants ── */
/* Figma A4 frame: 595 x 842 px. Content area: 405.5px wide.
   Padding: left 97.5px, right 92px, top 75px, bottom 88px (footer zone). */
const FONT = 'neue-haas-grotesk-display, system-ui, sans-serif'
const SERIF = 'mencken-std-narrow, Georgia, serif'
const C = { black: '#171717', grey: '#525252', light: '#737373', border: '#d4d4d4', faint: '#a3a3a3', white: '#ffffff', pampas: '#F0ECE5' }

const A4_W = 595
const A4_H = 842
const PAD_L = 97.5
const PAD_R = 92
const PAD_T = 75
const PAD_B = 88 // space reserved for footer
const CONTENT_W = A4_W - PAD_L - PAD_R // ~405.5
const CONTENT_GAP = 32

const PAGE: React.CSSProperties = {
  position: 'relative', width: A4_W, height: A4_H, overflow: 'hidden',
  boxSizing: 'border-box', background: C.pampas, pageBreakAfter: 'always', fontFamily: FONT,
  fontSize: 11, lineHeight: '1.45', color: C.black, letterSpacing: '0.01em',
}

const BODY: React.CSSProperties = {
  position: 'absolute', top: PAD_T, left: PAD_L, width: CONTENT_W,
  display: 'flex', flexDirection: 'column', gap: CONTENT_GAP,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatMs(v: number | null) {
  if (v === null) return '—'
  return v < 1000 ? `${Math.round(v)}` : `${(v / 1000).toFixed(1)}`
}
function formatMsUnit(v: number | null) {
  if (v === null) return 'ms'
  return v >= 1000 ? 's' : 'ms'
}
function formatCls(v: number | null) { return v === null ? '—' : v.toFixed(3) }

function ringColor(s: number) { return s >= 75 ? '#6dbb7a' : s >= 50 ? '#d4a054' : '#c76b6b' }
function scoreLabel(s: number) {
  if (s >= 85) return 'Strong Performance'
  if (s >= 70) return 'Good Performance'
  if (s >= 50) return 'Moderate Performance'
  if (s >= 30) return 'Needs Improvement'
  return 'Critical Issues'
}

function statusDot(status: string) {
  const c = status === 'good' ? '#10b981' : status === 'warning' || status === 'needs-improvement' ? '#f59e0b' : status === 'poor' ? '#ef4444' : C.light
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 1.5, background: c, flexShrink: 0 }} />
}

function countRisks(r: AuditResult) {
  let high = 0, moderate = 0
  for (const c of [r.riskCards.visibility, r.riskCards.conversion, r.riskCards.trust]) {
    if (c.level === 'red') high += c.bullets.length
    else if (c.level === 'amber') moderate += c.bullets.length
  }
  return { high, moderate, accessibility: r.accessibilityIndicators?.eaaIssues?.length ?? 0 }
}

/* ── Edge inset for header / footer (full-width with small margin) ── */
const EDGE = 36

/* ── Page header — single row: Title (left) · URL (centre) · Date (right) ── */
function PH({ url, date }: { url: string; date: string; riskLabel?: string }) {
  return (
    <div style={{
      position: 'absolute', top: 25, left: EDGE, right: EDGE,
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      paddingTop: 1, paddingBottom: 3, borderBottom: `1px solid ${C.border}`,
    }}>
      <p style={{ margin: 0, fontSize: 11, fontFamily: SERIF, color: C.black, flexShrink: 0 }}>Website Health Check</p>
      <p style={{ margin: 0, fontSize: 9, color: C.light, textAlign: 'center', flex: '1 1 auto' }}>{url.startsWith('http') ? url : `https://${url}`}</p>
      <p style={{ margin: 0, fontSize: 9, color: C.light, flexShrink: 0, textAlign: 'right' }}>{date}</p>
    </div>
  )
}

/* ── Page footer — sits at bottom of A4 frame, full width ── */
function PF() {
  return (
    <div style={{
      position: 'absolute', bottom: 30, left: EDGE, right: EDGE,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <img src="/ohaha-logo.svg" alt="Ohana" style={{ height: 16, opacity: 0.45 }} />
      <p style={{ margin: 0, fontSize: 9, color: C.faint }}>www.ohana.studio</p>
    </div>
  )
}

/* ── Section heading ── */
function SH({ children, badge, badgeColor }: { children: React.ReactNode; badge?: string; badgeColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
      <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: FONT, color: C.black }}>{children}</h2>
      {badge && <span style={{ fontSize: 7, fontWeight: 500, padding: '1px 7px', borderRadius: 99, background: badgeColor || '#f5f5f4', color: C.grey }}>{badge}</span>}
    </div>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 5px', fontSize: 7.5, fontStyle: 'italic', color: C.light, lineHeight: 1.45 }}>{children}</p>
}

/* ── Indicator row ── */
function IR({ label, detail, note, status }: { label: string; detail?: string; note?: string; status?: string }) {
  const dotColor = status === 'clear' || status === 'good' || status === 'pass' || status === 'low' || status === 'scannable' || status === 'clear_path' || status === 'strong'
    ? '#16a34a' : status === 'mixed' || status === 'warn' || status === 'medium' || status === 'moderate' || status === 'partial'
      ? '#d97706' : status === 'unclear' || status === 'fail' || status === 'high' || status === 'dense' || status === 'broken' || status === 'weak'
        ? '#dc2626' : '#a3a3a3'
  return (
    <div style={{ padding: '4px 0', borderBottom: '1px solid #e7e5e4' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 8, color: C.black }}>{label}</span>
      </div>
      {detail && <p style={{ margin: '1px 0 0 11px', fontSize: 7.5, color: C.grey, lineHeight: 1.4 }}>{detail}</p>}
      {note && <p style={{ margin: '1px 0 0 11px', fontSize: 7, fontStyle: 'italic', color: C.light, lineHeight: 1.35, padding: '4px 0 0 0', background: 'transparent' }}>Note: {note}</p>}
    </div>
  )
}

/* ═══ COVER PAGE ═══ */
function CoverPage({ url, date }: { url: string; date: string }) {
  /* Figma cover measurements (proportional to 595x842 frame):
     Logo: 23px left, 21px top. Title block starts ~38px below logo.
     URL: 9px below title. Date: tight below URL.
     "www.ohana.studio" bottom-right. */
  return (
    <div style={{ position: 'relative', width: A4_W, height: A4_H, overflow: 'hidden', pageBreakAfter: 'always', background: C.pampas }}>
      <img src="/hc-front.svg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: 80, left: 23, zIndex: 1 }}>
        <img src="/ohaha-logo.svg" alt="Ohana" style={{ height: 28 }} />
      </div>
      <div style={{ position: 'absolute', top: 120, left: 23, zIndex: 1 }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1.0, color: C.black, margin: '0 0 9px' }}>
          Website<br />Health Check
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.grey, margin: '0 0 2px' }}>{'www.' + url.replace(/^https?:\/\/(www\.)?/, '')}</p>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.grey, margin: 0 }}>{date}</p>
      </div>
      <p style={{ position: 'absolute', bottom: 24, right: 23, fontFamily: FONT, fontSize: 9, color: C.light, margin: 0, zIndex: 1 }}>www.ohana.studio</p>
    </div>
  )
}

/* ── Simple markdown bold (**text**) → <strong> renderer ── */
function renderMarkdown(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: 700, color: C.black }}>{part}</strong>
      : <span key={i}>{part}</span>
  )
}

/* ═══ PAGE 2: Intro + Score + Recap ═══ */
function IntroPage({ r, date, riskLabel, risks, recapText }: { r: AuditResult; date: string; riskLabel: string; risks: { high: number; moderate: number; accessibility: number }; recapText?: string }) {
  const size = 110, cx = 55, cy = 55, radius = 44, sw = 5
  const gap = 20, circ = 2 * Math.PI * radius, arc = circ * ((360 - gap) / 360)
  const fill = (Math.max(0, Math.min(100, r.overallScore)) / 100) * arc
  const rot = 90 + gap / 2

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} riskLabel={riskLabel} />
      <div style={BODY}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontSize: 28, lineHeight: 1.1, color: C.black, margin: '0 0 8px' }}>Introduction</h1>
          <p style={{ margin: 0, fontSize: 10, lineHeight: 1.55, color: C.grey }}>
            {renderMarkdown(recapText || (r.salesTalkTrack ? `${r.salesTalkTrack.whatWeFound} ${r.salesTalkTrack.whyItMatters}` : r.summaryText))}
          </p>
        </div>

        {/* Score gauge + label + pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: `rotate(${rot}deg)` }}>
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#d6cfc4" strokeWidth={sw} strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" />
              {r.overallScore > 0 && <circle cx={cx} cy={cy} r={radius} fill="none" stroke={ringColor(r.overallScore)} strokeWidth={sw} strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" />}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: FONT, fontSize: 34, fontWeight: 700, lineHeight: 1, color: C.black }}>{r.overallScore}</span>
              <span style={{ fontSize: 10, color: C.light }}>/100</span>
            </div>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: C.black }}>{scoreLabel(r.overallScore)}</p>
            <p style={{ margin: '0 0 6px', fontSize: 9, color: C.grey, lineHeight: 1.5 }}>
              There are several areas where improvements could make a meaningful difference to how this site performs and converts.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {risks.high > 0 && <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}>{risks.high} High Risks</span>}
              {risks.moderate > 0 && <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 8px', border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e' }}>{risks.moderate} Moderate Risks</span>}
              {risks.accessibility > 0 && <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 8px', border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0369a1' }}>{risks.accessibility} Accessibility Risks</span>}
            </div>
          </div>
        </div>

        {/* Screenshots with device frames */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {/* Desktop browser frame */}
          {r.desktop.screenshot?.data && (
            <div style={{ flex: '3 1 0%', border: '1px solid #404040', background: '#171717', overflow: 'hidden' }}>
              {/* Browser chrome bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderBottom: '1px solid #404040', background: '#262626' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#525252' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#525252' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#525252' }} />
              </div>
              <div style={{ overflow: 'hidden', maxHeight: 204 }}>
                <img src={r.desktop.screenshot.data} alt="Desktop" style={{ width: '100%', objectFit: 'contain', objectPosition: 'top', display: 'block' }} />
              </div>
            </div>
          )}
          {/* Mobile phone frame */}
          {r.mobile.screenshot?.data && (
            <div style={{ flex: '1 1 0%', maxWidth: 110, border: '1px solid #404040', background: '#171717', overflow: 'hidden' }}>
              {/* Notch */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                <span style={{ width: 30, height: 3, borderRadius: 2, background: '#525252' }} />
              </div>
              <div style={{ overflow: 'hidden', maxHeight: 195 }}>
                <img src={r.mobile.screenshot.data} alt="Mobile" style={{ width: '100%', objectFit: 'contain', objectPosition: 'top', display: 'block' }} />
              </div>
              {/* Home button */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #525252' }} />
              </div>
            </div>
          )}
        </div>

        {/* Recap CTA */}
        <div style={{ background: C.black, color: C.white, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: C.white }}>{"Let's talk about what we found"}</p>
          <p style={{ margin: '0 0 8px', fontSize: 10, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>Book a free 30-minute clarity call to walk through your results and discuss quick wins.</p>
          <a href="https://calendar.notion.so/meet/ollie-ohana/ohana-30min" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.white, color: C.black, fontSize: 10, fontWeight: 500, padding: '5px 12px', textDecoration: 'none' }}>Book a meeting &rarr;</a>
        </div>
      </div>
      <PF />
    </div>
  )
}

/* ═══ PAGE 3: Risk cards ═══ */
function RiskPage({ r, date, riskLabel }: { r: AuditResult; date: string; riskLabel: string }) {
  const allCards = [r.riskCards.visibility, r.riskCards.conversion, r.riskCards.trust]
  const groups: { level: RiskLevel; cards: RiskCard[] }[] = []
  const seen = new Map<RiskLevel, RiskCard[]>()
  for (const c of allCards) { if (!seen.has(c.level)) seen.set(c.level, []); seen.get(c.level)!.push(c) }
  for (const lvl of ['red', 'amber', 'green'] as RiskLevel[]) { const cs = seen.get(lvl); if (cs?.length) groups.push({ level: lvl, cards: cs }) }

  const cfg: Record<RiskLevel, { heading: string; sub: string; badge: string; badgeBg: string; badgeC: string; borderC: string }> = {
    red: { heading: 'High Risks', sub: 'These issues are likely reducing conversions and trust.', badge: 'High Risk', badgeBg: '#fef2f2', badgeC: '#991b1b', borderC: '#fecaca' },
    amber: { heading: 'Moderate Risks', sub: 'Areas with room for improvement that could affect performance.', badge: 'Moderate', badgeBg: '#fffbeb', badgeC: '#92400e', borderC: '#fde68a' },
    green: { heading: 'Low Risks', sub: 'These areas are performing well.', badge: 'Low Risk', badgeBg: '#ecfdf5', badgeC: '#065f46', borderC: '#a7f3d0' },
  }

  /* Card icon lookup — simple SVG icons matching the report's lucide icons */
  const cardIcon = (label: string) => {
    if (label.includes('Conversion')) return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 9 5 12 1.8-5.2L21 14Z" /><path d="M7.2 2.2 8 5.1" /><path d="m5.1 8-2.9-.8" /><path d="M14 4.1 12 6" /><path d="m6 12-1.9 2" /></svg>
    )
    if (label.includes('Trust')) return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
    )
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="21.17" y1="8" x2="12" y2="8" /><line x1="3.95" y1="6.06" x2="8.54" y2="14" /><line x1="10.88" y1="21.94" x2="15.46" y2="14" /></svg>
    )
  }

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} />
      <div style={{ ...BODY, gap: 20 }}>
        {groups.map((g) => {
          const c = cfg[g.level]
          return (
            <div key={g.level}>
              <h2 style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: C.black }}>{c.heading}</h2>
              <p style={{ margin: '0 0 8px', fontSize: 8, fontStyle: 'italic', color: C.light }}>{c.sub}</p>
              {/* Single bordered container for all cards in this risk group */}
              <div style={{ border: `1px solid ${c.borderC}`, borderRadius: 10, background: 'rgb(255 255 255 / 60%)', overflow: 'hidden' }}>
                {g.cards.map((card, ci) => (
                  <div key={card.label} style={{ padding: '10px 12px', borderTop: ci > 0 ? `1px solid #e7e5e4` : 'none' }}>
                    {/* Header: icon + title + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {cardIcon(card.label)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 10, color: C.black }}>{card.label} ({card.bullets.length} {card.bullets.length === 1 ? 'Risk' : 'Risks'})</span>
                      </div>
                      <span style={{ fontSize: 7, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: c.badgeBg, color: c.badgeC }}>{c.badge}</span>
                    </div>
                    {/* Bullets + notes */}
                    {card.bullets.map((b, bi) => (
                      <div key={bi} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <span style={{ fontSize: 8, color: C.grey, flexShrink: 0 }}>--</span>
                          <span style={{ fontSize: 8, color: C.grey, lineHeight: 1.5 }}>{b}</span>
                        </div>
                        {card.bulletNotes?.[bi] && (
                          <p style={{ margin: '2px 0 0 14px', fontSize: 7, fontStyle: 'italic', color: C.light, lineHeight: 1.5, padding: '4px 0 0 0', background: 'transparent' }}>Note: {card.bulletNotes[bi]}</p>
                        )}
                      </div>
                    ))}
                    {/* Why it matters */}
                    <p style={{ margin: '4px 0 0', fontSize: 7.5, fontStyle: 'italic', color: C.light, lineHeight: 1.45 }}>{card.whyItMatters}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <PF />
    </div>
  )
}

/* ═══ PAGE 4: Platform + Performance ═══ */
function PerfPage({ r, date, riskLabel }: { r: AuditResult; date: string; riskLabel: string }) {
  /* Print tile — mirrors report MetricTile: rounded-xl, border, coloured borders,
     inner rounded-lg muted bg with mobile|desktop grid split + divider, square dots */
  function Tile({ label, mob, desk, unit, mobSt, deskSt, icon }: { label: string; mob: string; desk: string; unit?: string; mobSt: string; deskSt: string; icon?: React.ReactNode }) {
    const dotColors: Record<string, string> = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' }
    const borderColors: Record<string, string> = { green: '#34d399', amber: '#fbbf24', red: '#f87171' }
    const worst = (['red', 'amber', 'green'] as const).find(l => mobSt === l || deskSt === l) || 'green'
    const borderC = borderColors[worst] || C.border
    const valSize = 11
    const unitSize = 7
    const makeDot = (st: string) => <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: dotColors[st] || C.black, flexShrink: 0 }} />
    return (
      <div style={{ border: `1px solid ${borderC}`, borderRadius: 12, padding: '8px 10px', background: 'rgb(255 255 255 / 60%)' }}>
        {/* Icon + Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '0 0 6px' }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, borderRadius: 2, background: '#f5f5f4', color: C.light, flexShrink: 0 }}>{icon}</span>}
          <p style={{ margin: 0, fontSize: 9, fontWeight: 500, color: C.black }}>{label}</p>
        </div>
        {/* Inner muted split — matches report's rounded-lg bg-muted/40 */}
        <div style={{ background: '#f5f5f4', borderRadius: 8, padding: '5px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ paddingRight: 8, borderRight: '1px solid rgba(0,0,0,0.08)' }}>
            <p style={{ margin: '0 0 2px', fontSize: 6, color: C.light, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 500 }}>MOBILE</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {makeDot(mobSt)}
              <span style={{ fontSize: valSize, fontWeight: 500, color: C.black }}>{mob}</span>
              {unit && <span style={{ fontSize: unitSize, fontWeight: 400, color: C.light }}>{unit}</span>}
            </div>
          </div>
          <div style={{ paddingLeft: 8 }}>
            <p style={{ margin: '0 0 2px', fontSize: 6, color: C.light, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 500 }}>DESKTOP</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {makeDot(deskSt)}
              <span style={{ fontSize: valSize, fontWeight: 500, color: C.black }}>{desk}</span>
              {unit && <span style={{ fontSize: unitSize, fontWeight: 400, color: C.light }}>{unit}</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const m = r.mobile.metrics, d = r.desktop.metrics
  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} riskLabel={riskLabel} />
      <div style={{ ...BODY, gap: 16 }}>
        {r.platformInfo && (
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: C.black }}>Platform detection</h2>
            <p style={{ margin: '0 0 5px', fontSize: 8, fontStyle: 'italic', color: C.light }}>Detected from page source signatures.</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 8, background: 'rgb(255 255 255 / 60%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: 4, background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.black }}>
                  <PrintPlatformIcon name={r.platformInfo.platform} size={14} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, color: C.black }}>{r.platformInfo.platform || 'Unknown'}</span>
              </div>
              <ConfidenceBadge level={r.platformInfo.confidence} />
            </div>
          </div>
        )}

        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: C.black }}>Performance overview</h2>
          <Sub>Key metrics from Google Lighthouse, measured for both mobile and desktop experiences.</Sub>

          {/* Single 6-col grid so all rows share the same column tracks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {/* Row 1: 2 cards, each spanning 3 cols */}
            <div style={{ gridColumn: 'span 3' }}><Tile icon={<ImageIcon style={{ width: 10, height: 10 }} />} label="Largest Contentful Paint" mob={formatMs(m.lcp)} desk={formatMs(d.lcp)} unit={formatMsUnit(m.lcp)} mobSt={getMetricStatus('lcp', m.lcp)} deskSt={getMetricStatus('lcp', d.lcp)} /></div>
            <div style={{ gridColumn: 'span 3' }}><Tile icon={<Paintbrush style={{ width: 10, height: 10 }} />} label="First Contentful Paint" mob={formatMs(m.fcp)} desk={formatMs(d.fcp)} unit={formatMsUnit(m.fcp)} mobSt={getMetricStatus('fcp', m.fcp)} deskSt={getMetricStatus('fcp', d.fcp)} /></div>
            {/* Row 2: 3 cards, each spanning 2 cols */}
            <div style={{ gridColumn: 'span 2' }}><Tile icon={<Move style={{ width: 6, height: 6 }} />} label="Cumulative Layout Shift" mob={formatCls(m.cls)} desk={formatCls(d.cls)} mobSt={getMetricStatus('cls', m.cls)} deskSt={getMetricStatus('cls', d.cls)} /></div>
            <div style={{ gridColumn: 'span 2' }}><Tile icon={<Clock style={{ width: 6, height: 6 }} />} label="Total Blocking Time" mob={formatMs(m.tbt)} desk={formatMs(d.tbt)} unit="ms" mobSt={getMetricStatus('tbt', m.tbt)} deskSt={getMetricStatus('tbt', d.tbt)} /></div>
            <div style={{ gridColumn: 'span 2' }}><Tile icon={<Gauge style={{ width: 6, height: 6 }} />} label="Speed Index" mob={formatMs(m.speedIndex)} desk={formatMs(d.speedIndex)} unit={formatMsUnit(m.speedIndex)} mobSt={getMetricStatus('speedIndex', m.speedIndex)} deskSt={getMetricStatus('speedIndex', d.speedIndex)} /></div>
            {/* Row 3: 3 cards, each spanning 2 cols */}
            <div style={{ gridColumn: 'span 2' }}><Tile icon={<Zap style={{ width: 6, height: 6 }} />} label="Performance Score" mob={`${r.mobile.performanceScore}`} desk={`${r.desktop.performanceScore}`} unit="/100" mobSt={getScoreStatus(r.mobile.performanceScore)} deskSt={getScoreStatus(r.desktop.performanceScore)} /></div>
            <div style={{ gridColumn: 'span 2' }}><Tile icon={<Eye style={{ width: 6, height: 6 }} />} label="Accessibility" mob={`${r.mobile.accessibilityScore}`} desk={`${r.desktop.accessibilityScore}`} unit="/100" mobSt={getScoreStatus(r.mobile.accessibilityScore)} deskSt={getScoreStatus(r.desktop.accessibilityScore)} /></div>
            <div style={{ gridColumn: 'span 2' }}><Tile icon={<ShieldCheck style={{ width: 6, height: 6 }} />} label="Best Practices" mob={`${r.mobile.bestPracticesScore}`} desk={`${r.desktop.bestPracticesScore}`} unit="/100" mobSt={getScoreStatus(r.mobile.bestPracticesScore)} deskSt={getScoreStatus(r.desktop.bestPracticesScore)} /></div>
          </div>
        </div>
      </div>
      <PF />
    </div>
  )
}

/* ═══ PAGE 5: UX Indicators + Design ═══ */
function UXPage({ r, date }: { r: AuditResult; date: string; riskLabel?: string }) {
  const ux = r.uxIndicators
  const di = r.designIndicators

  /* Build items matching the report's UXIndicatorsSection logic exactly */
  type Item = { found: boolean; label: string; detail?: string; note?: string }
  const items: Item[] = []

  // CTA clarity
  items.push({
    found: ux.ctaFound,
    label: 'Call-to-action clarity',
    detail: ux.ctaFound
      ? (() => { const d = ux.ctaKeywords.filter((k: string) => !k.startsWith('(')); return d.length > 0 ? `Found: ${d.join(', ')}` : 'Interactive elements detected' })()
      : 'No clear CTA keywords detected in buttons or links',
    note: ux.ctaFound
      ? 'Clear CTAs guide visitors toward taking action. Ensuring they are prominent and well-worded can further increase enquiry rates.'
      : 'Without a clear call-to-action, visitors don\'t know what step to take next. This is one of the most common reasons websites fail to convert traffic into leads.',
  })
  // Trust signals
  items.push({
    found: ux.trustSignalsFound,
    label: 'Trust signals',
    detail: ux.trustSignalsFound ? `Found: ${ux.trustKeywords.join(', ')}` : 'No obvious trust indicators detected',
    note: ux.trustSignalsFound
      ? 'Trust signals reassure visitors the business is credible. Strengthening these can improve conversion rates further.'
      : '88% of consumers trust online reviews as much as personal recommendations. Without visible trust indicators, visitors have no reason to choose this business over a competitor.',
  })
  // Social proof
  items.push({
    found: ux.socialProofAboveFold,
    label: 'Social proof above the fold',
    detail: ux.socialProofAboveFold
      ? `Above the fold: ${ux.socialProofKeywordsAboveFold.join(', ')}`
      : ux.trustSignalsFound ? 'Social proof was found, but appears to be below the fold' : 'No social proof detected',
    note: ux.socialProofAboveFold
      ? 'Having social proof visible immediately helps build trust within the first few seconds of a visit.'
      : 'Most visitors never scroll past the fold. If reviews and testimonials are hidden below, the majority of potential customers never see them.',
  })
  // Third-party reviews
  items.push({
    found: ux.testimonialsVerified,
    label: 'Verified third-party reviews',
    detail: ux.testimonialsVerified
      ? `Sources: ${ux.verifiedSources.join(', ')}`
      : ux.trustSignalsFound ? 'Testimonials appear self-hosted, not from a verified third-party source' : 'No review sources detected',
    note: ux.testimonialsVerified
      ? 'Verified reviews from recognised platforms like Google or Trustpilot carry significantly more weight with consumers than self-hosted testimonials.'
      : 'Self-hosted testimonials can be fabricated and savvy consumers know this. Integrating verified third-party reviews dramatically increases credibility.',
  })
  // Phone
  items.push({
    found: ux.phoneFound,
    label: 'Phone number visible',
    note: ux.phoneFound
      ? 'A visible phone number signals the business is real and reachable, building immediate trust.'
      : 'Many visitors want to verify a business is legitimate before engaging. A visible phone number is one of the simplest and most effective trust builders.',
  })
  // Email
  items.push({
    found: ux.emailFound,
    label: 'Email address visible',
    note: ux.emailFound
      ? 'Showing an email address gives visitors an alternative way to get in touch, improving accessibility.'
      : 'Not all visitors want to fill out a form. A visible email address provides an alternative contact method and signals openness.',
  })

  const failCount = items.filter((i) => !i.found).length
  const badgeBg = failCount === 0 ? '#ecfdf5' : failCount <= 3 ? '#fffbeb' : '#fef2f2'
  const badgeColor = failCount === 0 ? '#065f46' : failCount <= 3 ? '#92400e' : '#b91c1c'
  const badgeBorder = failCount === 0 ? '#a7f3d0' : failCount <= 3 ? '#fde68a' : '#fecaca'
  const badgeLabel = failCount === 0 ? 'All clear' : `${failCount} Moderate Risk${failCount !== 1 ? 's' : ''}`

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} />
      <div style={{ ...BODY, gap: 16 }}>
        {/* UX Indicators */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 500, color: C.black }}>UX indicators</h2>
            <span style={{ fontSize: 7, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}>{badgeLabel}</span>
          </div>
          <Sub>These indicators are based on an AI analysis of the page screenshots.</Sub>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: 'rgb(255 255 255 / 60%)', overflow: 'hidden' }}>
            {items.map((item, i) => (
              <div key={item.label} style={{ padding: '6px 10px', borderTop: i > 0 ? '1px solid #e7e5e4' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ marginTop: 1, flexShrink: 0 }}><A11yIcon status={item.found ? 'pass' : 'fail'} /></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 1px', fontWeight: 600, fontSize: 8.5, color: C.black }}>{item.label}</p>
                    {item.detail && <p style={{ margin: '1px 0 0', fontSize: 7.5, color: C.grey, lineHeight: 1.45 }}>{item.detail}</p>}
                    {item.note && <p style={{ margin: '2px 0 0', fontSize: 7, fontStyle: 'italic', color: C.light, lineHeight: 1.5, padding: '4px 0 0 0', background: 'transparent' }}>Note: {item.note}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {allClear && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 0' }}>
            <span style={{ fontSize: 7, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>All clear</span>
              )}
            </div>
            <Sub>Checks based on Lighthouse audits and page analysis.</Sub>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: 'rgb(255 255 255 / 60%)', overflow: 'hidden' }}>
              {[
                { found: di.imageIssues.oversizedCount === 0, label: 'Image optimisation', detail: di.imageIssues.oversizedCount > 0 ? `${di.imageIssues.oversizedCount} oversized images found` : 'Images appear well-optimised.', note: 'Well-optimised images keep the site fast and improve both user experience and search ranking.' },
                { found: di.contrastPassed, label: 'Colour contrast', detail: di.contrastPassed ? 'All text meets WCAG colour contrast guidelines.' : `${di.contrastIssues} contrast issue${(di.contrastIssues ?? 0) > 1 ? 's' : ''} detected.`, note: 'Good contrast ensures text is readable for all users including those with visual impairments.' },
                { found: !di.inconsistentSpacing, label: 'Spacing consistency', detail: di.inconsistentSpacing ? di.spacingDetails : 'No inline spacing inconsistencies detected.', note: 'Consistent spacing contributes to a polished, professional appearance.' },
              ].map((item, i) => (
                <div key={item.label} style={{ padding: '6px 10px', borderTop: i > 0 ? '1px solid #e7e5e4' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}><A11yIcon status={item.found ? 'pass' : 'fail'} /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 1px', fontWeight: 600, fontSize: 8.5, color: C.black }}>{item.label}</p>
                      {item.detail && <p style={{ margin: '1px 0 0', fontSize: 7.5, color: C.grey, lineHeight: 1.45 }}>{item.detail}</p>}
                      {item.note && <p style={{ margin: '2px 0 0', fontSize: 7, fontStyle: 'italic', color: C.light, lineHeight: 1.5, padding: '4px 0 0 0', background: 'transparent' }}>Note: {item.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <PF />
    </div>
  )
}

/* ── Friction status helpers (matches report's AdvancedUXSection) ── */
function frictionStatusColor(status: string): 'emerald' | 'amber' | 'red' {
  const green = ['clear', 'low', 'scannable', 'clear_path', 'strong']
  const amber = ['mixed', 'medium', 'partial', 'moderate']
  if (green.includes(status)) return 'emerald'
  if (amber.includes(status)) return 'amber'
  return 'red'
}
function frictionIsApplicable(status: string): boolean {
  const na = status.toLowerCase().replace(/[\s_-]/g, '')
  return na !== 'na' && na !== 'n/a' && na !== 'notapplicable'
}
const frictionNotes: Record<string, { good: string; bad: string }> = {
  firstImpression: { good: 'A clear first impression keeps visitors engaged and reduces bounce rates.', bad: 'Visitors decide in 3\u20135 seconds whether to stay. If the value proposition isn\u2019t immediately clear, they leave for a competitor.' },
  navigationFriction: { good: 'Low decision friction means visitors can easily find what they need and take action.', bad: 'Confusing navigation overwhelms visitors with choices. Every extra click or unclear path is a chance for them to give up and leave.' },
  scanability: { good: 'Scannable content structure helps visitors quickly find the information they need.', bad: 'Dense text walls cause visitors to bounce. Breaking content into clear, scannable sections can significantly increase time on page.' },
  conversionPath: { good: 'A clear conversion path guides visitors smoothly from interest to action.', bad: 'A broken conversion path with dead ends or inconsistent CTAs means potential customers get lost before completing an enquiry.' },
  formFriction: { good: 'Low form friction means more visitors will complete enquiry forms.', bad: 'Complex or lengthy forms are the number one conversion killer. Reducing fields to essentials can double form completion rates.' },
  trustDepth: { good: 'Strong trust depth with verified credentials helps convert hesitant visitors.', bad: 'Weak trust signals mean visitors have no evidence to support choosing this business. Named testimonials and case studies are far more convincing than anonymous quotes.' },
  mobileFriction: { good: 'Low mobile friction ensures the growing majority of mobile visitors have a smooth experience.', bad: 'Over 60% of web traffic is mobile. High mobile friction means the majority of potential customers are having a frustrating experience.' },
}

/* ═══ PAGE 6: Advanced UX ═══ */
function FrictionPage({ r, date }: { r: AuditResult; date: string; riskLabel?: string }) {
  const a = r.advancedUX
  if (!a) return null

  const allCats = [
    { key: 'firstImpression', title: 'First-impression clarity', ...a.firstImpression },
    { key: 'navigationFriction', title: 'Decision friction', ...a.navigationFriction },
    { key: 'scanability', title: 'Scanability', ...a.scanability },
    { key: 'conversionPath', title: 'Conversion path', ...a.conversionPath },
    { key: 'formFriction', title: 'Form friction', ...a.formFriction },
    { key: 'trustDepth', title: 'Trust depth', ...a.trustDepth },
    { key: 'mobileFriction', title: 'Mobile friction', ...a.mobileFriction },
  ]

  const cats = allCats.filter((c) => frictionIsApplicable(c.status))
  if (cats.length === 0) return null

  const redCount = cats.filter((c) => frictionStatusColor(c.status) === 'red').length
  const amberCount = cats.filter((c) => frictionStatusColor(c.status) === 'amber').length
  const issueCount = redCount + amberCount

  const badgeBg = redCount > 0 ? '#fef2f2' : amberCount > 0 ? '#fffbeb' : '#ecfdf5'
  const badgeColor = redCount > 0 ? '#b91c1c' : amberCount > 0 ? '#92400e' : '#065f46'
  const badgeBorder = redCount > 0 ? '#fecaca' : amberCount > 0 ? '#fde68a' : '#a7f3d0'
  const badgeLabel = issueCount === 0 ? 'All clear' : redCount > 0 ? `${issueCount} High Risk${issueCount !== 1 ? 's' : ''}` : `${issueCount} Moderate Risk${issueCount !== 1 ? 's' : ''}`

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} />
      <div style={{ ...BODY, gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.black }}>UX friction analysis</h2>
            <span style={{ fontSize: 7, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}>{badgeLabel}</span>
          </div>
          <Sub>AI-powered analysis of visual friction patterns based on page screenshots.</Sub>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: 'rgb(255 255 255 / 60%)', overflow: 'hidden' }}>
            {cats.map((cat, i) => {
              const color = frictionStatusColor(cat.status)
              const isGood = color === 'emerald'
              const detail = cat.bullets.length > 0 ? cat.bullets.join(' ') : cat.status
              const note = frictionNotes[cat.key]?.[isGood ? 'good' : 'bad']
              const iconStatus: 'pass' | 'warn' | 'fail' = color === 'emerald' ? 'pass' : color === 'amber' ? 'warn' : 'fail'
              return (
                <div key={cat.key} style={{ padding: '6px 10px', borderTop: i > 0 ? '1px solid #e7e5e4' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}><A11yIcon status={iconStatus} /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 1px', fontWeight: 600, fontSize: 8.5, color: C.black }}>{cat.title}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 7.5, color: C.grey, lineHeight: 1.5 }}>{detail}</p>
                      {note && <p style={{ margin: '2px 0 0', fontSize: 7, fontStyle: 'italic', color: C.light, lineHeight: 1.5, padding: '4px 0 0 0', background: 'transparent' }}>Note: {note}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <PF />
    </div>
  )
}

/* ── A11y status icons matching report (Check / AlertTriangle / X) ── */
function A11yIcon({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  const s = 12
  if (status === 'pass') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
  )
  if (status === 'warn') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  )
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
  )
}

/* ── EAA issue parser (matches report) ── */
const EAA_NOTES: Record<string, string> = {
  '3.1.1': 'Without a language declaration, screen readers may mispronounce content, making the site difficult for visually impaired visitors.',
  '2.4.2': 'The page title appears in browser tabs, search results, and bookmarks. Missing titles look unprofessional and hurt search rankings.',
  '1.3.1': 'Proper document structure helps screen readers and search engines understand your content. This is a foundational accessibility and SEO requirement.',
  '1.1.1': 'Images without alt text are invisible to screen reader users and search engines. This is both an accessibility violation and a missed SEO opportunity.',
  '4.1.2': 'Unlabelled form fields are confusing for screen reader users and can reduce form completion rates on mobile devices.',
  '2.4.4': 'Links without descriptive text are meaningless for screen reader users who navigate by link list. This reduces clarity for all visitors.',
  '1.4.2': 'Videos without user controls frustrate visitors and violate accessibility standards. Autoplay can disorient users with cognitive disabilities.',
  '1.2.2': 'Captions are essential for deaf and hard-of-hearing users, and also help visitors in sound-sensitive environments like offices.',
  '2.4.1': 'Without skip navigation, keyboard users must tab through every menu item on every page load. This is a simple fix with major impact.',
  'gdpr': 'EU regulations require consent before setting non-essential cookies. Non-compliance can result in significant fines under GDPR.',
}
function parseEaaIssue(issue: string) {
  const wcagMatch = issue.match(/\(([^)]+)\)/)
  const wcagRef = wcagMatch ? wcagMatch[1].replace(' requirement for EU sites', '').trim() : undefined
  const detail = issue.replace(/\s*\([^)]+\)\.?/, '').replace(/\.$/, '').trim()
  const label = detail.replace(/^\d+\s+/, '').replace(/\.$/, '').trim()
  let note: string | undefined
  if (wcagRef) {
    const refNumber = wcagRef.replace('WCAG ', '').trim()
    note = EAA_NOTES[refNumber]
    if (!note && wcagRef.toLowerCase().includes('gdpr')) note = EAA_NOTES['gdpr']
  }
  return { label, detail, wcagRef, note }
}

/* ═══ PAGE 7: Accessibility ═══ */
function A11yPage({ r, date }: { r: AuditResult; date: string; riskLabel?: string }) {
  const a = r.accessibilityIndicators
  if (!a) return null

  type Row = { label: string; status: 'pass' | 'warn' | 'fail'; detail: string; wcag?: string; note?: string }
  const rows: Row[] = []

  // Video controls
  if (a.videosFound > 0) {
    rows.push({
      label: 'Video controls',
      status: a.videosWithControls >= a.videosFound && a.videosAutoplay === 0 ? 'pass' : a.videosAutoplay > 0 ? 'fail' : 'warn',
      detail: a.videosWithControls >= a.videosFound && a.videosAutoplay === 0 ? `${a.videosFound} video(s) found, all with controls and no autoplay.` : a.videosAutoplay > 0 ? `${a.videosAutoplay} of ${a.videosFound} video(s) set to autoplay.` : `${a.videosFound - a.videosWithControls} of ${a.videosFound} video(s) missing controls.`,
      wcag: 'WCAG 1.4.2', note: 'Videos without user controls frustrate visitors and violate accessibility standards.',
    })
    if (a.videoCaptionIssues > 0) rows.push({ label: 'Video captions', status: 'fail', detail: `${a.videoCaptionIssues} video(s) missing captions.`, wcag: 'WCAG 1.2.2', note: 'Captions are essential for deaf and hard-of-hearing users.' })
  } else {
    rows.push({ label: 'Video controls', status: 'pass', detail: 'No video elements detected on the page.' })
  }

  rows.push(
    { label: 'Language attribute', wcag: 'WCAG 3.1.1', status: a.htmlLangPresent ? 'pass' : 'fail', detail: a.htmlLangPresent ? 'The page declares a language for screen readers.' : 'Missing lang attribute on <html>.', note: a.htmlLangPresent ? 'Properly declared language helps screen readers pronounce content correctly for visually impaired users.' : 'Without a language declaration, screen readers may mispronounce content.' },
    { label: 'Page title', wcag: 'WCAG 2.4.2', status: a.documentTitlePresent ? 'pass' : 'fail', detail: a.documentTitlePresent ? 'The page has a descriptive title.' : 'Missing or empty page title.', note: a.documentTitlePresent ? 'A descriptive title helps users and search engines understand the page at a glance.' : 'The page title appears in browser tabs, search results, and bookmarks.' },
    { label: 'Heading hierarchy', wcag: 'WCAG 1.3.1', status: a.headingOrderValid ? 'pass' : 'warn', detail: a.headingOrderValid ? 'Headings follow a logical order.' : 'Heading levels skip or are out of order.', note: 'A logical heading structure helps both screen readers and search engines understand the page content.' },
    { label: 'Image alt text', wcag: 'WCAG 1.1.1', status: a.missingAltText === 0 ? 'pass' : a.missingAltText <= 2 ? 'warn' : 'fail', detail: a.missingAltText === 0 ? 'All images have alt text.' : `${a.missingAltText} image(s) missing alt text.`, note: 'Alt text ensures images are accessible and improves image search rankings.' },
    { label: 'Form labels', wcag: 'WCAG 4.1.2', status: a.missingFormLabels === 0 ? 'pass' : 'fail', detail: a.missingFormLabels === 0 ? 'All form inputs have associated labels.' : `${a.missingFormLabels} form input(s) missing labels.`, note: 'Labelled form fields ensure all users can complete enquiry forms successfully.' },
    { label: 'Link text', wcag: 'WCAG 2.4.4', status: a.missingLinkNames === 0 ? 'pass' : a.missingLinkNames <= 2 ? 'warn' : 'fail', detail: a.missingLinkNames === 0 ? 'All links have discernible text.' : `${a.missingLinkNames} link(s) have no accessible name.`, note: 'Descriptive link text helps all users understand where links lead before clicking.' },
    { label: 'Skip navigation', wcag: 'WCAG 2.4.1', status: a.skipNavFound ? 'pass' : 'warn', detail: a.skipNavFound ? 'A skip navigation mechanism was detected.' : 'No skip navigation link found.', note: 'Without skip navigation, keyboard users must tab through every menu item on every page load. This is a simple addition that significantly improves the experience for disabled users.' },
    { label: 'ARIA landmarks', wcag: 'WCAG 1.3.1', status: a.landmarksFound.length >= 3 ? 'pass' : a.landmarksFound.length >= 1 ? 'warn' : 'fail', detail: a.landmarksFound.length >= 3 ? `Landmarks found: ${a.landmarksFound.join(', ')}.` : a.landmarksFound.length > 0 ? `Only ${a.landmarksFound.join(', ')} detected.` : 'No semantic landmarks detected.', note: 'Without proper landmarks, screen reader users cannot efficiently navigate the page. This is a code-level fix that makes a big difference for accessibility.' },
    { label: 'Cookie consent (GDPR)', wcag: 'ePrivacy / GDPR', status: a.cookieConsentFound ? 'pass' : 'warn', detail: a.cookieConsentFound ? 'A cookie consent mechanism was detected.' : 'No cookie consent banner detected.', note: a.cookieConsentFound ? 'Having a cookie consent mechanism helps ensure compliance with EU privacy regulations.' : 'EU regulations require websites to obtain consent before setting non-essential cookies.' },
  )

  // Merge EAA issues into the same rows array so everything appears in one list
  if (a.eaaIssues.length > 0) {
    for (const issue of a.eaaIssues) {
      const parsed = parseEaaIssue(issue)
      rows.push({ label: parsed.label, status: 'fail', detail: parsed.detail, wcag: parsed.wcagRef || undefined, note: parsed.note || undefined })
    }
  }

  const failCount = rows.filter((r) => r.status === 'fail').length
  const warnCount = rows.filter((r) => r.status === 'warn').length
  const issueCount = failCount + warnCount
  const badgeBg = failCount > 0 ? '#fef2f2' : warnCount > 0 ? '#fffbeb' : '#ecfdf5'
  const badgeColor = failCount > 0 ? '#b91c1c' : warnCount > 0 ? '#92400e' : '#065f46'
  const badgeLabel = issueCount === 0 ? 'All clear' : `${issueCount} Accessibility Risk${issueCount !== 1 ? 's' : ''}`

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} />
      <div style={{ ...BODY, gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.black }}>Accessibility & EAA compliance</h2>
            <span style={{ fontSize: 7, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}20` }}>{badgeLabel}</span>
          </div>
          <Sub>Checks aligned to the European Accessibility Act (EAA) and WCAG 2.1 AA.</Sub>

          {/* All checks in one unified bordered container */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: 'rgb(255 255 255 / 60%)', overflow: 'hidden' }}>
            {rows.map((ch, i) => (
              <div key={`${ch.label}-${i}`} style={{ padding: '5px 10px', borderTop: i > 0 ? `1px solid #e7e5e4` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ marginTop: 1, flexShrink: 0 }}><A11yIcon status={ch.status} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 8.5, color: C.black }}>{ch.label}</span>
                      {ch.wcag && <span style={{ fontSize: 6.5, fontWeight: 500, color: C.light, background: '#f5f5f4', borderRadius: 3, padding: '0.5px 4px' }}>{ch.wcag}</span>}
                    </div>
                    <p style={{ margin: '1px 0 0', fontSize: 7.5, color: C.grey, lineHeight: 1.4 }}>{ch.detail}</p>
                    {ch.note && <p style={{ margin: '2px 0 0', fontSize: 7, fontStyle: 'italic', color: C.light, lineHeight: 1.45, padding: '4px 0 0 0', background: 'transparent' }}>Note: {ch.note}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PF />
    </div>
  )
}

/* ═══ HELPERS ═══ */
export { formatDate, countRisks, CoverPage, IntroPage, RiskPage, PerfPage, UXPage, FrictionPage, A11yPage, PAGE, BODY, C }

/* ═══ MAIN EXPORT (print-only) ═══ */
export function PrintReport({ result }: { result: AuditResult }) {
  const date = formatDate(result.timestamp)
  const risks = countRisks(result)
  const riskLabel = [
    risks.high > 0 ? `${risks.high} High Risks` : '',
    risks.moderate > 0 ? `${risks.moderate} Moderate Risks` : '',
  ].filter(Boolean).join(' | ')

  return (
    <div className="hidden print:block print-report-wrapper" style={{ background: C.white }}>
      <CoverPage url={result.url} date={date} />
      <IntroPage r={result} date={date} riskLabel={riskLabel} risks={risks} />
      <RiskPage r={result} date={date} riskLabel={riskLabel} />
      <PerfPage r={result} date={date} riskLabel={riskLabel} />
      <UXPage r={result} date={date} riskLabel={riskLabel} />
      <FrictionPage r={result} date={date} riskLabel={riskLabel} />
      <A11yPage r={result} date={date} riskLabel={riskLabel} />
    </div>
  )
}
