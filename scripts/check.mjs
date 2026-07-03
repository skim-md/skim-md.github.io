// Site gate: per-page SEO fields, internal link integrity, page-weight budget.
// Run AFTER `npm run build`. Exits 1 on any violation.
//
// Weight budget: 300 KB per page = HTML + statically referenced CSS/JS/images
// + url() targets inside that CSS (this is how the always-loaded latin
// webfonts, ~145 KB, are counted). Lazy viewer assets are exempt: they load
// only on user intent (viewer.bundle.js, skim.css, katex/**, viewer-fonts.css
// and the woff2 files only that sheet references).
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMeta, outPathFor } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => resolve(root, ...p);

const WEIGHT_BUDGET = 300 * 1024;
// Lazy viewer assets + promo screenshots are exempt: both load only below the
// fold / on intent (promo <img> are loading="lazy"), so they never block the
// first render the budget is protecting.
const WEIGHT_EXEMPT = /^assets\/(viewer\.bundle\.js|skim\.css|viewer-fonts\.css|katex\/|promo\/)/;

// Renderer snapshots: vendored copies must match the live extension checkout
// (sibling dir, same convention as scripts/sync-renderer.mjs; override with
// SKIM_EXT_DIR). Drift WARNS, never fails: the extension may be ahead.
const EXT_DIR = process.env.SKIM_EXT_DIR || r('../mdviewer');
const SNAPSHOTS = [
  ['src/render.js', 'vendor/skim/render.js'],
  ['src/frontmatter.js', 'vendor/skim/frontmatter.js'],
];

const EXTERNAL_URL = /^(https?:)?\/\//i;

function stripJsonLd(html) {
  return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
}

export function extractRefs(html) {
  return [...stripJsonLd(html).matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith('/') && !u.startsWith('//'));
}

// Resource loads from an external host: <script src>, <link href> (except
// canonical/alternate, which browsers do not fetch), <img src>, any srcset.
// External <a href> is allowed.
export function externalLoads(html) {
  const out = [];
  for (const tag of stripJsonLd(html).matchAll(/<(\w+)\b([^>]*)>/g)) {
    const name = tag[1].toLowerCase();
    const attrs = tag[2];
    for (const a of attrs.matchAll(/\b(href|src|srcset)="([^"]*)"/g)) {
      const [, attr, value] = a;
      if (name === 'a' && attr === 'href') continue;
      if (name === 'link' && attr === 'href' && /\brel="(canonical|alternate)"/.test(attrs)) continue;
      const urls = attr === 'srcset' ? value.split(',').map((s) => s.trim().split(/\s+/)[0]) : [value];
      for (const u of urls) if (EXTERNAL_URL.test(u)) out.push(`<${name} ${attr}="${u}">`);
    }
  }
  return out;
}

export function externalCssUrls(css) {
  return [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]
    .map((m) => m[1])
    .filter((u) => EXTERNAL_URL.test(u));
}

// Em dashes are banned in page copy except the brand-title separator:
// "Skim — ..." / "... — Skim" (the footer brand line closes a tag between
// the brand and the dash, hence the optional </strong>).
const EMDASH_ALLOWED = /Skim(<\/strong>)? — | — Skim/g;

export function emDashViolations(html) {
  const out = [];
  html.split('\n').forEach((line, i) => {
    if (line.replace(EMDASH_ALLOWED, '').includes('—')) out.push({ line: i + 1, text: line.trim() });
  });
  return out;
}

export function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

export function extractCssUrls(css) {
  return [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith('/'));
}

