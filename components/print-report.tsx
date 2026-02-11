"use client"

import React from "react"

import type { AuditResult, RiskCard, RiskLevel } from "@/lib/types"
import { getMetricStatus, getScoreStatus } from "@/lib/metric-thresholds"

/* ── shared inline-style constants ── */
/* Figma A4 frame: 595 x 842 px. Content area: 405.5px wide.
   Padding: left 97.5px, right 92px, top 75px, bottom 88px (footer zone). */
const FONT = 'neue-haas-grotesk-display, system-ui, sans-serif'
const SERIF = '"Playfair Display", Georgia, serif'
const C = { black: '#171717', grey: '#525252', light: '#737373', border: '#d4d4d4', faint: '#a3a3a3', white: '#ffffff', pampas: '#F8ECE5' }

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
  const c = status === 'good' ? '#16a34a' : status === 'warning' ? '#d97706' : status === 'poor' ? '#dc2626' : C.light
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: c, marginRight: 4, verticalAlign: 'middle' }} />
}

function countRisks(r: AuditResult) {
  let high = 0, moderate = 0
  for (const c of [r.riskCards.visibility, r.riskCards.conversion, r.riskCards.trust]) {
    if (c.level === 'red') high += c.bullets.length
    else if (c.level === 'amber') moderate += c.bullets.length
  }
  return { high, moderate, accessibility: r.accessibilityIndicators?.eaaIssues?.length ?? 0 }
}

