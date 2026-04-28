import { READINESS_TOLERANCE_RATIO, SCORE_THRESHOLDS } from "./constants"
import { formatCurrency, formatPercent, formatSignedCurrencyCompact } from "./format"
import type {
  OMYMarginalResult,
  OMYModelInputs,
  OMYReadinessResult,
  OMYRecommendation,
  OMYResult,
} from "./types"

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

function summarizeMarginalDirection(score: number): string {
  if (score > 0) {
    return `the marginal year favours working by about ${formatSignedCurrencyCompact(score)}`
  }
  if (score < 0) {
    return `the marginal year favours stopping by about ${formatSignedCurrencyCompact(score)}`
  }
  return "the marginal year is roughly neutral"
}

function calculateReadiness(
  withdrawalRateNow: number,
  withdrawalRateInOneYear: number,
  targetWithdrawalRate: number,
  gapNow: number,
  gapInOneYear: number,
): OMYReadinessResult {
  const isReadyNow = withdrawalRateNow <= targetWithdrawalRate
  const closesGapInOneYear = withdrawalRateInOneYear <= targetWithdrawalRate

  let status: OMYReadinessResult["status"] = "not-ready"

  if (isReadyNow) {
    status = "ready"
  } else if (
    closesGapInOneYear ||
    withdrawalRateNow <= targetWithdrawalRate * READINESS_TOLERANCE_RATIO ||
    withdrawalRateInOneYear <= targetWithdrawalRate * READINESS_TOLERANCE_RATIO
  ) {
    status = "borderline"
  }

  return {
    status,
    isReadyNow,
    closesGapInOneYear,
    currentWithdrawalRate: withdrawalRateNow,
    oneYearWithdrawalRate: withdrawalRateInOneYear,
    targetWithdrawalRate,
    gapNow,
    gapInOneYear,
  }
}

function composeNarrative(
  readiness: OMYReadinessResult,
  marginal: OMYMarginalResult,
): Pick<OMYResult, "primaryConclusion" | "primaryExplanation" | "secondaryInsight"> {
  const readinessSentence = `Your current withdrawal rate is ${formatPercent(readiness.currentWithdrawalRate)} against a ${formatPercent(readiness.targetWithdrawalRate)} safety target. One more year moves it to ${formatPercent(readiness.oneYearWithdrawalRate)}.`

  if (readiness.status === "not-ready") {
    return {
      primaryConclusion: "Not financially ready yet",
      primaryExplanation: `${readinessSentence} Working one more year improves your position, but it still leaves a gap of ${formatCurrency(readiness.gapInOneYear)} to your safety level.`,
      secondaryInsight: `Separately, ${summarizeMarginalDirection(marginal.score)} based on your delayed-freedom assumptions.`,
    }
  }

  if (readiness.status === "borderline") {
    const bridge = readiness.closesGapInOneYear
      ? "You are close, and one more year would likely close the safety gap."
      : "You are close to the target, but still slightly above it." 

    return {
      primaryConclusion: "Borderline financial readiness",
      primaryExplanation: `${readinessSentence} ${bridge}`,
      secondaryInsight: `On the one-more-year trade-off, ${summarizeMarginalDirection(marginal.score)}.`,
    }
  }

  let readyConclusion = "Financially ready — close call on one more year"
  if (marginal.status === "strong-work" || marginal.status === "lean-work") {
    readyConclusion = "Financially ready — one more year still looks attractive"
  } else if (marginal.status === "strong-stop" || marginal.status === "lean-stop") {
    readyConclusion = "Financially ready — stopping now looks reasonable"
  }

  return {
    primaryConclusion: readyConclusion,
    primaryExplanation: `${readinessSentence} You are at or below your selected safety target now.`,
    secondaryInsight: `The marginal trade-off suggests ${summarizeMarginalDirection(marginal.score)}.`,
  }
}

export function calculateOMY(inputs: OMYModelInputs): OMYResult {
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

  const targetWithdrawalRate = inputs.safetyWithdrawalTarget
  const requiredPortfolioAtTarget = safeDivide(inputs.annualSpending, targetWithdrawalRate)
  const requiredPortfolioAtTargetInOneYear = requiredPortfolioAtTarget
  const gapNow = Math.max(requiredPortfolioAtTarget - portfolioNow, 0)
  const gapInOneYear = Math.max(requiredPortfolioAtTargetInOneYear - portfolioInOneYear, 0)

  const estimatedValueOfDelayedFreedom =
    inputs.freeYearValue + inputs.workDisutility + inputs.opportunityValue
  const score = portfolioGain - estimatedValueOfDelayedFreedom

  const readiness = calculateReadiness(
    withdrawalRateNow,
    withdrawalRateInOneYear,
    targetWithdrawalRate,
    gapNow,
    gapInOneYear,
  )

  const marginal: OMYMarginalResult = {
    benefitOfWorking: portfolioGain,
    estimatedValueOfDelayedFreedom,
    score,
    status: toRecommendation(score),
  }

  const narrative = composeNarrative(readiness, marginal)

  return {
    readiness,
    marginal,
    primaryConclusion: narrative.primaryConclusion,
    primaryExplanation: narrative.primaryExplanation,
    secondaryInsight: narrative.secondaryInsight,
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
      requiredPortfolioAtTarget,
      requiredPortfolioAtTargetInOneYear,
      gapNow,
      gapInOneYear,
      freeYearValue: inputs.freeYearValue,
      workDisutility: inputs.workDisutility,
      opportunityValue: inputs.opportunityValue,
      impliedIncome: inputs.annualSpending + inputs.annualSavingsIfWork,
    },
  }
}
