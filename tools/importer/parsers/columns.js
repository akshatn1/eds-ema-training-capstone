/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: columns
 * Base block: columns
 * SHARED across templates. Handles two source DOM shapes:
 *   1. adventure-detail: a content fragment (.contentfragment.cmp-contentfragment--elements)
 *      holding label/value pairs (Activity, Adventure Type, Trip Length, Group Size,
 *      Difficulty, Price). Emitted as a 2-column table, one row per label/value pair.
 *   2. homepage: an Adobe "Featured Article" split teaser — two-column single row
 *      (image + text: pretitle/title/description/CTA).
 * Source(s): https://wknd.site/us/en/adventures/bali-surf-camp.html (content fragment),
 *            https://wknd.site/us/en.html (teaser).
 * Generated: 2026-09-07
 *
 * Structure (from library-description): multiple columns/rows, first row is block name.
 * Selectors validated against migration-work/block-context/columns/source.html.
 */
export default function parse(element, { document }) {
  // --- Adventure-detail branch: content fragment of label/value pairs ---
  // Each pair is a .cmp-contentfragment__element containing a <dt> (label) and <dd> (value).
  const cfElements = Array.from(
    element.querySelectorAll('.cmp-contentfragment__element'),
  );

  if (cfElements.length) {
    const cells = [];
    cfElements.forEach((el) => {
      const label = el.querySelector('.cmp-contentfragment__element-title, dt');
      const value = el.querySelector('.cmp-contentfragment__element-value, dd');
      // Normalize whitespace on the value (source <dd> has surrounding newlines).
      if (value) value.textContent = value.textContent.trim();
      // Row per pair: [label, value]. Pad to keep the 2-column shape even.
      cells.push([label || '', value || '']);
    });

    // Empty-block guard: no usable pairs.
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
    element.replaceWith(block);
    return;
  }

  // --- Homepage teaser branch (original behavior) ---
  // Selectors are specific and mutually exclusive. A generic `p` fallback is
  // avoided because the pretitle is a <p> that precedes the description div in DOM
  // order and would otherwise be double-selected (dropping the real description).
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
