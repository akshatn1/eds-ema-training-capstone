# WKND → EDS Migration Report

**Source:** https://wknd.site/us/en.html · **Target:** `akshatn1/eds-ema-training-capstone`
**Scope:** US English subtree `/us/en` only. Out of scope: other locales, commerce, sign-in, working search.

---

## 1. Site Scope report

| Metric | Value |
|---|---|
| In-scope pages (crawl) | 26 |
| Templates | 6 |
| Block variants cataloged | 30 |
| URL discovery | crawl (WKND has no sitemap) |

### Templates (representative page → count)

| Template | Pages | Representative | Structure |
|---|---|---|---|
| homepage | 1 | `/us/en.html` | hero carousel, featured-article split, recent-articles cards, next-adventures hero, adventure cards |
| adventure-detail | 16 | `adventures/bali-surf-camp` | hero + breadcrumb + metadata sidebar (columns) + tabs |
| adventure-listing | 1 | `adventures` | hero-with-overlay + filter bar + card grid |
| article-detail | 5 | `magazine/arctic-surfing` | hero + byline + long-form default content + related links |
| card-listing | 2 | `about-us`, `magazine` | title + card grids (+ featured teaser on magazine) |
| faq-accordion | 1 | `faqs` | title + hero + intro + accordion + contact sidebar |

### Blocks

- **Reused from boilerplate:** cards, columns, hero, header, footer, fragment
- **New for WKND:** carousel, tabs, accordion
- Base blocks in the WKND catalog: hero(4), carousel(4), tabs(7), cards(2), quote(2), accordion(1), breadcrumbs(1) + header/footer globals

Full catalog + per-page screenshots in `catalog/` (git-ignored).

---

## 2. Migration inventory (26 pages → EDS paths)

| EDS path | Template |
|---|---|
| `/` | homepage |
| `/about-us` | card-listing |
| `/adventures` | adventure-listing |
| `/adventures/bali-surf-camp` … `/adventures/yosemite-backpacking` (16) | adventure-detail |
| `/faqs` | faq-accordion |
| `/magazine` | card-listing |
| `/magazine/arctic-surfing`, `/guide-la-skateparks`, `/san-diego-surf`, `/ski-touring`, `/western-australia` (5) | article-detail |

Path mapping: `/us/en.html → /`, `/us/en/<p>.html → /<p>`. Internal links rewritten site-wide by the `wknd-cleanup` transformer. Content completeness on import: 88.6–98.9% (most 94–99%).

---

## 3. Import infrastructure

- `tools/importer/page-templates.json` — 6 templates with block mappings
- `tools/importer/parsers/` — carousel, columns, hero, cards, tabs, accordion (shared across templates, shape-detecting)
- `tools/importer/transformers/wknd-cleanup.js` — strips global chrome (header/nav/footer/sign-in/locale/search) + rewrites internal links
- `tools/importer/import-wknd.js` — generic import script (selects template per URL from embedded snapshot); `sync-templates-snapshot.js` refreshes the snapshot before bundling
- `tools/importer/da-sync.sh` — one-command DA upload + preview/publish

---

## 4. Design system (Phase 1)

Applied to `styles/styles.css` + `styles/fonts.css` from extracted WKND tokens:
- Colors: text `#202020`, link `#0045ff`, accent (yellow) `#ffea00`, bg white, dark `#000`
- Fonts: Asar (headings, weight 400) + Source Sans Pro (body 18px/1.75) — **self-hosted** latin woff2 with metric-adjusted fallbacks (CLS-safe, no third-party render-block)
- Buttons: squared, uppercase, semibold; yellow CTA / dark primary / outlined secondary
- Sections: dark variant + yellow section-title underline accent

---

## 5. Validation evidence

**Lint:** `npm run lint` (eslint + stylelint) passes clean on every branch. `scripts/aem.js` untouched.

