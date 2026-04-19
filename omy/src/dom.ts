import {
  DEFAULT_SCENARIO,
  HARD_LIMITS,
  INPUT_CONFIGS,
  OMY_SCENARIOS,
  OMY_SCENARIO_ORDER,
  type OMYScenarioKey,
} from "./constants"
import type { OMYDerived, OMYInputKey, OMYRecommendation } from "./types"

export type OMYDomRefs = {
  root: HTMLElement
  resultCard: HTMLElement
  inputs: Record<OMYInputKey, HTMLInputElement>
  errors: Record<OMYInputKey, HTMLElement>
  returnValue: HTMLElement
  probabilityValue: HTMLElement
  retirementYearsValue: HTMLElement
  scenarioButtons: Record<OMYScenarioKey, HTMLButtonElement>
  scenarioSummary: HTMLElement
  resetButton: HTMLButtonElement
  recommendationLabel: HTMLElement
  score: HTMLElement
  explanation: HTMLElement
  benefitValue: HTMLElement
  costValue: HTMLElement
  derived: Record<keyof OMYDerived, HTMLElement>
  totalCostValue: HTMLElement
  swrTargetValue: HTMLElement
  swrRequiredPortfolioValue: HTMLElement
  swrGapNowValue: HTMLElement
  swrGapInOneYearValue: HTMLElement
  swrStatusValue: HTMLElement
  dominantSideValue: HTMLElement
  largestCostValue: HTMLElement
  flipFreeYearValue: HTMLElement
  flipWorkDisutilityValue: HTMLElement
  flipOpportunityValue: HTMLElement
  liveRegion: HTMLElement
}

const RECOMMENDATION_CLASSES: Record<OMYRecommendation, string> = {
  "strong-work": "omy-tone-strong-work",
  "lean-work": "omy-tone-lean-work",
  "close-call": "omy-tone-close-call",
  "lean-stop": "omy-tone-lean-stop",
  "strong-stop": "omy-tone-strong-stop",
}

export const RECOMMENDATION_CLASS_LIST = Object.values(RECOMMENDATION_CLASSES)

export function recommendationClass(recommendation: OMYRecommendation): string {
  return RECOMMENDATION_CLASSES[recommendation]
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) {
    node.className = className
  }
  if (text) {
    node.textContent = text
  }
  return node
}

function createField(
  key: OMYInputKey,
  labelText: string,
  helperText: string,
  kind:
    | "currency"
    | "decimal"
    | "return-slider"
    | "probability-slider"
    | "years-slider",
  step: string,
): {
  wrapper: HTMLElement
  input: HTMLInputElement
  error: HTMLElement
  sliderValue?: HTMLElement
} {
  const wrapper = el("div", "omy-field")
  const label = el("label", "omy-label", labelText)
  const helper = el("p", "omy-helper", helperText)
  const error = el("p", "omy-error")
  const inputId = `omy-${key}`
  const helperId = `${inputId}-helper`
  const errorId = `${inputId}-error`

  label.htmlFor = inputId
  helper.id = helperId
  error.id = errorId
  error.hidden = true

  let sliderValue: HTMLElement | undefined

  if (
    kind === "return-slider" ||
    kind === "probability-slider" ||
    kind === "years-slider"
  ) {
    const row = el("div", "omy-slider-row")
    const input = el("input", "omy-input omy-input-slider")
    const bounds = HARD_LIMITS[key]
    input.type = "range"
    input.id = inputId
    input.name = key
    input.min =
      kind === "return-slider"
        ? Math.round(bounds.min * 100).toString()
        : kind === "probability-slider"
          ? Math.round(bounds.min * 100).toString()
          : bounds.min.toString()
    input.max =
      kind === "return-slider"
        ? Math.round((bounds.max ?? 0.15) * 100).toString()
        : kind === "probability-slider"
          ? Math.round((bounds.max ?? 1) * 100).toString()
          : (bounds.max ?? 60).toString()
    input.step =
      kind === "return-slider"
        ? (Number(step) * 100).toString()
        : "1"

    input.setAttribute("aria-describedby", `${helperId} ${errorId}`)

    sliderValue = el(
      "output",
      "omy-slider-value omy-mono",
      kind === "probability-slider"
        ? "0%"
        : kind === "years-slider"
          ? "30 years"
          : "3.0%",
    )
    sliderValue.id = `${inputId}-value`

    row.append(input, sliderValue)
    wrapper.append(label, helper, row, error)

    return { wrapper, input, error, sliderValue }
  }

  const input = el("input", "omy-input")
  input.type = "number"
  input.id = inputId
  input.name = key
  input.step = step
  input.inputMode = "decimal"
  input.autocomplete = "off"
  input.setAttribute("aria-describedby", `${helperId} ${errorId}`)

  const bounds = HARD_LIMITS[key]
  if (bounds.min >= 0) {
    input.min = bounds.min.toString()
  }
  if (bounds.max !== undefined) {
    input.max = bounds.max.toString()
  }

  wrapper.append(label, helper, input, error)
  return { wrapper, input, error }
}

