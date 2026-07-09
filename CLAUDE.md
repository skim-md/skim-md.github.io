# CLAUDE.md — skim-site

Static marketing/blog site for the Skim markdown viewer, served by GitHub Pages
from `main` at https://skim.md.

## Build / verify

- `npm run build` compiles `pages/*.html` through `templates/layout.html` into
  the repo root, and regenerates favicons, blog cover images, blog diagrams,
  `sitemap.xml`, and `robots.txt`.
- `npm run check` is a hard SEO/link gate. `npm test` runs unit tests.
- Before committing: `npm run build && npm run check && npm test` must all pass.
- Commit the built root files too (Pages serves them); don't commit only `pages/`.

## Deploy risk (READ THIS)

**A green push does NOT guarantee the change is live.** Deploy runs via the
GitHub Actions workflow `.github/workflows/deploy.yml`. The final
`actions/deploy-pages` step intermittently fails with
`Deployment failed, try again later` even when build/check/test passed and the
artifact uploaded. When that happens the live site silently stays on the
previous commit (symptom seen once: new blog images/diagrams were pushed but the
site showed only the old content).

After any push, confirm the deploy actually succeeded:

```bash
gh run list --repo skim-md/skim-md.github.io --limit 3
```

If the latest run is `failure` on the deploy step, it is almost always this
transient error, not your code. Re-run it:

```bash
gh run rerun <run-id> --repo skim-md/skim-md.github.io --failed
```

Then verify live, e.g.
`curl -s -o /dev/null -w "%{http_code}" https://skim.md/<path>/`.

## Adding a blog post

See `NEW_BLOG_POST.md` for the full playbook (constraints, cover image + in-body
diagrams, rendered examples, blog-index registration).

## Hard content rules enforced by `npm run check`

- `title` <= 60 chars; `description` 50-155 chars; exactly one `<h1>` per page.
- No em-dashes (`—`) or double-hyphens (`--`) anywhere except the `<!--meta`
  block delimiters. This is also a standing owner preference: never use em-dashes
  in prose (or commit messages).
- No external resource loads (self-host every image/script/style under
  `/assets/`; external `<a href>` links are fine).

## Store URLs (live as of 2026-07-09)

The real listings are published and wired in (`INSTALL_URL` in
`scripts/build.mjs`, the `STORE` map in `templates/layout.html`, plus the
hardcoded links in `pages/install.html` and the per-browser guide pages):

- Chrome Web Store: `https://chromewebstore.google.com/detail/skim-%E2%80%94-markdown-viewer-re/feeikgjlekgeepjljmnifkbnpcnflcmd`
- Firefox Add-ons: `https://addons.mozilla.org/en-US/firefox/addon/skim-markdown-viewer-reader/`
- Edge / Brave / Opera / Vivaldi / Arc all point at the Chrome Web Store URL
  (Chromium browsers install Chrome extensions; there is no separate Edge
  Add-ons listing).

Still a placeholder: Safari (`id000000000` App Store link in the `STORE` map).
There is no Safari build yet; the markdown-reader-safari page already routes
Safari users to the online viewer, so the dead App Store id is only reachable
via the client-side browser-detect fallback. Swap it when the Safari app ships.
