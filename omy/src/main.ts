import {
  DEFAULT_INPUTS,
  DEFAULT_SCENARIO,
  HARD_LIMITS,
  OMY_SCENARIOS,
  OMY_SCENARIO_ORDER,
  SAFE_FALLBACKS,
  type OMYScenarioKey,
} from "./constants"
import {
  RECOMMENDATION_CLASS_LIST,
  createOMYDom,
  recommendationClass,
} from "./dom"
import {
  formatCurrency,
  formatPercent,
  formatPercentInput,
  formatRecommendation,
  formatSignedCurrency,
  formatWholeYears,
  formatYears,
} from "./format"
import { calculateOMY } from "./model"
import type { OMYInputKey, OMYInputs } from "./types"

type RawInputs = Record<OMYInputKey, string>
type ValidationErrors = Partial<Record<OMYInputKey, string>>

const INPUT_KEYS = Object.keys(DEFAULT_INPUTS) as OMYInputKey[]

function toRawInputs(inputs: OMYInputs): RawInputs {
  const raw = {} as RawInputs
  for (const key of INPUT_KEYS) {
    raw[key] = inputs[key].toString()
  }
  return raw
}

function setText(node: HTMLElement, value: string): void {
  if (node.textContent !== value) {
    node.textContent = value
  }
}

function formatInputNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString()
  }
  return Number(value.toFixed(6)).toString()
}

function parseRawNumber(rawValue: string): number | null {
  if (rawValue.trim() === "") {
    return null
  }
  const parsed = Number(rawValue)
  return Number.isFinite(parsed) ? parsed : null
}

function minMessageForKey(key: OMYInputKey): string {
  if (key === "annualSavingsIfWork") {
    return "Must be zero or greater."
  }
  if (
    key === "payForYearOff" ||
    key === "extraCompNeededToWork" ||
    key === "freedomOpportunityValue"
  ) {
    return "Must be zero or greater."
  }
  if (key === "freedomOpportunityProbability") {
    return "Must be between 0% and 100%."
  }
  if (key === "yearsInRetirementIfStopNow") {
    return "Must be at least 5 years."
  }
  return "Must be greater than zero."
}

function maxMessageForKey(key: OMYInputKey): string {
  if (key === "expectedRealReturn") {
    return "Capped at 0.15 (15%)."
  }
  if (key === "freedomOpportunityProbability") {
    return "Must be between 0% and 100%."
  }
  if (key === "yearsInRetirementIfStopNow") {
    return "Capped at 60 years."
  }
  return "Value is above the allowed range."
}

function normalizeInputs(raw: RawInputs): {
  inputs: OMYInputs
  errors: ValidationErrors
} {
  const errors: ValidationErrors = {}
  const inputs = {} as OMYInputs

  for (const key of INPUT_KEYS) {
    const parsed = parseRawNumber(raw[key])

    if (parsed === null) {
      inputs[key] = SAFE_FALLBACKS[key]
      errors[key] = "Enter a valid number."
      continue
    }

    const bounds = HARD_LIMITS[key]
    let next = parsed

    if (next < bounds.min) {
      next = bounds.min
      errors[key] = minMessageForKey(key)
    }

    if (bounds.max !== undefined && next > bounds.max) {
      next = bounds.max
      errors[key] = maxMessageForKey(key)
    }

    if (key === "yearsInRetirementIfStopNow") {
      const rounded = Math.round(next)
      if (rounded !== next && !errors[key]) {
        errors[key] = "Rounded to the nearest year."
      }
      next = rounded
    }

    inputs[key] = next
  }

  return { inputs, errors }
}

function syncInputsFromValues(
  rawInputs: RawInputs,
  domInputs: Record<OMYInputKey, HTMLInputElement>,
): void {
  for (const key of INPUT_KEYS) {
    const input = domInputs[key]
    if (key === "expectedRealReturn") {
      const decimal = parseRawNumber(rawInputs[key]) ?? 0
      input.value = (decimal * 100).toString()
      continue
    }
    if (key === "freedomOpportunityProbability") {
      const decimal = parseRawNumber(rawInputs[key]) ?? 0
      input.value = Math.round(decimal * 100).toString()
      continue
    }
    if (key === "yearsInRetirementIfStopNow") {
      const years = parseRawNumber(rawInputs[key]) ?? 30
      input.value = Math.round(years).toString()
      continue
    }
    input.value = rawInputs[key]
  }
}

