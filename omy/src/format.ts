import { RECOMMENDATION_LABELS } from "./constants"
import type { OMYRecommendation } from "./types"

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

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  return currencyFormatter.format(value)
}

export function formatSignedCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  const formatted = currencyFormatter.format(Math.abs(value))
  if (value > 0) {
    return `+${formatted}`
  }
  if (value < 0) {
    return `-${formatted}`
  }
  return formatted
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

export function formatPercentInput(decimal: number): string {
  if (!Number.isFinite(decimal)) {
    return "0%"
  }
  return `${Math.round(decimal * 100).toString()}%`
}
