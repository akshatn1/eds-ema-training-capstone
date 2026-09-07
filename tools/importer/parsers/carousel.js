/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: carousel
 * Base block: carousel
 * Source: https://wknd.site/us/en.html (WKND hero carousel)
 * Generated: 2026-09-07
 *
 * Structure (from library-description): 2 columns, one row per slide.
 *   - Cell 1: image (mandatory)
 *   - Cell 2: text content (heading, description, CTA)
 * Selectors validated against migration-work/block-context/carousel/source.html:
 *   slides:  .cmp-carousel__item
 *   image:   .cmp-teaser__image img
 *   title:   .cmp-teaser__title
 *   desc:    .cmp-teaser__description
 *   cta:     .cmp-teaser__action-link
 */
export default function parse(element, { document }) {
  // Each carousel item is a slide. Fallbacks cover other carousel markups.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll(':scope .teaser, .carousel-slide'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // INPUT extraction (validated against source.html)
    const image = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');
    const heading = slide.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
    const description = slide.querySelector('.cmp-teaser__description, p, [class*="description"]');
    const ctas = Array.from(slide.querySelectorAll('.cmp-teaser__action-link, a.cmp-teaser__action-link, [class*="action"] a'));

    // Build the text cell (heading, description, CTAs)
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    ctas.forEach((cta) => contentCell.push(cta));

    // 2-column row: [image, content]. Pad missing cells to keep the table even.
    cells.push([image || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: no slides extracted.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
