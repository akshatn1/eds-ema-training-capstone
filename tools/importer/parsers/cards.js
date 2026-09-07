/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: cards
 * Base block: cards
 * SHARED across templates. Handles two source DOM shapes:
 *   1. Image-list grids (homepage / adventure-listing / article grids):
 *      a .image-list.list / ul.cmp-image-list of .cmp-image-list__item cards
 *      (image + title link + summary). Emits one row per <li>.
 *   2. Contributor experience fragment (about-us "people" grid): a single
 *      .experiencefragment.cmp-experience-fragment--contributor person card
 *      (circular photo + name + role + optional social links). Each contributor
 *      is mapped as its own cards instance, so the parser is invoked once per
 *      person and emits a single-row cards block for that person.
 * Source(s): https://wknd.site/us/en.html (image-list),
 *            https://wknd.site/us/en/about-us.html (contributor XF).
 * Generated: 2026-09-07
 *
 * Structure (from library-description): 2 columns, one row per card.
 *   - Cell 1: image (mandatory)
 *   - Cell 2: text content — title (heading), description, optional CTA link(s).
 * Selectors validated against migration-work/block-context/cards/source.html,
 * migration-work/block-context/cards-articles/source.html, and
 * migration-work/block-context/cards-contributor/source.html:
 *   image-list card:  .cmp-image-list__item
 *   image:            .cmp-image-list__item-image img
 *   title:            .cmp-image-list__item-title
 *   desc:             .cmp-image-list__item-description
 *   link:             .cmp-image-list__item-title-link (card is fully clickable)
 *   contributor:      .experiencefragment.cmp-experience-fragment--contributor (or self)
 *   photo:            .cmp-image img
 *   name:             .cmp-title__text (first)
 *   role:             .cmp-title__text (second)
 *   social links:     .cmp-button (Facebook / Twitter / Instagram)
 */
export default function parse(element, { document }) {
  // --- Contributor experience-fragment branch (about-us person cards) ---
  // Detect whether this element IS a contributor XF, or CONTAINS one.
  const contributor = element.matches(
    '.experiencefragment.cmp-experience-fragment--contributor',
  )
    ? element
    : element.querySelector(
        '.experiencefragment.cmp-experience-fragment--contributor',
      );

  if (contributor) {
    // Circular photo (mandatory image cell).
    const photo = contributor.querySelector('.cmp-image img, img');

    // Name + role live in .cmp-title__text elements (name first, role second).
    const titles = Array.from(
      contributor.querySelectorAll('.cmp-title__text'),
    );
    const nameEl = titles[0] || null;
    const roleEl = titles[1] || null;

    // Optional social links (Facebook / Twitter / Instagram).
    const socialLinks = Array.from(
      contributor.querySelectorAll('.cmp-button[href], a.cmp-button'),
    );

    const contentCell = [];
    if (nameEl) {
      const heading = document.createElement('h3');
      heading.textContent = nameEl.textContent.trim();
      contentCell.push(heading);
    }
    if (roleEl) {
      const p = document.createElement('p');
      p.textContent = roleEl.textContent.trim();
      contentCell.push(p);
    }
    socialLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      const a = document.createElement('a');
      a.setAttribute('href', href);
      // Prefer the button's text label (e.g. "Facebook"); fall back to href.
      const label = link.querySelector('.cmp-button__text');
      a.textContent = (label ? label.textContent : link.textContent).trim() || href;
      const linkP = document.createElement('p');
      linkP.appendChild(a);
      contentCell.push(linkP);
    });

    // Empty-block guard: nothing usable in this XF.
    if (!photo && !contentCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }

    // Single 2-column row for this one person. Pad missing cells to stay even.
    const cells = [[photo || '', contentCell.length ? contentCell : '']];
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
    element.replaceWith(block);
    return;
  }

  // --- Image-list branch (original behavior) ---
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
