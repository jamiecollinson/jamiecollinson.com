export type OMYInputs = {
  currentPortfolio: number
  annualSpending: number
  annualSavingsIfWork: number
  expectedRealReturn: number
  yearsInRetirementIfStopNow: number
  payForYearOff: number
  extraCompNeededToWork: number
  freedomOpportunityProbability: number
  freedomOpportunityValue: number
}

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
  freeYearValue: number
  workDisutility: number
  opportunityValue: number
  safeWithdrawalRateTarget: number
  safeWithdrawalRateTargetInOneYear: number
  requiredPortfolioAtSafeWithdrawal: number
  swrGapNow: number
  swrGapInOneYear: number
}

export type OMYRecommendation =
  | "strong-work"
  | "lean-work"
  | "close-call"
  | "lean-stop"
  | "strong-stop"

export type OMYResult = {
  benefitOfWorking: number
  costOfWorking: number
  score: number
  recommendationFromScore: OMYRecommendation
  recommendation: OMYRecommendation
  swrAdjusted: boolean
  isSafeNow: boolean
  isSafeInOneYear: boolean
  explanation: string
  derived: OMYDerived
}

export type OMYInputKey = keyof OMYInputs
