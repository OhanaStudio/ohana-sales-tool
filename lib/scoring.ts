import type {
  StrategyResult,
  UXIndicators,
  DesignIndicators,
  AccessibilityIndicators,
  AdvancedUXIndicators,
  RiskLevel,
  RiskCard,
  SalesTalkTrack,
} from "./types"

export function calculateOverallScore(
  mobile: StrategyResult,
  desktop: StrategyResult
): number {
  const score =
    mobile.performanceScore * 0.4 +
    mobile.accessibilityScore * 0.15 +
    mobile.seoScore * 0.15 +
    desktop.performanceScore * 0.2 +
    mobile.bestPracticesScore * 0.1
  return Math.round(score)
}

function riskLevel(score: number): RiskLevel {
  if (score >= 75) return "green"
  if (score >= 50) return "amber"
  return "red"
}

export function generateVisibilityRisk(
  mobile: StrategyResult,
  adv?: AdvancedUXIndicators
): RiskCard {
  let avgScore = (mobile.performanceScore + mobile.seoScore) / 2
  if (adv && adv.scanability.status === "dense") avgScore -= 5
  // Only penalize for missing H1 if the analysis actually found it missing (not just blocked)
  const h1Confirmed = adv?.firstImpression.h1Text?.includes("(detected by Lighthouse")
  if (adv && adv.firstImpression.h1Count === 0 && !h1Confirmed) avgScore -= 5
  avgScore = Math.max(0, Math.min(100, avgScore))
  const level = riskLevel(avgScore)

  const bullets: string[] = []
  if (mobile.performanceScore < 50)
    bullets.push("Mobile page speed is below average, which can hurt search rankings.")
  if (mobile.seoScore < 70)
    bullets.push("Some basic SEO signals may need attention.")
  // Don't say "No H1 found" if Lighthouse confirmed headings exist
  if (adv && adv.firstImpression.h1Count === 0 && !h1Confirmed)
    bullets.push("No H1 heading found, which is important for search engines to understand the page.")
  if (adv && adv.firstImpression.h1Vague)
    bullets.push("The H1 heading uses generic language, which can reduce search relevance.")
  if (adv && adv.scanability.status === "dense")
    bullets.push("Content structure is dense with limited subheadings, which can reduce engagement and dwell time.")
  if (mobile.performanceScore >= 50 && mobile.seoScore >= 70 && bullets.length === 0)
    bullets.push("Core visibility signals look reasonable.")
  if (mobile.metrics.speedIndex && mobile.metrics.speedIndex > 4000)
    bullets.push("Content takes a while to become visible on mobile.")
  if (bullets.length < 2)
    bullets.push("Search engines generally favour faster, well-structured pages.")

  return {
    label: "Visibility Risk",
    level,
    bullets: bullets.slice(0, 4),
    whyItMatters:
      "Sites that load slowly or lack basic SEO structure can be harder for potential customers to find.",
  }
}

