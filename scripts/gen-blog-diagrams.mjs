// Generate in-body explanatory diagrams for blog posts (SVG -> PNG).
//
// These are the "sketches" that sit inside a post to explain a concept (a
// pipeline, an install flow, what to look for). They are self-hosted raster
// PNGs so they can be indexed by Google Images, lazy-loaded in the page, and
// carry real alt text + a <figcaption>. Rendered on a light card so they read
// as a diagram on both the light and dark site themes.
//
// Two shapes cover almost everything here:
//   flow  - a left-to-right pipeline of 2..4 labeled boxes joined by arrows
//   cards - three labeled point cards side by side
//
// Add one: append to DIAGRAMS (id becomes /assets/blog/dg-<id>.png), run
// `npm run blogimg` (build calls generateBlogDiagrams() too), then reference it
// with <figure class="figure"><img loading="lazy" ...><figcaption>...</figcaption></figure>.
import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const W = 1200;
const INK = '#141922';
const SUB = '#5b6478';
const CARD = '#ffffff';
const CARDBORDER = '#cbd4e6';

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function frame(inner, h, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#eef3fb"/>
    </linearGradient>
    <filter id="bs" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#1b2a4a" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect width="${W}" height="${h}" rx="20" fill="url(#bg)"/>
  <rect x="1" y="1" width="${W - 2}" height="${h - 2}" rx="19" fill="none" stroke="${accent}" stroke-opacity="0.28" stroke-width="2"/>
  ${inner}
</svg>`;
}

function box(x, y, w, h, l1, l2, accent, f1) {
  const cy = y + h / 2;
  const t1y = l2 ? cy - 4 : cy + f1 * 0.34;
  return `<g filter="url(#bs)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${CARD}" stroke="${CARDBORDER}" stroke-width="1.5"/></g>
    <rect x="${x}" y="${y}" width="6" height="${h}" rx="3" fill="${accent}"/>
    <text x="${x + w / 2}" y="${t1y}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="${f1}" font-weight="700" fill="${INK}">${esc(l1)}</text>
    ${l2 ? `<text x="${x + w / 2}" y="${cy + 26}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="17" font-weight="500" fill="${SUB}">${esc(l2)}</text>` : ''}`;
}

function arrow(x1, x2, y, accent) {
  const xe = x2 - 12;
  return `<line x1="${x1 + 6}" y1="${y}" x2="${xe}" y2="${y}" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${xe - 2} ${y - 9} L${x2 + 2} ${y} L${xe - 2} ${y + 9} Z" fill="${accent}"/>`;
}

function renderFlow({ steps, accent }) {
  const h = 300, mx = 56, gap = 54, n = steps.length;
  const boxW = (W - 2 * mx - (n - 1) * gap) / n;
  const boxH = 150, boxY = (h - boxH) / 2;
  const maxLen = Math.max(...steps.map((s) => s.l1.length));
  const f1 = clamp(Math.floor((boxW * 1.75) / maxLen), 17, 27);
  let inner = '';
  steps.forEach((s, i) => {
    const x = mx + i * (boxW + gap);
    inner += box(x, boxY, boxW, boxH, s.l1, s.l2 || '', accent, f1);
    if (i < n - 1) inner += arrow(x + boxW, x + boxW + gap, boxY + boxH / 2, accent);
  });
  return frame(inner, h, accent);
}

function renderCards({ cards, accent }) {
  const h = 300, mx = 56, gap = 36, n = cards.length;
  const cardW = (W - 2 * mx - (n - 1) * gap) / n;
  const cardH = 200, cardY = (h - cardH) / 2;
  let inner = '';
  cards.forEach((c, i) => {
    const x = mx + i * (cardW + gap), cx = x + cardW / 2;
    inner += `<g filter="url(#bs)"><rect x="${x}" y="${cardY}" width="${cardW}" height="${cardH}" rx="18" fill="${CARD}" stroke="${CARDBORDER}" stroke-width="1.5"/></g>
      <circle cx="${cx}" cy="${cardY + 52}" r="17" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-width="2.5"/>
      <text x="${cx}" y="${cardY + 106}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="27" font-weight="700" fill="${INK}">${esc(c.l1)}</text>
      <text x="${cx}" y="${cardY + 140}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="17" font-weight="500" fill="${SUB}">${esc(c.l2)}</text>`;
  });
  return frame(inner, h, accent);
}

