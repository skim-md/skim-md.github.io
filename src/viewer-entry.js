// Skim on the web: the /viewer tool and the landing page's live demo.
// 100% client-side. Files are read with the File API and rendered in this
// tab; nothing is ever uploaded.
import { renderMarkdown } from '../vendor/skim/render.js';
import { extractFrontmatter, buildFrontmatterCard } from '../vendor/skim/frontmatter.js';

export { renderMarkdown };

// Strip a leading YAML frontmatter block (same rules as the extension) and
// render the remaining body into `container`. When frontmatter is present,
// a key/value card (same markup/class as the extension) is prepended inside
// the container, ahead of the rendered body. Without this, frontmatter lines
// fall straight into the markdown parser and read as a run-on heading.
// Prepending inside (rather than as a sibling, like the extension does)
// keeps this safe to use for grid cells such as the hero demo's output pane.
function renderBody(container, source) {
  const { fields, body } = extractFrontmatter(source);
  container.innerHTML = renderMarkdown(body);
  if (fields) container.prepend(buildFrontmatterCard(fields));
}

const LAZY_CSS = ['/assets/skim.css', '/assets/katex/katex.min.css', '/assets/viewer-fonts.css'];
let cssDone = false;
function injectCss() {
  if (cssDone) return;
  cssDone = true;
  for (const href of LAZY_CSS) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }
  // Activate the extension theme's CSS variables and match the site theme.
  document.documentElement.setAttribute('data-skim-md', '1');
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
function syncTheme() {
  if (!document.documentElement.getAttribute('data-theme')) {
    const light = matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
  }
}

function decorate(container) {
  // Same hygiene as the extension: text direction + external links.
  container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th').forEach((n) => n.setAttribute('dir', 'auto'));
  container.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });
}

const SAMPLE = `---
title: Skim sample
status: rendered entirely in your browser
---

# Markdown, readable

This document was rendered **locally**. It never left your device.

## Things Skim renders

- GitHub-flavored tables, task lists, and footnotes
- Math: $e^{i\\pi} + 1 = 0$
- Code with syntax highlighting:

\`\`\`js
const answer = 6 * 7; // 42
\`\`\`

| Feature | Status |
| --- | --- |
| Tables | Works |
| Math | Works |

> Install the Skim extension and every local .md file opens like this, with live reload while your AI agent keeps writing.
`;

// ---------------------------------------------------------------- /viewer
export function initViewer(root, getPendingFile) {
  const drop = root.querySelector('#drop');
  const fileInput = root.querySelector('#file-input');
  const pasteBox = root.querySelector('#paste-box');
  const renderBtn = root.querySelector('#render-paste');
  const sampleBtn = root.querySelector('#try-sample');
  const outWrap = root.querySelector('#out-wrap');
  const out = root.querySelector('#out');
  const nameEl = root.querySelector('#doc-name');

  function render(source, name) {
    injectCss();
    renderBody(out, source);
    decorate(out);
    nameEl.textContent = name || 'pasted markdown';
    outWrap.hidden = false;
    outWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleFile(file) {
    if (!file) return;
    render(await file.text(), file.name);
  }

  ['dragover', 'dragenter'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => handleFile(e.dataTransfer.files?.[0]));
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', () => handleFile(fileInput.files?.[0]));
  renderBtn.addEventListener('click', () => { if (pasteBox.value.trim()) render(pasteBox.value, null); });
  sampleBtn.addEventListener('click', () => render(SAMPLE, 'sample.md'));
  document.addEventListener('paste', (e) => {
    if (e.target === pasteBox) return; // typing in the textarea is not "render now"
    const text = e.clipboardData?.getData('text/plain');
    if (text && text.trim()) render(text, null);
  });

  // A file dropped before this bundle finished loading (page shell stashed it).
  const pending = getPendingFile?.();
  if (pending) handleFile(pending);
}

// ------------------------------------------------------- landing hero demo
// An agent-style plan.md types itself into the source pane; the rendered
// pane re-renders as it grows. This is the auto-reload story, live.
const DEMO_PLAN = `---
task: Ship the onboarding flow
status: in progress
---

# plan.md

Agent notes, updated as I work.

## Steps

1. Audit the current flow
2. Draft the new copy
3. Wire the settings screen

- [x] Audit complete: 3 drop-off points found
- [ ] Copy draft in review

## Decision

| Option | Verdict |
| --- | --- |
| Modal tour | Rejected, too pushy |
| Inline hints | **Shipping** |

\`\`\`js
export const ONBOARDING_STEPS = 3;
\`\`\`
`;

export function initHeroDemo(root) {
  const srcEl = root.querySelector('.demo-src code');
  const srcPane = root.querySelector('.demo-src');
  const outEl = root.querySelector('.demo-out');
  const replay = root.querySelector('.demo-replay');
  injectCss();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;

  function finish() {
    srcEl.textContent = DEMO_PLAN;
    renderBody(outEl, DEMO_PLAN);
    decorate(outEl);
    replay.hidden = false;
  }

  function play() {
    cancelAnimationFrame(raf);
    replay.hidden = true;
    if (reduced) return finish(); // no typewriter for reduced motion
    let i = 0;
    let lastRender = 0;
    const step = (t) => {
      i = Math.min(i + 2, DEMO_PLAN.length); // ~120 chars/sec
      srcEl.textContent = DEMO_PLAN.slice(0, i);
      srcPane.scrollTop = srcPane.scrollHeight;
      if (t - lastRender > 160 || i === DEMO_PLAN.length) {
        renderBody(outEl, DEMO_PLAN.slice(0, i));
        decorate(outEl);
        lastRender = t;
      }
      if (i < DEMO_PLAN.length) raf = requestAnimationFrame(step);
      else replay.hidden = false;
    };
    raf = requestAnimationFrame(step);
  }

  replay.addEventListener('click', play);
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); play(); }
  }, { threshold: 0.3 });
  io.observe(root);
}
