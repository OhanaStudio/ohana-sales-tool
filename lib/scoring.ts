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
  const bulletNotes: string[] = []
  if (mobile.performanceScore < 50) {
    bullets.push("Mobile page speed is below average, which can hurt search rankings.")
    bulletNotes.push("Google uses page speed as a ranking factor. Slower sites get pushed down in search results, meaning fewer potential customers find you.")
  }
  if (mobile.seoScore < 70) {
    bullets.push("Some basic SEO signals may need attention.")
    bulletNotes.push("Missing SEO fundamentals means search engines can't fully understand what this business offers, reducing organic traffic.")
  }
  if (adv && adv.firstImpression.h1Count === 0 && !h1Confirmed) {
    bullets.push("No H1 heading found, which is important for search engines to understand the page.")
    bulletNotes.push("The H1 tag tells Google what the page is about. Without it, the site may rank for the wrong terms or not rank at all.")
  }
  if (adv && adv.firstImpression.h1Vague) {
    bullets.push("The H1 heading uses generic language, which can reduce search relevance.")
    bulletNotes.push("A vague headline like 'Welcome' doesn't help Google match this page to what people are searching for.")
  }
  if (adv && adv.scanability.status === "dense") {
    bullets.push("Content structure is dense with limited subheadings, which can reduce engagement and dwell time.")
    bulletNotes.push("Visitors typically scan before reading. Dense text walls increase bounce rates, which signals to Google the page isn't useful.")
  }
  if (mobile.performanceScore >= 50 && mobile.seoScore >= 70 && bullets.length === 0) {
    bullets.push("Core visibility signals look reasonable.")
    bulletNotes.push("The basics are in place, but there may be opportunities to gain an edge over competitors.")
  }
  if (mobile.metrics.speedIndex && mobile.metrics.speedIndex > 4000) {
    bullets.push("Content takes a while to become visible on mobile.")
    bulletNotes.push("53% of mobile users abandon sites that take over 3 seconds to load. Every second of delay costs potential leads.")
  }
  if (bullets.length < 2) {
    bullets.push("Search engines generally favour faster, well-structured pages.")
    bulletNotes.push("Ongoing optimisation helps maintain and improve search rankings over time.")
  }

  return {
    label: "Visibility Risk",
    level,
    bullets: bullets.slice(0, 4),
    bulletNotes: bulletNotes.slice(0, 4),
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
  const bulletNotes: string[] = []
  if (adv && adv.firstImpression.status === "unclear") {
    bullets.push("First impression clarity is low, which can cause visitors to leave before engaging.")
    bulletNotes.push("Visitors decide in 3-5 seconds whether to stay. If the value proposition isn't immediately clear, they leave and go to a competitor.")
  }
  if (mobile.metrics.lcp && mobile.metrics.lcp > 2500) {
    bullets.push("Main content takes longer than ideal to appear, which can reduce engagement.")
    bulletNotes.push("Delayed content loading directly increases bounce rate. Each 100ms of delay can reduce conversions by up to 7%.")
  }
  if (mobile.metrics.tbt && mobile.metrics.tbt > 300) {
    bullets.push("The page may feel sluggish when users try to interact.")
    bulletNotes.push("When buttons and forms don't respond quickly, users assume the site is broken and leave before completing an enquiry.")
  }
  if (!ux.ctaFound) {
    bullets.push("No clear call-to-action keywords were detected in buttons or links.")
    bulletNotes.push("Without a clear next step, visitors don't know what action to take. This is one of the most common reasons sites fail to convert traffic into leads.")
  }
  if (ux.ctaFound && ux.ctaKeywords.length > 0) {
    const displayCtas = ux.ctaKeywords.filter(k => !k.startsWith("("))
    if (displayCtas.length > 0) {
      bullets.push(`CTA indicators found: ${displayCtas.join(", ")}.`)
      bulletNotes.push("Having CTAs present is positive. The next step is ensuring they're prominent, well-placed, and use action-oriented language.")
    }
  }
  if (adv && adv.conversionPath.status === "broken") {
    bullets.push("The conversion path appears fragmented with dead-end sections or inconsistent CTAs.")
    bulletNotes.push("Every dead-end on a page is a point where potential customers drop off. A clear, consistent path from interest to action is essential.")
  }
  if (adv && adv.formFriction.status === "high") {
    bullets.push("Form friction is high, which can reduce enquiry completion rates.")
    bulletNotes.push("Long or complex forms are the number one conversion killer. Reducing fields to essentials can double completion rates.")
  }
  if (adv && adv.mobileFriction.status === "high") {
    bullets.push("Mobile-specific friction detected that can increase drop-off on phones.")
    bulletNotes.push("Over 60% of web traffic is mobile. If the mobile experience is frustrating, the majority of potential customers are being lost.")
  }
  if (design && !design.contrastPassed) {
    bullets.push(`${design.contrastIssues} colour contrast issue(s) detected, which can make text hard to read.`)
    bulletNotes.push("If visitors can't easily read text or see buttons, they won't engage. This also affects accessibility compliance.")
  }
  if (bullets.length < 2) {
    bullets.push("Page responsiveness is an important factor in keeping visitors engaged.")
    bulletNotes.push("Fast, responsive pages keep users focused on taking action rather than waiting.")
  }

  return {
    label: "Conversion Risk",
    level,
    bullets: bullets.slice(0, 4),
    bulletNotes: bulletNotes.slice(0, 4),
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
  const bulletNotes: string[] = []
  if (mobile.accessibilityScore < 70) {
    bullets.push("Accessibility gaps may prevent some users from engaging with the site.")
    bulletNotes.push("Up to 20% of users have some form of disability. Accessibility issues mean lost customers and potential legal risk under EAA/ADA regulations.")
  }
  if (a11y && a11y.videosFound > 0 && a11y.videosWithControls < a11y.videosFound) {
    bullets.push(`${a11y.videosFound - a11y.videosWithControls} video(s) found without visible play/pause controls.`)
    bulletNotes.push("Videos without controls frustrate users and fail accessibility requirements. This is a quick fix that improves both UX and compliance.")
  }
  if (a11y && a11y.videosAutoplay > 0) {
    bullets.push(`${a11y.videosAutoplay} video(s) set to autoplay, which can be disorienting and fails WCAG 1.4.2.`)
    bulletNotes.push("Autoplaying video is a WCAG violation and can be jarring for users, especially on mobile. It also consumes bandwidth, slowing the page.")
  }
  if (!ux.trustSignalsFound) {
    bullets.push("No obvious trust indicators (reviews, testimonials, awards) were detected.")
    bulletNotes.push("88% of consumers trust online reviews as much as personal recommendations. Without visible social proof, visitors have no reason to choose this business over competitors.")
  }
  if (ux.trustSignalsFound && !ux.socialProofAboveFold) {
    bullets.push("Social proof was found on the page, but it appears to be below the fold. Moving it higher could build trust faster.")
    bulletNotes.push("Most visitors never scroll past the fold. Placing reviews and testimonials higher ensures they see proof of quality before deciding to leave.")
  }
  if (ux.trustSignalsFound && ux.socialProofAboveFold) {
    bullets.push(`Trust indicators visible above the fold: ${ux.socialProofKeywordsAboveFold.join(", ")}.`)
    bulletNotes.push("This is a strong signal. Visible trust indicators above the fold help convert first-time visitors into enquiries.")
  }
  if (ux.trustSignalsFound && !ux.testimonialsVerified) {
    bullets.push("Testimonials appear to be self-hosted rather than from a verified third-party source (e.g. Google, Trustpilot). Third-party reviews carry more weight with visitors.")
    bulletNotes.push("Self-hosted testimonials are easily fabricated and savvy consumers know this. Verified third-party reviews are significantly more persuasive.")
  }
  if (ux.trustSignalsFound && ux.testimonialsVerified) {
    bullets.push(`Verified reviews detected from: ${ux.verifiedSources.join(", ")}.`)
    bulletNotes.push("Verified reviews from recognised platforms build strong credibility and directly influence purchase decisions.")
  }
  if (adv && adv.trustDepth.status === "weak") {
    bullets.push("Trust credibility signals are weak: testimonials may be anonymous or case studies missing.")
    bulletNotes.push("Named testimonials with roles and companies are far more convincing. Case studies show real results and help close deals.")
  }
  if (adv && adv.trustDepth.stockImagerySignals > 0) {
    bullets.push("Stock photography indicators detected, which can reduce perceived authenticity.")
    bulletNotes.push("Visitors can spot stock photos and it makes the business feel impersonal. Real photography of the team, office, or work builds much stronger trust.")
  }
  if (a11y && a11y.eaaScore === "fail") {
    bullets.push(`${a11y.eaaIssues.length} European Accessibility Act / WCAG issues detected that could affect compliance.`)
    bulletNotes.push("The European Accessibility Act comes into effect in June 2025. Non-compliance can result in fines and legal action. This is an urgent conversation starter.")
  }
  if (!ux.phoneFound && !ux.emailFound) {
    bullets.push("No visible phone number or email address was found on the page.")
    bulletNotes.push("Many visitors want to verify a business is real before engaging. A visible phone number or email is one of the simplest trust builders.")
  }
  if (ux.phoneFound || ux.emailFound) {
    bullets.push("Contact information is visible, which helps build credibility.")
    bulletNotes.push("Visible contact details reassure visitors the business is legitimate and reachable.")
  }
  if (bullets.length < 2) {
    bullets.push("Trust signals help visitors feel confident about engaging with a business.")
    bulletNotes.push("Building trust online is the foundation of converting visitors into customers.")
  }

  return {
    label: "Trust Risk",
    level,
    bullets: bullets.slice(0, 4),
    bulletNotes: bulletNotes.slice(0, 4),
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
