import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Dynamic, index-driven card listing.
 *
 * Data source: the EDS query-index sheet at `/query-index.json`. This block
 * fetches the index once, filters/sorts it deterministically from authored
 * config, and renders the same semantic `ul > li` markup + `.cards` CSS hooks
 * as the static cards block so the WKND visual design is preserved.
 *
 * Authored configuration (one "key | value" row per option in the block table):
 *   path        prefix an item's path must start with (e.g. /magazine/)
 *   type        template/type filter (article | adventure | page | <template>)
 *   category    tag/category/activity filter (e.g. Surfing) — matched on
 *               category or tags, case-insensitive
 *   members     true | false | all — filter on the membersOnly field
 *   exclude     comma-separated exact paths to omit (e.g. /magazine)
 *   sort        index field to sort by (default: lastModified)
 *   direction   asc | desc (default: desc)
 *   limit       max items to render (default: all)
 *   variant     extra class added to the block (e.g. compact)
 *   filters     when set to "category", render keyboard-accessible category tabs
 *
 * Data contract (query-index.json row fields):
 *   path, title, description, image, lastModified, template, type,
 *   category, tags, membersOnly
 */

const INDEX_URL = '/query-index.json';
let indexPromise;

function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(INDEX_URL)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => (Array.isArray(j.data) ? j.data : []))
      .catch(() => []);
  }
  return indexPromise;
}

/** Read the authored "key | value" config rows, then empty the block. */
function readConfig(block) {
  const cfg = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const val = cells[1].textContent.trim();
      if (key) cfg[key] = val;
    }
  });
  return cfg;
}

function matches(item, cfg) {
  if (cfg.path && !item.path.startsWith(cfg.path)) return false;
  if (cfg.type && (item.type || '').toLowerCase() !== cfg.type.toLowerCase()
    && (item.template || '').toLowerCase() !== cfg.type.toLowerCase()) return false;
  if (cfg.category) {
    const hay = `${item.category || ''} ${item.tags || ''}`.toLowerCase();
    if (!hay.includes(cfg.category.toLowerCase())) return false;
  }
  if (cfg.members && cfg.members !== 'all') {
    const mo = String(item.membersOnly).toLowerCase() === 'true';
    if (cfg.members === 'true' && !mo) return false;
    if (cfg.members === 'false' && mo) return false;
  }
  if (cfg.exclude) {
    const ex = cfg.exclude.split(',').map((s) => s.trim());
    if (ex.includes(item.path)) return false;
  }
  return true;
}

function sortItems(items, cfg) {
  const field = cfg.sort || 'lastModified';
  const dir = (cfg.direction || 'desc') === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = a[field] || '';
    const bv = b[field] || '';
    if (av === bv) return a.path.localeCompare(b.path); // stable fallback
    // numeric compare when both look numeric (timestamps)
    if (/^\d+$/.test(av) && /^\d+$/.test(bv)) return (Number(av) - Number(bv)) * dir;
    return av.localeCompare(bv) * dir;
  });
}

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
  const titleLink = document.createElement('a');
  titleLink.href = item.path;
  titleLink.textContent = item.title || item.path;
  h3.append(titleLink);
  body.append(h3);
  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    body.append(p);
  }

  li.append(imageDiv, body);
  return li;
}

function renderList(ul, items) {
  ul.replaceChildren(...items.map(buildCard));
}

function emptyState(msg) {
  const p = document.createElement('p');
  p.className = 'cards-empty';
  p.textContent = msg;
  return p;
}

export default async function decorate(block) {
  const cfg = readConfig(block);
  block.textContent = '';
  if (cfg.variant) block.classList.add(cfg.variant);
  // reuse the .cards visual design (borderless WKND cards)
  block.classList.add('cards');

  const all = await loadIndex();
  if (!all.length) {
    block.append(emptyState('Content is currently unavailable. Please try again later.'));
    return;
  }

  let items = all.filter((i) => matches(i, cfg));
  items = sortItems(items, cfg);
  const limit = cfg.limit ? parseInt(cfg.limit, 10) : items.length;

  // optional keyboard-accessible category filter tabs (Adventures)
  let tablist;
  if (cfg.filters === 'category') {
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
    const limited = filtered.slice(0, limit);
    if (!limited.length) {
      ul.replaceChildren();
      let empty = block.querySelector('.cards-empty');
      if (!empty) { empty = emptyState('No matching results.'); block.append(empty); }
    } else {
      const empty = block.querySelector('.cards-empty');
      if (empty) empty.remove();
      renderList(ul, limited);
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
