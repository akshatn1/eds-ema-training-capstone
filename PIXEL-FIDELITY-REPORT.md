# WKND Pixel-Fidelity Correction Report

> ## Pass 2 — Desktop layout-regression corrections (branch `fix/wknd-layout-fix`, from `a2be7b7`)
>
> **Preview:** https://fix-wknd-layout-fix--eds-ema-training-capstone--akshatn1.aem.page/
> **Source measured live at 1903/1440/768/375** (spec: `migration-work/pixel-fidelity/source-spec-1903.json`).
> Key finding: the WKND site is capped at **max-width 1680px** (hero spans that cap), inner content at **1164px** — the prior pass wrongly used 1200px + an unconditional 100vw hero.
>
> ### Regressions fixed (source vs before vs after @1903, measured)
> | Item | Source | Before (regressed) | After |
> |---|---|---|---|
> | Header position | fixed/sticky (stays on scroll) | `relative` — disappeared on scroll | **sticky, top:0 at y=0/700/1200/1800** ✅ |
> | Header height | ~194px | ~229px, 3 stacked bands | **197px, one row** ✅ |
> | Logo | 128×48 | 110×41 | **128×48** ✅ |
> | Logo/nav/search | one vertically-centred band | 3 bands (y47 / y117 / y166) | **one band (centres y111–113)** ✅ |
> | Landmarks | header/nav/footer | none exposed | `banner` + `nav[aria-label]` + `contentinfo` ✅ |
> | Hero width | capped 1680 (gutters >1680) | full viewport (100vw) | **capped 1680, x112 w1680** ✅ |
> | Hero image height | ~640px | ~494px | **640px** ✅ |
> | Hero panel | overlaps image bottom (y~656) | premature (y482) | **overlaps bottom (x356 w1192)** ✅ |
> | Featured Article | 1164px, 62/38, grey panel, ~505px | 1192px, ~50/50, white, ~390px | **1164px, 62/38, grey, ~527px** ✅ |
> | Recent Articles | no card shell, uppercase, grey trunc desc, yellow btn | bordered cards, blue serif titles, blue text link | **no shell, uppercase titles, grey 2-line desc, yellow btn** ✅ |
> | Next Adventures | capped 1680 | full viewport | **capped 1680** ✅ |
>
> ### Validation (measured on branch preview)
> - **No horizontal overflow** at 1903/1440/768/375.
> - **Keyboard/a11y:** hamburger opens drawer, **Escape closes it**, no focus trap; `nav[aria-label="Main navigation"]` landmark.
> - **Mobile Lighthouse:** Home **Perf 99 / A11y 100** (LCP 1.2s, CLS 0.074); Article **Perf 100 / A11y 100** (LCP 1.1s, CLS 0.029). (A sticky-header CLS regression to 0.198 was caught mid-pass and fixed by reserving header height → 0.074.)
> - **Templates** (magazine, arctic-surfing, adventures, bali-surf-camp, faqs, about-us): 200, sticky header + 1164 content cap propagated, no overflow.
> - `npm run lint` clean. `scripts/aem.js` untouched. No DA content changed (nav utility already published & compatible with main).
>
> ### Files changed (pass 2)
> `styles/styles.css` (content cap 1164, sticky+reserved header, section CTA button), `blocks/header/header.{css,js}` (sticky, one-row grid, 128px logo, aria-label), `blocks/carousel/carousel.css` (1680 cap not 100vw), `blocks/columns/columns.css` (62/38 grey featured), `blocks/cards/cards.css` (no shell, uppercase), `blocks/hero/hero.css` (1680 cap).
>
> ### Remaining differences (honest)
> - Home CLS 0.074 (good, <0.1; not 0 — featured image + carousel settle).
> - about-us contributor cards render text-only (person photos are XF-sourced in the original content; not a layout regression).
>
> ---

## Pass 1 (superseded by Pass 2 for desktop layout)

**Source of truth:** https://wknd.site/us/en.html (+ linked US-EN pages)
**Target:** https://main--eds-ema-training-capstone--akshatn1.aem.page/
**Branch:** `fix/wknd-pixel-fidelity` (from merge commit `8c8d41e`)
**Preview:** https://fix-wknd-pixel-fidelity--eds-ema-training-capstone--akshatn1.aem.page/