function applyInputErrors(
  domInputs: Record<OMYInputKey, HTMLInputElement>,
  errorNodes: Record<OMYInputKey, HTMLElement>,
  errors: ValidationErrors,
): void {
  for (const key of INPUT_KEYS) {
    const error = errors[key] ?? ""
    const input = domInputs[key]
    const node = errorNodes[key]

    input.setAttribute("aria-invalid", error ? "true" : "false")
    node.hidden = !error
    setText(node, error)
  }
}

function formatFlipPoint(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }
  if (value <= 0) {
    return "Already below zero"
  }
  return formatCurrency(value)
}

function formatReturnSliderInput(decimal: number): string {
  if (!Number.isFinite(decimal)) {
    return "0.0%"
  }
  return `${(decimal * 100).toFixed(1)}%`
}

function mount(container: HTMLElement): void {
  const refs = createOMYDom(container)
  let rawInputs = toRawInputs(DEFAULT_INPUTS)
  let activeScenario: OMYScenarioKey = DEFAULT_SCENARIO
  syncInputsFromValues(rawInputs, refs.inputs)

  const updateScenarioUI = (): void => {
    for (const key of OMY_SCENARIO_ORDER) {
      const button = refs.scenarioButtons[key]
      const selected = key === activeScenario
      button.classList.toggle("is-active", selected)
      button.setAttribute("aria-pressed", selected ? "true" : "false")
    }

    const scenario = OMY_SCENARIOS[activeScenario]
    setText(
      refs.scenarioSummary,
      `${scenario.percentileLabel}: net worth ~${formatCurrency(scenario.netWorth)}, annual income ~${formatCurrency(scenario.annualIncome)}.`,
    )
  }

  const render = (normalizeToInputs = false): void => {
    const normalized = normalizeInputs(rawInputs)

    if (normalizeToInputs) {
      rawInputs = toRawInputs(normalized.inputs)
      syncInputsFromValues(rawInputs, refs.inputs)
    }

    const result = calculateOMY(normalized.inputs)
    applyInputErrors(refs.inputs, refs.errors, normalized.errors)

    refs.resultCard.classList.remove(...RECOMMENDATION_CLASS_LIST)
    refs.resultCard.classList.add(recommendationClass(result.recommendation))

    setText(
      refs.probabilityValue,
      formatPercentInput(normalized.inputs.freedomOpportunityProbability),
    )
    setText(
      refs.returnValue,
      formatReturnSliderInput(normalized.inputs.expectedRealReturn),
    )
    setText(
      refs.retirementYearsValue,
      `${Math.round(normalized.inputs.yearsInRetirementIfStopNow).toString()} years`,
    )

    setText(refs.recommendationLabel, formatRecommendation(result.recommendation))
    setText(refs.score, formatSignedCurrency(result.score))
    setText(refs.explanation, result.explanation)
    setText(refs.benefitValue, formatCurrency(result.benefitOfWorking))
    setText(refs.costValue, formatCurrency(result.costOfWorking))

    setText(refs.derived.portfolioNow, formatCurrency(result.derived.portfolioNow))
    setText(refs.derived.portfolioInOneYear, formatCurrency(result.derived.portfolioInOneYear))
    setText(refs.derived.portfolioGain, formatSignedCurrency(result.derived.portfolioGain))

    setText(refs.derived.withdrawalRateNow, formatPercent(result.derived.withdrawalRateNow))
    setText(refs.derived.withdrawalRateInOneYear, formatPercent(result.derived.withdrawalRateInOneYear))
    setText(
      refs.derived.withdrawalRateImprovement,
      formatPercent(result.derived.withdrawalRateImprovement),
    )

    setText(refs.derived.fundedYearsNow, formatYears(result.derived.fundedYearsNow))
    setText(refs.derived.fundedYearsInOneYear, formatYears(result.derived.fundedYearsInOneYear))
    setText(refs.derived.fundedYearsGain, formatYears(result.derived.fundedYearsGain))

    setText(refs.derived.retirementYearsNow, formatWholeYears(result.derived.retirementYearsNow))
    setText(
      refs.derived.retirementYearsInOneYear,
      formatWholeYears(result.derived.retirementYearsInOneYear),
    )

    setText(refs.derived.freeYearValue, formatCurrency(result.derived.freeYearValue))
    setText(refs.derived.workDisutility, formatCurrency(result.derived.workDisutility))
    setText(refs.derived.opportunityValue, formatCurrency(result.derived.opportunityValue))
    setText(refs.totalCostValue, formatCurrency(result.costOfWorking))
    setText(
      refs.swrTargetValue,
      `${formatPercent(result.derived.safeWithdrawalRateTarget)} -> ${formatPercent(result.derived.safeWithdrawalRateTargetInOneYear)}`,
    )
    setText(
      refs.swrRequiredPortfolioValue,
      formatCurrency(result.derived.requiredPortfolioAtSafeWithdrawal),
    )
    setText(refs.swrGapNowValue, formatCurrency(result.derived.swrGapNow))
    setText(refs.swrGapInOneYearValue, formatCurrency(result.derived.swrGapInOneYear))
    setText(
      refs.swrStatusValue,
      result.isSafeNow
        ? "At or below target now"
        : result.isSafeInOneYear
          ? "Above target now, at target after one year"
          : "Above target in both scenarios",
    )

    const components = [
      { label: "Free year value", value: result.derived.freeYearValue },
      { label: "Work disutility", value: result.derived.workDisutility },
      {
        label: "Foregone opportunity",
        value: result.derived.opportunityValue,
      },
    ]
    const largest = components.reduce((current, next) =>
      next.value > current.value ? next : current,
    )

    const dominantSide =
      result.benefitOfWorking >= result.costOfWorking
        ? "Financial gain dominates"
        : "Cost of giving up freedom dominates"

    const freeYearFlipPoint =
      result.benefitOfWorking -
      result.derived.workDisutility -
      result.derived.opportunityValue

    const workDisutilityFlipPoint =
      result.benefitOfWorking -
      result.derived.freeYearValue -
      result.derived.opportunityValue

    const opportunityFlipPoint =
      result.benefitOfWorking -
      result.derived.freeYearValue -
      result.derived.workDisutility

    setText(refs.dominantSideValue, dominantSide)
    setText(
      refs.largestCostValue,
      `${largest.label} (${formatCurrency(largest.value)})`,
    )
    setText(refs.flipFreeYearValue, formatFlipPoint(freeYearFlipPoint))
    setText(refs.flipWorkDisutilityValue, formatFlipPoint(workDisutilityFlipPoint))
    setText(refs.flipOpportunityValue, formatFlipPoint(opportunityFlipPoint))

    setText(
      refs.liveRegion,
      `${formatRecommendation(result.recommendation)}. Score ${formatSignedCurrency(result.score)}.` +
        (result.swrAdjusted ? " Recommendation adjusted for SWR safety." : ""),
    )
    updateScenarioUI()
  }

  const applyScenario = (
    scenarioKey: OMYScenarioKey,
    opts?: { resetAll?: boolean },
  ): void => {
    if (opts?.resetAll) {
      rawInputs = toRawInputs(DEFAULT_INPUTS)
    }
    const scenario = OMY_SCENARIOS[scenarioKey]
    rawInputs.currentPortfolio = scenario.appliedInputs.currentPortfolio.toString()
    rawInputs.annualSpending = scenario.appliedInputs.annualSpending.toString()
    rawInputs.annualSavingsIfWork = scenario.appliedInputs.annualSavingsIfWork.toString()
    activeScenario = scenarioKey
    syncInputsFromValues(rawInputs, refs.inputs)
    render(true)
  }

  for (const key of INPUT_KEYS) {
    const input = refs.inputs[key]

    input.addEventListener("input", () => {
      if (key === "expectedRealReturn") {
        const asPercent = parseRawNumber(input.value) ?? 0
        rawInputs[key] = (asPercent / 100).toString()
      } else if (key === "freedomOpportunityProbability") {
        const asPercent = parseRawNumber(input.value) ?? 0
        rawInputs[key] = (asPercent / 100).toString()
      } else {
        rawInputs[key] = input.value
      }

      render(false)
    })

    input.addEventListener("blur", () => {
      if (key === "expectedRealReturn") {
        const asPercent = parseRawNumber(input.value) ?? 0
        rawInputs[key] = (asPercent / 100).toString()
      } else if (key === "freedomOpportunityProbability") {
        const asPercent = parseRawNumber(input.value) ?? 0
        rawInputs[key] = (asPercent / 100).toString()
      } else {
        rawInputs[key] = input.value
      }

      const normalized = normalizeInputs(rawInputs)
      rawInputs[key] = formatInputNumber(normalized.inputs[key])

      render(true)
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