/* ── Page header — sits at the very top of the A4 frame ── */
function PH({ url, date, riskLabel }: { url: string; date: string; riskLabel: string }) {
  return (
    <div style={{
      position: 'absolute', top: 25, left: PAD_L, right: PAD_R,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      paddingBottom: 6, borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, fontFamily: SERIF, color: C.black }}>Website Health Check</p>
        <p style={{ margin: '2px 0 0', fontSize: 8, color: C.light }}>{url.replace(/^https?:\/\//, '')}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: 8, color: C.light }}>{date}</p>
        <p style={{ margin: '2px 0 0', fontSize: 8, color: C.light }}>{riskLabel}</p>
      </div>
    </div>
  )
}

/* ── Page footer — sits at bottom of A4 frame ── */
function PF() {
  return (
    <div style={{
      position: 'absolute', bottom: 30, left: PAD_L, right: PAD_R,
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
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, fontFamily: FONT, color: C.black }}>{children}</h2>
      {badge && <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 6px', borderRadius: 2, background: badgeColor || '#f5f5f5', color: C.grey }}>{badge}</span>}
    </div>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 8px', fontSize: 9, fontStyle: 'italic', color: C.light, lineHeight: 1.5 }}>{children}</p>
}

/* ── Indicator row ── */
function IR({ label, detail, note, status }: { label: string; detail?: string; note?: string; status?: string }) {
  const dotColor = status === 'clear' || status === 'good' || status === 'pass' || status === 'low' || status === 'scannable' || status === 'clear_path' || status === 'strong'
    ? '#16a34a' : status === 'mixed' || status === 'warn' || status === 'medium' || status === 'moderate' || status === 'partial'
    ? '#d97706' : status === 'unclear' || status === 'fail' || status === 'high' || status === 'dense' || status === 'broken' || status === 'weak'
    ? '#dc2626' : '#a3a3a3'
  return (
    <div style={{ padding: '5px 0', borderBottom: '1px solid #e5e5e5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 10, color: C.black }}>{label}</span>
      </div>
      {detail && <p style={{ margin: '1px 0 0 13px', fontSize: 9, color: C.grey, lineHeight: 1.4 }}>{detail}</p>}
      {note && <p style={{ margin: '1px 0 0 13px', fontSize: 8, fontStyle: 'italic', color: C.light, lineHeight: 1.4 }}>Note: {note}</p>}
    </div>
  )
}

/* ═══ COVER PAGE ═══ */
function CoverPage({ url, date }: { url: string; date: string }) {
  return (
    <div style={{ position: 'relative', width: A4_W, height: A4_H, overflow: 'hidden', pageBreakAfter: 'always', background: C.white }}>
      <img src="/cover-background.svg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: 40, left: PAD_L, zIndex: 1 }}>
        <img src="/ohaha-logo.svg" alt="Ohana" style={{ height: 24 }} />
      </div>
      <div style={{ position: 'absolute', bottom: 100, left: PAD_L, zIndex: 1 }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 700, lineHeight: 1.05, color: C.black, margin: '0 0 14px' }}>
          Website<br />Health Check
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 12, color: C.grey, margin: '0 0 3px' }}>{url.replace(/^https?:\/\//, '')}</p>
        <p style={{ fontFamily: FONT, fontSize: 12, color: C.grey, margin: 0 }}>{date}</p>
      </div>
      <p style={{ position: 'absolute', bottom: 30, right: PAD_R, fontFamily: FONT, fontSize: 9, color: C.light, margin: 0, zIndex: 1 }}>www.ohana.studio</p>
    </div>
  )
}

/* ═══ PAGE 2: Intro + Score + Recap ═══ */
function IntroPage({ r, date, riskLabel, risks }: { r: AuditResult; date: string; riskLabel: string; risks: { high: number; moderate: number; accessibility: number } }) {
  const size = 110, cx = 55, cy = 55, radius = 44, sw = 5
  const gap = 20, circ = 2 * Math.PI * radius, arc = circ * ((360 - gap) / 360)
  const fill = (Math.max(0, Math.min(100, r.overallScore)) / 100) * arc
  const rot = 90 + gap / 2

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} riskLabel={riskLabel} />
      <div style={BODY}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: C.black, margin: '0 0 8px' }}>Introduction</h1>
          <p style={{ margin: 0, fontSize: 10, lineHeight: 1.55, color: C.grey }}>{r.summaryText}</p>
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
            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: C.black }}>{scoreLabel(r.overallScore)}</p>
            <p style={{ margin: '0 0 6px', fontSize: 9, color: C.grey, lineHeight: 1.5 }}>
              There are several areas where improvements could make a meaningful difference to how this site performs and converts.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {risks.high > 0 && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}>{risks.high} High Risks</span>}
              {risks.moderate > 0 && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e' }}>{risks.moderate} Moderate Risks</span>}
              {risks.accessibility > 0 && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0369a1' }}>{risks.accessibility} Accessibility Risks</span>}
            </div>
          </div>
        </div>

        {/* Screenshots placeholder */}
        <div style={{ display: 'flex', gap: 10 }}>
          {r.desktop.screenshot && (
            <img src={r.desktop.screenshot || "/placeholder.svg"} alt="Desktop" style={{ flex: '2 1 0%', height: 160, objectFit: 'cover', objectPosition: 'top', borderRadius: 0, border: `1px solid ${C.border}` }} crossOrigin="anonymous" />
          )}
          {r.mobile.screenshot && (
            <img src={r.mobile.screenshot || "/placeholder.svg"} alt="Mobile" style={{ flex: '1 1 0%', height: 160, objectFit: 'cover', objectPosition: 'top', borderRadius: 0, border: `1px solid ${C.border}` }} crossOrigin="anonymous" />
          )}
        </div>

        {/* Recap CTA */}
        <div style={{ background: C.black, color: C.white, padding: '14px 16px' }}>
          <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: C.white }}>{"Let's talk about what we found"}</p>
          <p style={{ margin: '0 0 8px', fontSize: 10, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>Book a free 30-minute clarity call to walk through your results and discuss quick wins.</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.white, color: C.black, fontSize: 10, fontWeight: 600, padding: '5px 12px' }}>Book a meeting &rarr;</span>
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

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} riskLabel={riskLabel} />
      <div style={BODY}>
        {groups.map((g) => {
          const c = cfg[g.level]
          return (
            <div key={g.level}>
              <h2 style={{ margin: '0 0 2px', fontSize: 17, fontWeight: 700, color: C.black, fontFamily: FONT }}>{c.heading}</h2>
              <p style={{ margin: '0 0 8px', fontSize: 9, fontStyle: 'italic', color: C.light }}>{c.sub}</p>
              <div style={{ border: `1px solid ${c.borderC}`, overflow: 'hidden' }}>
                {g.cards.map((card, ci) => (
                  <div key={card.label} style={{ padding: '8px 10px', borderBottom: ci < g.cards.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 11, color: C.black }}>{card.label} ({card.bullets.length} {card.bullets.length === 1 ? 'Risk' : 'Risks'})</span>
                      <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 6px', background: c.badgeBg, color: c.badgeC }}>{c.badge}</span>
                    </div>
                    {card.bullets.map((b, bi) => (
                      <div key={bi} style={{ marginBottom: 3 }}>
                        <p style={{ margin: 0, fontSize: 9, color: C.grey, lineHeight: 1.45 }}>-- {b}</p>
                        {card.bulletNotes?.[bi] && <p style={{ margin: '0 0 0 10px', fontSize: 8, fontStyle: 'italic', color: C.light, lineHeight: 1.4 }}>Note: {card.bulletNotes[bi]}</p>}
                      </div>
                    ))}
                    <p style={{ margin: '3px 0 0', fontSize: 8, fontStyle: 'italic', color: C.light, lineHeight: 1.4 }}>{card.whyItMatters}</p>
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
  function Tile({ label, mob, desk, unit, mobSt, deskSt, wide }: { label: string; mob: string; desk: string; unit?: string; mobSt: string; deskSt: string; wide?: boolean }) {
    const border = mobSt === 'good' && deskSt === 'good' ? '#a7f3d0' : mobSt === 'poor' || deskSt === 'poor' ? '#fecaca' : '#fde68a'
    return (
      <div style={{ border: `1px solid ${border}`, padding: wide ? '8px 10px' : '6px 8px', flex: wide ? '1 1 48%' : '1 1 30%' }}>
        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 600, color: C.black }}>{label}</p>
        <div style={{ display: 'flex', gap: wide ? 20 : 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 7, color: C.light, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>MOBILE</p>
            <p style={{ margin: 0, fontSize: wide ? 16 : 13, fontWeight: 700, color: C.black }}>{statusDot(mobSt)}{mob}{unit || ''}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 7, color: C.light, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>DESKTOP</p>
            <p style={{ margin: 0, fontSize: wide ? 16 : 13, fontWeight: 700, color: C.black }}>{statusDot(deskSt)}{desk}{unit || ''}</p>
          </div>
        </div>
      </div>
    )
  }

  const m = r.mobile.metrics, d = r.desktop.metrics
  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} riskLabel={riskLabel} />
      <div style={BODY}>
        {r.platformInfo && (
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.black }}>Platform detection</h2>
            <p style={{ margin: '0 0 6px', fontSize: 9, fontStyle: 'italic', color: C.light }}>Detected from page source signatures.</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 10px', border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.black }}>{r.platformInfo.platform || 'Unknown'}</span>
              <span style={{ fontSize: 9, color: C.light }}>{r.platformInfo.confidence} confidence</span>
            </div>
          </div>
        )}

        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: 17, fontWeight: 700, color: C.black, fontFamily: FONT }}>Performance overview</h2>
          <Sub>Key metrics from Google Lighthouse, measured for both mobile and desktop experiences.</Sub>

          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            <Tile wide label="Largest Contentful Paint" mob={formatMs(m.lcp)} desk={formatMs(d.lcp)} unit={formatMsUnit(m.lcp)} mobSt={getMetricStatus('lcp', m.lcp)} deskSt={getMetricStatus('lcp', d.lcp)} />
            <Tile wide label="First Contentful Paint" mob={formatMs(m.fcp)} desk={formatMs(d.fcp)} unit={formatMsUnit(m.fcp)} mobSt={getMetricStatus('fcp', m.fcp)} deskSt={getMetricStatus('fcp', d.fcp)} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 6 }}>
            <Tile label="Cumulative Layout Shift" mob={formatCls(m.cls)} desk={formatCls(d.cls)} mobSt={getMetricStatus('cls', m.cls)} deskSt={getMetricStatus('cls', d.cls)} />
            <Tile label="Total Blocking Time" mob={formatMs(m.tbt)} desk={formatMs(d.tbt)} unit="ms" mobSt={getMetricStatus('tbt', m.tbt)} deskSt={getMetricStatus('tbt', d.tbt)} />
            <Tile label="Speed Index" mob={formatMs(m.speedIndex)} desk={formatMs(d.speedIndex)} unit={formatMsUnit(m.speedIndex)} mobSt={getMetricStatus('speedIndex', m.speedIndex)} deskSt={getMetricStatus('speedIndex', d.speedIndex)} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 6 }}>
            <Tile label="Performance Score" mob={`${r.mobile.performanceScore}/100`} desk={`${r.desktop.performanceScore}/100`} mobSt={getScoreStatus(r.mobile.performanceScore)} deskSt={getScoreStatus(r.desktop.performanceScore)} />
            <Tile label="Accessibility" mob={`${r.mobile.accessibilityScore}/100`} desk={`${r.desktop.accessibilityScore}/100`} mobSt={getScoreStatus(r.mobile.accessibilityScore)} deskSt={getScoreStatus(r.desktop.accessibilityScore)} />
            <Tile label="Best Practices" mob={`${r.mobile.bestPracticesScore}/100`} desk={`${r.desktop.bestPracticesScore}/100`} mobSt={getScoreStatus(r.mobile.bestPracticesScore)} deskSt={getScoreStatus(r.desktop.bestPracticesScore)} />
          </div>
        </div>
      </div>
      <PF />
    </div>
  )
}

