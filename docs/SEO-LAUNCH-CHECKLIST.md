# SEO launch checklist

Site: <https://thewikipediastudio.com/>

Ordered by what actually blocks Google from indexing the site, then by impact.
Tick items off as they are done.

Before anything else, run the automated check from a machine with network access:

```bash
php bin/check-live-seo.php https://thewikipediastudio.com
```

It tests reachability, indexability, the sitemap and every URL in it, host and
scheme canonicalisation, homepage tags, 404 handling, and whether private files
are exposed. It exits non-zero while any blocker remains, so it can be re-run
after each fix. Everything in Phase 0 below is something that script verifies.

---

## Phase 0 — blockers (do these first)

These stop indexing, or cause Search Console to reject what you submit.

- [ ] **Confirm `/sitemap.xml` returns 200.** On nginx (Kinsta), `.htaccess` is
      ignored, so the rewrite that maps `/sitemap.xml` to `sitemap.php` does not
      exist and the URL 404s. Fix either way:
      - add the `location` blocks from the "Server configuration" section of
        `README.md`, **or**
      - generate static files: `php bin/build-seo-files.php https://thewikipediastudio.com`
- [ ] **Confirm `/robots.txt` returns 200.** Same cause and same two fixes. A
      missing robots.txt does not block crawling, but the `Sitemap:` line is lost.
- [ ] **Confirm the five `/portfolio/<slug>/` pages return 200.** These also
      depend on a rewrite. They are listed in the sitemap, so if the rewrite is
      missing you submit a sitemap containing five 404s.
- [ ] **Pick one canonical host and 301 the other.** If both
      `thewikipediastudio.com` and `www.thewikipediastudio.com` serve HTTP 200,
      every page exists at two addresses. Choose one, redirect the other.
- [ ] **Force HTTPS** with a 301 from `http://`.
- [ ] **Set the `SITE_URL` environment variable** to the canonical origin, e.g.
      `SITE_URL=https://thewikipediastudio.com`. Without it, canonical and Open
      Graph URLs are built from the incoming `Host` header — correct in normal
      use, but it means a request with a spoofed Host produces a wrong canonical.
- [ ] **Confirm no staging password protection or `noindex`** is left on the
      production host.
- [ ] **Confirm `/storage/` is not web-readable.** If the site runs on SQLite and
      nginx without the deny rule, `storage/database.sqlite` is downloadable —
      that is the whole database, including the admin password hash. Add the deny
      block, point `DB_SQLITE` outside the web root, or move to MySQL.
- [ ] **Run the database setup** if it has not been run on production yet:
      ```bash
      php bin/db-migrate.php
      php bin/create-admin.php <username>
      php bin/seed-portfolio.php
      ```
      Until then the portfolio falls back to the file-based entries — the site
      works, but the admin panel cannot be used.

## Phase 1 — get it into Google

- [ ] **Google Search Console**: add the property, verify by DNS TXT record
      (survives redeploys, unlike an HTML file).
- [ ] **Submit the sitemap** in Search Console → Sitemaps → `sitemap.xml`.
- [ ] **Request indexing** via URL Inspection for the pages that matter most:
      `/`, `/services/`, the five service pages, `/contact/`. Do not bother
      requesting all 19; Google finds the rest from the sitemap and internal links.
- [ ] **Bing Webmaster Tools**: same two steps. It takes ten minutes, feeds
      Copilot and DuckDuckGo, and supports IndexNow for near-instant submission.
- [ ] **Google Business Profile**: create or claim it. For a service business this
      is what produces a branded panel and reviews in search results. Service area
      is worldwide, so set it up without a public street address.
- [ ] **Install analytics** (GA4, or a privacy-friendly alternative) and link it to
      Search Console so query data and behaviour sit side by side.

Expect nothing for the first few days. New sites typically start appearing for
brand queries within one to two weeks, and for competitive terms over months.

## Phase 2 — credibility gaps that cost rankings

These are the real weaknesses in the site as it stands.

- [ ] **Add named editors with credentials.** Google's helpful-content guidance
      asks *who* created a page. Right now the service pages say "written by the
      editorial team" and nothing more, because inventing names and qualifications
      for a real business was not an option. This is the single biggest content
      gap, and it needs: two or three real names, professional backgrounds, and
      Wikipedia editing experience. Once they exist, add `Person` schema and an
      author byline per page.
- [ ] **Verify or remove the headline metrics.** The site claims 500+ pages
      created, a 98% approval rate, 25+ editors, and 10+ years. These were carried
      over from the original design and have not been confirmed. Unverifiable
      claims are a trust risk with both readers and reviewers — either stand behind
      them or soften them.