// "/viewer/" (from any page) -> "viewer/index.html"; strips query/hash.
export function resolveRef(fromOut, ref) {
  const clean = ref.split(/[?#]/)[0];
  if (!clean.startsWith('/')) return null;
  if (clean === '/') return 'index.html';
  return clean.endsWith('/') ? clean.slice(1) + 'index.html' : clean.slice(1);
}

async function fileSize(p) {
  try { return (await stat(r(p))).size; } catch { return null; }
}

async function main() {
  const errors = [];
  const warnings = [];
  const cssExternalsChecked = new Set(); // css files are shared; report each once
  const pages = (await readdir(r('pages'))).filter((f) => f.endsWith('.html'));
  for (const f of pages) {
    const { meta } = parseMeta(await readFile(r('pages', f), 'utf8'));
    const out = outPathFor(meta.path);
    const html = await readFile(r(out), 'utf8').catch(() => null);
    if (html === null) { errors.push(`${out}: missing, run npm run build`); continue; }

    // SEO fields
    if (meta.title.length > 60) errors.push(`${out}: title ${meta.title.length} chars (max 60)`);
    if (meta.description.length > 155) errors.push(`${out}: description ${meta.description.length} chars (max 155)`);
    if (meta.description.length < 50) errors.push(`${out}: description under 50 chars`);
    if (!html.includes('<link rel="canonical"')) errors.push(`${out}: no canonical`);
    if (!html.includes('property="og:title"')) errors.push(`${out}: no og:title`);
    const h1s = (html.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) errors.push(`${out}: ${h1s} <h1> elements (need exactly 1)`);
    if (/\{\{\w+\}\}/.test(html)) errors.push(`${out}: unreplaced {{token}}`);

    // External resource loads (external <a href> is fine, anything fetched is not)
    for (const load of externalLoads(html)) errors.push(`${out}: external resource load ${load}`);

    // Em-dash sweep (brand-title separator "Skim — " / " — Skim" allowed)
    for (const v of emDashViolations(html)) errors.push(`${out}:${v.line}: em dash outside brand-title pattern: ${v.text.slice(0, 100)}`);

    // JSON-LD must parse
    jsonLdBlocks(html).forEach((block, i) => {
      try { JSON.parse(block); } catch (e) { errors.push(`${out}: JSON-LD block ${i + 1} does not parse: ${e.message}`); }
    });

    // Internal links + page weight (existence checked for everything,
    // weight counted only for non-exempt, non-html refs).
    let weight = Buffer.byteLength(html);
    const seen = new Set();
    const queue = extractRefs(html).map((ref) => ({ from: out, ref }));
    while (queue.length) {
      const { from, ref } = queue.shift();
      const file = resolveRef(from, ref);
      if (!file || seen.has(file)) continue;
      seen.add(file);
      const size = await fileSize(file);
      if (size === null) { errors.push(`${from}: broken internal ref ${ref}`); continue; }
      if (WEIGHT_EXEMPT.test(file)) continue;
      if (!file.endsWith('.html')) weight += size;
      if (file.endsWith('.css')) {
        const css = await readFile(r(file), 'utf8');
        for (const u of extractCssUrls(css)) queue.push({ from: file, ref: u });
        if (!cssExternalsChecked.has(file)) {
          cssExternalsChecked.add(file);
          for (const u of externalCssUrls(css)) errors.push(`${file}: external url() load ${u}`);
        }
      }
    }
    if (weight > WEIGHT_BUDGET) errors.push(`${out}: page weight ${(weight / 1024).toFixed(0)} KB > 300 KB`);
    console.log(`checked ${out}: ${(weight / 1024).toFixed(0)} KB, ${seen.size} refs`);
  }
  // Renderer-snapshot staleness: warn only, the extension may be ahead.
  for (const [src, dst] of SNAPSHOTS) {
    const live = await readFile(resolve(EXT_DIR, src), 'utf8').catch(() => null);
    if (live === null) { warnings.push(`snapshot check skipped: ${resolve(EXT_DIR, src)} not found`); continue; }
    const snap = await readFile(r(dst), 'utf8');
    const body = snap.slice(snap.indexOf('\n') + 1); // drop the AUTO-SYNCED stamp line
    if (body !== live) warnings.push(`${dst} is stale vs extension ${src} (run npm run sync)`);
  }

  if (warnings.length) console.warn('\nWARNINGS (non-fatal):\n' + warnings.map((w) => `  - ${w}`).join('\n'));
  if (errors.length) {
    console.error('\nCHECK FAILED:\n' + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
