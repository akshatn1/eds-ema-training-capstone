import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  loadIndex, readListingConfig, selectItems,
} from '../../scripts/listing.js';

/** Static cards: convert authored rows into ul > li card markup. */
function decorateStatic(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}

/** Build one card <li> from an index record. */
function buildCard(item) {
  const li = document.createElement('li');

  const imageDiv = document.createElement('div');
  imageDiv.className = 'cards-card-image';
  if (item.image) {
    const a = document.createElement('a');
    a.href = item.path;
    a.setAttribute('aria-hidden', 'true');
    a.setAttribute('tabindex', '-1');
    a.append(createOptimizedPicture(item.image, item.title || '', false, [{ width: '750' }]));
    imageDiv.append(a);
  }

  const body = document.createElement('div');
  body.className = 'cards-card-body';
  const h3 = document.createElement('h3');
  const link = document.createElement('a');
  link.href = item.path;
  link.textContent = item.title || item.path;
  h3.append(link);
  body.append(h3);
  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    body.append(p);
  }

  li.append(imageDiv, body);
  return li;
}

function emptyState(msg) {
  const p = document.createElement('p');
  p.className = 'cards-empty';
  p.textContent = msg;
  return p;
}

/**
 * Dynamic cards variant (block classes `cards dynamic`): fetch the query index
 * once, filter/sort/limit from authored config, render the same card markup,
 * and optionally render keyboard-accessible category filter tabs.
 */
async function decorateDynamic(block) {
  const cfg = readListingConfig(block);
  block.textContent = '';

  const all = await loadIndex();
  if (!all.length) {
    block.append(emptyState('Content is currently unavailable. Please try again later.'));
    return;
  }

  const items = selectItems(all, cfg);

  let tablist;
  if (cfg.filters === 'category') {
    // categories come from the indexed metadata, sorted; "All" first
    const cats = ['All', ...[...new Set(items.map((i) => i.category).filter(Boolean))].sort()];
    tablist = document.createElement('div');
    tablist.className = 'cards-filters';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Filter by category');
    cats.forEach((cat, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cards-filter';
      btn.textContent = cat;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.dataset.cat = cat;
      tablist.append(btn);
    });
    block.append(tablist);
  }

  const ul = document.createElement('ul');
  block.append(ul);

  const apply = (cat) => {
    const filtered = (cat && cat !== 'All') ? items.filter((i) => i.category === cat) : items;
    const existingEmpty = block.querySelector('.cards-empty');
    if (existingEmpty) existingEmpty.remove();
    if (!filtered.length) {
      ul.replaceChildren();
      block.append(emptyState('No matching results.'));
    } else {
      ul.replaceChildren(...filtered.map(buildCard));
    }
  };

  apply('All');

  if (tablist) {
    const tabs = [...tablist.querySelectorAll('.cards-filter')];
    const select = (btn) => {
      tabs.forEach((t) => t.setAttribute('aria-selected', t === btn ? 'true' : 'false'));
      apply(btn.dataset.cat);
    };
    tablist.addEventListener('click', (e) => {
      const btn = e.target.closest('.cards-filter');
      if (btn) select(btn);
    });
    tablist.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') [n] = tabs;
      else if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); n.focus(); select(n); }
    });
  }
}

export default async function decorate(block) {
  if (block.classList.contains('dynamic')) {
    await decorateDynamic(block);
  } else {
    decorateStatic(block);
  }
}
