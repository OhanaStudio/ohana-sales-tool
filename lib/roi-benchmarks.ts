import type { IndustryBenchmark } from "./roi-types"

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  "fashion-apparel": {
    industry: "Fashion & Apparel",
    conversionRate: 0.025, // 2.5%
    averageOrderValue: 85,
    grossMargin: 0.50,
    returnRate: 0.12,
  },
  "electronics": {
    industry: "Electronics & Tech",
    conversionRate: 0.018, // 1.8%
    averageOrderValue: 320,
    grossMargin: 0.25,
    returnRate: 0.08,
  },
  "home-garden": {
    industry: "Home & Garden",
    conversionRate: 0.022, // 2.2%
    averageOrderValue: 135,
    grossMargin: 0.40,
    returnRate: 0.10,
  },
  "health-beauty": {
    industry: "Health & Beauty",
    conversionRate: 0.028, // 2.8%
    averageOrderValue: 65,
    grossMargin: 0.60,
    returnRate: 0.05,
  },
  "food-beverage": {
    industry: "Food & Beverage",
    conversionRate: 0.032, // 3.2%
    averageOrderValue: 55,
    grossMargin: 0.35,
    returnRate: 0.03,
  },
  "sports-outdoors": {
    industry: "Sports & Outdoors",
    conversionRate: 0.020, // 2.0%
    averageOrderValue: 110,
    grossMargin: 0.45,
    returnRate: 0.09,
  },
  "luxury": {
    industry: "Luxury Goods",
    conversionRate: 0.015, // 1.5%
    averageOrderValue: 850,
    grossMargin: 0.65,
    returnRate: 0.04,
  },
  "automotive": {
    industry: "Automotive Parts",
    conversionRate: 0.021, // 2.1%
    averageOrderValue: 180,
    grossMargin: 0.35,
    returnRate: 0.07,
  },
  "b2b-services": {
    industry: "B2B Services",
    conversionRate: 0.008, // 0.8%
    averageOrderValue: 2500,
    grossMargin: 0.70,
    returnRate: 0.02,
  },
  "education": {
    industry: "Education & Training",
    conversionRate: 0.012, // 1.2%
    averageOrderValue: 450,
    grossMargin: 0.80,
    returnRate: 0.01,
  },
  "retail-general": {
    industry: "General Retail",
    conversionRate: 0.023, // 2.3%
    averageOrderValue: 95,
    grossMargin: 0.40,
    returnRate: 0.08,
  },
  "other": {
    industry: "Other",
    conversionRate: 0.020, // 2.0%
    averageOrderValue: 100,
    grossMargin: 0.40,
    returnRate: 0.08,
  },
}

export const INDUSTRY_OPTIONS = Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => ({
  value: key,
  label: data.industry,
}))