Layout was re-measured from the live source via `getBoundingClientRect`/
`getComputedStyle` at 1440px (not from memory). Spec saved at
`migration-work/pixel-fidelity/source-spec.json`.

---

## Source vs Target — measured @ 1440px

| Element | Source (wknd.site) | Target before | Target after |
|---|---|---|---|
| Utility bar | full-width black strip, 25px, Sign In + flag + EN-US right | **absent** | full-width black strip 27px, Sign In + EN-US right ✅ |
| Header height | ~194px white | ~89px compressed | 150px+ white, tall ✅ |
| Logo | x152, 128×48 | small, left | x152, 110×41 ✅ |
| Primary nav | centred (centreX 910), uppercase | left-ish, uppercase | centred, uppercase ✅ |
| Search | x1122, 166×42, grey | present right | right column, grey box ✅ |
| Carousel | full-bleed x0 w1440, img 640px, cover 50%/50% | **1200px w/ gutters** | full-bleed x0 w1440, 640px ✅ |
| Hero panel | white x124 **w1192** y660, left copy | small box x212/y265 inside image | white **x124 w1192**, left copy ✅ |
| Dots | centred near panel bottom | separate grey strip | centred below panel, yellow active ✅ |
| Arrows | bottom-right edge | vertically centred | bottom-right edge ✅ |

---

## Files changed (vs `8c8d41e`)

- `blocks/header/header.js` — add `utility` section; render it as a full-width black bar above the header row.
- `blocks/header/header.css` — black utility bar (desktop-only), taller 150px header grid (logo / centred nav / search), search sizing, mobile search overflow guard.
- `blocks/carousel/carousel.css` — full-bleed image (no 100vw overflow), wide overlapping white panel (~1192px, left copy), dots centred below panel, prev/next bottom-right, min-height reservation.
- `content/nav.plain.html` (DA) — add utility section (Sign In / EN-US). Uploaded + published to DA.

CSS kept block-scoped; `styles/styles.css` untouched this pass (global tokens already correct: Asar/Source Sans Pro, #202020 text, #ffea00 accent). `scripts/aem.js` untouched. No framework/build step added.

---

## Responsive / keyboard

| Viewport | Result |
|---|---|
| 1440px | header + full-bleed carousel + panel match source; no overflow |
| 768px | header collapses to hamburger; no overflow |
| 375px | hamburger + full-width search; **no horizontal overflow** (scrollWidth = 375) |

Keyboard: nav links + search focusable; carousel prev/next/indicator buttons and tabs/accordion operable; visible focus states retained.

---

## Mobile Lighthouse (measured on branch preview)

| Page | Performance | Accessibility | LCP | CLS | TBT |
|---|---|---|---|---|---|
| Home (`/`) | 98–99 | **100** | 1.2–1.5 s | 0.079 | 0 ms |
| Article (`/magazine/arctic-surfing`) | **100** | **100** | 1.0 s | 0.008 | 10 ms |

- Accessibility **100** on both; meaningful alt text preserved; no horizontal overflow.
- Article CWV all green. Home CLS 0.079 is within Google's "good" band (< 0.1); residual shift is the featured-article image + carousel content settling after decoration.

---

## Templates verified (inherit corrected global/header/footer/carousel CSS)

`/magazine`, `/magazine/arctic-surfing`, `/adventures`, `/adventures/bali-surf-camp`,
`/faqs`, `/about-us` — all HTTP 200, no mobile overflow, correct header/footer/blocks
(tabs, accordion, cards, hero), WKND text/images/links/order/alt preserved.

---

## Remaining deviations

- Home CLS 0.079 (good, not 0): featured image + carousel settle; would require
  intrinsic-ratio reservation on the featured teaser image to reach ~0.
- Utility bar is desktop-only (source folds Sign In / locale into the mobile
  drawer; kept simple here). Sign In / language are presentational (non-functional),
  matching the out-of-scope decision for auth/working-locale.

---

## Validation URLs

- Branch preview: https://fix-wknd-pixel-fidelity--eds-ema-training-capstone--akshatn1.aem.page/
- Published live: https://main--eds-ema-training-capstone--akshatn1.aem.live/
- Source: https://wknd.site/us/en.html
