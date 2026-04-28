import {
  READINESS_LABELS,
  RECOMMENDATION_BADGES,
  RECOMMENDATION_LABELS,
} from "./constants"
import type { OMYReadinessStatus, OMYRecommendation } from "./types"

const CURRENCY_CODE = "GBP"
const LOCALE = "en-GB"

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY_CODE,
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const yearsFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function withUnit(value: number, divisor: number, suffix: string): string {
  const short = value / divisor
  const decimals = short >= 100 ? 0 : short >= 10 ? 1 : 1
  return `${short.toFixed(decimals)}${suffix}`
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  return currencyFormatter.format(value)
}

export function formatCurrencyCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }

  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""

  if (abs >= 1_000_000_000) {
    return `${sign}£${withUnit(abs, 1_000_000_000, "bn")}`
  }
  if (abs >= 1_000_000) {
    return `${sign}£${withUnit(abs, 1_000_000, "m")}`
  }
  if (abs >= 1_000) {
    return `${sign}£${withUnit(abs, 1_000, "k")}`
  }
  return `${sign}${currencyFormatter.format(abs)}`
}

export function formatSignedCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  if (value > 0) {
    return `+${formatCurrency(value)}`
  }
  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`
  }
  return formatCurrency(value)
}

export function formatSignedCurrencyCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  if (value > 0) {
    return `+${formatCurrencyCompact(value)}`
  }
  if (value < 0) {
    return `-${formatCurrencyCompact(Math.abs(value))}`
  }
  return formatCurrencyCompact(value)
}

export function formatPercent(decimal: number): string {
  if (!Number.isFinite(decimal)) {
    return "-"
  }
  return percentFormatter.format(decimal)
}

export function formatYears(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  return `${yearsFormatter.format(value)} years`
}

export function formatWholeYears(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  return `${Math.round(value).toString()} years`
}

export function formatRecommendation(recommendation: OMYRecommendation): string {
  return RECOMMENDATION_LABELS[recommendation]
}

export function formatRecommendationBadge(recommendation: OMYRecommendation): string {
  return RECOMMENDATION_BADGES[recommendation]
}

export function formatReadiness(readiness: OMYReadinessStatus): string {
  return READINESS_LABELS[readiness]
}

export function formatPercentInput(decimal: number): string {
  if (!Number.isFinite(decimal)) {
    return "0.0%"
  }
  return `${(decimal * 100).toFixed(1)}%`
}
