import {
  DEFAULT_SCENARIO,
  FREE_YEAR_PLAN_OPTIONS,
  OMY_SCENARIOS,
  OMY_SCENARIO_ORDER,
  RECOMMENDATION_TONES,
  WORK_ATTITUDE_OPTIONS,
  type OMYScenarioKey,
} from "./constants"
import type { OMYReadinessStatus, OMYRecommendation } from "./types"

export type OMYDomRefs = {
  root: HTMLElement
  resultCard: HTMLElement
  primaryConclusion: HTMLElement
  score: HTMLElement
  primaryExplanation: HTMLElement
  secondaryInsight: HTMLElement
  readinessBadge: HTMLElement
  marginalBadge: HTMLElement
  headlineBenefit: HTMLElement
  headlineDelayedFreedom: HTMLElement
  comparisonStopPortfolio: HTMLElement
  comparisonStopWithdrawal: HTMLElement
  comparisonStopGap: HTMLElement
  comparisonWorkPortfolio: HTMLElement
  comparisonWorkWithdrawal: HTMLElement
  comparisonWorkGap: HTMLElement
  tradeoffBenefit: HTMLElement
  tradeoffFreeYear: HTMLElement
  tradeoffWorkDisutility: HTMLElement
  tradeoffOpportunity: HTMLElement
  tradeoffDelayedFreedom: HTMLElement
  tradeoffNet: HTMLElement
  impliedIncome: HTMLElement
  workDisutilityHint: HTMLElement
  opportunityHint: HTMLElement
  requiredPortfolio: HTMLElement
  gapNow: HTMLElement
  gapInOneYear: HTMLElement
  fundedYearsNow: HTMLElement
  fundedYearsInOneYear: HTMLElement
  fundedYearsGain: HTMLElement
  withdrawalImprovement: HTMLElement
  flipFreeYear: HTMLElement
  flipWorkDisutility: HTMLElement
  flipOpportunity: HTMLElement
  returnValue: HTMLElement
  safetyTargetValue: HTMLElement
  retirementYearsValue: HTMLElement
  scenarioButtons: Record<OMYScenarioKey, HTMLButtonElement>
  scenarioSummary: HTMLElement
  resetButton: HTMLButtonElement
  advancedToggle: HTMLInputElement
  customOpportunityField: HTMLElement
  manualFields: HTMLElement
  inputs: {
    currentPortfolio: HTMLInputElement
    annualSpending: HTMLInputElement
    annualSavingsIfWork: HTMLInputElement
    expectedRealReturn: HTMLInputElement
    safetyWithdrawalTarget: HTMLInputElement
    yearsInRetirementIfStopNow: HTMLInputElement
    sabbaticalWillingnessToPay: HTMLInputElement
    workYearAttitude: HTMLSelectElement
    freeYearPlan: HTMLSelectElement
    customOpportunityMultiplier: HTMLInputElement
    manualWorkDisutility: HTMLInputElement
    manualOpportunityValue: HTMLInputElement
  }
  liveRegion: HTMLElement
}

const RECOMMENDATION_CLASSES = Object.values(RECOMMENDATION_TONES)

export const RECOMMENDATION_CLASS_LIST = RECOMMENDATION_CLASSES

export function recommendationClass(recommendation: OMYRecommendation): string {
  return RECOMMENDATION_TONES[recommendation]
}

export function readinessFallbackTone(readiness: OMYReadinessStatus): string {
  if (readiness === "not-ready") {
    return RECOMMENDATION_TONES["strong-work"]
  }
  if (readiness === "borderline") {
    return RECOMMENDATION_TONES["close-call"]
  }
  return ""
}

function queryRequired<T extends HTMLElement>(container: HTMLElement, selector: string): T {
  const node = container.querySelector(selector)
  if (!node) {
    throw new Error(`Missing required element: ${selector}`)
  }
  return node as T
}