export function generateConversionRisk(
  mobile: StrategyResult,
  ux: UXIndicators,
  design?: DesignIndicators,
  adv?: AdvancedUXIndicators
): RiskCard {
  let score = mobile.performanceScore
  if (mobile.metrics.lcp && mobile.metrics.lcp > 2500) score -= 10
  if (mobile.metrics.tbt && mobile.metrics.tbt > 300) score -= 10
  if (!ux.ctaFound) score -= 15
  if (design && !design.contrastPassed) score -= 8
  if (design && design.imageIssues.oversizedCount > 2) score -= 5
  if (design && design.imageIssues.incorrectAspectRatio > 0) score -= 5
  if (adv && adv.firstImpression.status === "unclear") score -= 8
  if (adv && adv.formFriction.status === "high") score -= 6
  if (adv && adv.conversionPath.status === "broken") score -= 8
  if (adv && adv.mobileFriction.status === "high") score -= 6
  score = Math.max(0, Math.min(100, score))
  const level = riskLevel(score)

  const bullets: string[] = []
  if (adv && adv.firstImpression.status === "unclear")
    bullets.push("First impression clarity is low, which can cause visitors to leave before engaging.")
  if (mobile.metrics.lcp && mobile.metrics.lcp > 2500)
    bullets.push("Main content takes longer than ideal to appear, which can reduce engagement.")
  if (mobile.metrics.tbt && mobile.metrics.tbt > 300)
    bullets.push("The page may feel sluggish when users try to interact.")
  if (!ux.ctaFound)
    bullets.push("No clear call-to-action keywords were detected in buttons or links.")
  if (ux.ctaFound && ux.ctaKeywords.length > 0) {
    // Filter out inference markers for display
    const displayCtas = ux.ctaKeywords.filter(k => !k.startsWith("("))
    if (displayCtas.length > 0) bullets.push(`CTA indicators found: ${displayCtas.join(", ")}.`)
  }
  if (adv && adv.conversionPath.status === "broken")
    bullets.push("The conversion path appears fragmented with dead-end sections or inconsistent CTAs.")
  if (adv && adv.formFriction.status === "high")
    bullets.push("Form friction is high, which can reduce enquiry completion rates.")
  if (adv && adv.mobileFriction.status === "high")
    bullets.push("Mobile-specific friction detected that can increase drop-off on phones.")
  if (design && !design.contrastPassed)
    bullets.push(`${design.contrastIssues} colour contrast issue(s) detected, which can make text hard to read.`)
  if (bullets.length < 2)
    bullets.push("Page responsiveness is an important factor in keeping visitors engaged.")

  return {
    label: "Conversion Risk",
    level,
    bullets: bullets.slice(0, 4),
    whyItMatters:
      "Slow or confusing experiences can lead visitors to leave before they enquire or buy.",
  }
}

export function generateTrustRisk(
  mobile: StrategyResult,
  ux: UXIndicators,
  a11y?: AccessibilityIndicators,
  adv?: AdvancedUXIndicators
): RiskCard {
  let score = (mobile.accessibilityScore + mobile.bestPracticesScore) / 2
  if (!ux.trustSignalsFound) score -= 15
  if (ux.trustSignalsFound && !ux.socialProofAboveFold) score -= 10
  if (ux.trustSignalsFound && !ux.testimonialsVerified) score -= 8
  if (!ux.phoneFound && !ux.emailFound) score -= 10
  if (a11y && a11y.eaaScore === "fail") score -= 10
  if (a11y && a11y.videosFound > 0 && a11y.videosWithControls < a11y.videosFound) score -= 8
  if (adv && adv.trustDepth.status === "weak") score -= 8
  score = Math.max(0, Math.min(100, score))
  const level = riskLevel(score)

  const bullets: string[] = []
  if (mobile.accessibilityScore < 70)
    bullets.push("Accessibility gaps may prevent some users from engaging with the site.")
  if (a11y && a11y.videosFound > 0 && a11y.videosWithControls < a11y.videosFound)
    bullets.push(`${a11y.videosFound - a11y.videosWithControls} video(s) found without visible play/pause controls.`)
  if (a11y && a11y.videosAutoplay > 0)
    bullets.push(`${a11y.videosAutoplay} video(s) set to autoplay, which can be disorienting and fails WCAG 1.4.2.`)
  if (!ux.trustSignalsFound)
    bullets.push("No obvious trust indicators (reviews, testimonials, awards) were detected.")
  if (ux.trustSignalsFound && !ux.socialProofAboveFold)
    bullets.push("Social proof was found on the page, but it appears to be below the fold. Moving it higher could build trust faster.")
  if (ux.trustSignalsFound && ux.socialProofAboveFold)
    bullets.push(`Trust indicators visible above the fold: ${ux.socialProofKeywordsAboveFold.join(", ")}.`)
  if (ux.trustSignalsFound && !ux.testimonialsVerified)
    bullets.push("Testimonials appear to be self-hosted rather than from a verified third-party source (e.g. Google, Trustpilot). Third-party reviews carry more weight with visitors.")
  if (ux.trustSignalsFound && ux.testimonialsVerified)
    bullets.push(`Verified reviews detected from: ${ux.verifiedSources.join(", ")}.`)
  if (adv && adv.trustDepth.status === "weak")
    bullets.push("Trust credibility signals are weak: testimonials may be anonymous or case studies missing.")
  if (adv && adv.trustDepth.stockImagerySignals > 0)
    bullets.push("Stock photography indicators detected, which can reduce perceived authenticity.")
  if (a11y && a11y.eaaScore === "fail")
    bullets.push(`${a11y.eaaIssues.length} European Accessibility Act / WCAG issues detected that could affect compliance.`)
  if (!ux.phoneFound && !ux.emailFound)
    bullets.push("No visible phone number or email address was found on the page.")
  if (ux.phoneFound || ux.emailFound)
    bullets.push("Contact information is visible, which helps build credibility.")
  if (bullets.length < 2)
    bullets.push("Trust signals help visitors feel confident about engaging with a business.")

  return {
    label: "Trust Risk",
    level,
    bullets: bullets.slice(0, 4),
    whyItMatters:
      "Visitors are more likely to engage with businesses that demonstrate credibility and accessibility.",
  }
}

