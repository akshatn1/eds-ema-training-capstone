/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: cards
 * Base block: cards
 * Source: https://wknd.site/us/en.html (WKND article/adventure card grids)
 * Generated: 2026-09-07
 *
 * Structure (from library-description): 2 columns, one row per card.
 *   - Cell 1: image (mandatory)
 *   - Cell 2: text content — title (heading), description, optional CTA link.
 * Selectors validated against migration-work/block-context/cards/source.html:
 *   card:   .cmp-image-list__item
 *   image:  .cmp-image-list__item-image img
 *   title:  .cmp-image-list__item-title
 *   desc:   .cmp-image-list__item-description
 *   link:   .cmp-image-list__item-title-link (card is fully clickable)
 */
export default function parse(element, { document }) {
  // Each list item is a card. Fallbacks cover other card markups.
  let items = Array.from(element.querySelectorAll('.cmp-image-list__item'));
  if (!items.length) {
    items = Array.from(element.querySelectorAll(':scope > ul > li, li'));
  }

  const cells = [];

  items.forEach((item) => {
    // INPUT extraction (validated against source.html)
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');
    const titleText = item.querySelector('.cmp-image-list__item-title, [class*="title"]');
    const description = item.querySelector('.cmp-image-list__item-description, [class*="description"], p');
    const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[class*="title-link"]');
    const linkHref = titleLink ? titleLink.getAttribute('href') : null;

    // Build the text cell: heading (linked if the card links out), description.
    const contentCell = [];
    if (titleText) {
      const heading = document.createElement('h3');
      if (linkHref) {
        const a = document.createElement('a');
        a.setAttribute('href', linkHref);
        a.textContent = titleText.textContent.trim();
        heading.appendChild(a);
      } else {
        heading.textContent = titleText.textContent.trim();
      }
      contentCell.push(heading);
    }
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      contentCell.push(p);
    }

    // 2-column row: [image, content]. Pad missing cells to keep the table even.
    cells.push([image || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
