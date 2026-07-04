// Generate one on-brand cover image per blog post, rendered SVG -> PNG.
//
// Why: pages with a relevant, self-hosted image read better and give Google
// Images another way in. External image hosts are banned by the site (see
// check.mjs externalLoads), so every cover is generated here and served from
// /assets/blog/. Covers reuse the og.png visual family (blue gradient, dark
// "reading lines" mark, yellow/other accent) so the blog feels like one set.
//
// Add a post: append a row to COVERS (slug = the page path segment), run
// `npm run blogimg` (the site build also calls generateBlogImages()), then
// reference /assets/blog/<slug>.png from the page. The <img> MUST carry
// width/height + loading="lazy" so it never shifts layout or blocks paint.
import { Resvg } from '@resvg/resvg-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Each cover: a filename "tab" token, up to two title lines, an accent color,
// and a small kicker. Keep line1/line2 short enough to fit (~22 chars/line).
const COVERS = [
  { slug: 'what-is-skim',                         token: 'skim.md',        kicker: 'Overview',   accent: '#ffd866', l1: 'What is Skim?' },
  { slug: 'how-to-open-md-file',                  token: 'file.md',        kicker: 'Guide',      accent: '#37c5f0', l1: 'How to open', l2: 'a .md file' },
  { slug: 'claude-chatgpt-md-file',               token: 'chat.md',        kicker: 'AI',         accent: '#a06bff', l1: 'Read a .md from', l2: 'Claude or ChatGPT' },
  { slug: 'readme-md',                            token: 'README.md',      kicker: 'Guide',      accent: '#34d399', l1: 'Open a', l2: 'README.md file' },
  { slug: 'best-markdown-viewer-extensions-2026', token: 'compare.md',     kicker: 'Comparison', accent: '#ff6a5f', l1: 'Best markdown', l2: 'viewers in 2026' },
  { slug: 'open-md-windows-11',                   token: 'windows.md',     kicker: 'Windows 11', accent: '#37c5f0', l1: 'Open .md files', l2: 'on Windows 11' },
  { slug: 'open-md-mac',                          token: 'mac.md',         kicker: 'macOS',      accent: '#7aa2ff', l1: 'Open .md files', l2: 'on a Mac' },
  { slug: 'what-is-agents-md',                    token: 'AGENTS.md',      kicker: 'Reference',  accent: '#ffd866', l1: 'What is an', l2: 'AGENTS.md file?' },
  { slug: 'what-is-claude-md',                    token: 'CLAUDE.md',      kicker: 'Reference',  accent: '#a06bff', l1: 'What is a', l2: 'CLAUDE.md file?' },
  { slug: 'what-is-markdown',                     token: 'markdown.md',    kicker: 'Basics',     accent: '#ffd866', l1: 'What is', l2: 'markdown?' },
  { slug: 'markdown-cheat-sheet',                 token: 'cheat-sheet.md', kicker: 'Reference',  accent: '#34d399', l1: 'Markdown', l2: 'cheat sheet' },
  { slug: 'markdown-reader-chrome',               token: 'chrome.md',      kicker: 'Chrome',     accent: '#ffd866', l1: 'Markdown reader', l2: 'for Chrome' },
  { slug: 'markdown-to-pdf',                      token: 'export.md',      kicker: 'Guide',      accent: '#ff6a5f', l1: 'Convert markdown', l2: 'to PDF' },
  // Per-browser guides
  { slug: 'markdown-reader-firefox',              token: 'firefox.md',     kicker: 'Firefox',    accent: '#ff7a1a', l1: 'Markdown reader', l2: 'for Firefox' },
  { slug: 'markdown-reader-edge',                 token: 'edge.md',        kicker: 'Edge',       accent: '#37c5f0', l1: 'Markdown viewer', l2: 'for Microsoft Edge' },
  { slug: 'markdown-reader-brave',                token: 'brave.md',       kicker: 'Brave',      accent: '#fb542b', l1: 'Markdown viewer', l2: 'for Brave' },
  { slug: 'markdown-reader-opera',                token: 'opera.md',       kicker: 'Opera',      accent: '#ee2f41', l1: 'Markdown viewer', l2: 'for Opera' },
  { slug: 'markdown-reader-vivaldi',              token: 'vivaldi.md',     kicker: 'Vivaldi',    accent: '#ef3939', l1: 'Markdown viewer', l2: 'for Vivaldi' },
  { slug: 'markdown-reader-safari',               token: 'safari.md',      kicker: 'Safari',     accent: '#1e9bf0', l1: 'Markdown viewer', l2: 'for Safari' },
];

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function coverSvg({ token, kicker, accent, l1, l2 }) {
  const titleY = l2 ? 330 : 356;
  const line2 = l2 ? `<text x="96" y="408" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="800" letter-spacing="-1.5" fill="#ffffff">${esc(l2)}</text>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4d68d6"/>
      <stop offset="1" stop-color="#8aabff"/>
    </linearGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#0d1017" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Faint oversized reading-lines motif, tinted with the accent -->
  <g opacity="0.16" transform="rotate(-6 980 300)">
    <rect x="800" y="70" width="410" height="470" rx="60" fill="none" stroke="#0d1017" stroke-width="10"/>
    <rect x="862" y="176" width="286" height="28" rx="14" fill="#0d1017"/>
    <rect x="862" y="240" width="200" height="28" rx="14" fill="${accent}"/>
    <rect x="862" y="304" width="128" height="28" rx="14" fill="#0d1017"/>
    <rect x="862" y="368" width="230" height="28" rx="14" fill="#0d1017"/>
  </g>

  <!-- Brand mark -->
  <g filter="url(#sh)">
    <rect x="96" y="86" width="120" height="120" rx="26" fill="#0d1017" stroke="#2c3344" stroke-width="2"/>
    <rect x="118" y="120" width="76" height="12" rx="6" fill="#e8eaf0"/>
    <rect x="118" y="146" width="54" height="12" rx="6" fill="#7aa2ff"/>
    <rect x="118" y="172" width="32" height="12" rx="6" fill="#4a5164"/>
    <circle cx="176" cy="178" r="7.5" fill="${accent}"/>
  </g>
  <text x="232" y="146" font-family="Inter, system-ui, sans-serif" font-size="40" font-weight="800" letter-spacing="-0.5" fill="#ffffff">Skim</text>
  <text x="232" y="188" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="600" fill="#eef2ff" opacity="0.92">${esc(kicker)}</text>

  <!-- Title -->
  <text x="96" y="${titleY}" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="800" letter-spacing="-1.5" fill="#ffffff">${esc(l1)}</text>
  ${line2}

  <!-- Accent rule -->
  <rect x="98" y="${l2 ? 452 : 400}" width="150" height="7" rx="3.5" fill="${accent}"/>

  <!-- Filename tab -->
  <g transform="translate(96 ${l2 ? 496 : 444})">
    <rect x="0" y="0" width="${Math.max(190, 60 + token.length * 22)}" height="62" rx="14" fill="#0d1017" opacity="0.82"/>
    <circle cx="34" cy="31" r="9" fill="${accent}"/>
    <text x="58" y="41" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="30" font-weight="600" fill="#e8eaf0">${esc(token)}</text>
  </g>

  <text x="96" y="592" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="500" fill="#0d1017" opacity="0.5">skim.md &#183; free &#183; open source</text>
</svg>`;
}

export async function generateBlogImages() {
  const dst = resolve(root, 'assets/blog');
  await mkdir(dst, { recursive: true });
  for (const c of COVERS) {
    const resvg = new Resvg(coverSvg(c), {
      fitTo: { mode: 'width', value: 1200 },
      font: { loadSystemFonts: true, defaultFontFamily: 'Inter' },
    });
    const png = resvg.render().asPng();
    await writeFile(resolve(dst, `${c.slug}.png`), png);
  }
  console.log(`blog images: ${COVERS.length} covers -> assets/blog/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await generateBlogImages();
