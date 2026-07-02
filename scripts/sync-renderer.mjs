// Snapshot the extension's renderer + theme into this repo (committed).
// Re-run whenever the extension's render.js/skim.css change:
//   npm run sync   (requires the extension checkout as a sibling directory)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = resolve(root, '../mdviewer'); // Skim extension checkout

const FILES = [
  ['src/render.js', 'vendor/skim/render.js'],
  ['src/skim.css', 'vendor/skim/skim.css'],
];

for (const [src, dst] of FILES) {
  const body = await readFile(resolve(EXT, src), 'utf8');
  const stamped = `/* AUTO-SYNCED from the Skim extension (${src}). Do not edit here; run \`npm run sync\`. */\n` + body;
  await mkdir(dirname(resolve(root, dst)), { recursive: true });
  await writeFile(resolve(root, dst), stamped);
  console.log(`synced: ${src} -> ${dst}`);
}
