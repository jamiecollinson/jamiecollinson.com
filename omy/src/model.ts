import { SCORE_THRESHOLDS, SWR_HORIZON_ANCHORS } from "./constants"
import { formatCurrency, formatPercent } from "./format"
import type { OMYInputs, OMYRecommendation, OMYResult } from "./types"

function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0
  }
  return numerator / denominator
}

function toRecommendation(score: number): OMYRecommendation {
  if (score >= SCORE_THRESHOLDS.strongWork) {
    return "strong-work"
  }
  if (score >= SCORE_THRESHOLDS.leanWork) {
    return "lean-work"
  }
  if (score > SCORE_THRESHOLDS.leanStop) {
    return "close-call"
  }
  if (score > SCORE_THRESHOLDS.strongStop) {
    return "lean-stop"
  }
  return "strong-stop"
}

function shiftTowardWork(recommendation: OMYRecommendation): OMYRecommendation {
  if (recommendation === "strong-stop") {
    return "lean-stop"
  }
  if (recommendation === "lean-stop") {
    return "close-call"
  }
  if (recommendation === "close-call") {
    return "lean-work"
  }
  if (recommendation === "lean-work") {
    return "strong-work"
  }
  return "strong-work"
}

function shiftTowardWorkBySteps(
  recommendation: OMYRecommendation,
  steps: number,
): OMYRecommendation {
  let next = recommendation
  for (let i = 0; i < steps; i += 1) {
    next = shiftTowardWork(next)
  }
  return next
}

function safeWithdrawalRateForHorizon(years: number): number {
  const anchors = SWR_HORIZON_ANCHORS
  if (years <= anchors[0].years) {
    return anchors[0].swr
  }

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i]
    const b = anchors[i + 1]
    if (years >= a.years && years <= b.years) {
      const ratio = (years - a.years) / (b.years - a.years)
      return a.swr + (b.swr - a.swr) * ratio
    }
  }

  return anchors[anchors.length - 1].swr
}

export function calculateOMY(inputs: OMYInputs): OMYResult {
  const portfolioNow = inputs.currentPortfolio
  const portfolioInOneYear =
    inputs.currentPortfolio * (1 + inputs.expectedRealReturn) +
    inputs.annualSavingsIfWork
  const portfolioGain = portfolioInOneYear - portfolioNow

  const withdrawalRateNow = safeDivide(inputs.annualSpending, portfolioNow)
  const withdrawalRateInOneYear = safeDivide(inputs.annualSpending, portfolioInOneYear)
  const withdrawalRateImprovement = withdrawalRateNow - withdrawalRateInOneYear

  const fundedYearsNow = safeDivide(portfolioNow, inputs.annualSpending)
  const fundedYearsInOneYear = safeDivide(portfolioInOneYear, inputs.annualSpending)
  const fundedYearsGain = fundedYearsInOneYear - fundedYearsNow

  const retirementYearsNow = inputs.yearsInRetirementIfStopNow
  const retirementYearsInOneYear = Math.max(inputs.yearsInRetirementIfStopNow - 1, 0)

  const freeYearValue = inputs.payForYearOff
  const workDisutility = inputs.extraCompNeededToWork
  const opportunityValue =
    inputs.freedomOpportunityProbability * inputs.freedomOpportunityValue

  const safeWithdrawalRateTarget = safeWithdrawalRateForHorizon(
    inputs.yearsInRetirementIfStopNow,
  )
  const safeWithdrawalRateTargetInOneYear = safeWithdrawalRateForHorizon(
    Math.max(inputs.yearsInRetirementIfStopNow - 1, 1),
  )
  const requiredPortfolioAtSafeWithdrawal = safeDivide(
    inputs.annualSpending,
    safeWithdrawalRateTarget,
  )
  const requiredPortfolioAtSafeWithdrawalInOneYear = safeDivide(
    inputs.annualSpending,
    safeWithdrawalRateTargetInOneYear,
  )
  const swrGapNow = Math.max(requiredPortfolioAtSafeWithdrawal - portfolioNow, 0)
  const swrGapInOneYear = Math.max(
    requiredPortfolioAtSafeWithdrawalInOneYear - portfolioInOneYear,
    0,
  )
  const isSafeNow = swrGapNow <= 0
  const isSafeInOneYear = swrGapInOneYear <= 0

  const benefitOfWorking = portfolioGain
  const costOfWorking = freeYearValue + workDisutility + opportunityValue
  const score = benefitOfWorking - costOfWorking

  const recommendationFromScore = toRecommendation(score)
  const recommendation = isSafeNow ? recommendationFromScore : "strong-work"
  const swrAdjusted = recommendation !== recommendationFromScore

  let explanation =
    `Working one more year appears to add ${formatCurrency(portfolioGain)} ` +
    `to your portfolio, while the estimated cost of giving up a free year is ${formatCurrency(costOfWorking)}.`

  if (!isSafeNow) {
    explanation +=
      ` Your current withdrawal rate is ${formatPercent(withdrawalRateNow)}, above the ${formatPercent(safeWithdrawalRateTarget)} safety target, so this is treated as a strong work-one-more-year case.`
  }

  return {
    benefitOfWorking,
    costOfWorking,
    score,
    recommendationFromScore,
    recommendation,
    swrAdjusted,
    isSafeNow,
    isSafeInOneYear,
    explanation,
    derived: {
      portfolioNow,
      portfolioInOneYear,
      portfolioGain,
      withdrawalRateNow,
      withdrawalRateInOneYear,
      withdrawalRateImprovement,
      fundedYearsNow,
      fundedYearsInOneYear,
      fundedYearsGain,
      retirementYearsNow,
      retirementYearsInOneYear,
      freeYearValue,
      workDisutility,
      opportunityValue,
      safeWithdrawalRateTarget,
      safeWithdrawalRateTargetInOneYear,
      requiredPortfolioAtSafeWithdrawal,
      swrGapNow,
      swrGapInOneYear,
    },
  }
}