export function generateSummary(overallScore: number): string {
  if (overallScore >= 80)
    return "This site is performing well across most areas. There may still be opportunities to optimise, but the foundations are solid."
  if (overallScore >= 60)
    return "The site shows a reasonable baseline but has some areas that could benefit from attention, particularly on mobile."
  if (overallScore >= 40)
    return "There are several areas where improvements could make a meaningful difference to how this site performs and converts."
  return "This site has significant opportunities for improvement. Addressing the issues highlighted could have a noticeable impact on visibility and engagement."
}

export function generateSalesTalkTrack(
  overallScore: number,
  mobile: StrategyResult,
  ux: UXIndicators,
  design?: DesignIndicators,
  a11y?: AccessibilityIndicators,
  adv?: AdvancedUXIndicators
): SalesTalkTrack {
  const issues: string[] = []
  if (mobile.performanceScore < 60) issues.push("mobile speed")
  if (mobile.seoScore < 70) issues.push("SEO basics")
  if (mobile.accessibilityScore < 70) issues.push("accessibility")
  if (!ux.ctaFound) issues.push("call-to-action clarity")
  if (!ux.trustSignalsFound) issues.push("trust signals")
  if (ux.trustSignalsFound && !ux.socialProofAboveFold) issues.push("social proof placement")
  if (ux.trustSignalsFound && !ux.testimonialsVerified) issues.push("unverified testimonials")
  if (design && !design.contrastPassed) issues.push("colour contrast")
  if (design && design.imageIssues.oversizedCount > 0) issues.push("image optimisation")
  if (a11y && a11y.eaaScore === "fail") issues.push("EAA / WCAG compliance")
  if (a11y && a11y.videosAutoplay > 0) issues.push("video autoplay")
  if (adv && adv.firstImpression.status === "unclear") issues.push("first-impression clarity")
  if (adv && adv.navigationFriction.status === "high") issues.push("navigation friction")
  if (adv && adv.formFriction.status === "high") issues.push("form friction")
  if (adv && adv.mobileFriction.status === "high") issues.push("mobile UX friction")

  const whatWeFound =
    issues.length > 0
      ? `The check highlighted areas for improvement in ${issues.slice(0, 3).join(", ")}.`
      : "The site is performing well across the key areas we checked."

  const whyItMatters =
    overallScore < 60
      ? "These factors directly influence whether visitors find the site, stay on it, and take action."
      : "Even well-performing sites benefit from regular checks to stay ahead of changing standards."

  const suggestedNextStep =
    overallScore < 60
      ? "A focused review session could identify quick wins and a realistic improvement plan."
      : "A brief clarity review could highlight any remaining opportunities to strengthen performance."

  return { whatWeFound, whyItMatters, suggestedNextStep }
}
