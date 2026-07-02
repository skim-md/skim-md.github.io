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
const WEIGHT_EXEMPT = /^assets\/(viewer\.bundle\.js|skim\.css|viewer-fonts\.css|katex\/)/;

export function extractRefs(html) {
  const stripped = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  return [...stripped.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith('/') && !u.startsWith('//'));
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
      }
    }
    if (weight > WEIGHT_BUDGET) errors.push(`${out}: page weight ${(weight / 1024).toFixed(0)} KB > 300 KB`);
    console.log(`checked ${out}: ${(weight / 1024).toFixed(0)} KB, ${seen.size} refs`);
  }
  if (errors.length) {
    console.error('\nCHECK FAILED:\n' + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
