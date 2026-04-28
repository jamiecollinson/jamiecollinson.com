var k={strongWork:1e5,leanWork:25e3,leanStop:-25e3,strongStop:-1e5},H=1.1,x={currentPortfolio:62e4,annualSpending:4e4,annualSavingsIfWork:15e3,expectedRealReturn:.03,safetyWithdrawalTarget:.04,yearsInRetirementIfStopNow:30,freeYearValue:4e4,workDisutility:13750,opportunityValue:2e4},q={currentPortfolio:1,annualSpending:1,annualSavingsIfWork:0,expectedRealReturn:0,safetyWithdrawalTarget:.04,yearsInRetirementIfStopNow:30,freeYearValue:0,workDisutility:0,opportunityValue:0},z={currentPortfolio:{min:1},annualSpending:{min:1},annualSavingsIfWork:{min:0},expectedRealReturn:{min:-.1,max:.15},safetyWithdrawalTarget:{min:.025,max:.06},yearsInRetirementIfStopNow:{min:5,max:60},freeYearValue:{min:0},workDisutility:{min:0},opportunityValue:{min:0}},Y={p50:{key:"p50",label:"50th percentile",shortLabel:"P50",percentileLabel:"50th percentile",netWorth:294e3,annualIncome:37e3,appliedInputs:{currentPortfolio:294e3,annualSpending:27e3,annualSavingsIfWork:7e3}},p75:{key:"p75",label:"75th percentile",shortLabel:"P75",percentileLabel:"75th percentile",netWorth:62e4,annualIncome:55e3,appliedInputs:{currentPortfolio:62e4,annualSpending:38e3,annualSavingsIfWork:17e3}},p90:{key:"p90",label:"90th percentile",shortLabel:"P90",percentileLabel:"90th percentile",netWorth:1200500,annualIncome:78e3,appliedInputs:{currentPortfolio:1200500,annualSpending:52e3,annualSavingsIfWork:26e3}},p99:{key:"p99",label:"99th percentile",shortLabel:"P99",percentileLabel:"99th percentile",netWorth:36e5,annualIncome:18e4,appliedInputs:{currentPortfolio:36e5,annualSpending:11e4,annualSavingsIfWork:7e4}}},M=["p50","p75","p90","p99"],S="p75",D=[{key:"definitely-yes",label:"Definitely yes",disutilityRate:0},{key:"probably-yes",label:"Probably yes",disutilityRate:.1},{key:"unsure",label:"Unsure",disutilityRate:.25},{key:"probably-no",label:"Probably no",disutilityRate:.5},{key:"definitely-no",label:"Definitely no",disutilityRate:1}],J="unsure",L=[{key:"none",label:"No clear plan",multiplier:0},{key:"rest",label:"Rest / family",multiplier:.25},{key:"explore",label:"Explore options",multiplier:.5},{key:"project",label:"Build a serious project",multiplier:1},{key:"business",label:"Start or buy a business",multiplier:2,usesCustomMultiplier:!0},{key:"opportunity",label:"Rare opportunity already in sight",multiplier:2,usesCustomMultiplier:!0}],Q="explore",$=2;var X={"strong-work":"Favours working","lean-work":"Slightly favours working","close-call":"Close call","lean-stop":"Slightly favours stopping","strong-stop":"Favours stopping"},W={"strong-work":"omy-tone-strong-work","lean-work":"omy-tone-lean-work","close-call":"omy-tone-close-call","lean-stop":"omy-tone-lean-stop","strong-stop":"omy-tone-strong-stop"},Z={"not-ready":"Not ready",borderline:"Borderline",ready:"Ready"};var pe=Object.values(W),ee=pe;function te(t){return W[t]}function ae(t){return t==="not-ready"?W["strong-work"]:t==="borderline"?W["close-call"]:""}function n(t,e){let r=t.querySelector(e);if(!r)throw new Error(`Missing required element: ${e}`);return r}function ne(t){t.innerHTML="";let e=document.createElement("section");e.className="omy-app";let r=M.map(p=>{let u=p===S;return`<button type="button" class="omy-scenario-button${u?" is-active":""}" data-scenario="${p}" aria-pressed="${u?"true":"false"}">${Y[p].shortLabel}</button>`}).join(""),a=D.map(p=>`<option value="${p.key}">${p.label}</option>`).join(""),c=L.map(p=>`<option value="${p.key}">${p.label}</option>`).join("");e.innerHTML=`
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
        <div class="omy-scenario-buttons">${r}</div>
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
            <button type="button" class="omy-anchor-button" data-anchor="0">\xA30</button>
            <button type="button" class="omy-anchor-button" data-anchor="0.25">3 months</button>
            <button type="button" class="omy-anchor-button" data-anchor="0.5">6 months</button>
            <button type="button" class="omy-anchor-button" data-anchor="1">1 year</button>
            <button type="button" class="omy-anchor-button" data-anchor="2">2 years</button>
          </div>

          <label class="omy-label" for="omy-workYearAttitude">Would you work one more year at current compensation?</label>
          <p class="omy-helper">This sets an implied burden of another work year.</p>
          <select id="omy-workYearAttitude" class="omy-input">${a}</select>
          <p class="omy-derived" data-output="work-disutility-hint">-</p>

          <label class="omy-label" for="omy-freeYearPlan">What would you do with a free year?</label>
          <p class="omy-helper">This sets a default foregone-opportunity value.</p>
          <select id="omy-freeYearPlan" class="omy-input">${c}</select>

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
  `,t.appendChild(e);let b={};for(let p of M)b[p]=n(e,`.omy-scenario-button[data-scenario="${p}"]`);return{root:e,resultCard:n(e,".omy-result-card"),primaryConclusion:n(e,".omy-primary-conclusion"),score:n(e,".omy-score"),primaryExplanation:n(e,".omy-explanation"),secondaryInsight:n(e,".omy-secondary"),readinessBadge:n(e,"[data-output='readiness-badge']"),marginalBadge:n(e,"[data-output='marginal-badge']"),headlineBenefit:n(e,"[data-output='headline-benefit']"),headlineDelayedFreedom:n(e,"[data-output='headline-cost']"),comparisonStopPortfolio:n(e,"[data-output='stop-portfolio']"),comparisonStopWithdrawal:n(e,"[data-output='stop-withdrawal']"),comparisonStopGap:n(e,"[data-output='stop-gap']"),comparisonWorkPortfolio:n(e,"[data-output='work-portfolio']"),comparisonWorkWithdrawal:n(e,"[data-output='work-withdrawal']"),comparisonWorkGap:n(e,"[data-output='work-gap']"),tradeoffBenefit:n(e,"[data-output='tradeoff-benefit']"),tradeoffFreeYear:n(e,"[data-output='tradeoff-free']"),tradeoffWorkDisutility:n(e,"[data-output='tradeoff-work']"),tradeoffOpportunity:n(e,"[data-output='tradeoff-opportunity']"),tradeoffDelayedFreedom:n(e,"[data-output='tradeoff-cost']"),tradeoffNet:n(e,"[data-output='tradeoff-net']"),impliedIncome:n(e,"[data-output='implied-income']"),workDisutilityHint:n(e,"[data-output='work-disutility-hint']"),opportunityHint:n(e,"[data-output='opportunity-hint']"),requiredPortfolio:n(e,"[data-output='required-portfolio']"),gapNow:n(e,"[data-output='gap-now']"),gapInOneYear:n(e,"[data-output='gap-year']"),fundedYearsNow:n(e,"[data-output='funded-now']"),fundedYearsInOneYear:n(e,"[data-output='funded-year']"),fundedYearsGain:n(e,"[data-output='funded-gain']"),withdrawalImprovement:n(e,"[data-output='withdrawal-improvement']"),flipFreeYear:n(e,"[data-output='flip-free']"),flipWorkDisutility:n(e,"[data-output='flip-work']"),flipOpportunity:n(e,"[data-output='flip-opportunity']"),returnValue:n(e,"[data-output='return-value']"),safetyTargetValue:n(e,"[data-output='safety-value']"),retirementYearsValue:n(e,"[data-output='years-value']"),scenarioButtons:b,scenarioSummary:n(e,"[data-output='scenario-summary']"),resetButton:n(e,".omy-reset"),advancedToggle:n(e,"#omy-advancedToggle"),customOpportunityField:n(e,"[data-field='custom-opportunity']"),manualFields:n(e,"[data-field='manual-fields']"),inputs:{currentPortfolio:n(e,"#omy-currentPortfolio"),annualSpending:n(e,"#omy-annualSpending"),annualSavingsIfWork:n(e,"#omy-annualSavingsIfWork"),expectedRealReturn:n(e,"#omy-expectedRealReturn"),safetyWithdrawalTarget:n(e,"#omy-safetyWithdrawalTarget"),yearsInRetirementIfStopNow:n(e,"#omy-yearsInRetirementIfStopNow"),sabbaticalWillingnessToPay:n(e,"#omy-sabbaticalWillingnessToPay"),workYearAttitude:n(e,"#omy-workYearAttitude"),freeYearPlan:n(e,"#omy-freeYearPlan"),customOpportunityMultiplier:n(e,"#omy-customOpportunityMultiplier"),manualWorkDisutility:n(e,"#omy-manualWorkDisutility"),manualOpportunityValue:n(e,"#omy-manualOpportunityValue")},liveRegion:n(e,".omy-sr-only")}}var me="GBP",B="en-GB",oe=new Intl.NumberFormat(B,{style:"currency",currency:me,maximumFractionDigits:0}),de=new Intl.NumberFormat(B,{style:"percent",minimumFractionDigits:1,maximumFractionDigits:1}),ce=new Intl.NumberFormat(B,{minimumFractionDigits:1,maximumFractionDigits:1});function V(t,e,r){let a=t/e,c=a>=100?0:(a>=10,1);return`${a.toFixed(c)}${r}`}function l(t){return Number.isFinite(t)?oe.format(t):"-"}function w(t){if(!Number.isFinite(t))return"-";let e=Math.abs(t),r=t<0?"-":"";return e>=1e9?`${r}\xA3${V(e,1e9,"bn")}`:e>=1e6?`${r}\xA3${V(e,1e6,"m")}`:e>=1e3?`${r}\xA3${V(e,1e3,"k")}`:`${r}${oe.format(e)}`}function re(t){return Number.isFinite(t)?t>0?`+${l(t)}`:t<0?`-${l(Math.abs(t))}`:l(t):"-"}function N(t){return Number.isFinite(t)?t>0?`+${w(t)}`:t<0?`-${w(Math.abs(t))}`:w(t):"-"}function I(t){return Number.isFinite(t)?de.format(t):"-"}function F(t){return Number.isFinite(t)?`${ce.format(t)} years`:"-"}function ie(t){return Number.isFinite(t)?`${Math.round(t).toString()} years`:"-"}function K(t){return X[t]}function U(t){return Z[t]}function G(t){return Number.isFinite(t)?`${(t*100).toFixed(1)}%`:"0.0%"}function A(t,e){return!Number.isFinite(t)||!Number.isFinite(e)||e===0?0:t/e}function ye(t){return t>=k.strongWork?"strong-work":t>=k.leanWork?"lean-work":t>k.leanStop?"close-call":t>k.strongStop?"lean-stop":"strong-stop"}function j(t){return t>0?`the marginal year favours working by about ${N(t)}`:t<0?`the marginal year favours stopping by about ${N(t)}`:"the marginal year is roughly neutral"}function fe(t,e,r,a,c){let b=t<=r,p=e<=r,u="not-ready";return b?u="ready":(p||t<=r*H||e<=r*H)&&(u="borderline"),{status:u,isReadyNow:b,closesGapInOneYear:p,currentWithdrawalRate:t,oneYearWithdrawalRate:e,targetWithdrawalRate:r,gapNow:a,gapInOneYear:c}}function ge(t,e){let r=`Your current withdrawal rate is ${I(t.currentWithdrawalRate)} against a ${I(t.targetWithdrawalRate)} safety target. One more year moves it to ${I(t.oneYearWithdrawalRate)}.`;if(t.status==="not-ready")return{primaryConclusion:"Not financially ready yet",primaryExplanation:`${r} Working one more year improves your position, but it still leaves a gap of ${l(t.gapInOneYear)} to your safety level.`,secondaryInsight:`Separately, ${j(e.score)} based on your delayed-freedom assumptions.`};if(t.status==="borderline"){let c=t.closesGapInOneYear?"You are close, and one more year would likely close the safety gap.":"You are close to the target, but still slightly above it.";return{primaryConclusion:"Borderline financial readiness",primaryExplanation:`${r} ${c}`,secondaryInsight:`On the one-more-year trade-off, ${j(e.score)}.`}}let a="Financially ready \u2014 close call on one more year";return e.status==="strong-work"||e.status==="lean-work"?a="Financially ready \u2014 one more year still looks attractive":(e.status==="strong-stop"||e.status==="lean-stop")&&(a="Financially ready \u2014 stopping now looks reasonable"),{primaryConclusion:a,primaryExplanation:`${r} You are at or below your selected safety target now.`,secondaryInsight:`The marginal trade-off suggests ${j(e.score)}.`}}function se(t){let e=t.currentPortfolio,r=t.currentPortfolio*(1+t.expectedRealReturn)+t.annualSavingsIfWork,a=r-e,c=A(t.annualSpending,e),b=A(t.annualSpending,r),p=c-b,u=A(e,t.annualSpending),v=A(r,t.annualSpending),s=v-u,d=t.yearsInRetirementIfStopNow,m=Math.max(t.yearsInRetirementIfStopNow-1,0),y=t.safetyWithdrawalTarget,f=A(t.annualSpending,y),o=f,O=Math.max(f-e,0),h=Math.max(o-r,0),E=t.freeYearValue+t.workDisutility+t.opportunityValue,T=a-E,R=fe(c,b,y,O,h),P={benefitOfWorking:a,estimatedValueOfDelayedFreedom:E,score:T,status:ye(T)},C=ge(R,P);return{readiness:R,marginal:P,primaryConclusion:C.primaryConclusion,primaryExplanation:C.primaryExplanation,secondaryInsight:C.secondaryInsight,derived:{portfolioNow:e,portfolioInOneYear:r,portfolioGain:a,withdrawalRateNow:c,withdrawalRateInOneYear:b,withdrawalRateImprovement:p,fundedYearsNow:u,fundedYearsInOneYear:v,fundedYearsGain:s,retirementYearsNow:d,retirementYearsInOneYear:m,requiredPortfolioAtTarget:f,requiredPortfolioAtTargetInOneYear:o,gapNow:O,gapInOneYear:h,freeYearValue:t.freeYearValue,workDisutility:t.workDisutility,opportunityValue:t.opportunityValue,impliedIncome:t.annualSpending+t.annualSavingsIfWork}}}function i(t,e){t.textContent!==e&&(t.textContent=e)}function _(t){if(t.trim()==="")return null;let e=Number(t);return Number.isFinite(e)?e:null}function be(t,e){let r=z[t];return e<r.min?r.min:r.max!==void 0&&e>r.max?r.max:e}function ve(t){var e,r;return(r=(e=D.find(a=>a.key===t))==null?void 0:e.disutilityRate)!=null?r:0}function Ie(t,e){let r=L.find(a=>a.key===t);return r?r.usesCustomMultiplier?e:r.multiplier:0}function g(t){return Number.isFinite(t)?Number.isInteger(t)?t.toString():Number(t.toFixed(4)).toString():"0"}function le(){return{modelInputs:{...x},activeScenario:S,workAttitude:J,freeYearPlan:Q,customOpportunityMultiplier:$,advancedSubjective:!1,manualWorkDisutility:x.workDisutility,manualOpportunityValue:x.opportunityValue,sabbaticalTouched:!1}}function Me(t){let e=ne(t),r=Array.from(e.root.querySelectorAll(".omy-anchor-button")),a=le(),c=()=>{for(let d of M){let m=e.scenarioButtons[d],y=d===a.activeScenario;m.classList.toggle("is-active",y),m.setAttribute("aria-pressed",y?"true":"false")}let s=Y[a.activeScenario];i(e.scenarioSummary,`${s.percentileLabel}: net worth ~${l(s.netWorth)}, annual income ~${l(s.annualIncome)}.`)},b=()=>{e.inputs.currentPortfolio.value=g(a.modelInputs.currentPortfolio),e.inputs.annualSpending.value=g(a.modelInputs.annualSpending),e.inputs.annualSavingsIfWork.value=g(a.modelInputs.annualSavingsIfWork),e.inputs.expectedRealReturn.value=g(a.modelInputs.expectedRealReturn*100),e.inputs.safetyWithdrawalTarget.value=g(a.modelInputs.safetyWithdrawalTarget*100),e.inputs.yearsInRetirementIfStopNow.value=g(a.modelInputs.yearsInRetirementIfStopNow),e.inputs.sabbaticalWillingnessToPay.value=g(a.modelInputs.freeYearValue),e.inputs.workYearAttitude.value=a.workAttitude,e.inputs.freeYearPlan.value=a.freeYearPlan,e.inputs.customOpportunityMultiplier.value=g(a.customOpportunityMultiplier),e.inputs.manualWorkDisutility.value=g(a.manualWorkDisutility),e.inputs.manualOpportunityValue.value=g(a.manualOpportunityValue),e.advancedToggle.checked=a.advancedSubjective},p=(s,d)=>{d!=null&&d.resetAll&&(a=le());let m=Y[s];a.modelInputs.currentPortfolio=m.appliedInputs.currentPortfolio,a.modelInputs.annualSpending=m.appliedInputs.annualSpending,a.modelInputs.annualSavingsIfWork=m.appliedInputs.annualSavingsIfWork,a.sabbaticalTouched||(a.modelInputs.freeYearValue=a.modelInputs.annualSpending),a.activeScenario=s,b(),u()},u=()=>{var R;let s=a.modelInputs.annualSpending+a.modelInputs.annualSavingsIfWork,d=s*ve(a.workAttitude),m=a.modelInputs.annualSpending*Ie(a.freeYearPlan,a.customOpportunityMultiplier),y=a.advancedSubjective?a.manualWorkDisutility:d,f=a.advancedSubjective?a.manualOpportunityValue:m,o=se({...a.modelInputs,workDisutility:y,opportunityValue:f});e.customOpportunityField.hidden=!((R=L.find(P=>P.key===a.freeYearPlan))!=null&&R.usesCustomMultiplier),e.manualFields.hidden=!a.advancedSubjective;let O=o.readiness.status==="ready"?te(o.marginal.status):ae(o.readiness.status);e.resultCard.classList.remove(...ee),O&&e.resultCard.classList.add(O),i(e.primaryConclusion,o.primaryConclusion),i(e.score,N(o.marginal.score)),i(e.primaryExplanation,o.primaryExplanation),i(e.secondaryInsight,o.secondaryInsight),i(e.readinessBadge,`Readiness: ${U(o.readiness.status)}`),i(e.marginalBadge,`Marginal year: ${K(o.marginal.status)}`),i(e.headlineBenefit,w(o.marginal.benefitOfWorking)),i(e.headlineDelayedFreedom,w(o.marginal.estimatedValueOfDelayedFreedom)),i(e.comparisonStopPortfolio,l(o.derived.portfolioNow)),i(e.comparisonStopWithdrawal,I(o.derived.withdrawalRateNow)),i(e.comparisonStopGap,l(o.derived.gapNow)),i(e.comparisonWorkPortfolio,l(o.derived.portfolioInOneYear)),i(e.comparisonWorkWithdrawal,I(o.derived.withdrawalRateInOneYear)),i(e.comparisonWorkGap,l(o.derived.gapInOneYear)),i(e.tradeoffBenefit,l(o.marginal.benefitOfWorking)),i(e.tradeoffFreeYear,l(o.derived.freeYearValue)),i(e.tradeoffWorkDisutility,l(o.derived.workDisutility)),i(e.tradeoffOpportunity,l(o.derived.opportunityValue)),i(e.tradeoffDelayedFreedom,l(o.marginal.estimatedValueOfDelayedFreedom)),i(e.tradeoffNet,re(o.marginal.score)),i(e.returnValue,G(a.modelInputs.expectedRealReturn)),i(e.safetyTargetValue,G(a.modelInputs.safetyWithdrawalTarget)),i(e.retirementYearsValue,ie(a.modelInputs.yearsInRetirementIfStopNow)),i(e.impliedIncome,l(s)),i(e.workDisutilityHint,a.advancedSubjective?`Manual work burden: ${l(y)}`:`Implied work burden from your answer: ${l(y)}`),i(e.opportunityHint,a.advancedSubjective?`Manual foregone opportunity: ${l(f)}`:`Implied foregone opportunity: ${l(f)}`),i(e.requiredPortfolio,l(o.derived.requiredPortfolioAtTarget)),i(e.gapNow,l(o.derived.gapNow)),i(e.gapInOneYear,l(o.derived.gapInOneYear)),i(e.fundedYearsNow,F(o.derived.fundedYearsNow)),i(e.fundedYearsInOneYear,F(o.derived.fundedYearsInOneYear)),i(e.fundedYearsGain,F(o.derived.fundedYearsGain)),i(e.withdrawalImprovement,I(o.derived.withdrawalRateImprovement));let h=o.marginal.benefitOfWorking-o.derived.workDisutility-o.derived.opportunityValue,E=o.marginal.benefitOfWorking-o.derived.freeYearValue-o.derived.opportunityValue,T=o.marginal.benefitOfWorking-o.derived.freeYearValue-o.derived.workDisutility;i(e.flipFreeYear,h<=0?"Marginal trade-off already favours stopping before this factor.":`Would flip near ${l(h)}.`),i(e.flipWorkDisutility,E<=0?"Marginal trade-off already favours stopping before this factor.":`Would flip near ${l(E)}.`),i(e.flipOpportunity,T<=0?"Marginal trade-off already favours stopping before this factor.":`Would flip near ${l(T)}.`),i(e.liveRegion,`${o.primaryConclusion}. ${U(o.readiness.status)} readiness. ${K(o.marginal.status)} marginal year.`),c()},v=(s,d,m)=>{let y=_(d);if(y===null){a.modelInputs[s]=q[s];return}let f=m!=null&&m.isPercent?y/100:y;f=be(s,f),m!=null&&m.round&&(f=Math.round(f)),a.modelInputs[s]=f};e.inputs.currentPortfolio.addEventListener("input",()=>{v("currentPortfolio",e.inputs.currentPortfolio.value),u()}),e.inputs.annualSpending.addEventListener("input",()=>{v("annualSpending",e.inputs.annualSpending.value),a.sabbaticalTouched||(a.modelInputs.freeYearValue=a.modelInputs.annualSpending,e.inputs.sabbaticalWillingnessToPay.value=g(a.modelInputs.freeYearValue)),u()}),e.inputs.annualSavingsIfWork.addEventListener("input",()=>{v("annualSavingsIfWork",e.inputs.annualSavingsIfWork.value),u()}),e.inputs.expectedRealReturn.addEventListener("input",()=>{v("expectedRealReturn",e.inputs.expectedRealReturn.value,{isPercent:!0}),u()}),e.inputs.safetyWithdrawalTarget.addEventListener("input",()=>{v("safetyWithdrawalTarget",e.inputs.safetyWithdrawalTarget.value,{isPercent:!0}),u()}),e.inputs.yearsInRetirementIfStopNow.addEventListener("input",()=>{v("yearsInRetirementIfStopNow",e.inputs.yearsInRetirementIfStopNow.value,{round:!0}),u()}),e.inputs.sabbaticalWillingnessToPay.addEventListener("input",()=>{v("freeYearValue",e.inputs.sabbaticalWillingnessToPay.value),a.sabbaticalTouched=!0,u()}),e.inputs.workYearAttitude.addEventListener("change",()=>{a.workAttitude=e.inputs.workYearAttitude.value,u()}),e.inputs.freeYearPlan.addEventListener("change",()=>{a.freeYearPlan=e.inputs.freeYearPlan.value,u()}),e.inputs.customOpportunityMultiplier.addEventListener("input",()=>{let s=_(e.inputs.customOpportunityMultiplier.value);a.customOpportunityMultiplier=s===null?$:Math.max(s,0),u()}),e.advancedToggle.addEventListener("change",()=>{a.advancedSubjective=e.advancedToggle.checked,u()}),e.inputs.manualWorkDisutility.addEventListener("input",()=>{let s=_(e.inputs.manualWorkDisutility.value);a.manualWorkDisutility=s===null?0:Math.max(s,0),u()}),e.inputs.manualOpportunityValue.addEventListener("input",()=>{let s=_(e.inputs.manualOpportunityValue.value);a.manualOpportunityValue=s===null?0:Math.max(s,0),u()});for(let s of r)s.addEventListener("click",()=>{var m;let d=_((m=s.dataset.anchor)!=null?m:"");d!==null&&(a.modelInputs.freeYearValue=Math.round(a.modelInputs.annualSpending*d),a.sabbaticalTouched=!0,e.inputs.sabbaticalWillingnessToPay.value=g(a.modelInputs.freeYearValue),u())});for(let s of M)e.scenarioButtons[s].addEventListener("click",()=>{p(s)});e.resetButton.addEventListener("click",()=>{p(S,{resetAll:!0})}),p(S,{resetAll:!0})}function ue(){let t=document.querySelector("#omy-app");t&&Me(t)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ue,{once:!0}):ue();