/* ═══ PAGE 5: UX Indicators + Design ═══ */
function UXPage({ r, date, riskLabel }: { r: AuditResult; date: string; riskLabel: string }) {
  const ux = r.uxIndicators
  const di = r.designIndicators
  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} riskLabel={riskLabel} />
      <div style={BODY}>
        <div>
          <SH>UX indicators</SH>
          <Sub>These indicators are based on an AI analysis of the page screenshots.</Sub>
          <IR label="Call-to-action clarity" detail={ux.ctaFound ? `Found: ${ux.ctaKeywords.join(', ')}` : 'No clear CTA found'} note="Clear CTAs guide visitors toward taking action." />
          <IR label="Trust signals" detail={ux.trustSignalsFound ? `Found: ${ux.trustKeywords.join(', ')}` : 'No obvious trust indicators detected'} note="Without visible trust indicators, visitors have no reason to choose this business." />
          <IR label="Social proof above the fold" detail={ux.socialProofAboveFold ? `Found: ${ux.socialProofKeywordsAboveFold.join(', ')}` : 'No social proof detected'} note="Most visitors never scroll past the fold." />
          <IR label="Verified third-party reviews" detail={ux.testimonialsVerified ? `Sources: ${ux.verifiedSources.join(', ')}` : 'No review sources detected'} note="Integrating verified third-party reviews dramatically increases credibility." />
          <IR label="Phone number visible" detail={ux.phoneFound ? 'Phone number found' : 'No phone number detected'} note="A visible phone number is one of the simplest and most effective trust builders." />
          <IR label="Email address visible" detail={ux.emailFound ? 'Email address found' : 'No email address detected'} note="A visible email address provides an alternative contact method." />
        </div>

        {di && (
          <div>
            <SH badge={!di.contrastIssues && di.imageIssues.oversizedCount === 0 ? 'All clear' : undefined} badgeColor="#ecfdf5">Design &amp; image quality</SH>
            <Sub>Checks based on Lighthouse audits and page analysis.</Sub>
            <IR label="Image optimisation" detail={di.imageIssues.oversizedCount > 0 ? `${di.imageIssues.oversizedCount} oversized images found` : 'Images appear well-optimised.'} note="Well-optimised images keep the site fast." />
            <IR label="Colour contrast" detail={di.contrastPassed ? 'All text meets WCAG colour contrast guidelines.' : `${di.contrastIssues} contrast issues found.`} note="Good contrast ensures text is readable for all users." />
            <IR label="Spacing consistency" detail={di.inconsistentSpacing ? di.spacingDetails : 'No inline spacing styles detected.'} note="Consistent spacing contributes to a polished appearance." />
          </div>
        )}
      </div>
      <PF />
    </div>
  )
}

