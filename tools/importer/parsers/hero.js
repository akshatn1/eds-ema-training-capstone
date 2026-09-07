/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: hero
 * Base block: hero
 * Source: https://wknd.site/us/en.html (WKND "Next Adventures" large feature teaser)
 * Generated: 2026-09-07
 *
 * Structure (from library-description): 1 column, 3 rows.
 *   - Row 1: block name (added by createBlock)
 *   - Row 2: single cell — background image (optional)
 *   - Row 3: single cell — title, subheading, CTA
 * Selectors validated against migration-work/block-context/hero/source.html.
 */
export default function parse(element, { document }) {
  // INPUT extraction (validated against source.html) — specific classes.
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
