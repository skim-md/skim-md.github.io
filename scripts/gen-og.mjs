// Render the 1200x630 social card (og:image) from an inline SVG.
// Visual family: blue gradient background, dark "reading lines" brand mark,
// white wordmark, accent tagline — matches promo/src/01-hero.svg in the
// extension repo (gradient bg, sketched dark Skim window, yellow accents).
import { Resvg } from '@resvg/resvg-js';
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5674dd"/>
      <stop offset="1" stop-color="#8aabff"/>
    </linearGradient>
    <filter id="markshadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#0d1017" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Faint oversized reading-lines motif on the right, for depth (matches promo family) -->
  <g opacity="0.14" transform="rotate(-6 980 300)">
    <rect x="790" y="90" width="380" height="380" rx="56" fill="none" stroke="#0d1017" stroke-width="10"/>
    <rect x="850" y="190" width="260" height="26" rx="13" fill="#0d1017"/>
    <rect x="850" y="250" width="180" height="26" rx="13" fill="#0d1017"/>
    <rect x="850" y="310" width="110" height="26" rx="13" fill="#0d1017"/>
  </g>

  <!-- Brand mark: three reading lines -->
  <g filter="url(#markshadow)">
    <rect x="100" y="96" width="130" height="130" rx="26" fill="#0d1017" stroke="#2c3344" stroke-width="2"/>
    <rect x="124" y="132" width="82" height="13" rx="6.5" fill="#e8eaf0"/>
    <rect x="124" y="159" width="58" height="13" rx="6.5" fill="#7aa2ff"/>
    <rect x="124" y="186" width="35" height="13" rx="6.5" fill="#4a5164"/>
    <circle cx="184" cy="192.5" r="8" fill="#ffd866"/>
  </g>

  <!-- Wordmark -->
  <text x="100" y="308" font-family="Inter, system-ui, sans-serif" font-size="92" font-weight="800" letter-spacing="-1.5" fill="#ffffff">Skim</text>
  <text x="100" y="366" font-family="Inter, system-ui, sans-serif" font-size="42" font-weight="600" fill="#eef2ff">&#8212; Markdown Viewer &amp; Reader</text>

  <!-- Accent rule -->
  <rect x="102" y="388" width="150" height="6" rx="3" fill="#ffd866"/>

  <!-- Tagline -->
  <text x="100" y="452" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="500" fill="#f4f6ff" opacity="0.95">Read what your AI wrote. Instantly.</text>

  <!-- Footer -->
  <text x="100" y="546" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="500" fill="#0d1017" opacity="0.55">skim-md.github.io &#183; free &#183; open source</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    loadSystemFonts: true,
    defaultFontFamily: 'Inter',
  },
});
const png = resvg.render().asPng();
await writeFile(resolve(root, 'assets/og.png'), png);
console.log(`wrote assets/og.png (${(png.length / 1024).toFixed(0)} KB)`);
