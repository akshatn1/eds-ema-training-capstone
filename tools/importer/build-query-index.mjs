/* eslint-disable */
/* Build an EDS query-index.json sheet from published-page metadata.
 *
 * This is a STOPGAP generator used only because the project's tools.aem.live
 * index is not reachable from this environment. Each row is derived from a
 * page's own metadata + the WKND source page's filter-tab / home-section
 * membership — there is no hard-coded catalog. Replace with a real
 * tools.aem.live index definition exposing the same columns (see report).
 *
 * Usage: node tools/importer/build-query-index.mjs > /tmp/query-index.json
 */
import fs from 'fs';

const PREVIEW = 'https://main--eds-ema-training-capstone--akshatn1.aem.page';
const SOURCE = 'https://wknd.site/us/en';
const pathMap = JSON.parse(fs.readFileSync('/tmp/pathmap.json', 'utf8'));

const meta = (html, re) => { const m = html.match(re); return m ? m[1] : ''; };
const decode = (s) => s
  .replace(/&#x26;|&amp;/g, '&').replace(/&#39;|&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&#x2019;/g, '’')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function fetchText(url) {
  try { const r = await fetch(url, { redirect: 'follow' }); return r.ok ? await r.text() : ''; } catch { return ''; }
}

const typeOf = (tpl) => ({
  'article-detail': 'article',
  'adventure-detail': 'adventure',
  homepage: 'page',
  'adventure-listing': 'page',
  'card-listing': 'page',
  'faq-accordion': 'page',
}[tpl] || 'page');

// adventure category from the WKND source page's own filter-tab membership
async function buildAdventureCategories() {
  const html = await fetchText(`${SOURCE}/adventures.html`);
  const tabLabels = {};
  const tabRe = /aria-controls="([^"]+)"[^>]*>([A-Za-z]+)</g; let m;
  while ((m = tabRe.exec(html))) tabLabels[m[1]] = m[2];
  const panels = html.split(/id="(tabs-[^"]*-tabpanel)"/);
  const catBySlug = {};
  for (let i = 1; i < panels.length; i += 2) {
    const label = tabLabels[panels[i]];
    if (!label || label === 'All') continue;
    [...(panels[i + 1] || '').matchAll(/\/us\/en\/adventures\/([a-z-]+)\.html/g)]
      .forEach((x) => { if (!catBySlug[x[1]]) catBySlug[x[1]] = label; });
  }
  return catBySlug;
}

// curated homepage selection + order from the source home page's own sections
async function buildHomeCuration() {
  const h = await fetchText(`${SOURCE}.html`);
  const raEnd = h.indexOf('Next Adventures');
  const ra = h.slice(h.indexOf('Recent Articles'), raEnd > 0 ? raEnd : undefined);
  const raSlugs = [...ra.matchAll(/magazine\/([a-z-]+)\.html/g)].map((x) => x[1]).filter((v, i, a) => a.indexOf(v) === i);
  const wd = h.slice(h.indexOf('Where do you want to go'));
  const wdSlugs = [...wd.matchAll(/adventures\/([a-z-]+)\.html/g)].map((x) => x[1]).filter((v, i, a) => a.indexOf(v) === i);
  const order = {};
  raSlugs.forEach((s, i) => { order[`/magazine/${s}`] = i + 1; });
  wdSlugs.forEach((s, i) => { order[`/adventures/${s}`] = i + 1; });
  return order;
}

// article publication date from the source article's visible date line
async function articleDate(path) {
  const src = await fetchText(`${SOURCE}${path}.html`);
  const m = src.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})/);
  if (!m) return '';
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const mo = months[m[2].slice(0, 3)];
  if (mo === undefined) return '';
  return String(Math.floor(Date.UTC(Number(m[3]), mo, Number(m[1])) / 1000));
}

(async () => {
  const advCats = await buildAdventureCategories();
  const homeOrder = await buildHomeCuration();
  const rows = [];
  for (const [path, tpl] of Object.entries(pathMap)) {
    const html = await fetchText(`${PREVIEW}${path}`);
    const title = decode(meta(html, /<meta property="og:title" content="([^"]*)"/) || meta(html, /<title>([^<]*)<\/title>/)).replace(/\s*\|\s*WKND.*$/, '').trim();
    const description = decode(meta(html, /<meta name="description" content="([^"]*)"/));
    const image = (meta(html, /<meta property="og:image" content="([^"]*)"/) || '').replace(/&#x26;/g, '&').replace(PREVIEW, '');
    let publicationDate = '';
    let activity = '';
    if (tpl === 'article-detail') publicationDate = await articleDate(path);
    if (tpl === 'adventure-detail') {
      const slug = path.split('/').pop();
      activity = advCats[slug] || '';
      if (!activity) {
        if (/cycling|biking/.test(slug)) activity = 'Cycling';
        else if (/ski/.test(slug)) activity = 'Skiing';
        else if (/surf/.test(slug)) activity = 'Surfing';
        else if (/climb/.test(slug)) activity = 'Climbing';
        else activity = 'Travel';
      }
    }
    const hOrder = homeOrder[path] || '';
    rows.push({
      path,
      title,
      description,
      image,
      lastModified: publicationDate,
      publicationDate,
      template: tpl,
      type: typeOf(tpl),
      category: activity,
      tags: activity,
      membersOnly: 'false',
      homeFeatured: hOrder ? 'true' : 'false',
      homeOrder: hOrder ? String(hOrder) : '',
    });
    process.stderr.write(`indexed ${path} (${tpl}${activity ? ', ' + activity : ''}${hOrder ? ', home#' + hOrder : ''})\n`);
  }
  rows.sort((a, b) => a.path.localeCompare(b.path));
  const sheet = { total: rows.length, offset: 0, limit: rows.length, data: rows, ':type': 'sheet' };
  process.stdout.write(JSON.stringify(sheet));
})();
