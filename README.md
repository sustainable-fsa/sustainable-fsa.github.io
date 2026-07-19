# sustainable-fsa.github.io

The public project site for **Sustainable FSA** — the USDA-funded research
partnership at the Montana Climate Office that maintains the data archives
linked from the home page. Lives at <https://sustainable-fsa.com>.

This is a Jekyll site, built with Tailwind CSS, deployed via GitHub Actions.

---

## Quick start

```bash
bundle install              # Ruby gems (Jekyll + github-pages)
npm install                 # Tailwind toolchain + html-validate
npm run build:css           # compile assets/tailwind.css
bundle exec jekyll serve    # serve at http://127.0.0.1:4000/
```

For interactive editing, run the Tailwind watcher and Jekyll's
livereload in two terminals:

```bash
# Terminal 1 — Tailwind rebuilds CSS as you edit layouts/includes/pages
npm run watch:css

# Terminal 2 — Jekyll rebuilds HTML and auto-refreshes the browser
bundle exec jekyll serve --livereload
```

---

## What's where

```
.
├── _config.yml             Jekyll config: site metadata + nav definition.
├── _layouts/
│   ├── default.html        HTML shell, head/meta, header, footer.
│   ├── home.html           Hero + intro + feature cards (no archive grid).
│   ├── page.html           Prose layout for About / Team.
│   └── archives.html       Card-grid layout for /data/ and /analysis/.
│                           Both pages render the same way; what they
│                           show is driven by `category:` in projects.yml.
├── _includes/
│   ├── header.html         Sticky navbar with banner + Alpine.js mobile menu.
│   ├── footer.html         Funding statement, partner credits, source link.
│   └── card.html           Single data-archive card; loop target for projects.yml.
├── _data/
│   └── projects.yml        Archive cards; each has `category: data` or
│                           `category: analysis` to route it to the right page.
├── index.md                Home page (uses `layout: home`).
├── about/index.md          About the project, including progress narrative.
├── data/index.md           Data archives (uses `layout: archives`).
├── analysis/index.md       Reproducible analytical reports.
├── team/index.md           PI, graduate researchers, faculty collaborators, partners.
├── assets/
│   ├── sustainable-fsa-banner.svg   Header logo banner.
│   ├── sustainable-fsa-logo-1024.png OG / social-card image.
│   ├── MCO_logo.svg                  Footer logo.
│   ├── favicon-*.png, favicon.ico, apple-touch-icon.png, android-chrome-*.png
│   ├── site.webmanifest              PWA manifest.
│   └── tailwind.css                  COMPILED — gitignored, built at deploy time.
├── src/
│   └── tailwind.css                  Source for the Tailwind build.
├── tailwind.config.js                Brand palette + prose color overrides.
├── package.json                      Node scripts (build:css, lint:html).
├── Gemfile                           Ruby deps (github-pages gem).
├── CNAME                             sustainable-fsa.com
├── favicon.ico                       Copy at root for browsers that auto-request it.
└── .github/workflows/pages.yml       CI: lint → build CSS → build Jekyll → deploy.
```

---

## Common changes

### Add a page to the top nav

Edit `_config.yml` — append to the `nav:` list:

```yaml
nav:
  - title: Publications
    url: /publications/
```

Then create `publications/index.md` with `layout: page` front matter.

### Add or edit a data or analysis card

Edit `_data/projects.yml`. Each entry needs:

```yaml
- title: My New Archive
  category: data            # or `analysis`
  type: ARCHIVE
  description: One- or two-sentence summary.
  links:
    - title: Documentation
      url: /my-new-archive
    - title: Download (CSV)
      url: /my-new-archive/data.csv
  image: /my-new-archive/example-1.png
  doi: 10.5281/zenodo.15252842   # optional; bare DOI, no https://doi.org/ prefix
```

The `category` field decides which page the card appears on:
`category: data` routes it to `/data/`, `category: analysis` routes it
to `/analysis/`. The first link's URL is used as the hyperlink target
for the card's preview image and title. Card images come from the
sibling repos under the same parent domain (e.g.
`sustainable-fsa.com/usdm/example-1.png` is served by the `usdm` repo's
GitHub Pages site); they 404 in local dev — that's expected.

If the archive has a Zenodo DOI, add it as `doi:` (bare, no
`https://doi.org/` prefix — the card template adds the resolver; prefer
the concept DOI, which always resolves to the latest version). It
renders as a small "DOI: …" footer line under the card's links.

### Edit page descriptions (and home-page card subtitles)

The four feature cards on the home page (`About`, `Data`, `Analysis`,
`Team`) read their subtitle from the target page's `description:`
front-matter field. Editing the front matter at `about/index.md`,
`data/index.md`, etc., automatically updates the matching card on the
home page.

### Change the brand palette

Edit `tailwind.config.js` — the `theme.extend.colors` block. Each color
token has `light`, `DEFAULT`, and `dark` variants tuned to clear WCAG
AA contrast (≥ 4.5:1 for small text) against either the cream body
background or the terracotta hero. If you adjust a hex, re-run an
accessibility audit (`npm run lint:html` + Lighthouse) to make sure the
new value still clears AA on the surfaces where it's used.

