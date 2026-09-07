# WKND Pixel-Fidelity Correction Report

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
