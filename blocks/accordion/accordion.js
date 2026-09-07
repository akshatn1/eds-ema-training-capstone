/*
 * Accordion Block
 * Recreate an accordion
 * https://www.aem.live/developer/block-collection/accordion
 *
 * Repo conventions: plain block name, no external imports (this repo's
 * vendored scripts/aem.js does not export fetchPlaceholders). Uses native
 * <details>/<summary> so no placeholder strings or labels are required.
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
