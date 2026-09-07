/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: tabs
 * Base block: tabs
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.cmp-tabs)
 * Generated: 2026-09-07
 *
 * Source shape: a .cmp-tabs component with an <ol class="cmp-tabs__tablist"> of
 * <li class="cmp-tabs__tab"> labels (Overview / Itinerary / What to Bring) and a
 * matching sequence of <div class="cmp-tabs__tabpanel"> panels holding rich text
 * and images.
 *
 * Output structure (from library-description + blocks/tabs/tabs.js): 2 columns.
 *   - Row 1: block name (added by createBlock)
 *   - Each subsequent row = one tab: cell 1 = tab label, cell 2 = tab panel content.
 * blocks/tabs/tabs.js takes each row's firstElementChild as the label and treats
 * the rest of the row as the panel, so the label/content split here matches it.
 * Selectors validated against migration-work/block-context/tabs/source.html.
 */
export default function parse(element, { document }) {
  const root = element.querySelector('.cmp-tabs') || element;

  const labels = Array.from(root.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab'));
  const panels = Array.from(root.querySelectorAll('.cmp-tabs__tabpanel'));

  // Empty-block guard: nothing tab-like found.
  if (!labels.length || !panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  labels.forEach((label, i) => {
    const panel = panels[i];
    // Label cell: plain text of the tab.
    const labelText = (label.textContent || '').trim();

    // Panel cell: prefer the meaningful content of the fragment (paragraphs, lists,
    // images) rather than the empty layout grid wrappers. Fall back to the whole panel.
    let panelContent;
    const contentEls = panel.querySelectorAll(
      '.cmp-contentfragment__elements p, .cmp-contentfragment__elements ul, '
      + '.cmp-contentfragment__elements ol, .cmp-contentfragment__elements img',
    );
    if (contentEls.length) {
      panelContent = Array.from(contentEls);
    } else {
      // Fallback: use the fragment container, or the panel itself.
      panelContent = panel.querySelector('.cmp-contentfragment__elements')
        || panel;
    }

    cells.push([labelText, panelContent]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
