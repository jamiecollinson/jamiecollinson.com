import type { OMYInputKey, OMYInputs, OMYRecommendation } from "./types"

export const SCORE_THRESHOLDS = {
  strongWork: 100_000,
  leanWork: 25_000,
  leanStop: -25_000,
  strongStop: -100_000,
} as const

export const SWR_HORIZON_ANCHORS = [
  { years: 20, swr: 0.045 },
  { years: 30, swr: 0.04 },
  { years: 40, swr: 0.035 },
  { years: 50, swr: 0.033 },
  { years: 60, swr: 0.03 },
] as const

export const DEFAULT_INPUTS: OMYInputs = {
  currentPortfolio: 620_000,
  annualSpending: 45_000,
  annualSavingsIfWork: 15_000,
  expectedRealReturn: 0.03,
  yearsInRetirementIfStopNow: 30,
  payForYearOff: 60_000,
  extraCompNeededToWork: 20_000,
  freedomOpportunityProbability: 0.2,
  freedomOpportunityValue: 300_000,
}

export const SAFE_FALLBACKS: OMYInputs = {
  currentPortfolio: 1,
  annualSpending: 1,
  annualSavingsIfWork: 0,
  expectedRealReturn: 0,
  yearsInRetirementIfStopNow: 5,
  payForYearOff: 0,
  extraCompNeededToWork: 0,
  freedomOpportunityProbability: 0,
  freedomOpportunityValue: 0,
}

export const HARD_LIMITS: Record<OMYInputKey, { min: number; max?: number }> = {
  currentPortfolio: { min: 1 },
  annualSpending: { min: 1 },
  annualSavingsIfWork: { min: 0 },
  expectedRealReturn: { min: -0.1, max: 0.15 },
  yearsInRetirementIfStopNow: { min: 5, max: 60 },
  payForYearOff: { min: 0 },
  extraCompNeededToWork: { min: 0 },
  freedomOpportunityProbability: { min: 0, max: 1 },
  freedomOpportunityValue: { min: 0 },
}

export type OMYScenarioKey = "p50" | "p75" | "p90" | "p99"

export type OMYScenario = {
  key: OMYScenarioKey
  label: string
  shortLabel: string
  percentileLabel: string
  netWorth: number
  annualIncome: number
  appliedInputs: Pick<OMYInputs, "currentPortfolio" | "annualSpending" | "annualSavingsIfWork">
}

// Approximate UK household wealth and income percentile anchors.
// Wealth anchors align to ONS Wealth and Assets Survey headlines for p50/p90 and
// interpolated high-percentile points for p75/p99 to provide practical presets.
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
      annualSpending: 32_000,
      annualSavingsIfWork: 8_000,
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
      annualSpending: 45_000,
      annualSavingsIfWork: 15_000,
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
      annualSpending: 60_000,
      annualSavingsIfWork: 25_000,
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
      annualSpending: 120_000,
      annualSavingsIfWork: 60_000,
    },
  },
}

export const OMY_SCENARIO_ORDER: OMYScenarioKey[] = ["p50", "p75", "p90", "p99"]
export const DEFAULT_SCENARIO: OMYScenarioKey = "p75"

export type OMYInputKind =
  | "currency"
  | "decimal"
  | "return-slider"
  | "probability-slider"
  | "years-slider"

export type OMYInputConfig = {
  key: OMYInputKey
  group: "financial" | "freedom"
  label: string
  helper: string
  kind: OMYInputKind
  placeholder: string
  step: string
}

export const INPUT_CONFIGS: OMYInputConfig[] = [
  {
    key: "currentPortfolio",
    group: "financial",
    label: "Current portfolio",
    helper: "Current investable portfolio value.",
    kind: "currency",
    placeholder: "620000",
    step: "1000",
  },
  {
    key: "annualSpending",
    group: "financial",
    label: "Annual spending",
    helper: "Annual spending required in retirement.",
    kind: "currency",
    placeholder: "45000",
    step: "1000",
  },
  {
    key: "annualSavingsIfWork",
    group: "financial",
    label: "Annual savings if you work",
    helper: "Additional amount added over the next year.",
    kind: "currency",
    placeholder: "15000",
    step: "1000",
  },
  {
    key: "expectedRealReturn",
    group: "financial",
    label: "Expected real return",
    helper:
      "Long-run return after inflation. Start around 3% and test a lower and higher case.",
    kind: "return-slider",
    placeholder: "3.0",
    step: "0.5",
  },
  {
    key: "yearsInRetirementIfStopNow",
    group: "financial",
    label: "Retirement years if stopping now",
    helper: "Planning horizon in years if you stop today.",
    kind: "years-slider",
    placeholder: "30",
    step: "1",
  },
  {
    key: "payForYearOff",
    group: "freedom",
    label: "Value of a fully free year",
    helper:
      "Imagine you could buy 12 months of full freedom: what one-off amount would feel fair? Use your honest gut figure, not what sounds sensible.",
    kind: "currency",
    placeholder: "60000",
    step: "1000",
  },
  {
    key: "extraCompNeededToWork",
    group: "freedom",
    label: "Extra compensation needed to feel good about working",
    helper: "Proxy for work disutility.",
    kind: "currency",
    placeholder: "20000",
    step: "1000",
  },
  {
    key: "freedomOpportunityProbability",
    group: "freedom",
    label: "Chance a free year unlocks meaningful upside",
    helper: "Probability from 0% to 100%.",
    kind: "probability-slider",
    placeholder: "20",
    step: "1",
  },
  {
    key: "freedomOpportunityValue",
    group: "freedom",
    label: "Value if that upside happens",
    helper: "Potential value if the opportunity materializes.",
    kind: "currency",
    placeholder: "300000",
    step: "1000",
  },
]

export const RECOMMENDATION_LABELS: Record<OMYRecommendation, string> = {
  "strong-work": "Strongly work one more year",
  "lean-work": "Lean work one more year",
  "close-call": "Close call",
  "lean-stop": "Lean retire now",
  "strong-stop": "Strongly retire now",
}

export const RECOMMENDATION_TONES: Record<OMYRecommendation, string> = {
  "strong-work": "omy-tone-strong-work",
  "lean-work": "omy-tone-lean-work",
  "close-call": "omy-tone-close-call",
  "lean-stop": "omy-tone-lean-stop",
  "strong-stop": "omy-tone-strong-stop",
}
