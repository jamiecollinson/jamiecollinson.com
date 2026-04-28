import {
  DEFAULT_CUSTOM_OPPORTUNITY_MULTIPLIER,
  DEFAULT_FREE_YEAR_PLAN,
  DEFAULT_INPUTS,
  DEFAULT_SCENARIO,
  DEFAULT_WORK_ATTITUDE,
  FREE_YEAR_PLAN_OPTIONS,
  HARD_LIMITS,
  OMY_SCENARIOS,
  OMY_SCENARIO_ORDER,
  SAFE_FALLBACKS,
  WORK_ATTITUDE_OPTIONS,
  type FreeYearPlanKey,
  type OMYScenarioKey,
  type WorkAttitudeKey,
} from "./constants"
import {
  RECOMMENDATION_CLASS_LIST,
  createOMYDom,
  readinessFallbackTone,
  recommendationClass,
} from "./dom"
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatPercentInput,
  formatReadiness,
  formatRecommendationBadge,
  formatSignedCurrency,
  formatSignedCurrencyCompact,
  formatWholeYears,
  formatYears,
} from "./format"
import { calculateOMY } from "./model"
import type { OMYModelInputs, OMYNumericInputKey } from "./types"

type AppState = {
  modelInputs: OMYModelInputs
  activeScenario: OMYScenarioKey
  workAttitude: WorkAttitudeKey
  freeYearPlan: FreeYearPlanKey
  customOpportunityMultiplier: number
  advancedSubjective: boolean
  manualWorkDisutility: number
  manualOpportunityValue: number
  sabbaticalTouched: boolean
}

function setText(node: HTMLElement, value: string): void {
  if (node.textContent !== value) {
    node.textContent = value
  }
}

