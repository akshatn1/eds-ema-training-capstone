/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup + internal link rewriting.
 *
 * All selectors are taken from the captured DOM in migration-work/cleaned.html.
 *
 * Removes non-authorable global chrome that is handled by separate EDS blocks
 * (header/footer) or is out of scope (sign-in, locale switch, working search,
 * mobile nav, Adobe ID-sync iframe), then rewrites WKND internal links from the
 * legacy /us/en(.html) AEM paths to their EDS equivalents.
 */

const H = { before: 'beforeTransform', after: 'afterTransform' };

/**
 * Rewrite a single href from a legacy WKND /us/en path to its EDS path.
 * Returns the rewritten href, or null when the href should be left untouched.
 *
 * Rules (scope: /us/en subtree only):
 *   https://wknd.site/us/en.html          -> /
 *   /us/en.html                           -> /
 *   https://wknd.site/us/en/<path>.html   -> /<path>
 *   /us/en/<path>.html                    -> /<path>
 * External links (docs.adobe.com, github.com, stock.adobe.com, ...) and in-page
 * anchors (#...) are left untouched.
 */
function rewriteWkndHref(href) {
  if (!href) return null;

  // Leave in-page anchors and non-http(s) schemes (mailto:, tel:, etc.) alone.
  if (href.startsWith('#') || /^(mailto:|tel:)/i.test(href)) return null;

  let path = href;

  // Absolute WKND URLs -> strip origin. Any other absolute (external) URL is left alone.
  const absMatch = href.match(/^https?:\/\/([^/]+)(\/.*)?$/i);
  if (absMatch) {
    const host = absMatch[1].toLowerCase();
    if (host !== 'wknd.site' && host !== 'www.wknd.site') return null; // external
    path = absMatch[2] || '/';
  }

  // Only rewrite links inside the /us/en subtree.
  // Homepage: /us/en.html (optionally with #hash or ?query) -> /
  const homeMatch = path.match(/^\/us\/en\.html(\?[^#]*)?(#.*)?$/);
  if (homeMatch) {
    return `/${homeMatch[1] || ''}${homeMatch[2] || ''}`;
  }

  // Sub-pages: /us/en/<path>.html -> /<path> (preserve query/hash)
  const pageMatch = path.match(/^\/us\/en\/(.+?)\.html(\?[^#]*)?(#.*)?$/);
  if (pageMatch) {
    return `/${pageMatch[1]}${pageMatch[2] || ''}${pageMatch[3] || ''}`;
  }

  // Any /us/en path without the .html suffix (e.g. bare directory) -> strip prefix.
  const bareMatch = path.match(/^\/us\/en(\/.*)?$/);
  if (bareMatch) {
    const rest = bareMatch[1] || '/';
    return rest === '/' ? '/' : rest.replace(/\.html($|[?#])/, '$1');
  }

  return null; // not a /us/en link (other locale, etc.) — out of scope, leave as-is
}

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Remove overlay / injected chrome that sits outside header/footer and could
    // interfere with parsing or leak into content. Selectors from cleaned.html:
    //   <iframe id="destination_publishing_iframe_wkndsite_0"> (Adobe demdex ID-sync, line 566)
    //   <div id="toggleNav"> mobile-nav toggle (line 568)
    //   <div id="mobileNav" class="cmp-navigation--mobile"> mobile nav (line 574)
    WebImporter.DOMUtils.remove(element, [
      '#destination_publishing_iframe_wkndsite_0',
      '#toggleNav',
      '#mobileNav',
    ]);
  }

  if (hookName === H.after) {
    // Global chrome handled by dedicated EDS blocks or out of scope. Selectors from cleaned.html:
    //   <header class="experiencefragment cmp-experiencefragment--header"> (line 5)
    //     contains sign-in (.sign-in-buttons), locale toggle (.languagenavigation),
    //     main nav (.cmp-navigation--header) and search (.cmp-search--header)
    //   <footer class="experiencefragment cmp-experiencefragment--footer"> (line 471)
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      // Defensive: strip these even if they ever appear outside the header shell.
      '.sign-in-buttons',
      '.wknd-sign-in-buttons',
      '.languagenavigation',
      '.cmp-search--header',
      'iframe',
    ]);

    // Standard AEM clientlib / cruft cleanup: empty <meta> placeholders that the
    // core-component image markup emits (e.g. after <img>, lines 183/204/227...),
    // plus <link>/<noscript>/<script> if present.
    WebImporter.DOMUtils.remove(element, ['link', 'noscript', 'script']);
    element.querySelectorAll('meta').forEach((m) => m.remove());

    // Accessibility: fix heading order (Lighthouse heading-order). WKND article
    // pages render the author byline as an <h4> ("By Jacob Wester") right under
    // the <h1>, causing an h1 -> h4 skip. A byline is not a section heading, so
    // demote any short "By …" h4/h5/h6 to a <p><em> byline anywhere in content.
    const doc = element.ownerDocument;
    element.querySelectorAll('h4, h5, h6').forEach((h) => {
      const text = (h.textContent || '').trim();
      if (/^by\s+\S/i.test(text) && text.length <= 60) {
        const p = doc.createElement('p');
        const em = doc.createElement('em');
        em.textContent = text;
        p.appendChild(em);
        h.replaceWith(p);
      }
    });

    // Drop a redundant secondary title that repeats the <h1> verbatim (WKND
    // article hero emits a duplicate title as an <h3>, causing an h1 -> h3 skip).
    const mainH1 = element.querySelector('h1');
    if (mainH1) {
      const h1text = (mainH1.textContent || '').trim().toLowerCase();
      element.querySelectorAll('h3').forEach((h3) => {
        if ((h3.textContent || '').trim().toLowerCase() === h1text) h3.remove();
      });
    }

    // Normalize remaining heading-order skips (e.g. an h5 "SHARE THIS STORY"
    // sidebar label after h2 content). Walk headings in order; never let a level
    // jump more than one deeper than the previous heading.
    let prevLevel = 0;
    element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      const level = Number(h.tagName[1]);
      if (prevLevel && level > prevLevel + 1) {
        const fixed = prevLevel + 1;
        const nh = doc.createElement(`h${fixed}`);
        [...h.attributes].forEach((a) => nh.setAttribute(a.name, a.value));
        nh.innerHTML = h.innerHTML;
        h.replaceWith(nh);
        prevLevel = fixed;
      } else {
        prevLevel = level;
      }
    });

    // Rewrite WKND internal links to EDS paths (site-wide; applies to every page).
    element.querySelectorAll('a[href]').forEach((a) => {
      const next = rewriteWkndHref(a.getAttribute('href'));
      if (next !== null) a.setAttribute('href', next);
    });

    // Attribute noise cleanup: strip data-cmp-* / data-* tracking and inline
    // handlers left by the AEM data layer. Keep authorable attrs (href, src, alt, title).
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name;
        if (
          name.startsWith('data-cmp-')
          || name.startsWith('data-track')
          || name.startsWith('data-layer')
          || name === 'onclick'
        ) {
          el.removeAttribute(name);
        }
      });
    });
  }
}
