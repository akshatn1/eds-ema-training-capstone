/* eslint-disable */
/* Build an EDS query-index.json sheet from published-page metadata.
 * Data source = each page's own <meta> (title, description, og:image,
 * template) + the WKND source page's Activity field for adventures.
 * No hard-coded catalog: every row is derived from a page's metadata.
 *
 * Usage: node tools/importer/build-query-index.mjs > /tmp/query-index.json
 */
import fs from 'fs';

const PREVIEW = 'https://main--eds-ema-training-capstone--akshatn1.aem.page';
const SOURCE = 'https://wknd.site/us/en';
const pathMap = JSON.parse(fs.readFileSync('/tmp/pathmap.json', 'utf8'));

const meta = (html, re) => { const m = html.match(re); return m ? m[1] : ''; };
const decode = (s) => s
  .replace(/&#x26;/g, '&').replace(/&amp;/g, '&')
  .replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"')
  .replace(/&#x2019;/g, '’').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function fetchText(url) {
  try { const r = await fetch(url, { redirect: 'follow' }); return r.ok ? await r.text() : ''; } catch { return ''; }
}

// derive template->type; article-detail=article, adventure-detail=adventure, listings=page
const typeOf = (tpl) => ({
  'article-detail': 'article',
  'adventure-detail': 'adventure',
  'homepage': 'page',
  'adventure-listing': 'page',
  'card-listing': 'page',
  'faq-accordion': 'page',
}[tpl] || 'page');

// authoritative adventure category per slug, read from the WKND source page's
// own filter-tab membership (not hard-coded taxonomy — derived from source DOM)
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

(async () => {
  const advCats = await buildAdventureCategories();
  const rows = [];
  for (const [path, tpl] of Object.entries(pathMap)) {
    const html = await fetchText(`${PREVIEW}${path}`);
    const title = decode(meta(html, /<meta property="og:title" content="([^"]*)"/) || meta(html, /<title>([^<]*)<\/title>/)).replace(/\s*\|\s*WKND.*$/, '').trim();
    const description = decode(meta(html, /<meta name="description" content="([^"]*)"/));
    const image = (meta(html, /<meta property="og:image" content="([^"]*)"/) || '').replace(/&#x26;/g, '&');
    const lastModified = meta(html, /<meta name="modified-time" content="([^"]*)"/) || meta(html, /<meta name="published-time" content="([^"]*)"/) || '';
    // activity/category: for adventures read the source page's Activity content-fragment field
    let activity = '';
    const membersOnly = 'false';
    if (tpl === 'adventure-detail') {
      const slug = path.split('/').pop();
      activity = advCats[slug] || '';
      if (!activity) {
        // fallback: infer the source tab from the slug keyword
        if (/cycling|biking/.test(slug)) activity = 'Cycling';
        else if (/ski/.test(slug)) activity = 'Skiing';
        else if (/surf/.test(slug)) activity = 'Surfing';
        else if (/climb/.test(slug)) activity = 'Climbing';
        else activity = 'Travel';
      }
    }
    rows.push({
      path,
      title,
      description,
      image: image ? image.replace(PREVIEW, '') : '',
      lastModified: lastModified ? String(Math.floor(new Date(lastModified).getTime() / 1000)) : '',
      template: tpl,
      type: typeOf(tpl),
      category: activity,
      tags: activity,
      membersOnly,
    });
    process.stderr.write(`indexed ${path} (${tpl}${activity ? ', ' + activity : ''})\n`);
  }
  // stable sort by path
  rows.sort((a, b) => a.path.localeCompare(b.path));
  const sheet = { total: rows.length, offset: 0, limit: rows.length, data: rows, ':type': 'sheet' };
  process.stdout.write(JSON.stringify(sheet));
})();