// slug accents mirror the cover accents so a post's images feel related.
const DIAGRAMS = [
  { id: 'what-is-skim', kind: 'flow', accent: '#f0a500', steps: [
    { l1: 'Any .md', l2: 'local or URL' }, { l1: 'Skim renders', l2: 'in your browser' }, { l1: 'Readable page', l2: 'live, on-device' } ] },
  { id: 'what-is-markdown', kind: 'flow', accent: '#4d68d6', steps: [
    { l1: 'Markdown', l2: 'plain text + marks' }, { l1: 'A renderer', l2: 'reads the marks' }, { l1: 'Formatted page', l2: 'headings, bold, lists' } ] },
  { id: 'what-is-markdown-2', kind: 'cards', accent: '#ffb000', cards: [
    { l1: 'READMEs', l2: 'on GitHub' }, { l1: 'AI chats', l2: 'Claude, ChatGPT' }, { l1: 'Note apps', l2: 'Obsidian, Notion' } ] },
  { id: 'how-to-open-md-file', kind: 'cards', accent: '#2f9bd8', cards: [
    { l1: 'Online viewer', l2: 'nothing to install' }, { l1: 'Browser add-on', l2: 'every file, auto' }, { l1: 'Apps you have', l2: 'source only' } ] },
  { id: 'claude-chatgpt-md-file', kind: 'flow', accent: '#8a63e0', steps: [
    { l1: 'AI writes .md', l2: 'plan, report, docs' }, { l1: 'Open in a viewer', l2: 'Skim or online' }, { l1: 'Clean page', l2: 'readable at once' } ] },
  { id: 'readme-md', kind: 'flow', accent: '#22a06b', steps: [
    { l1: 'README.md', l2: 'raw markdown' }, { l1: 'Render it', l2: 'like GitHub does' }, { l1: 'Readable page', l2: 'headings + code' } ] },
  { id: 'best-markdown-viewer-extensions-2026', kind: 'cards', accent: '#e0523f', cards: [
    { l1: 'Free', l2: 'every feature' }, { l1: 'Open source', l2: 'current code' }, { l1: 'Maintained', l2: 'updated in 2026' } ] },
  { id: 'open-md-windows-11', kind: 'flow', accent: '#2f9bd8', steps: [
    { l1: '.md on Windows', l2: 'opens as text' }, { l1: 'Pick a viewer', l2: 'browser or app' }, { l1: 'Formatted page', l2: 'readable' } ] },
  { id: 'open-md-mac', kind: 'flow', accent: '#4d68d6', steps: [
    { l1: '.md on a Mac', l2: 'Quick Look / text' }, { l1: 'Use a viewer', l2: 'online or app' }, { l1: 'Formatted page', l2: 'readable' } ] },
  { id: 'what-is-agents-md', kind: 'flow', accent: '#ffb000', steps: [
    { l1: 'Your repo', l2: 'code + docs' }, { l1: 'AGENTS.md', l2: 'rules for agents' }, { l1: 'Agent reads it', l2: 'follows your setup' } ] },
  { id: 'what-is-claude-md', kind: 'flow', accent: '#8a63e0', steps: [
    { l1: 'Your project', l2: 'files + context' }, { l1: 'CLAUDE.md', l2: 'standing memory' }, { l1: 'Claude Code', l2: 'reads it each run' } ] },
  { id: 'markdown-cheat-sheet', kind: 'flow', accent: '#22a06b', steps: [
    { l1: 'Type a mark', l2: '# ** - > `' }, { l1: 'Renderer', l2: 'reads it' }, { l1: 'Formatting', l2: 'heading, bold, list' } ] },
  { id: 'markdown-reader-chrome', kind: 'flow', accent: '#f0a500', steps: [
    { l1: 'Add to Chrome', l2: 'one click' }, { l1: 'Allow files', l2: 'one switch' }, { l1: 'Every .md', l2: 'renders auto' } ] },
  { id: 'markdown-to-pdf', kind: 'flow', accent: '#e0523f', steps: [
    { l1: 'Your .md', l2: '' }, { l1: 'Render it', l2: 'viewer or Skim' }, { l1: 'Print dialog', l2: 'Ctrl or Cmd + P' }, { l1: 'Save as PDF', l2: 'done' } ] },
  { id: 'markdown-reader-firefox', kind: 'flow', accent: '#ff7a1a', steps: [
    { l1: 'Firefox Add-ons', l2: 'open listing' }, { l1: 'Add to Firefox', l2: 'confirm' }, { l1: 'Every .md', l2: 'renders auto' } ] },
  { id: 'markdown-reader-edge', kind: 'flow', accent: '#2f9bd8', steps: [
    { l1: 'Edge Add-ons', l2: 'open listing' }, { l1: 'Get', l2: 'confirm' }, { l1: 'Every .md', l2: 'renders auto' } ] },
  { id: 'markdown-reader-brave', kind: 'flow', accent: '#e0523f', steps: [
    { l1: 'Chrome Store', l2: 'open in Brave' }, { l1: 'Add to Brave', l2: 'confirm' }, { l1: 'On-device', l2: 'private, auto' } ] },
  { id: 'markdown-reader-opera', kind: 'flow', accent: '#e0233a', steps: [
    { l1: 'Chrome Ext add-on', l2: 'enable once' }, { l1: 'Add to Opera', l2: 'from store' }, { l1: 'Every .md', l2: 'renders auto' } ] },
  { id: 'markdown-reader-vivaldi', kind: 'flow', accent: '#e02b2b', steps: [
    { l1: 'Chrome Store', l2: 'open in Vivaldi' }, { l1: 'Add to Vivaldi', l2: 'confirm' }, { l1: 'Every .md', l2: 'renders auto' } ] },
  { id: 'markdown-reader-safari', kind: 'flow', accent: '#1e9bf0', steps: [
    { l1: 'Open the viewer', l2: 'in Safari' }, { l1: 'Drop a .md', l2: 'no install' }, { l1: 'Formatted page', l2: 'Mac + iPhone' } ] },
];

export async function generateBlogDiagrams() {
  const dst = resolve(root, 'assets/blog');
  await mkdir(dst, { recursive: true });
  for (const d of DIAGRAMS) {
    const svg = d.kind === 'cards' ? renderCards(d) : renderFlow(d);
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true, defaultFontFamily: 'Inter' } });
    await writeFile(resolve(dst, `dg-${d.id}.png`), resvg.render().asPng());
  }
  console.log(`blog diagrams: ${DIAGRAMS.length} -> assets/blog/dg-*.png`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await generateBlogDiagrams();