/* ═══ PAGE 6: Advanced UX ═══ */
function FrictionPage({ r, date, riskLabel }: { r: AuditResult; date: string; riskLabel: string }) {
  const a = r.advancedUX
  if (!a) return null

  const sections: { label: string; status: string; bullets: string[] }[] = [
    { label: 'First-impression clarity', status: a.firstImpression.status, bullets: a.firstImpression.bullets },
    { label: 'Decision friction', status: a.navigationFriction.status, bullets: a.navigationFriction.bullets },
    { label: 'Scanability', status: a.scanability.status, bullets: a.scanability.bullets },
    { label: 'Conversion path', status: a.conversionPath.status, bullets: a.conversionPath.bullets },
    { label: 'Form friction', status: a.formFriction.status, bullets: a.formFriction.bullets },
    { label: 'Trust depth', status: a.trustDepth.status, bullets: a.trustDepth.bullets },
    { label: 'Mobile friction', status: a.mobileFriction.status, bullets: a.mobileFriction.bullets },
  ]

  // Count high-risk items
  const highCount = sections.filter(s => s.status === 'unclear' || s.status === 'high' || s.status === 'broken' || s.status === 'weak' || s.status === 'dense').length

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} riskLabel={riskLabel} />
      <div style={BODY}>
        <div>
          <SH badge={highCount > 0 ? `${highCount} High Risks` : undefined} badgeColor="#fef2f2">UX friction analysis</SH>
          <Sub>AI-powered analysis of visual friction patterns based on page screenshots.</Sub>
          {sections.map((s) => (
            <IR key={s.label} label={s.label} status={s.status}
              detail={s.bullets[0] || ''}
              note={s.bullets[1]?.startsWith('Note:') ? s.bullets[1].replace('Note: ', '') : s.bullets[1] || ''} />
          ))}
        </div>
      </div>
      <PF />
    </div>
  )
}