function parseNumber(raw: string): number | null {
  if (raw.trim() === "") {
    return null
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function clampInput(key: OMYNumericInputKey, value: number): number {
  const limits = HARD_LIMITS[key]
  if (value < limits.min) {
    return limits.min
  }
  if (limits.max !== undefined && value > limits.max) {
    return limits.max
  }
  return value
}

function workDisutilityRate(attitude: WorkAttitudeKey): number {
  return WORK_ATTITUDE_OPTIONS.find((option) => option.key === attitude)?.disutilityRate ?? 0
}

function planMultiplier(plan: FreeYearPlanKey, customMultiplier: number): number {
  const option = FREE_YEAR_PLAN_OPTIONS.find((item) => item.key === plan)
  if (!option) {
    return 0
  }
  return option.usesCustomMultiplier ? customMultiplier : option.multiplier
}

function toInputString(value: number): string {
  if (!Number.isFinite(value)) {
    return "0"
  }
  if (Number.isInteger(value)) {
    return value.toString()
  }
  return Number(value.toFixed(4)).toString()
}

function createDefaultState(): AppState {
  return {
    modelInputs: { ...DEFAULT_INPUTS },
    activeScenario: DEFAULT_SCENARIO,
    workAttitude: DEFAULT_WORK_ATTITUDE,
    freeYearPlan: DEFAULT_FREE_YEAR_PLAN,
    customOpportunityMultiplier: DEFAULT_CUSTOM_OPPORTUNITY_MULTIPLIER,
    advancedSubjective: false,
    manualWorkDisutility: DEFAULT_INPUTS.workDisutility,
    manualOpportunityValue: DEFAULT_INPUTS.opportunityValue,
    sabbaticalTouched: false,
  }
}

function mount(container: HTMLElement): void {
  const refs = createOMYDom(container)
  const anchorButtons = Array.from(
    refs.root.querySelectorAll<HTMLButtonElement>(".omy-anchor-button"),
  )

  let state = createDefaultState()

  const syncScenarioUI = (): void => {
    for (const key of OMY_SCENARIO_ORDER) {
      const button = refs.scenarioButtons[key]
      const selected = key === state.activeScenario
      button.classList.toggle("is-active", selected)
      button.setAttribute("aria-pressed", selected ? "true" : "false")
    }

    const scenario = OMY_SCENARIOS[state.activeScenario]
    setText(
      refs.scenarioSummary,
      `${scenario.percentileLabel}: net worth ~${formatCurrency(scenario.netWorth)}, annual income ~${formatCurrency(scenario.annualIncome)}.`,
    )
  }

  const syncInputs = (): void => {
    refs.inputs.currentPortfolio.value = toInputString(state.modelInputs.currentPortfolio)
    refs.inputs.annualSpending.value = toInputString(state.modelInputs.annualSpending)
    refs.inputs.annualSavingsIfWork.value = toInputString(state.modelInputs.annualSavingsIfWork)
    refs.inputs.expectedRealReturn.value = toInputString(state.modelInputs.expectedRealReturn * 100)
    refs.inputs.safetyWithdrawalTarget.value = toInputString(
      state.modelInputs.safetyWithdrawalTarget * 100,
    )
    refs.inputs.yearsInRetirementIfStopNow.value = toInputString(
      state.modelInputs.yearsInRetirementIfStopNow,
    )
    refs.inputs.sabbaticalWillingnessToPay.value = toInputString(state.modelInputs.freeYearValue)

    refs.inputs.workYearAttitude.value = state.workAttitude
    refs.inputs.freeYearPlan.value = state.freeYearPlan
    refs.inputs.customOpportunityMultiplier.value = toInputString(
      state.customOpportunityMultiplier,
    )
    refs.inputs.manualWorkDisutility.value = toInputString(state.manualWorkDisutility)
    refs.inputs.manualOpportunityValue.value = toInputString(state.manualOpportunityValue)
    refs.advancedToggle.checked = state.advancedSubjective
  }

  const applyScenario = (
    scenarioKey: OMYScenarioKey,
    opts?: { resetAll?: boolean },
  ): void => {
    if (opts?.resetAll) {
      state = createDefaultState()
    }

    const scenario = OMY_SCENARIOS[scenarioKey]
    state.modelInputs.currentPortfolio = scenario.appliedInputs.currentPortfolio
    state.modelInputs.annualSpending = scenario.appliedInputs.annualSpending
    state.modelInputs.annualSavingsIfWork = scenario.appliedInputs.annualSavingsIfWork

    if (!state.sabbaticalTouched) {
      state.modelInputs.freeYearValue = state.modelInputs.annualSpending
    }

    state.activeScenario = scenarioKey
    syncInputs()
    render()
  }

  const render = (): void => {
    const impliedIncome = state.modelInputs.annualSpending + state.modelInputs.annualSavingsIfWork
    const derivedWorkDisutility = impliedIncome * workDisutilityRate(state.workAttitude)
    const derivedOpportunityValue =
      state.modelInputs.annualSpending *
      planMultiplier(state.freeYearPlan, state.customOpportunityMultiplier)

    const workDisutility = state.advancedSubjective
      ? state.manualWorkDisutility
      : derivedWorkDisutility
    const opportunityValue = state.advancedSubjective
      ? state.manualOpportunityValue
      : derivedOpportunityValue

    const calculation = calculateOMY({
      ...state.modelInputs,
      workDisutility,
      opportunityValue,
    })

    refs.customOpportunityField.hidden = !FREE_YEAR_PLAN_OPTIONS.find(
      (option) => option.key === state.freeYearPlan,
    )?.usesCustomMultiplier
    refs.manualFields.hidden = !state.advancedSubjective

    const toneClass =
      calculation.readiness.status === "ready"
        ? recommendationClass(calculation.marginal.status)
        : readinessFallbackTone(calculation.readiness.status)

    refs.resultCard.classList.remove(...RECOMMENDATION_CLASS_LIST)
    if (toneClass) {
      refs.resultCard.classList.add(toneClass)
    }

    setText(refs.primaryConclusion, calculation.primaryConclusion)
    setText(refs.score, formatSignedCurrencyCompact(calculation.marginal.score))
    setText(refs.primaryExplanation, calculation.primaryExplanation)
    setText(refs.secondaryInsight, calculation.secondaryInsight)

    setText(refs.readinessBadge, `Readiness: ${formatReadiness(calculation.readiness.status)}`)
    setText(
      refs.marginalBadge,
      `Marginal year: ${formatRecommendationBadge(calculation.marginal.status)}`,
    )

    setText(refs.headlineBenefit, formatCurrencyCompact(calculation.marginal.benefitOfWorking))
    setText(
      refs.headlineDelayedFreedom,
      formatCurrencyCompact(calculation.marginal.estimatedValueOfDelayedFreedom),
    )

    setText(refs.comparisonStopPortfolio, formatCurrency(calculation.derived.portfolioNow))
    setText(refs.comparisonStopWithdrawal, formatPercent(calculation.derived.withdrawalRateNow))
    setText(refs.comparisonStopGap, formatCurrency(calculation.derived.gapNow))

    setText(refs.comparisonWorkPortfolio, formatCurrency(calculation.derived.portfolioInOneYear))
    setText(
      refs.comparisonWorkWithdrawal,
      formatPercent(calculation.derived.withdrawalRateInOneYear),
    )
    setText(refs.comparisonWorkGap, formatCurrency(calculation.derived.gapInOneYear))

    setText(refs.tradeoffBenefit, formatCurrency(calculation.marginal.benefitOfWorking))
    setText(refs.tradeoffFreeYear, formatCurrency(calculation.derived.freeYearValue))
    setText(refs.tradeoffWorkDisutility, formatCurrency(calculation.derived.workDisutility))
    setText(refs.tradeoffOpportunity, formatCurrency(calculation.derived.opportunityValue))
    setText(
      refs.tradeoffDelayedFreedom,
      formatCurrency(calculation.marginal.estimatedValueOfDelayedFreedom),
    )
    setText(refs.tradeoffNet, formatSignedCurrency(calculation.marginal.score))

    setText(refs.returnValue, formatPercentInput(state.modelInputs.expectedRealReturn))
    setText(refs.safetyTargetValue, formatPercentInput(state.modelInputs.safetyWithdrawalTarget))
    setText(refs.retirementYearsValue, formatWholeYears(state.modelInputs.yearsInRetirementIfStopNow))

    setText(refs.impliedIncome, formatCurrency(impliedIncome))
    setText(
      refs.workDisutilityHint,
      state.advancedSubjective
        ? `Manual work burden: ${formatCurrency(workDisutility)}`
        : `Implied work burden from your answer: ${formatCurrency(workDisutility)}`,
    )
    setText(
      refs.opportunityHint,
      state.advancedSubjective
        ? `Manual foregone opportunity: ${formatCurrency(opportunityValue)}`
        : `Implied foregone opportunity: ${formatCurrency(opportunityValue)}`,
    )

    setText(refs.requiredPortfolio, formatCurrency(calculation.derived.requiredPortfolioAtTarget))
    setText(refs.gapNow, formatCurrency(calculation.derived.gapNow))
    setText(refs.gapInOneYear, formatCurrency(calculation.derived.gapInOneYear))
    setText(refs.fundedYearsNow, formatYears(calculation.derived.fundedYearsNow))
    setText(refs.fundedYearsInOneYear, formatYears(calculation.derived.fundedYearsInOneYear))
    setText(refs.fundedYearsGain, formatYears(calculation.derived.fundedYearsGain))
    setText(
      refs.withdrawalImprovement,
      formatPercent(calculation.derived.withdrawalRateImprovement),
    )

    const freeFlip =
      calculation.marginal.benefitOfWorking -
      calculation.derived.workDisutility -
      calculation.derived.opportunityValue
    const workFlip =
      calculation.marginal.benefitOfWorking -
      calculation.derived.freeYearValue -
      calculation.derived.opportunityValue
    const opportunityFlip =
      calculation.marginal.benefitOfWorking -
      calculation.derived.freeYearValue -
      calculation.derived.workDisutility

    setText(
      refs.flipFreeYear,
      freeFlip <= 0
        ? "Marginal trade-off already favours stopping before this factor."
        : `Would flip near ${formatCurrency(freeFlip)}.`,
    )
    setText(
      refs.flipWorkDisutility,
      workFlip <= 0
        ? "Marginal trade-off already favours stopping before this factor."
        : `Would flip near ${formatCurrency(workFlip)}.`,
    )
    setText(
      refs.flipOpportunity,
      opportunityFlip <= 0
        ? "Marginal trade-off already favours stopping before this factor."
        : `Would flip near ${formatCurrency(opportunityFlip)}.`,
    )

    setText(
      refs.liveRegion,
      `${calculation.primaryConclusion}. ${formatReadiness(calculation.readiness.status)} readiness. ${formatRecommendationBadge(calculation.marginal.status)} marginal year.`,
    )

    syncScenarioUI()
  }

  const updateNumericInput = (
    key: OMYNumericInputKey,
    rawValue: string,
    opts?: { isPercent?: boolean; round?: boolean },
  ): void => {
    const parsed = parseNumber(rawValue)
    if (parsed === null) {
      state.modelInputs[key] = SAFE_FALLBACKS[key]
      return
    }

    let next = opts?.isPercent ? parsed / 100 : parsed
    next = clampInput(key, next)

    if (opts?.round) {
      next = Math.round(next)
    }

    state.modelInputs[key] = next
  }

  refs.inputs.currentPortfolio.addEventListener("input", () => {
    updateNumericInput("currentPortfolio", refs.inputs.currentPortfolio.value)
    render()
  })

  refs.inputs.annualSpending.addEventListener("input", () => {
    updateNumericInput("annualSpending", refs.inputs.annualSpending.value)
    if (!state.sabbaticalTouched) {
      state.modelInputs.freeYearValue = state.modelInputs.annualSpending
      refs.inputs.sabbaticalWillingnessToPay.value = toInputString(state.modelInputs.freeYearValue)
    }
    render()
  })

  refs.inputs.annualSavingsIfWork.addEventListener("input", () => {
    updateNumericInput("annualSavingsIfWork", refs.inputs.annualSavingsIfWork.value)
    render()
  })

  refs.inputs.expectedRealReturn.addEventListener("input", () => {
    updateNumericInput("expectedRealReturn", refs.inputs.expectedRealReturn.value, {
      isPercent: true,
    })
    render()
  })

  refs.inputs.safetyWithdrawalTarget.addEventListener("input", () => {
    updateNumericInput("safetyWithdrawalTarget", refs.inputs.safetyWithdrawalTarget.value, {
      isPercent: true,
    })
    render()
  })

  refs.inputs.yearsInRetirementIfStopNow.addEventListener("input", () => {
    updateNumericInput(
      "yearsInRetirementIfStopNow",
      refs.inputs.yearsInRetirementIfStopNow.value,
      { round: true },
    )
    render()
  })

  refs.inputs.sabbaticalWillingnessToPay.addEventListener("input", () => {
    updateNumericInput("freeYearValue", refs.inputs.sabbaticalWillingnessToPay.value)
    state.sabbaticalTouched = true
    render()
  })

  refs.inputs.workYearAttitude.addEventListener("change", () => {
    state.workAttitude = refs.inputs.workYearAttitude.value as WorkAttitudeKey
    render()
  })

  refs.inputs.freeYearPlan.addEventListener("change", () => {
    state.freeYearPlan = refs.inputs.freeYearPlan.value as FreeYearPlanKey
    render()
  })

  refs.inputs.customOpportunityMultiplier.addEventListener("input", () => {
    const parsed = parseNumber(refs.inputs.customOpportunityMultiplier.value)
    state.customOpportunityMultiplier =
      parsed === null ? DEFAULT_CUSTOM_OPPORTUNITY_MULTIPLIER : Math.max(parsed, 0)
    render()
  })

  refs.advancedToggle.addEventListener("change", () => {
    state.advancedSubjective = refs.advancedToggle.checked
    render()
  })

  refs.inputs.manualWorkDisutility.addEventListener("input", () => {
    const parsed = parseNumber(refs.inputs.manualWorkDisutility.value)
    state.manualWorkDisutility = parsed === null ? 0 : Math.max(parsed, 0)
    render()
  })

  refs.inputs.manualOpportunityValue.addEventListener("input", () => {
    const parsed = parseNumber(refs.inputs.manualOpportunityValue.value)
    state.manualOpportunityValue = parsed === null ? 0 : Math.max(parsed, 0)
    render()
  })

  for (const button of anchorButtons) {
    button.addEventListener("click", () => {
      const anchor = parseNumber(button.dataset.anchor ?? "")
      if (anchor === null) {
        return
      }
      state.modelInputs.freeYearValue = Math.round(state.modelInputs.annualSpending * anchor)
      state.sabbaticalTouched = true
      refs.inputs.sabbaticalWillingnessToPay.value = toInputString(state.modelInputs.freeYearValue)
      render()
    })
  }

  for (const scenarioKey of OMY_SCENARIO_ORDER) {
    refs.scenarioButtons[scenarioKey].addEventListener("click", () => {
      applyScenario(scenarioKey)
    })
  }

  refs.resetButton.addEventListener("click", () => {
    applyScenario(DEFAULT_SCENARIO, { resetAll: true })
  })

  applyScenario(DEFAULT_SCENARIO, { resetAll: true })
}

function boot(): void {
  const mountNode = document.querySelector<HTMLElement>("#omy-app")
  if (!mountNode) {
    return
  }
  mount(mountNode)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true })
} else {
  boot()
}
