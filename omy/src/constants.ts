import type {
  OMYModelInputs,
  OMYNumericInputKey,
  OMYReadinessStatus,
  OMYRecommendation,
} from "./types"

export const SCORE_THRESHOLDS = {
  strongWork: 100_000,
  leanWork: 25_000,
  leanStop: -25_000,
  strongStop: -100_000,
} as const

export const READINESS_TOLERANCE_RATIO = 1.1

export const DEFAULT_INPUTS: OMYModelInputs = {
  currentPortfolio: 620_000,
  annualSpending: 40_000,
  annualSavingsIfWork: 15_000,
  expectedRealReturn: 0.03,
  safetyWithdrawalTarget: 0.04,
  yearsInRetirementIfStopNow: 30,
  freeYearValue: 40_000,
  workDisutility: 13_750,
  opportunityValue: 20_000,
}

export const SAFE_FALLBACKS: OMYModelInputs = {
  currentPortfolio: 1,
  annualSpending: 1,
  annualSavingsIfWork: 0,
  expectedRealReturn: 0,
  safetyWithdrawalTarget: 0.04,
  yearsInRetirementIfStopNow: 30,
  freeYearValue: 0,
  workDisutility: 0,
  opportunityValue: 0,
}

export const HARD_LIMITS: Record<OMYNumericInputKey, { min: number; max?: number }> = {
  currentPortfolio: { min: 1 },
  annualSpending: { min: 1 },
  annualSavingsIfWork: { min: 0 },
  expectedRealReturn: { min: -0.1, max: 0.15 },
  safetyWithdrawalTarget: { min: 0.025, max: 0.06 },
  yearsInRetirementIfStopNow: { min: 5, max: 60 },
  freeYearValue: { min: 0 },
  workDisutility: { min: 0 },
  opportunityValue: { min: 0 },
}

export type OMYScenarioKey = "p50" | "p75" | "p90" | "p99"

export type OMYScenario = {
  key: OMYScenarioKey
  label: string
  shortLabel: string
  percentileLabel: string
  netWorth: number
  annualIncome: number
  appliedInputs: Pick<
    OMYModelInputs,
    "currentPortfolio" | "annualSpending" | "annualSavingsIfWork"
  >
}

export const OMY_SCENARIOS: Record<OMYScenarioKey, OMYScenario> = {
  p50: {
    key: "p50",
    label: "50th percentile",
    shortLabel: "P50",
    percentileLabel: "50th percentile",
    netWorth: 294_000,
    annualIncome: 37_000,
    appliedInputs: {
      currentPortfolio: 294_000,
      annualSpending: 27_000,
      annualSavingsIfWork: 7_000,
    },
  },
  p75: {
    key: "p75",
    label: "75th percentile",
    shortLabel: "P75",
    percentileLabel: "75th percentile",
    netWorth: 620_000,
    annualIncome: 55_000,
    appliedInputs: {
      currentPortfolio: 620_000,
      annualSpending: 38_000,
      annualSavingsIfWork: 17_000,
    },
  },
  p90: {
    key: "p90",
    label: "90th percentile",
    shortLabel: "P90",
    percentileLabel: "90th percentile",
    netWorth: 1_200_500,
    annualIncome: 78_000,
    appliedInputs: {
      currentPortfolio: 1_200_500,
      annualSpending: 52_000,
      annualSavingsIfWork: 26_000,
    },
  },
  p99: {
    key: "p99",
    label: "99th percentile",
    shortLabel: "P99",
    percentileLabel: "99th percentile",
    netWorth: 3_600_000,
    annualIncome: 180_000,
    appliedInputs: {
      currentPortfolio: 3_600_000,
      annualSpending: 110_000,
      annualSavingsIfWork: 70_000,
    },
  },
}

export const OMY_SCENARIO_ORDER: OMYScenarioKey[] = ["p50", "p75", "p90", "p99"]
export const DEFAULT_SCENARIO: OMYScenarioKey = "p75"

export type WorkAttitudeKey =
  | "definitely-yes"
  | "probably-yes"
  | "unsure"
  | "probably-no"
  | "definitely-no"

export type WorkAttitudeOption = {
  key: WorkAttitudeKey
  label: string
  disutilityRate: number
}

export const WORK_ATTITUDE_OPTIONS: WorkAttitudeOption[] = [
  { key: "definitely-yes", label: "Definitely yes", disutilityRate: 0 },
  { key: "probably-yes", label: "Probably yes", disutilityRate: 0.1 },
  { key: "unsure", label: "Unsure", disutilityRate: 0.25 },
  { key: "probably-no", label: "Probably no", disutilityRate: 0.5 },
  { key: "definitely-no", label: "Definitely no", disutilityRate: 1 },
]

export const DEFAULT_WORK_ATTITUDE: WorkAttitudeKey = "unsure"

export type FreeYearPlanKey =
  | "none"
  | "rest"
  | "explore"
  | "project"
  | "business"
  | "opportunity"

export type FreeYearPlanOption = {
  key: FreeYearPlanKey
  label: string
  multiplier: number
  usesCustomMultiplier?: boolean
}

export const FREE_YEAR_PLAN_OPTIONS: FreeYearPlanOption[] = [
  { key: "none", label: "No clear plan", multiplier: 0 },
  { key: "rest", label: "Rest / family", multiplier: 0.25 },
  { key: "explore", label: "Explore options", multiplier: 0.5 },
  { key: "project", label: "Build a serious project", multiplier: 1 },
  {
    key: "business",
    label: "Start or buy a business",
    multiplier: 2,
    usesCustomMultiplier: true,
  },
  {
    key: "opportunity",
    label: "Rare opportunity already in sight",
    multiplier: 2,
    usesCustomMultiplier: true,
  },
]

export const DEFAULT_FREE_YEAR_PLAN: FreeYearPlanKey = "explore"
export const DEFAULT_CUSTOM_OPPORTUNITY_MULTIPLIER = 2

export const SABBATICAL_ANCHORS = [
  { label: "£0", multiple: 0 },
  { label: "3 months", multiple: 0.25 },
  { label: "6 months", multiple: 0.5 },
  { label: "1 year", multiple: 1 },
  { label: "2 years", multiple: 2 },
] as const

export const RECOMMENDATION_LABELS: Record<OMYRecommendation, string> = {
  "strong-work": "Strongly favours working one more year",
  "lean-work": "Leans toward working one more year",
  "close-call": "Close call",
  "lean-stop": "Leans toward stopping now",
  "strong-stop": "Strongly favours stopping now",
}

export const RECOMMENDATION_BADGES: Record<OMYRecommendation, string> = {
  "strong-work": "Favours working",
  "lean-work": "Slightly favours working",
  "close-call": "Close call",
  "lean-stop": "Slightly favours stopping",
  "strong-stop": "Favours stopping",
}

export const RECOMMENDATION_TONES: Record<OMYRecommendation, string> = {
  "strong-work": "omy-tone-strong-work",
  "lean-work": "omy-tone-lean-work",
  "close-call": "omy-tone-close-call",
  "lean-stop": "omy-tone-lean-stop",
  "strong-stop": "omy-tone-strong-stop",
}

export const READINESS_LABELS: Record<OMYReadinessStatus, string> = {
  "not-ready": "Not ready",
  borderline: "Borderline",
  ready: "Ready",
}