function createComparisonGrid(
  title: string,
  derivedRefs: Record<keyof OMYDerived, HTMLElement>,
): HTMLElement {
  const section = el("section", "omy-diagnostic-section")
  const heading = el("h4", "omy-subheading", title)
  const grid = el("div", "omy-comparison-grid")

  const headers = ["", "Now", "In one year", "Change"]
  for (const text of headers) {
    const headerCell = el("div", "omy-comparison-head", text)
    grid.appendChild(headerCell)
  }

  const rows: Array<{
    label: string
    now: keyof OMYDerived
    future: keyof OMYDerived
    change?: keyof OMYDerived
  }> = [
    {
      label: "Portfolio",
      now: "portfolioNow",
      future: "portfolioInOneYear",
      change: "portfolioGain",
    },
    {
      label: "Withdrawal rate",
      now: "withdrawalRateNow",
      future: "withdrawalRateInOneYear",
      change: "withdrawalRateImprovement",
    },
    {
      label: "Funded years",
      now: "fundedYearsNow",
      future: "fundedYearsInOneYear",
      change: "fundedYearsGain",
    },
    {
      label: "Retirement horizon",
      now: "retirementYearsNow",
      future: "retirementYearsInOneYear",
    },
  ]

  for (const row of rows) {
    const labelCell = el("div", "omy-comparison-label", row.label)
    const nowCell = el("div", "omy-comparison-value omy-mono", "-")
    const futureCell = el("div", "omy-comparison-value omy-mono", "-")
    const changeCell = el("div", "omy-comparison-value omy-mono", "-")

    derivedRefs[row.now] = nowCell
    derivedRefs[row.future] = futureCell

    if (row.change) {
      derivedRefs[row.change] = changeCell
    } else {
      changeCell.textContent = "-"
    }

    grid.append(labelCell, nowCell, futureCell, changeCell)
  }

  section.append(heading, grid)
  return section
}

function createMetricRow(labelText: string): { row: HTMLElement; value: HTMLElement } {
  const row = el("div", "omy-metric-row")
  const label = el("span", "omy-metric-label", labelText)
  const value = el("span", "omy-metric-value omy-mono", "-")
  row.append(label, value)
  return { row, value }
}