- [ ] **Verify the three testimonials** (Dr. Sarah Mitchell, Daniel Mercer, Elena
      Brooks). If they are placeholders, replace them with real, attributable
      quotes or remove them. Do **not** add `Review`/`AggregateRating` schema until
      the reviews are genuine and published somewhere verifiable — fake review
      markup is a manual-action risk, which is why it is deliberately absent.
- [ ] **Create real social profiles and wire them up.** The footer's Facebook,
      LinkedIn, Instagram, and X icons currently all link to `/contact/`. Point
      them at real profiles, then add those URLs to the `sameAs` array in
      `seo_organization_node()` in `includes/seo.php` so the Organization entity
      cross-references properly.
- [ ] **Confirm the phone number and email** in `includes/config.php`
      (`+1 (800) 453-7801`, `hello@thewikipediastudio.com`) are live and monitored.
      They appear in the schema and on the contact page; a dead number is worse
      than none.
- [ ] **Check the contact form actually delivers.** It uses PHP `mail()`, which
      many hosts either disable or get spam-filtered. Send a test enquiry. If it
      does not arrive, switch to SMTP — the send call is in one place in
      `contact/index.php`.
- [ ] **Decide what happens with `thewikistudio.com`.** You own both domains. If
      similar content sits on both, they compete with each other. Either
      differentiate them, or 301 one to the other and consolidate the authority.

## Phase 3 — the actual growth work

The site covers commercial keywords well ("wikipedia page creation services").
It has no pages targeting the informational queries that bring in far more
traffic, and those searchers are exactly the people who later need the service.

- [ ] **Build a guides section** covering the questions the FAQ only touches:
      - how to create a Wikipedia page (step by step)
      - Wikipedia notability guidelines explained
      - how much a Wikipedia page costs
      - why Wikipedia pages get rejected or deleted
      - Wikipedia paid editing and disclosure rules
      - how to fix errors on an existing Wikipedia page
      Roughly 1,500 words each, per the content gates, each linking to the
      relevant service page with descriptive anchor text.
- [ ] **Add `Article` schema** and a visible published/updated date to each guide.
- [ ] **Earn links.** Nothing else moves competitive rankings as much. Realistic
      routes for this business: commentary in trade and marketing press,
      contributed articles on reputation management, and being the source
      journalists quote about paid Wikipedia editing.
- [ ] **Re-run the content gates** after any content edit:
      ```bash
      php bin/check-seo-gates.php https://thewikipediastudio.com
      ```

## Phase 4 — performance and polish

- [ ] **Measure Core Web Vitals** with PageSpeed Insights on the homepage and one
      service page. Likely findings, given how the site is built:
      - the hero background image (`assets/hero-orbital-globe.jpg`, 1536×1024) is
        loaded from CSS, so the browser discovers it late — add a `<link rel="preload">`
      - Google Fonts blocks rendering; self-hosting the two families removes a
        third-party round trip and the privacy question with it
      - the star-field and hero-particle canvases run continuously on desktop;
        they already pause when off-screen and respect `prefers-reduced-motion`,
        but they are the first thing to cut if INP is poor
- [ ] **Serve WebP or AVIF** for the photographic assets, keeping JPEG fallbacks.
- [ ] **Add a full favicon set** and a web app manifest. Currently one 400×331 PNG
      does the job of every icon size.
- [ ] **Confirm compression and caching** are on at the host. `.htaccess` sets
      both for Apache; on nginx they are configured server-side.
- [ ] **Set up uptime monitoring.** A site that is down when Googlebot calls loses
      crawl trust.

---

## What is already done

Worth knowing so it does not get redone:

- 19 pages, each with a unique keyword-led title (30–60 chars), meta description
  (120–160 chars), self-referencing canonical, hreflang, and robots directives
- Complete Open Graph and Twitter card tags, with purpose-built 1200×630 social
  cards in `assets/og/`
- JSON-LD on every page: Organization + ProfessionalService, WebSite, WebPage,
  BreadcrumbList, plus Service, FAQPage, ItemList, AboutPage, ContactPage and
  CreativeWork where they apply
- Clean keyword-led URLs, one canonical address per page, trailing slashes
  enforced, `index.php` and `.php` variants 301-redirected
- Dynamic sitemap including database-driven portfolio entries, plus robots.txt
- Visible breadcrumbs matching the BreadcrumbList markup
- Content gates enforced by `bin/check-seo-gates.php`: word floors, one
  keyword-bearing H1 per page, keyword in the first 100 words, density under 3%,
  3+ internal links, descriptive alt text
- Security headers, HTTPS redirect, compression and cache rules in `.htaccess`
- `noindex` on the admin panel, 404s returning a real 404
