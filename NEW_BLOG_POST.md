# NEW_BLOG_POST.md — how to add a blog post to this site

A playbook for Claude (or anyone) to create a new blog/guide post that matches
this site's voice, passes the build gate, and is set up for SEO. Give the topic
and target keyword; follow every step below.

## 0. How the site works (context)

- Source pages live in `pages/*.html`. `npm run build` wraps each one in
  `templates/layout.html` and writes the result to the repo root (GitHub Pages
  serves `main`), then regenerates `sitemap.xml` + `robots.txt`, favicons, and
  blog cover images.
- `npm run check` is a hard gate (also run in CI). `npm test` runs unit tests.
- **A post is not done until `npm run build && npm run check && npm test` all
  pass.**

## 1. Page skeleton

Create `pages/<slug>.html`. `<slug>` becomes the URL `/<slug>/`. Start with the
meta block, then the article:

```html
<!--meta
{
  "title": "...",
  "description": "...",
  "path": "/<slug>/",
  "date": "YYYY-MM-DD",
  "updated": "YYYY-MM-DD"
}
-->
<article class="prose">
<h1>...</h1>
<p class="byline"><time datetime="YYYY-MM-DD">Updated D Month YYYY</time></p>
<p class="byline">One-line hook. N minute read.</p>
<figure class="figure post-hero"><img class="shot" src="/assets/blog/<slug>.png" width="1200" height="630" loading="lazy" decoding="async" alt="Descriptive, keyword-aware alt text"></figure>

<h2>...</h2>
<p>...</p>

<aside class="cta-box">
  <p><strong>Hook?</strong> Try the <a href="/viewer/">free online markdown viewer</a>, or install <a href="{{installUrl}}" rel="noopener">the free Skim extension</a>.</p>
</aside>

<h2>Related guides</h2>
<ul>
<li><a href="/other-post/">Another guide</a></li>
</ul>

<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "FAQPage", "datePublished": "YYYY-MM-DD", "dateModified": "YYYY-MM-DD", "publisher": { "@type": "Organization", "name": "Skim", "url": "https://skim.md/" }, "mainEntity": [ /* mirror the on-page FAQ exactly */ ] }
</script>
</article>
```

`{{installUrl}}` is a build token (resolves to the store link, rewritten per
browser client-side). Write it literally.

## 2. Hard rules the check gate enforces (breaking any fails the build)

- `title` **<= 60 characters**.
- `description` **between 50 and 155 characters**. Include the keyword.
- **Exactly one `<h1>`** on the page. Example previews must NOT add real
  `<h1>`/`<h2>` (see the `.md-demo` heading trick below).
- **No em-dashes (—) and no double-hyphens (`--`) anywhere** except the
  `<!--meta` / `-->` delimiters. Use commas, periods, colons, "and"/"or".
  Single hyphens inside words (`plain-English`) are fine. This is also a
  standing style rule for the site owner: never use em-dashes in prose.
- **No external resource loads.** Do not reference any image, script, stylesheet,
  or font on another host. Self-host everything under `/assets/`. External
  `<a href>` links are allowed.
- Every internal link and image `src` must resolve to a real file.
- Page weight budget is 300 KB (HTML + CSS/JS/images it statically loads).
  Blog cover images under `/assets/blog/` and screenshots under `/assets/promo/`
  are exempt because they are lazy-loaded, so prefer those dirs for imagery.
- All JSON-LD must be valid JSON.

## 3. Voice

Honest, concise, plain-English, second person. No hype, no exclamation-marketing.
Lead with the fastest useful answer, then the deeper setup. Look at
`pages/how-to-open-md-file.html` and `pages/markdown-reader-chrome.html` as the
reference tone.

## 4. Every post gets one image (SEO)