### Change the typeface

The site loads Roboto from Google Fonts (`_layouts/default.html`).
Body text uses regular weight; all headings (`h1`–`h4`) use Roboto Black
via:
- `src/tailwind.css` — `@layer base` rule applying `font-weight: 900` to
  `h1`–`h4` for layouts and includes.
- `tailwind.config.js` — `typography` plugin overrides applying
  `font-weight: 900` to prose-rendered markdown headings.

To switch to a different family, edit both the Google Fonts URL in
`_layouts/default.html` and the `fontFamily.sans` entry in
`tailwind.config.js`.

### Add or change a content page

1. Create `<slug>/index.md` with front matter:
   ```markdown
   ---
   layout: page
   title: My Page Title
   section_label: Optional eyebrow
   description: One-sentence meta description that also feeds the page's
     home-card subtitle if there is one.
   ---
   ```
2. Write the body in Markdown — headings, links, lists, blockquotes,
   tables all pick up the brand prose styling automatically.
3. If the page should appear in the top nav, add it to `_config.yml`.

---

## Build pipeline

The full pipeline runs in GitHub Actions on every push to `main`
(`.github/workflows/pages.yml`):

1. **Install Node deps** (`npm ci`)
2. **Lint source HTML** (`npm run lint:html` — `html-validate` against
   layouts and includes)
3. **Build Tailwind CSS** (`npm run build:css` — minified `assets/tailwind.css`)
4. **Install Ruby gems** and **build Jekyll** (`bundle exec jekyll build`)
5. **Upload `_site/`** to GitHub Pages

The site is deployed via the `actions/deploy-pages` flow, not the
older "deploy from branch" mode. The first time this repo is enabled
for Pages, switch the source to **GitHub Actions** under
**Settings → Pages**.

---

## Conventions and a few things to know

- **The `assets/tailwind.css` file is gitignored.** It's the compiled
  output of `src/tailwind.css`. The CI workflow builds it fresh on
  every deploy. Locally, run `npm run build:css` (one-shot) or
  `npm run watch:css` (rebuilds on edit) — both write to that path.
- **Liquid `{% comment %}` blocks** are stripped by Jekyll at build
  time, so the in-source documentation in layouts and includes does
  not ship to production. HTML comments (`<!-- -->`) are preserved.
- **The `_data/projects.yml` schema and the card-rendering Liquid in
  `_includes/card.html` must stay in sync.** If you add fields to
  projects.yml, also extend card.html to render them.
- **External links** on the site use `target="_blank" rel="noopener
  noreferrer"` to avoid reverse-tabnabbing.
- **html-validate doesn't understand Liquid.** Keep any `{% comment %}`
  blocks free of angle-bracket text (use words like "main element"
  rather than `<main>`), and keep any documentation comment in
  `_layouts/default.html` placed *after* the `<!doctype html>` line so
  the parser sees the doctype first.
- **Branding files in `assets/`:**
  - `.svg` files (`sustainable-fsa-banner.svg`, `MCO_logo.svg`) are the
    web-served versions.
  - `.ai` files (Adobe Illustrator sources) are the editable masters.
    They are excluded from the Jekyll build via `_config.yml` and live
    in `assets/` for safekeeping alongside their exports.
- **Tailwind purge / content globs** — `tailwind.config.js`'s
  `content` array lists exactly the directories Tailwind should scan
  for utility classes. If you add a new top-level content directory
  (e.g. `publications/`), add it to the `content` array so utility
  classes in those pages survive the production build.

---

## Audit results (May 2026)

Locally, against `bundle exec jekyll serve` (Lighthouse v13.3):

| Page       | Performance | Accessibility | Best practices |
|------------|------------:|--------------:|---------------:|
| Home       |          86 |           100 |             96 |
| About      |          90 |           100 |            100 |
| Data       |          --- |          --- |            --- |
| Analysis   |          --- |          --- |            --- |
| Team       |          88 |           100 |            100 |

(Baseline measured before the data/analysis split and the resources
removal; re-run the audit when you next deploy to get fresh scores
for the new routes.)

Notes:
- The home page's Best Practices score is 96 (not 100) only because
  the data-archive cards reference images on sibling repos
  (`/usdm/example-1.png` etc.) that 404 in local development.
  Those URLs resolve under `sustainable-fsa.com` in production.
- Performance is held to ~86–90 by Google Fonts (render-blocking) and
  by Lighthouse's "unused CSS rules" calculation — which counts
  responsive-variant and pseudo-class rules that aren't actively
  matching during the audit run. Neither is meaningfully fixable
  without self-hosting fonts or hand-curating utility classes.
- The bf-cache, cache-insight, and document-latency findings are
  all artifacts of Jekyll's dev server. They don't apply on GitHub
  Pages, which sets sensible cache headers and doesn't open a
  livereload websocket.

To re-run the audit locally:

```bash
npx -y lighthouse http://127.0.0.1:4321/ \
  --quiet --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices \
  --view
```
