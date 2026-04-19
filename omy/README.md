# One More Year (OMY)

Framework-free, standalone decision tool for answering:

> Is working one more year worth it?

It compares:

- `benefitOfWorking = portfolioGain`
- `costOfWorking = freeYearValue + workDisutility + opportunityValue`
- `score = benefitOfWorking - costOfWorking`

## Project layout

```text
omy/
  src/
    main.ts
    model.ts
    types.ts
    constants.ts
    format.ts
    dom.ts
    styles.css
  dist/
    omy.js
    omy.css
  package.json
  README.md
```

Build output is also copied to:

- `/Users/jamie/work/jamiecollinson.com/static/tools/omy/omy.js`
- `/Users/jamie/work/jamiecollinson.com/static/tools/omy/omy.css`

## Build

From repo root:

```bash
cd omy
npm install
npm run build
```

What `npm run build` does:

1. Bundles TypeScript to minified ESM (`dist/omy.js`)
2. Bundles/minifies CSS (`dist/omy.css`)
3. Copies both files into Hugo static assets (`static/tools/omy/`)

## Hugo embedding (single page)

Recommended shortcode:

`/Users/jamie/work/jamiecollinson.com/themes/jc/layouts/shortcodes/omy-tool.html`

```html
<div id="omy-app"></div>
<link rel="stylesheet" href="/tools/omy/omy.css">
<script type="module" src="/tools/omy/omy.js"></script>
```

Usage in Markdown:

```go-html-template
{{< omy-tool >}}
```

## Notes

- No runtime framework, no backend, no external runtime dependencies.
- DOM is created once and patched on input events.
- Objective diagnostics are shown separately from subjective cost inputs.
- Validation clamps values to safe bounds and shows inline messages.
- Uses sliders for opportunity probability (`0–100%`) and retirement horizon (`5–60 years`).
- Includes fixed UK percentile scenarios (`P50`, `P75`, `P90`, `P99`; default `P75`) that set portfolio and income-linked financial assumptions in one click.
- Includes an SWR guardrail with a retirement-horizon-scaled target (Bogleheads-style anchors), nudging recommendations toward working when stop-now withdrawal is above target.

## Design/architecture deviations

- Added a lightweight sensitivity card with simple flip points (free-year value, work disutility, and opportunity value) because it fits cleanly in v1.
- Added a minimal dark-mode compatibility block using `prefers-color-scheme`; the default remains a calm warm-light style.
- Added fixed scenario presets using UK overall percentile-style bands and approximate anchors.
