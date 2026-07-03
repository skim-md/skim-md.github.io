// Pure helpers for the static-page compiler. No fs access here (testable).

export function escAttr(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// A page source starts with:  <!--meta\n{ ...json... }\n-->\n<body html>
export function parseMeta(src) {
  const m = String(src).match(/^<!--meta\s*\n([\s\S]*?)\n-->\s*\n?/);
  if (!m) throw new Error('page is missing a meta block (<!--meta {json} -->)');
  const meta = JSON.parse(m[1]);
  for (const key of ['title', 'description', 'path']) {
    if (!meta[key]) throw new Error(`meta block missing "${key}"`);
  }
  return { meta, body: src.slice(m[0].length) };
}

// "/" -> index.html, "/viewer/" -> viewer/index.html, "/404.html" -> 404.html
export function outPathFor(path) {
  if (path.endsWith('/')) return `${path.slice(1)}index.html`;
  return path.slice(1);
}

export function applyLayout(layout, meta, body, consts) {
  const canonical = consts.SITE_ORIGIN + meta.path;
  const robots = meta.noindex ? '<meta name="robots" content="noindex">' : '';
  const analytics = consts.GOATCOUNTER_CODE
    ? `<script data-goatcounter="https://${consts.GOATCOUNTER_CODE}.goatcounter.com/count" async src="/assets/count.js"></script>`
    : '<!-- analytics: set GOATCOUNTER_CODE in scripts/build.mjs and self-host count.js as assets/count.js -->';
  const tokens = {
    title: escAttr(meta.title),
    description: escAttr(meta.description),
    canonical,
    origin: consts.SITE_ORIGIN,
    extraHead: meta.extraHead || '',
    robots,
    content: body,
    installUrl: consts.INSTALL_URL,
    installLabel: consts.INSTALL_LABEL,
    installBtn: consts.installBtn || '',
    repoUrl: consts.REPO_URL || consts.INSTALL_URL,
    analytics,
  };
  // Two passes: the body itself may contain {{installUrl}} etc.
  let html = layout;
  for (let pass = 0; pass < 2; pass++) {
    html = html.replace(/\{\{(\w+)\}\}/g, (_m, k) => (k in tokens ? tokens[k] : _m));
  }
  if (/\{\{\w+\}\}/.test(html)) throw new Error(`unreplaced token in ${meta.path}`);
  return html;
}
