# Repository Guidance

## Overview
- This project hosts the source for **jamiecollinson.com**, a Hugo-generated static site.
- Hugo configuration lives in `config.yaml`; the active theme is `jc`, located under `themes/jc/`.
- Generated output is written to `docs/`, which is committed for GitHub Pages hosting.

## Working with Content
- Author homepage copy in `content/_index.md`; long-form posts reside in `content/post/` as Markdown or Org files with TOML front matter.
- When creating new content, follow the voice and style guidance in `VOICE.md`.
- Filenames determine permalinks because `disablePathToLower` is enabled—choose slugs carefully.
- Run `hugo server` for local previews and `hugo --minify` for production builds.
- During dev work, do **not** run `hugo --minify` unless explicitly requested; assume the user is running a separate watcher/build process.

## Theming Notes
- The base HTML scaffold is `themes/jc/layouts/_default/baseof.html`.
- The homepage layout (`themes/jc/layouts/index.html`) renders the hero text, social links, and "Latest posts" listing.
- Individual articles use `themes/jc/layouts/_default/single.html`.
- Global styling is in `themes/jc/static/css/styles.css`; adjust typography, TOC, and footnote behavior there.
- Reusable fragments live in `themes/jc/layouts/partials/`, including `footer.html` and `social.html`. The `nav.html` partial is currently empty for potential navigation additions.

## Design Principles
- Keep runtime assets fully local: do not load JavaScript, CSS, fonts, or icon assets from third-party CDNs.
- Vendor external dependencies under `static/vendor/` (pinned version directories) and reference them via local paths (for example, `/vendor/...`).
- Prefer self-contained pages that render correctly without outbound network requests for core functionality.
- Inline icons directly in templates (SVG) for small icon counts instead of loading icon runtimes; only use vendored icon packages when there is a clear need.
- For Phosphor icons, use pinned paths from `@phosphor-icons/core` (currently `2.1.1`) and load them as inline SVG `<symbol>` defs via a shared partial (no runtime JS/CDN); this is the default performance tradeoff for small shared icon sets like the footer.

## Next Steps for New Contributors
- Explore Hugo templating to extend layouts or add partials (e.g., build out `nav.html`).
- Customize styles by editing `styles.css`, especially for responsive tweaks to the TOC and sidenotes.
- Investigate Hugo taxonomies and shortcodes if you plan to introduce tags, project listings, or custom components.
