/* eslint-disable */
/* global WebImporter */
/**
 * Parser for: accordion
 * Base block: accordion
 * Source: https://wknd.site/us/en/faqs.html (WKND FAQ accordion)
 * Generated: 2026-09-07
 *
 * Block library convention (migration-work/block-context/accordion/library-description.txt):
 *   2 columns, multiple rows; first row is the block name.
 *   Each subsequent row is one accordion item with 2 cells:
 *     - Cell 1 (title, mandatory): the clickable question/label.
 *     - Cell 2 (content, mandatory): the answer body (rich content).
 * Target block authored structure (blocks/accordion/accordion.js) matches: it turns
 *   each row's cell 1 into <summary> and cell 2 into the accordion body.
 *
 * Selectors validated against migration-work/block-context/accordion/source.html:
 *   item:     .cmp-accordion__item
 *   question: .cmp-accordion__title (inside .cmp-accordion__button / .cmp-accordion__header)
 *   answer:   .cmp-accordion__panel  (rich content lives in .cmp-text within the panel)
 */
export default function parse(element, { document }) {
  // Each accordion item is one Q&A row. Fallbacks cover minor markup variation.
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));

  const cells = [];

  items.forEach((item) => {
    // --- Question (cell 1) ---
    const questionEl = item.querySelector(
      '.cmp-accordion__title, .cmp-accordion__button, .cmp-accordion__header',
    );
    const questionText = questionEl ? questionEl.textContent.trim() : '';

    // --- Answer (cell 2) ---
    const panel = item.querySelector('.cmp-accordion__panel');
    const answerCell = [];
    if (panel) {
      // Prefer the semantic rich-text blocks; each .cmp-text wraps <p>/<h3>/etc.
      const textBlocks = Array.from(panel.querySelectorAll('.cmp-text'));
      if (textBlocks.length) {
        textBlocks.forEach((tb) => {
          // Move the meaningful child elements (p, h3, ...) into the answer cell.
          Array.from(tb.children).forEach((child) => answerCell.push(child));
        });
      } else {
        // Fallback: use the panel's own content when no .cmp-text wrapper exists.
        Array.from(panel.children).forEach((child) => answerCell.push(child));
      }
    }

    // Skip items with no usable question and no answer.
    if (!questionText && !answerCell.length) return;

    // Build the question cell as a paragraph so it renders as the summary label.
    const questionP = document.createElement('p');
    questionP.textContent = questionText;

    // 2-column row: [question, answer]. Pad missing cells to keep the table even.
    cells.push([questionP, answerCell.length ? answerCell : '']);
  });

  // Empty-block guard: no usable items.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
