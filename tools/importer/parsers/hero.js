/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: hero
 * Base block: hero
 * SHARED across templates. Handles two source DOM shapes:
 *   1. adventure-detail: a single-image "mini carousel" (.carousel.cmp-carousel--mini)
 *      — a full-bleed image only, no heading/text/CTA.
 *   2. homepage: an Adobe teaser (.cmp-teaser__image / .cmp-teaser__title /
 *      .cmp-teaser__description / .cmp-teaser__action-link).
 * Source(s): https://wknd.site/us/en/adventures/bali-surf-camp.html (carousel),
 *            https://wknd.site/us/en.html (teaser).
 * Generated: 2026-09-07
 *
 * Structure (from library-description): 1 column, up to 3 rows.
 *   - Row 1: block name (added by createBlock)
 *   - Row 2: single cell — background image (optional)
 *   - Row 3: single cell — title, subheading, CTA (optional)
 * Selectors validated against migration-work/block-context/hero/source.html.
 */
export default function parse(element, { document }) {
  // Detect the homepage teaser shape first (it carries text content).
  const hasTeaser = !!element.querySelector(
    '.cmp-teaser__title, .cmp-teaser__description, .cmp-teaser__action-link',
  );
  // Detect the adventure-detail "mini carousel" shape (image only, no teaser text).
  const isCarousel = !!element.querySelector('.cmp-carousel, .cmp-carousel__item')
    || element.classList.contains('cmp-carousel')
    || element.classList.contains('carousel');

  if (isCarousel && !hasTeaser) {
    // --- Adventure-detail branch: single-image hero (image only) ---
    const image = element.querySelector('.cmp-image img, .cmp-carousel__item img, img');

    // Empty-block guard: no image to show.
    if (!image) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const cells = [[image]]; // Row 2: single-cell background image only.
    const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
    element.replaceWith(block);
    return;
  }

  // --- Homepage teaser branch (original behavior) ---
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description');
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link'));

  // Empty-block guard: no heading and no description.
  if (!heading && !description) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (single cell). Only added if present.
  if (image) cells.push([image]);

  // Row 3: text content (single cell holding all elements).
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  ctas.forEach((cta) => contentCell.push(cta));
  cells.push([contentCell]); // 1-column: one row, one cell containing all elements

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
