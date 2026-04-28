export type OMYRecommendation =
  | "strong-work"
  | "lean-work"
  | "close-call"
  | "lean-stop"
  | "strong-stop"

export type OMYReadinessStatus = "not-ready" | "borderline" | "ready"

export type OMYModelInputs = {
  currentPortfolio: number
  annualSpending: number
  annualSavingsIfWork: number
  expectedRealReturn: number
  safetyWithdrawalTarget: number
  yearsInRetirementIfStopNow: number
  freeYearValue: number
  workDisutility: number
  opportunityValue: number
}

export type OMYNumericInputKey = keyof OMYModelInputs

export type OMYDerived = {
  portfolioNow: number
  portfolioInOneYear: number
  portfolioGain: number
  withdrawalRateNow: number
  withdrawalRateInOneYear: number
  withdrawalRateImprovement: number
  fundedYearsNow: number
  fundedYearsInOneYear: number
  fundedYearsGain: number
  retirementYearsNow: number
  retirementYearsInOneYear: number
  requiredPortfolioAtTarget: number
  requiredPortfolioAtTargetInOneYear: number
  gapNow: number
  gapInOneYear: number
  freeYearValue: number
  workDisutility: number
  opportunityValue: number
  impliedIncome: number
}

export type OMYReadinessResult = {
  status: OMYReadinessStatus
  isReadyNow: boolean
  closesGapInOneYear: boolean
  currentWithdrawalRate: number
  oneYearWithdrawalRate: number
  targetWithdrawalRate: number
  gapNow: number
  gapInOneYear: number
}

export type OMYMarginalResult = {
  benefitOfWorking: number
  estimatedValueOfDelayedFreedom: number
  score: number
  status: OMYRecommendation
}

export type OMYResult = {
  readiness: OMYReadinessResult
  marginal: OMYMarginalResult
  primaryConclusion: string
  primaryExplanation: string
  secondaryInsight: string
  derived: OMYDerived
}
