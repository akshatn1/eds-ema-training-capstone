/*
 * Shared index-driven listing helpers.
 *
 * Data source: the EDS query-index sheet at `/query-index.json`. Blocks import
 * these helpers to fetch the index once, then filter/sort/limit deterministically
 * from authored config. No hard-coded catalogs or path arrays.
 *
 * query-index.json row fields (data contract):
 *   path, title, description, image, lastModified, publicationDate,
 *   template, type, category, tags, membersOnly, homeFeatured, homeOrder
 */

const INDEX_URL = '/query-index.json';
let indexPromise;

/** Fetch and cache the query index once per page load. */
export async function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(INDEX_URL)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => (Array.isArray(j.data) ? j.data : []))
      .catch(() => []);
  }
  return indexPromise;
}

/**
 * Read authored "key | value" config rows from a block, then leave the block
 * empty for the caller to populate.
 * @param {Element} block
 * @returns {Object} config map (lowercased keys)
 */
export function readListingConfig(block) {
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

/** True if an index item satisfies the authored config filters. */
export function matchesConfig(item, cfg) {
  if (cfg.path && !item.path.startsWith(cfg.path)) return false;
  if (cfg.type
    && (item.type || '').toLowerCase() !== cfg.type.toLowerCase()
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
  if (cfg.featured === 'true' && String(item.homeFeatured).toLowerCase() !== 'true') return false;
  if (cfg.exclude) {
    const ex = cfg.exclude.split(',').map((s) => s.trim());
    if (ex.includes(item.path)) return false;
  }
  return true;
}

function numeric(v) { return /^\d+$/.test(String(v)); }

/**
 * Deterministic sort. Default sort field is `lastModified`; when the config
 * sorts by `homeOrder` (curated), numeric ascending is used. Stable fallback
 * is path order.
 */
export function sortItems(items, cfg) {
  const field = cfg.sort || 'lastModified';
  const dir = (cfg.direction || 'desc') === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av === bv) return a.path.localeCompare(b.path);
    if (av === '') return 1; // blanks last
    if (bv === '') return -1;
    if (numeric(av) && numeric(bv)) return (Number(av) - Number(bv)) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

/** Full pipeline: filter → sort → limit. */
export function selectItems(all, cfg) {
  let items = all.filter((i) => matchesConfig(i, cfg));
  items = sortItems(items, cfg);
  const limit = cfg.limit ? parseInt(cfg.limit, 10) : items.length;
  return items.slice(0, limit);
}