export function createOMYDom(container: HTMLElement): OMYDomRefs {
  container.innerHTML = ""

  const root = document.createElement("section")
  root.className = "omy-app"

  const scenarioButtons = OMY_SCENARIO_ORDER.map((key) => {
    const isActive = key === DEFAULT_SCENARIO
    return `<button type=\"button\" class=\"omy-scenario-button${isActive ? " is-active" : ""}\" data-scenario=\"${key}\" aria-pressed=\"${isActive ? "true" : "false"}\">${OMY_SCENARIOS[key].shortLabel}</button>`
  }).join("")

  const workAttitudeOptions = WORK_ATTITUDE_OPTIONS.map(
    (option) =>
      `<option value=\"${option.key}\">${option.label}</option>`,
  ).join("")

  const freeYearPlanOptions = FREE_YEAR_PLAN_OPTIONS.map(
    (option) =>
      `<option value=\"${option.key}\">${option.label}</option>`,
  ).join("")

  root.innerHTML = `
    <section class="omy-panel omy-result-card">
      <p class="omy-result-label">Primary conclusion</p>
      <h3 class="omy-primary-conclusion">-</h3>
      <p class="omy-score-label">Marginal one-year net</p>
      <p class="omy-score omy-mono">-</p>
      <p class="omy-explanation">-</p>
      <p class="omy-secondary">-</p>
      <div class="omy-badges">
        <span class="omy-badge" data-output="readiness-badge">Readiness: -</span>
        <span class="omy-badge" data-output="marginal-badge">Marginal year: -</span>
      </div>
      <div class="omy-summary-grid">
        <div class="omy-metric-row">
          <span class="omy-metric-label">Financial benefit of one more year</span>
          <span class="omy-metric-value omy-mono" data-output="headline-benefit">-</span>
        </div>
        <div class="omy-metric-row">
          <span class="omy-metric-label">Estimated value of delayed freedom</span>
          <span class="omy-metric-value omy-mono" data-output="headline-cost">-</span>
        </div>
      </div>
      <p class="omy-sr-only" aria-live="polite"></p>
    </section>

    <section class="omy-panel">
      <h3 class="omy-section-title">Stop now vs work one more year</h3>
      <div class="omy-compare-grid">
        <div class="omy-compare-column">
          <h4 class="omy-column-title">Stop now</h4>
          <div class="omy-metric-row"><span class="omy-metric-label">Portfolio</span><span class="omy-metric-value omy-mono" data-output="stop-portfolio">-</span></div>
          <div class="omy-metric-row"><span class="omy-metric-label">Withdrawal rate</span><span class="omy-metric-value omy-mono" data-output="stop-withdrawal">-</span></div>
          <div class="omy-metric-row"><span class="omy-metric-label">Gap to target</span><span class="omy-metric-value omy-mono" data-output="stop-gap">-</span></div>
        </div>
        <div class="omy-compare-column">
          <h4 class="omy-column-title">Work one more year</h4>
          <div class="omy-metric-row"><span class="omy-metric-label">Portfolio</span><span class="omy-metric-value omy-mono" data-output="work-portfolio">-</span></div>
          <div class="omy-metric-row"><span class="omy-metric-label">Withdrawal rate</span><span class="omy-metric-value omy-mono" data-output="work-withdrawal">-</span></div>
          <div class="omy-metric-row"><span class="omy-metric-label">Gap to target</span><span class="omy-metric-value omy-mono" data-output="work-gap">-</span></div>
        </div>
      </div>
    </section>

    <section class="omy-panel">
      <h3 class="omy-section-title">The marginal year</h3>
      <div class="omy-metric-row"><span class="omy-metric-label">Portfolio gain</span><span class="omy-metric-value omy-mono" data-output="tradeoff-benefit">-</span></div>
      <div class="omy-metric-row"><span class="omy-metric-label">Value of a free year</span><span class="omy-metric-value omy-mono" data-output="tradeoff-free">-</span></div>
      <div class="omy-metric-row"><span class="omy-metric-label">Burden of another work year</span><span class="omy-metric-value omy-mono" data-output="tradeoff-work">-</span></div>
      <div class="omy-metric-row"><span class="omy-metric-label">Foregone opportunity value</span><span class="omy-metric-value omy-mono" data-output="tradeoff-opportunity">-</span></div>
      <div class="omy-metric-row"><span class="omy-metric-label">Estimated value of delayed freedom</span><span class="omy-metric-value omy-mono" data-output="tradeoff-cost">-</span></div>
      <div class="omy-metric-row omy-metric-row-strong"><span class="omy-metric-label">Net trade-off</span><span class="omy-metric-value omy-mono" data-output="tradeoff-net">-</span></div>
    </section>

    <section class="omy-panel">
      <h3 class="omy-section-title">Assumptions</h3>
      <div class="omy-scenarios">
        <p class="omy-scenarios-title">Scenario presets (UK overall percentiles)</p>
        <p class="omy-scenarios-helper">Use as a starting point, then adjust assumptions manually.</p>
        <div class="omy-scenario-buttons">${scenarioButtons}</div>
        <p class="omy-scenarios-summary" data-output="scenario-summary">-</p>
      </div>

      <div class="omy-assumptions-grid">
        <section class="omy-input-group">
          <h4 class="omy-group-title">Financial assumptions</h4>

          <label class="omy-label" for="omy-currentPortfolio">Current portfolio</label>
          <p class="omy-helper">Current investable portfolio value.</p>
          <input id="omy-currentPortfolio" class="omy-input" type="number" step="1000" min="1" inputmode="decimal" />

          <label class="omy-label" for="omy-annualSpending">Annual spending</label>
          <p class="omy-helper">Annual spending required in retirement.</p>
          <input id="omy-annualSpending" class="omy-input" type="number" step="1000" min="1" inputmode="decimal" />

          <label class="omy-label" for="omy-annualSavingsIfWork">Annual savings if you work</label>
          <p class="omy-helper">Additional amount added over the next year.</p>
          <input id="omy-annualSavingsIfWork" class="omy-input" type="number" step="1000" min="0" inputmode="decimal" />

          <label class="omy-label" for="omy-expectedRealReturn">Expected real return</label>
          <p class="omy-helper">Long-run return after inflation.</p>
          <div class="omy-slider-row">
            <input id="omy-expectedRealReturn" class="omy-input omy-input-slider" type="range" min="-10" max="15" step="0.5" />
            <output class="omy-slider-value omy-mono" data-output="return-value">0.0%</output>
          </div>

          <label class="omy-label" for="omy-safetyWithdrawalTarget">Safety withdrawal target</label>
          <p class="omy-helper">Your personal safety threshold.</p>
          <div class="omy-slider-row">
            <input id="omy-safetyWithdrawalTarget" class="omy-input omy-input-slider" type="range" min="2.5" max="6" step="0.1" />
            <output class="omy-slider-value omy-mono" data-output="safety-value">4.0%</output>
          </div>

          <label class="omy-label" for="omy-yearsInRetirementIfStopNow">Planning horizon</label>
          <p class="omy-helper">Used in advanced diagnostics.</p>
          <div class="omy-slider-row">
            <input id="omy-yearsInRetirementIfStopNow" class="omy-input omy-input-slider" type="range" min="5" max="60" step="1" />
            <output class="omy-slider-value omy-mono" data-output="years-value">30 years</output>
          </div>
        </section>

        <section class="omy-input-group">
          <h4 class="omy-group-title">Life assumptions</h4>

          <label class="omy-label" for="omy-sabbaticalWillingnessToPay">Sabbatical trade-off</label>
          <p class="omy-helper">If you could take a one-year unpaid sabbatical and return to the same role, what is the most you would give up financially?</p>
          <input id="omy-sabbaticalWillingnessToPay" class="omy-input" type="number" step="1000" min="0" inputmode="decimal" />
          <div class="omy-anchor-buttons">
            <button type="button" class="omy-anchor-button" data-anchor="0">£0</button>
            <button type="button" class="omy-anchor-button" data-anchor="0.25">3 months</button>
            <button type="button" class="omy-anchor-button" data-anchor="0.5">6 months</button>
            <button type="button" class="omy-anchor-button" data-anchor="1">1 year</button>
            <button type="button" class="omy-anchor-button" data-anchor="2">2 years</button>
          </div>

          <label class="omy-label" for="omy-workYearAttitude">Would you work one more year at current compensation?</label>
          <p class="omy-helper">This sets an implied burden of another work year.</p>
          <select id="omy-workYearAttitude" class="omy-input">${workAttitudeOptions}</select>
          <p class="omy-derived" data-output="work-disutility-hint">-</p>

          <label class="omy-label" for="omy-freeYearPlan">What would you do with a free year?</label>
          <p class="omy-helper">This sets a default foregone-opportunity value.</p>
          <select id="omy-freeYearPlan" class="omy-input">${freeYearPlanOptions}</select>

          <div class="omy-field" data-field="custom-opportunity">
            <label class="omy-label" for="omy-customOpportunityMultiplier">Opportunity multiplier</label>
            <p class="omy-helper">Multiplier of annual spending for business or rare-opportunity cases.</p>
            <input id="omy-customOpportunityMultiplier" class="omy-input" type="number" step="0.1" min="0" inputmode="decimal" />
          </div>

          <p class="omy-derived" data-output="opportunity-hint">-</p>

          <label class="omy-toggle-row" for="omy-advancedToggle">
            <input id="omy-advancedToggle" type="checkbox" />
            <span>Advanced subjective overrides</span>
          </label>

          <div class="omy-advanced-fields" data-field="manual-fields">
            <label class="omy-label" for="omy-manualWorkDisutility">Manual work burden</label>
            <input id="omy-manualWorkDisutility" class="omy-input" type="number" step="1000" min="0" inputmode="decimal" />

            <label class="omy-label" for="omy-manualOpportunityValue">Manual foregone opportunity value</label>
            <input id="omy-manualOpportunityValue" class="omy-input" type="number" step="1000" min="0" inputmode="decimal" />
          </div>
        </section>
      </div>

      <div class="omy-actions">
        <button type="button" class="omy-reset">Reset assumptions</button>
      </div>
    </section>

    <details class="omy-panel omy-advanced-details">
      <summary>Advanced details</summary>
      <div class="omy-metrics">
        <div class="omy-metric-row"><span class="omy-metric-label">Portfolio needed at target</span><span class="omy-metric-value omy-mono" data-output="required-portfolio">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Gap to target (now)</span><span class="omy-metric-value omy-mono" data-output="gap-now">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Gap to target (in one year)</span><span class="omy-metric-value omy-mono" data-output="gap-year">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Funded years now</span><span class="omy-metric-value omy-mono" data-output="funded-now">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Funded years in one year</span><span class="omy-metric-value omy-mono" data-output="funded-year">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Funded years gain</span><span class="omy-metric-value omy-mono" data-output="funded-gain">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Withdrawal-rate improvement</span><span class="omy-metric-value omy-mono" data-output="withdrawal-improvement">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Free-year flip point</span><span class="omy-metric-value" data-output="flip-free">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Work-burden flip point</span><span class="omy-metric-value" data-output="flip-work">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Opportunity flip point</span><span class="omy-metric-value" data-output="flip-opportunity">-</span></div>
        <div class="omy-metric-row"><span class="omy-metric-label">Implied income (spending + savings)</span><span class="omy-metric-value omy-mono" data-output="implied-income">-</span></div>
      </div>
    </details>
  `

  container.appendChild(root)

  const scenarioButtonRefs = {} as Record<OMYScenarioKey, HTMLButtonElement>
  for (const scenarioKey of OMY_SCENARIO_ORDER) {
    scenarioButtonRefs[scenarioKey] = queryRequired<HTMLButtonElement>(
      root,
      `.omy-scenario-button[data-scenario="${scenarioKey}"]`,
    )
  }

  return {
    root,
    resultCard: queryRequired(root, ".omy-result-card"),
    primaryConclusion: queryRequired(root, ".omy-primary-conclusion"),
    score: queryRequired(root, ".omy-score"),
    primaryExplanation: queryRequired(root, ".omy-explanation"),
    secondaryInsight: queryRequired(root, ".omy-secondary"),
    readinessBadge: queryRequired(root, "[data-output='readiness-badge']"),
    marginalBadge: queryRequired(root, "[data-output='marginal-badge']"),
    headlineBenefit: queryRequired(root, "[data-output='headline-benefit']"),
    headlineDelayedFreedom: queryRequired(root, "[data-output='headline-cost']"),
    comparisonStopPortfolio: queryRequired(root, "[data-output='stop-portfolio']"),
    comparisonStopWithdrawal: queryRequired(root, "[data-output='stop-withdrawal']"),
    comparisonStopGap: queryRequired(root, "[data-output='stop-gap']"),
    comparisonWorkPortfolio: queryRequired(root, "[data-output='work-portfolio']"),
    comparisonWorkWithdrawal: queryRequired(root, "[data-output='work-withdrawal']"),
    comparisonWorkGap: queryRequired(root, "[data-output='work-gap']"),
    tradeoffBenefit: queryRequired(root, "[data-output='tradeoff-benefit']"),
    tradeoffFreeYear: queryRequired(root, "[data-output='tradeoff-free']"),
    tradeoffWorkDisutility: queryRequired(root, "[data-output='tradeoff-work']"),
    tradeoffOpportunity: queryRequired(root, "[data-output='tradeoff-opportunity']"),
    tradeoffDelayedFreedom: queryRequired(root, "[data-output='tradeoff-cost']"),
    tradeoffNet: queryRequired(root, "[data-output='tradeoff-net']"),
    impliedIncome: queryRequired(root, "[data-output='implied-income']"),
    workDisutilityHint: queryRequired(root, "[data-output='work-disutility-hint']"),
    opportunityHint: queryRequired(root, "[data-output='opportunity-hint']"),
    requiredPortfolio: queryRequired(root, "[data-output='required-portfolio']"),
    gapNow: queryRequired(root, "[data-output='gap-now']"),
    gapInOneYear: queryRequired(root, "[data-output='gap-year']"),
    fundedYearsNow: queryRequired(root, "[data-output='funded-now']"),
    fundedYearsInOneYear: queryRequired(root, "[data-output='funded-year']"),
    fundedYearsGain: queryRequired(root, "[data-output='funded-gain']"),
    withdrawalImprovement: queryRequired(root, "[data-output='withdrawal-improvement']"),
    flipFreeYear: queryRequired(root, "[data-output='flip-free']"),
    flipWorkDisutility: queryRequired(root, "[data-output='flip-work']"),
    flipOpportunity: queryRequired(root, "[data-output='flip-opportunity']"),
    returnValue: queryRequired(root, "[data-output='return-value']"),
    safetyTargetValue: queryRequired(root, "[data-output='safety-value']"),
    retirementYearsValue: queryRequired(root, "[data-output='years-value']"),
    scenarioButtons: scenarioButtonRefs,
    scenarioSummary: queryRequired(root, "[data-output='scenario-summary']"),
    resetButton: queryRequired(root, ".omy-reset"),
    advancedToggle: queryRequired(root, "#omy-advancedToggle"),
    customOpportunityField: queryRequired(root, "[data-field='custom-opportunity']"),
    manualFields: queryRequired(root, "[data-field='manual-fields']"),
    inputs: {
      currentPortfolio: queryRequired(root, "#omy-currentPortfolio"),
      annualSpending: queryRequired(root, "#omy-annualSpending"),
      annualSavingsIfWork: queryRequired(root, "#omy-annualSavingsIfWork"),
      expectedRealReturn: queryRequired(root, "#omy-expectedRealReturn"),
      safetyWithdrawalTarget: queryRequired(root, "#omy-safetyWithdrawalTarget"),
      yearsInRetirementIfStopNow: queryRequired(root, "#omy-yearsInRetirementIfStopNow"),
      sabbaticalWillingnessToPay: queryRequired(root, "#omy-sabbaticalWillingnessToPay"),
      workYearAttitude: queryRequired(root, "#omy-workYearAttitude"),
      freeYearPlan: queryRequired(root, "#omy-freeYearPlan"),
      customOpportunityMultiplier: queryRequired(root, "#omy-customOpportunityMultiplier"),
      manualWorkDisutility: queryRequired(root, "#omy-manualWorkDisutility"),
      manualOpportunityValue: queryRequired(root, "#omy-manualOpportunityValue"),
    },
    liveRegion: queryRequired(root, ".omy-sr-only"),
  }
}
