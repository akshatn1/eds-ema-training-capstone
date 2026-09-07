/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: columns
 * Base block: columns
 * Source: https://wknd.site/us/en.html (WKND "Featured Article" split teaser)
 * Generated: 2026-09-07
 *
 * Structure (from library-description): multiple columns/rows, first row is block name.
 * Intent: two-column single row — image on one side, text on the other.
 * Selectors validated against migration-work/block-context/columns/source.html.
 *
 * NOTE: selectors are specific and mutually exclusive. A generic `p` fallback is
 * avoided because the pretitle is a <p> that precedes the description div in DOM
 * order and would otherwise be double-selected (dropping the real description).
 */
export default function parse(element, { document }) {
  // INPUT extraction (validated against source.html) — specific classes, no overlap.
  const pretitle = element.querySelector('.cmp-teaser__pretitle');
  const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description');
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link'));
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // Build the text column (eyebrow, heading, paragraph, CTA)
  const textCell = [];
  if (pretitle) textCell.push(pretitle);
  if (heading) textCell.push(heading);
  if (description) textCell.push(description);
  ctas.forEach((cta) => textCell.push(cta));

  // Empty-block guard.
  if (!textCell.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Two-column single row: [image, text]. Pad missing cells to keep the row even.
  const cells = [[image || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