export function createOMYDom(container: HTMLElement): OMYDomRefs {
  container.innerHTML = ""

  const root = el("section", "omy-app")
  const header = el("header", "omy-header")
  const title = el("h2", "omy-title", "One More Year")
  const framing = el(
    "p",
    "omy-framing",
    "A narrow decision instrument for comparing one more year of work with one year of immediate freedom.",
  )
  const questionLabel = el("p", "omy-question-label", "Key question")
  const question = el(
    "p",
    "omy-question",
    "Is working one more year worth it?",
  )
  const subtitle = el(
    "p",
    "omy-subtitle",
    "The model keeps objective portfolio effects separate from subjective value judgements.",
  )
  header.append(title, framing, questionLabel, question, subtitle)

  const layout = el("div", "omy-layout")
  const inputsColumn = el("div", "omy-inputs")
  const diagnosticsColumn = el("div", "omy-diagnostics")

  const resultCard = el("section", "omy-card omy-result-card")
  const resultLabel = el("p", "omy-result-label", "Primary conclusion")
  const recommendationLabel = el("p", "omy-recommendation", "-")
  const score = el("p", "omy-score omy-mono", "-")
  const explanation = el("p", "omy-explanation", "-")
  const liveRegion = el("p", "omy-sr-only")
  liveRegion.setAttribute("aria-live", "polite")

  const summaryGrid = el("div", "omy-summary-grid")
  const benefit = createMetricRow("Financial benefit of working")
  const cost = createMetricRow("Estimated cost of working")
  summaryGrid.append(benefit.row, cost.row)

  resultCard.append(
    resultLabel,
    recommendationLabel,
    score,
    explanation,
    summaryGrid,
    liveRegion,
  )

  const diagnosticsCard = el("section", "omy-card")
  const diagnosticsHeading = el("h3", "omy-card-title", "Diagnostics")
  const derived = {} as Record<keyof OMYDerived, HTMLElement>
  const diagnosticsGrid = createComparisonGrid("Derived comparisons", derived)
  diagnosticsCard.append(diagnosticsHeading, diagnosticsGrid)

  const costCard = el("section", "omy-card")
  const costHeading = el("h3", "omy-card-title", "Cost terms")
  const freeYearRow = createMetricRow("Free year value")
  const workRow = createMetricRow("Work disutility")
  const opportunityRow = createMetricRow("Foregone opportunity value")
  const totalCostRow = createMetricRow("Total cost of working")
  const costRows = el("div", "omy-metrics")
  costRows.append(freeYearRow.row, workRow.row, opportunityRow.row, totalCostRow.row)
  costCard.append(costHeading, costRows)

  derived.freeYearValue = freeYearRow.value
  derived.workDisutility = workRow.value
  derived.opportunityValue = opportunityRow.value

  const sensitivityCard = el("section", "omy-card")
  const sensitivityHeading = el("h3", "omy-card-title", "SWR and sensitivity")
  const swrTargetRow = createMetricRow("Safe withdrawal target (now -> in one year)")
  const swrRequiredPortfolioRow = createMetricRow("Portfolio needed at target")
  const swrGapNowRow = createMetricRow("Gap to safe level (now)")
  const swrGapInOneYearRow = createMetricRow("Gap to safe level (in one year)")
  const swrStatusRow = createMetricRow("SWR safety status")
  const dominantRow = createMetricRow("Currently dominant side")
  const largestCostRow = createMetricRow("Largest cost component")
  const flipFreeRow = createMetricRow("Free-year value flip point")
  const flipWorkRow = createMetricRow("Work disutility flip point")
  const flipOpportunityRow = createMetricRow("Opportunity value flip point")
  const sensitivityRows = el("div", "omy-metrics")
  sensitivityRows.append(
    swrTargetRow.row,
    swrRequiredPortfolioRow.row,
    swrGapNowRow.row,
    swrGapInOneYearRow.row,
    swrStatusRow.row,
    dominantRow.row,
    largestCostRow.row,
    flipFreeRow.row,
    flipWorkRow.row,
    flipOpportunityRow.row,
  )
  sensitivityCard.append(sensitivityHeading, sensitivityRows)

  const financialInputsCard = el("section", "omy-card")
  const financialHeading = el("h3", "omy-card-title", "Assumptions")
  financialInputsCard.appendChild(financialHeading)

  const scenarioBlock = el("div", "omy-scenarios")
  const scenarioHeading = el(
    "p",
    "omy-scenarios-title",
    "Scenario presets (UK overall percentiles)",
  )
  const scenarioHelper = el(
    "p",
    "omy-scenarios-helper",
    "Use as a starting point, then adjust assumptions manually.",
  )
  const scenarioButtonsRow = el("div", "omy-scenario-buttons")
  const scenarioSummary = el("p", "omy-scenarios-summary")
  const scenarioButtons = {} as Record<OMYScenarioKey, HTMLButtonElement>

  for (const scenarioKey of OMY_SCENARIO_ORDER) {
    const button = el("button", "omy-scenario-button", scenarioKey)
    button.type = "button"
    button.dataset.scenario = scenarioKey
    button.textContent =
      OMY_SCENARIOS[scenarioKey].shortLabel
    button.classList.toggle("is-active", scenarioKey === DEFAULT_SCENARIO)
    button.setAttribute(
      "aria-pressed",
      scenarioKey === DEFAULT_SCENARIO ? "true" : "false",
    )
    scenarioButtons[scenarioKey] = button
    scenarioButtonsRow.appendChild(button)
  }

  scenarioBlock.append(scenarioHeading, scenarioHelper, scenarioButtonsRow, scenarioSummary)
  financialInputsCard.appendChild(scenarioBlock)

  const freedomInputsCard = el("section", "omy-card")
  const freedomHeading = el("h3", "omy-card-title", "Subjective assumptions")
  freedomInputsCard.appendChild(freedomHeading)

  const inputs = {} as Record<OMYInputKey, HTMLInputElement>
  const errors = {} as Record<OMYInputKey, HTMLElement>

  let returnValue: HTMLElement | undefined
  let probabilityValue: HTMLElement | undefined
  let retirementYearsValue: HTMLElement | undefined

  for (const config of INPUT_CONFIGS) {
    const field = createField(
      config.key,
      config.label,
      config.helper,
      config.kind,
      config.step,
    )

    field.input.placeholder = config.placeholder
    inputs[config.key] = field.input
    errors[config.key] = field.error

    if (config.kind === "return-slider" && field.sliderValue) {
      returnValue = field.sliderValue
    }
    if (config.kind === "probability-slider" && field.sliderValue) {
      probabilityValue = field.sliderValue
    }
    if (config.kind === "years-slider" && field.sliderValue) {
      retirementYearsValue = field.sliderValue
    }

    if (config.group === "financial") {
      financialInputsCard.appendChild(field.wrapper)
    } else {
      freedomInputsCard.appendChild(field.wrapper)
    }
  }

  const actions = el("div", "omy-actions")
  const resetButton = el("button", "omy-reset", "Reset assumptions")
  resetButton.type = "button"
  actions.appendChild(resetButton)

  inputsColumn.append(financialInputsCard, freedomInputsCard, actions)
  diagnosticsColumn.append(diagnosticsCard, costCard, sensitivityCard)
  layout.append(resultCard, inputsColumn, diagnosticsColumn)

  root.append(header, layout)
  container.appendChild(root)

  if (!returnValue) {
    returnValue = el("span", "omy-slider-value omy-mono", "3.0%")
  }
  if (!probabilityValue) {
    probabilityValue = el("span", "omy-slider-value omy-mono", "0%")
  }
  if (!retirementYearsValue) {
    retirementYearsValue = el("span", "omy-slider-value omy-mono", "30 years")
  }

  return {
    root,
    resultCard,
    inputs,
    errors,
    returnValue,
    probabilityValue,
    retirementYearsValue,
    scenarioButtons,
    scenarioSummary,
    resetButton,
    recommendationLabel,
    score,
    explanation,
    benefitValue: benefit.value,
    costValue: cost.value,
    derived,
    totalCostValue: totalCostRow.value,
    swrTargetValue: swrTargetRow.value,
    swrRequiredPortfolioValue: swrRequiredPortfolioRow.value,
    swrGapNowValue: swrGapNowRow.value,
    swrGapInOneYearValue: swrGapInOneYearRow.value,
    swrStatusValue: swrStatusRow.value,
    dominantSideValue: dominantRow.value,
    largestCostValue: largestCostRow.value,
    flipFreeYearValue: flipFreeRow.value,
    flipWorkDisutilityValue: flipWorkRow.value,
    flipOpportunityValue: flipOpportunityRow.value,
    liveRegion,
  }
}