/* ═══ PAGE 7: Accessibility ═══ */
function A11yPage({ r, date, riskLabel }: { r: AuditResult; date: string; riskLabel: string }) {
  const a = r.accessibilityIndicators
  if (!a) return null

  const checks: { label: string; wcag?: string; passed: boolean; detail: string; note: string }[] = [
    { label: 'Video controls', passed: a.videosFound === 0 || a.videosWithControls > 0, detail: a.videosFound === 0 ? 'No video elements detected on the page.' : `${a.videosWithControls}/${a.videosFound} videos have controls.`, note: '' },
    { label: 'Language attribute', wcag: 'WCAG 3.1.1', passed: a.htmlLangPresent, detail: a.htmlLangPresent ? 'The page declares a language for screen readers.' : 'No language attribute found.', note: 'Properly declared language helps screen readers pronounce content correctly for visually impaired users.' },
    { label: 'Page title', wcag: 'WCAG 2.4.2', passed: a.documentTitlePresent, detail: a.documentTitlePresent ? 'The page has a descriptive title.' : 'No page title found.', note: 'A descriptive title helps users and search engines understand the page at a glance.' },
    { label: 'Heading hierarchy', wcag: 'WCAG 1.3.1', passed: a.headingOrderValid, detail: a.headingOrderValid ? 'Headings follow a logical order.' : 'Heading order is incorrect.', note: 'A logical heading structure helps both screen readers and search engines understand the page content.' },
    { label: 'Image alt text', wcag: 'WCAG 1.1.1', passed: a.missingAltText === 0, detail: a.missingAltText === 0 ? 'All images have alt text.' : `${a.missingAltText} images missing alt text.`, note: 'Alt text ensures images are accessible and improves image search rankings.' },
    { label: 'Form labels', wcag: 'WCAG 4.1.2', passed: a.missingFormLabels === 0, detail: a.missingFormLabels === 0 ? 'All form inputs have associated labels.' : `${a.missingFormLabels} form inputs missing labels.`, note: 'Labelled form fields ensure all users can complete enquiry forms successfully.' },
    { label: 'Link text', wcag: 'WCAG 2.4.4', passed: a.missingLinkNames === 0, detail: a.missingLinkNames === 0 ? 'All links have discernible text.' : `${a.missingLinkNames} links missing text.`, note: 'Descriptive link text helps all users understand where links lead before clicking.' },
    { label: 'Skip navigation', wcag: 'WCAG 2.4.1', passed: a.skipNavFound, detail: a.skipNavFound ? 'Skip navigation link found.' : 'No skip navigation link found.', note: 'Without skip navigation, keyboard users must tab through every menu item on every page load. This is a simple addition that significantly improves the experience for disabled users.' },
    { label: 'ARIA landmarks', wcag: 'WCAG 1.3.1', passed: a.landmarksFound.length > 0, detail: a.landmarksFound.length > 0 ? `Found: ${a.landmarksFound.join(', ')}` : 'No semantic landmarks detected.', note: 'Without proper landmarks, screen reader users cannot efficiently navigate the page. This is a code-level fix that makes a big difference for accessibility.' },
    { label: 'Cookie consent (GDPR)', wcag: 'ePrivacy / GDPR', passed: a.cookieConsentFound, detail: a.cookieConsentFound ? 'A cookie consent mechanism was detected.' : 'No cookie consent mechanism found.', note: 'Having a cookie consent mechanism helps ensure compliance with EU privacy regulations.' },
  ]

  return (
    <div style={PAGE}>
      <PH url={r.url} date={date} riskLabel={riskLabel} />
      <div style={BODY}>
        <div>
          <SH badge={a.eaaIssues.length > 0 ? `${a.eaaIssues.length} Accessibility Risks` : undefined} badgeColor="#f0f9ff">Accessibility &amp; EAA compliance</SH>
          <Sub>Checks aligned to the European Accessibility Act (EAA) and WCAG 2.1 AA.</Sub>

          {checks.map((ch) => (
            <div key={ch.label} style={{ padding: '4px 0', borderBottom: '1px solid #e5e5e5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ch.passed ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 10, color: C.black }}>{ch.label}</span>
                {ch.wcag && <span style={{ fontSize: 8, color: C.light, marginLeft: 4 }}>{ch.wcag}</span>}
              </div>
              <p style={{ margin: '1px 0 0 13px', fontSize: 9, color: C.grey, lineHeight: 1.4 }}>{ch.detail}</p>
              {ch.note && <p style={{ margin: '1px 0 0 13px', fontSize: 8, fontStyle: 'italic', color: C.light, lineHeight: 1.4 }}>Note: {ch.note}</p>}
            </div>
          ))}
        </div>

        {/* EAA Issue Summary */}
        {a.eaaIssues.length > 0 && (
          <div style={{ padding: '8px 10px', border: `1px solid ${C.border}`, background: '#fafafa' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.black }}>EAA / WCAG ISSUE SUMMARY</p>
            {a.eaaIssues.map((issue, i) => (
              <p key={i} style={{ margin: '2px 0', fontSize: 9, color: C.grey, lineHeight: 1.4 }}>{issue}</p>
            ))}
          </div>
        )}
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