**Block decoration (unit-verified via jsdom against real imported `.plain.html`):**
| Block | Result |
|---|---|
| carousel | 3 slides + 3 indicators |
| tabs | 3 panels (Overview/Itinerary/What to Bring) |
| accordion | 7 `<details>` (all FAQ questions) |
| cards | 16 cards (adventure grid) |

**Block modules on integration preview** (`feat-wknd-integration--…aem.page`): `carousel.js`, `tabs.js`, `accordion.js` (+ all block CSS, styles.css, fonts.css) return **HTTP 200**. The stacked-PR previews returned 404 for these because EDS serves code only from the previewed branch and the stacked children did not each carry the full code set — the integration branch fixes this.

**Visual verification (integration preview, real DA content):**
- Home: carousel (3 slides, prev/next + indicators), featured-article split, recent-articles cards (yellow-underline heading), next-adventures hero (white panel), where-to-go cards, WKND header + dark footer — matches source.
- adventure-detail (`/adventures/bali-surf-camp`): breadcrumb, hero, title, metadata sidebar (6 pairs), tabs (Overview/Itinerary/What-to-Bring, active tab dark-on-white).
- faq-accordion (`/faqs`): title, hero, intro, 7-item accordion (expand works), contact sidebar.

**Responsive (Playwright):**
- Mobile (375px): no horizontal overflow; hamburger visible; carousel + all sections render; 8 cards.
- Tablet (780px): no overflow; hamburger visible; footer dark.
- Desktop (1440px): no overflow; hamburger hidden; inline nav.
- Keyboard: header exposes 12 focusable elements (nav links + search); accordion/tabs operable.

**Logo fix:** WKND header/footer logos rendered as `about:error` (DA rewrites raw
`<img src="/icons/...">` in content). Switched to the EDS icon convention
(`:wknd-logo:` / `:wknd-logo-light:`) which `decorateIcons` resolves to the
code-served SVG at runtime and survives the pipeline. Verified on the integration
preview: header logo `/icons/wknd-logo.svg` → 200 (renders 110×41), footer
`/icons/wknd-logo-light.svg` → 200 (renders 120×45), both linked to `/`.

**Mobile Lighthouse (measured on the live integration preview):**
| Page | Performance | Accessibility | LCP | CLS | TBT |
|---|---|---|---|---|---|
| Home | 99 | **100** | 1.5 s | 0.076 | 0 ms |
| Article (`/magazine/arctic-surfing`) | **100** | **100** | 1.1 s | 0.008 | 0 ms |

Accessibility is **100** on both after: heading-order normalization (byline/
duplicate-title/level-cap) and underlining inline content links
(`link-in-text-block`). Article CWV all green. Home CLS 0.076 (still "good",
&lt; 0.1); a committed `columns` image aspect-ratio reservation reduces it further
once the branch code-bus serves the updated block CSS (it was still serving the
pre-fix `columns.css` at measurement time).

---

## 6. Delivery status

**PRs (feature branches only; no direct main pushes):**
- #1 `chore/lf-line-endings` → main — `.gitattributes`
- #2 `feat/wknd-global-design` → main — design system + fonts
- #3 `feat/home-shell` → #2 — homepage + carousel + header/nav/footer
- #4 `feat/rep-pages` → #3 — representative pages + tabs/accordion + generic importer
- #5 `feat/bulk-import` → #4 — all 20 remaining pages + da-sync
- #6 `feat/qa-polish` → #5 — WKND block styling
- **#7 `feat/wknd-integration` → main — integration PR** (all commits; single-branch preview that serves every block). Recommended review target.

**Live URLs:**
- Published site (main code + DA content): https://main--eds-ema-training-capstone--akshatn1.aem.live/
- Integration preview (full WKND code + DA content): https://feat-wknd-integration--eds-ema-training-capstone--akshatn1.aem.page/
- Content published to DA: all 26 pages + nav/footer (preview + live = 200).

**Note:** The published `main` live site shows real WKND content but boilerplate block *code* (carousel 404) until the integration PR merges — EDS serves code only from `main`. Do not merge until acceptance checks are reviewed on the integration preview.
