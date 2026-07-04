// Generate the raster favicons from assets/favicon.svg.
//
// Why an .ico at the site root: Google's search-result favicon crawler is far
// happier with a real /favicon.ico than with an SVG-only <link>, and several
// browsers/aggregators still probe /favicon.ico by convention. We keep the
// crisp SVG for modern browsers and add:
//   - /favicon.ico              multi-size (16/32/48) ICO, PNG-encoded frames
//   - /assets/apple-touch-icon.png  180x180 for iOS home-screen / link unfurls
//   - /assets/icon-512.png          512x512, used as the Organization logo in JSON-LD
//
// Run via `npm run favicon`; the site build (scripts/build.mjs) also invokes
// generateFavicons() so the raster set can never drift from favicon.svg.
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => resolve(root, ...p);

// Render favicon.svg to a PNG Buffer fitted to `size` x `size`.
function renderPng(svg, size) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return Buffer.from(resvg.render().asPng());
}

// Pack an array of {size, png} into a single ICO file. Each frame is stored as
// PNG (valid since Windows Vista and understood by every current browser).
function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(frames.length, 4); // image count

  const dir = Buffer.alloc(16 * frames.length);
  let offset = 6 + dir.length;
  frames.forEach((f, i) => {
    const e = 16 * i;
    dir.writeUInt8(f.size >= 256 ? 0 : f.size, e + 0); // width  (0 => 256)
    dir.writeUInt8(f.size >= 256 ? 0 : f.size, e + 1); // height (0 => 256)
    dir.writeUInt8(0, e + 2); // palette size
    dir.writeUInt8(0, e + 3); // reserved
    dir.writeUInt16LE(1, e + 4); // color planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(f.png.length, e + 8); // bytes of PNG data
    dir.writeUInt32LE(offset, e + 12); // offset to PNG data
    offset += f.png.length;
  });

  return Buffer.concat([header, dir, ...frames.map((f) => f.png)]);
}

export async function generateFavicons() {
  const svg = await readFile(r('assets/favicon.svg'), 'utf8');

  const icoSizes = [16, 32, 48];
  const frames = icoSizes.map((size) => ({ size, png: renderPng(svg, size) }));
  await writeFile(r('favicon.ico'), buildIco(frames));

  await writeFile(r('assets/apple-touch-icon.png'), renderPng(svg, 180));
  await writeFile(r('assets/icon-512.png'), renderPng(svg, 512));

  console.log('favicons: favicon.ico (16/32/48) + apple-touch-icon.png + icon-512.png');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await generateFavicons();
