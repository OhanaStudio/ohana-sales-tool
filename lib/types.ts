export interface LighthouseMetrics {
  lcp: number | null
  cls: number | null
  tbt: number | null
  fcp: number | null
  speedIndex: number | null
}

export interface ScreenshotData {
  data: string // base64 data URI
  width: number
  height: number
}

export interface StrategyResult {
  strategy: "mobile" | "desktop"
  performanceScore: number
  accessibilityScore: number
  seoScore: number
  bestPracticesScore: number
  metrics: LighthouseMetrics
  fieldDataAvailable: boolean
  notes: string[]
  screenshot?: ScreenshotData
}

export interface UXIndicators {
  ctaFound: boolean
  ctaKeywords: string[]
  trustSignalsFound: boolean
  trustKeywords: string[]
  socialProofAboveFold: boolean
  socialProofKeywordsAboveFold: string[]
  testimonialsVerified: boolean
  verifiedSources: string[]
  phoneFound: boolean
  emailFound: boolean
  fetchBlocked: boolean
}

export interface ImageIssues {
  oversizedCount: number
  unoptimizedCount: number
  offscreenCount: number
  unsizedCount: number
  modernFormatMissing: number
  incorrectAspectRatio: number
  totalSavingsKb: number
  details: string[]
}

export interface DesignIndicators {
  contrastIssues: number
  contrastPassed: boolean
  imageIssues: ImageIssues
  inconsistentSpacing: boolean
  spacingDetails: string
}

export interface AccessibilityIndicators {
  // From Lighthouse audits
  missingAltText: number
  missingFormLabels: number
  missingLinkNames: number
  headingOrderValid: boolean
  documentTitlePresent: boolean
  htmlLangPresent: boolean
  videoCaptionIssues: number
  // From HTML heuristics
  videosFound: number
  videosWithControls: number
  videosAutoplay: number
  skipNavFound: boolean
  landmarksFound: string[]
  cookieConsentFound: boolean
  // Overall
  eaaIssues: string[]
  eaaScore: "pass" | "warn" | "fail"
}

// --- Advanced UX indicator types ---

export type UXStatus3 = "clear" | "mixed" | "unclear"
export type FrictionLevel = "low" | "medium" | "high"
export type ScanabilityStatus = "scannable" | "mixed" | "dense"
export type ConversionPathStatus = "clear_path" | "partial" | "broken"
export type TrustDepthStatus = "strong" | "moderate" | "weak"

export interface FirstImpressionIndicators {
  h1Count: number
  h1Text: string | null
  h1AboveFold: boolean
  h1Vague: boolean
  primaryCtaAboveFold: boolean
  competingCtasAboveFold: number
  autoplayAboveFold: boolean
  status: UXStatus3
  bullets: string[]
}

export interface NavigationFrictionIndicators {
  navItemCount: number
  contactInNav: boolean
  genericNavLabels: string[]
  nestedMenuDepth: number
  tapTargetIssues: number
  status: FrictionLevel
  bullets: string[]
}

export interface ScanabilityIndicators {
  avgParagraphLength: number
  longParagraphs: number
  bulletListsFound: number
  subheadingFrequency: number
  headingSkips: number
  longLineEstimate: boolean
  status: ScanabilityStatus
  bullets: string[]
}

export interface ConversionPathIndicators {
  ctaLabels: string[]
  ctaConsistency: boolean
  deadEndSections: number
  inlineCtasFound: number
  externalLinkCount: number
  status: ConversionPathStatus
  bullets: string[]
}

export interface FormFrictionIndicators {
  formsFound: number
  avgFieldCount: number
  highFieldCountForms: number
  placeholderOnlyLabels: number
  submitButtonLabels: string[]
  genericSubmitButtons: number
  status: FrictionLevel
  bullets: string[]
}

export interface TrustDepthIndicators {
  namedTestimonials: number
  anonymousTestimonials: number
  testimonialsWithRoles: number
  caseStudiesFound: boolean
  stockImagerySignals: number
  aboutPageLinked: boolean
  physicalAddressFound: boolean
  status: TrustDepthStatus
  bullets: string[]
}

export interface MobileFrictionIndicators {
  tapTargetIssues: number
  stickyElementsFound: number
  cookieBannerOverCta: boolean
  horizontalScrollRisk: boolean
  viewportConfigured: boolean
  stickyCtaFound: boolean
  status: FrictionLevel
  bullets: string[]
}

export interface AdvancedUXIndicators {
  firstImpression: FirstImpressionIndicators
  navigationFriction: NavigationFrictionIndicators
  scanability: ScanabilityIndicators
  conversionPath: ConversionPathIndicators
  formFriction: FormFrictionIndicators
  trustDepth: TrustDepthIndicators
  mobileFriction: MobileFrictionIndicators
}

export type RiskLevel = "red" | "amber" | "green"

export interface RiskCard {
  label: string
  level: RiskLevel
  bullets: string[]
  whyItMatters: string
}

export interface SalesTalkTrack {
  whatWeFound: string
  whyItMatters: string
  suggestedNextStep: string
}

export interface AuditResult {
  id: string
  url: string
  timestamp: string
  overallScore: number
  summaryText: string
  mobile: StrategyResult
  desktop: StrategyResult
  uxIndicators: UXIndicators
  designIndicators: DesignIndicators
  accessibilityIndicators: AccessibilityIndicators
  advancedUX: AdvancedUXIndicators
  riskCards: {
    visibility: RiskCard
    conversion: RiskCard
    trust: RiskCard
  }
  salesTalkTrack: SalesTalkTrack
}

export interface StoredReport {
  id: string
  url: string
  timestamp: string
  result: AuditResult
}