1. Add a row to `COVERS` in `scripts/gen-blog-images.mjs`:
   ```js
   { slug: '<slug>', token: '<name>.md', kicker: 'Category', accent: '#37c5f0', l1: 'Line one', l2: 'Line two' },
   ```
   Keep `l1`/`l2` short (~22 chars each); `l2` is optional. Rotate `accent`
   among the brand colors (`#ffd866 #37c5f0 #ff6a5f #a06bff #34d399 #7aa2ff`, or
   a browser's brand color for per-browser posts).
2. Run `npm run blogimg` (the full `npm run build` also does this).
3. Reference it with the exact `<figure class="figure post-hero">` snippet in
   section 1: **always `loading="lazy"`, explicit `width="1200" height="630"`,
   and descriptive, keyword-aware `alt` text.** Lazy + fixed dimensions keep the
   page fast and prevent layout shift.

## 4b. In-body diagrams (more images = more Google Images reach)

Do not stop at the header image. A good post has one or more explanatory
"sketches" in the body, near the content they illustrate. They are generated the
same self-hosted way and indexed by Google Images.

1. Add a spec to `DIAGRAMS` in `scripts/gen-blog-diagrams.mjs`. Two shapes cover
   most needs:
   - `flow`: a 2 to 4 step pipeline of labeled boxes joined by arrows. Good for
     "source to rendered", install flows, "render then print".
     ```js
     { id: '<slug>', kind: 'flow', accent: '#4d68d6', steps: [ { l1: 'Short', l2: 'sub' }, ... ] }
     ```
   - `cards`: three labeled point cards. Good for "what to look for" / "where you
     see it".
     ```js
     { id: '<slug>', kind: 'cards', accent: '#22a06b', cards: [ { l1: 'Free', l2: 'every feature' }, ... ] }
     ```
   Keep `l1` short (it auto-shrinks but ~14 chars is the sweet spot). It renders
   to `/assets/blog/dg-<id>.png` (1200x300).
2. Run `npm run blogimg` (or the full build).
3. Place it in the body between block elements, near the section it explains
   (NOT next to the header hero), with a caption:
   ```html
   <figure class="figure"><img class="diagram" src="/assets/blog/dg-<id>.png" width="1200" height="300" loading="lazy" decoding="async" alt="Descriptive alt"><figcaption>One-line caption.</figcaption></figure>
   ```
   Use `class="diagram"` (not `shot`); the PNG already carries its own frame.

## 5. Showing markdown with color and formatting

When a post teaches syntax, do not dump raw markdown in a flat `<pre>` (it looks
broken). Show the source and the rendered result together with the `.md-demo`
component (styled in `assets/site.css`):

```html
<div class="md-demo">
<pre class="md-src"><code><span class="tk">**</span>bold<span class="tk">**</span></code></pre>
<div class="md-out"><p><strong>bold</strong></p></div>
</div>
```

- Wrap structural marks (`# - > * [ ] ( ) ! | \` `) in `<span class="tk">` (accent
  color); use `<span class="tb">` for the bold marker.
- In the rendered pane, real `<strong>`, `<em>`, `<a>`, `<code>`, `<ul>`,
  `<blockquote>`, `<table>` are all fine.
- For heading previews use `<div class="md-h1|md-h2|md-h3">`, **never** a real
  heading tag (it would break the single-`<h1>` rule and pollute the outline).

The cheat sheet (`pages/markdown-cheat-sheet.html`) also uses a two-column
`Markdown | Renders as` table inside `<div class="table-scroll">` for reference
grids. Either pattern is good; pick per post.

## 6. Register the post in the blog index

Edit `pages/blog.html`:

1. Add a card inside `.post-cards` (copy an existing `<a class="post-card reveal">`
   block, set `href="/<slug>/"`, a distinct `fname` token in the `.pthumb`, a
   `.ptag`/`.post-kicker`, `<h3>`, and one-line `<p>`).
2. Add an entry to the `blogPost` array in the page's Blog JSON-LD:
   `{ "@type": "BlogPosting", "headline": "...", "url": "https://skim.md/<slug>/" }`.

The sitemap picks the page up automatically on build (any page whose meta lacks
`"noindex": true`).

## 7. Ship

```bash
npm run build && npm run check && npm test
```

All three must pass. Then commit (end the message with the Co-Authored-By line
the repo uses) and push `main`. Never use em-dashes in the commit message either.
