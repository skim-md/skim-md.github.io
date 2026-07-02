import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMeta, outPathFor, applyLayout, escAttr } from '../scripts/lib.mjs';
import { extractRefs, extractCssUrls, resolveRef } from '../scripts/check.mjs';

test('parseMeta: extracts JSON block and body', () => {
  const src = '<!--meta\n{ "title": "T", "description": "D", "path": "/x/" }\n-->\n<h1>Hi</h1>\n';
  const { meta, body } = parseMeta(src);
  assert.equal(meta.title, 'T');
  assert.equal(meta.path, '/x/');
  assert.equal(body.trim(), '<h1>Hi</h1>');
});

test('parseMeta: throws on a page without a meta block', () => {
  assert.throws(() => parseMeta('<h1>no meta</h1>'), /meta block/);
});

test('outPathFor: directory paths get index.html, file paths pass through', () => {
  assert.equal(outPathFor('/'), 'index.html');
  assert.equal(outPathFor('/viewer/'), 'viewer/index.html');
  assert.equal(outPathFor('/404.html'), '404.html');
});

test('applyLayout: substitutes every token and escapes attribute values', () => {
  const layout = '<title>{{title}}</title><meta content="{{description}}"><link href="{{canonical}}">{{robots}}<main>{{content}}</main>';
  const html = applyLayout(
    layout,
    { title: 'A "quoted" title', description: 'D', path: '/p/' },
    '<p>body {{installUrl}}</p>',
    { SITE_ORIGIN: 'https://example.org', INSTALL_URL: 'https://gh', INSTALL_LABEL: 'Get', GOATCOUNTER_CODE: '' }
  );
  assert.ok(html.includes('A &quot;quoted&quot; title'));
  assert.ok(html.includes('href="https://example.org/p/"'));
  assert.ok(html.includes('<p>body https://gh</p>'));
  assert.ok(!html.includes('{{'), 'no unreplaced tokens');
});

test('applyLayout: noindex pages get a robots meta', () => {
  const layout = '{{robots}}';
  const html = applyLayout(layout, { title: 't', description: 'd', path: '/404.html', noindex: true }, '', { SITE_ORIGIN: 'x', INSTALL_URL: 'y', INSTALL_LABEL: 'z', GOATCOUNTER_CODE: '' });
  assert.match(html, /noindex/);
});

test('escAttr escapes quotes and angle brackets', () => {
  assert.equal(escAttr('a"b<c>&'), 'a&quot;b&lt;c&gt;&amp;');
});

test('check: extractRefs finds local hrefs/srcs, skips externals and anchors', () => {
  const html = '<a href="/viewer/">v</a><script src="/assets/a.js"></script><a href="https://x.y/z">e</a><a href="#top">t</a><a href="mailto:a@b.c">m</a>';
  assert.deepEqual(extractRefs(html), ['/viewer/', '/assets/a.js']);
});

test('check: extractCssUrls finds root-relative url() targets', () => {
  const css = '@font-face { src: url("/assets/webfonts/a.woff2") format("woff2"); } .x { background: url(/assets/img.png); } .y { background: url(data:image/png;base64,xx); }';
  assert.deepEqual(extractCssUrls(css), ['/assets/webfonts/a.woff2', '/assets/img.png']);
});

test('check: resolveRef maps pretty URLs to files', () => {
  assert.equal(resolveRef('viewer/index.html', '/'), 'index.html');
  assert.equal(resolveRef('index.html', '/viewer/'), 'viewer/index.html');
  assert.equal(resolveRef('index.html', '/assets/site.css'), 'assets/site.css');
  assert.equal(resolveRef('index.html', '/viewer/?q=1#x'), 'viewer/index.html');
});
