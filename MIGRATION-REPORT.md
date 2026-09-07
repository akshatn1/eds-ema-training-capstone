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

**Responsive (shell, Playwright):**
- Tablet (780px): no horizontal overflow; hamburger visible; header 88px; footer dark
- Desktop (1440px): no overflow; hamburger hidden; inline nav; 6 links
- Header exposes 12 keyboard-focusable elements (nav links + search input)

**Pending (gated on DA publish — see §6):** full-page PAGE critique vs source, mobile Lighthouse (perf + a11y) on home + an article. These require content served from DA; local `aem up` proxies content documents from the deployed origin, so they can only be measured post-publish.

---

## 6. Delivery status & blockers

**Branches (feature branches only, no direct main):**
- `chore/lf-line-endings` — `.gitattributes` (LF; excludes vendored aem.js)
- `feat/wknd-global-design` — design system + fonts
- `feat/home-shell` — homepage + carousel + header/nav/footer
- `feat/rep-pages` — representative page per template + tabs/accordion + generic importer
- `feat/bulk-import` — all 20 remaining pages + da-sync tool
- `feat/qa-polish` — WKND styling for carousel/tabs/accordion

**Blockers (credential opt-ins not injected in session):**
- `git push` → 401 (GitHub write creds) — blocks pushing branches + opening PRs
- `admin.da.live` POST → 401 (DA creds) — blocks content sync/publish
- Lighthouse + PAGE critique gated behind DA publish

When credentials are live: push branches → open stacked PRs (each with `{branch}--eds-ema-training-capstone--akshatn1.aem.page` preview link) → `tools/importer/da-sync.sh --publish` → run Lighthouse + critique.
