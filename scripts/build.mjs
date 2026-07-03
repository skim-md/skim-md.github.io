// Build: compile pages/*.html through templates/layout.html into the repo
// root (GitHub Pages serves main branch root), vendor the site webfonts,
// and generate sitemap.xml/robots.txt.
import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { parseMeta, outPathFor, applyLayout } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => resolve(root, ...p);

// ---- Site-wide constants (single place to swap when things change) ----
export const SITE_ORIGIN = 'https://skim.md'; // custom domain live 2026-07-03 (github.io redirects here)
// Store listing URLs. PLACEHOLDER ids: swap for the real listings once live.
// The per-browser map lives in the detect script in templates/layout.html;
// this default (Chrome Web Store) is the static href before JS runs.
export const INSTALL_URL = 'https://chromewebstore.google.com/detail/skim-markdown-viewer/placeholderskimid';
export const INSTALL_LABEL = 'Add Skim to your browser, free';
export const REPO_URL = 'https://github.com/skim-md/skim';
export const GOATCOUNTER_CODE = ''; // e.g. 'skim' once the user creates the account

// The primary install control: a two-tone button whose left segment carries
// the visitor's actual browser logo (swapped client-side from the sprite in
// templates/layout.html) and whose label + store link are rewritten to match.
// Used wherever a page wants the full CTA treatment ({{installBtn}}); inline
// prose keeps the plain {{installUrl}}/{{installLabel}} text link.
const INSTALL_BTN =
  '<span class="install-cta">' +
  `<a class="btn-chrome" href="${INSTALL_URL}" rel="noopener" data-install>` +
  '<span class="cmark-wrap" data-install-mark><svg class="cmark" viewBox="0 0 48 48" aria-hidden="true"><use href="#logo-chrome" data-install-use></use></svg></span>' +
  '<span class="bi-text"><span class="bi-label" data-install-label>Add to Chrome</span>' +
  '<span class="bi-sub" data-install-sub>Free &middot; open source &middot; no sign-up</span></span></a>' +
  '<a class="install-alt" href="/install/" data-install-alt>Using another browser? See every install option &rarr;</a>' +
  '</span>';

const consts = { SITE_ORIGIN, INSTALL_URL, INSTALL_LABEL, REPO_URL, GOATCOUNTER_CODE, installBtn: INSTALL_BTN };

// Webfonts: the site self-hosts the product's own typefaces. Latin subsets
// load on every page (site-fonts.css); Hebrew + mono-700 load lazily with
// the viewer (viewer-fonts.css, written here too so there is one font map).
const HEBREW_RANGE = 'U+0590-05FF, U+200F, U+FB1D-FB4F';
const FONTS = [
  { src: 'node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff2', file: 'source-serif-400.woff2', family: 'Skim Serif', weight: 400, range: null, sheet: 'site' },
  { src: 'node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2', file: 'source-serif-700.woff2', family: 'Skim Serif', weight: 700, range: null, sheet: 'site' },
  { src: 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', file: 'jetbrains-mono-400.woff2', family: 'Skim Mono', weight: 400, range: null, sheet: 'site' },
  { src: 'node_modules/@fontsource/frank-ruhl-libre/files/frank-ruhl-libre-hebrew-400-normal.woff2', file: 'frank-ruhl-400.woff2', family: 'Skim Hebrew', weight: 400, range: HEBREW_RANGE, sheet: 'viewer' },
  { src: 'node_modules/@fontsource/frank-ruhl-libre/files/frank-ruhl-libre-hebrew-700-normal.woff2', file: 'frank-ruhl-700.woff2', family: 'Skim Hebrew', weight: 700, range: HEBREW_RANGE, sheet: 'viewer' },
  { src: 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2', file: 'jetbrains-mono-700.woff2', family: 'Skim Mono', weight: 700, range: null, sheet: 'viewer' },
];

async function vendorFonts() {
  const dst = r('assets/webfonts');
  await rm(dst, { recursive: true, force: true });
  await mkdir(dst, { recursive: true });
  const sheets = { site: [], viewer: [] };
  for (const f of FONTS) {
    await cp(r(f.src), resolve(dst, f.file));
    sheets[f.sheet].push(
      `@font-face {\n  font-family: "${f.family}";\n  font-style: normal;\n  font-weight: ${f.weight};\n  font-display: swap;\n  src: url("/assets/webfonts/${f.file}") format("woff2");${f.range ? `\n  unicode-range: ${f.range};` : ''}\n}`
    );
  }
  await writeFile(r('assets/site-fonts.css'), sheets.site.join('\n\n') + '\n');
  await writeFile(r('assets/viewer-fonts.css'), sheets.viewer.join('\n\n') + '\n');
  console.log('vendored: webfonts + site-fonts.css + viewer-fonts.css');
}

async function vendorViewerAssets() {
  // KaTeX stylesheet + fonts (render.js output references katex classes/fonts).
  await mkdir(r('assets/katex'), { recursive: true });
  await cp(r('node_modules/katex/dist/katex.min.css'), r('assets/katex/katex.min.css'));
  await rm(r('assets/katex/fonts'), { recursive: true, force: true });
  await cp(r('node_modules/katex/dist/fonts'), r('assets/katex/fonts'), { recursive: true });
  // The extension theme, served as-is (family names match site-fonts.css).
  await cp(r('vendor/skim/skim.css'), r('assets/skim.css'));
  console.log('vendored: katex + skim.css');
}

async function bundleViewer() {
  await build({
    entryPoints: [r('src/viewer-entry.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    outfile: r('assets/viewer.bundle.js'),
    minify: true,
    legalComments: 'none',
    logLevel: 'info',
  });
}

async function buildPages() {
  const layout = await readFile(r('templates/layout.html'), 'utf8');
  const files = (await readdir(r('pages'))).filter((f) => f.endsWith('.html')).sort();
  const sitemapUrls = [];
  for (const f of files) {
    const src = await readFile(r('pages', f), 'utf8');
    const { meta, body } = parseMeta(src);
    const out = outPathFor(meta.path);
    await mkdir(dirname(r(out)), { recursive: true });
    await writeFile(r(out), applyLayout(layout, meta, body, consts));
    if (!meta.noindex) sitemapUrls.push(SITE_ORIGIN + meta.path);
    console.log(`page: pages/${f} -> ${out}`);
  }
  return sitemapUrls;
}

async function buildSitemapAndRobots(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`;
  await writeFile(r('sitemap.xml'), xml);
  // Source dirs are served by Pages too; keep them out of the index.
  await writeFile(
    r('robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /pages/\nDisallow: /templates/\nDisallow: /vendor/\nDisallow: /scripts/\nDisallow: /src/\nDisallow: /tests/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
  );
  console.log(`sitemap: ${urls.length} urls; robots.txt written`);
}

await vendorFonts();
await vendorViewerAssets();
await bundleViewer();
const urls = await buildPages();
await buildSitemapAndRobots(urls);
