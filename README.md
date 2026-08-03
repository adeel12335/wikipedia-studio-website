# Wikipedia Studio Website

PHP website for The Wikipedia Studio. Every section that used to be an anchor on
one long page is now its own indexable URL with its own title, meta description,
keywords, Open Graph tags, and structured data.

## Requirements

PHP 8.1 or newer. No build step, no Composer dependencies, no database.

## Local preview

```bash
php -S localhost:8000 router-dev.php
```

Then open <http://localhost:8000>. Directory URLs resolve to `index.php` on their
own; `router-dev.php` adds the three rewritten routes (`/portfolio/<slug>/`,
`/sitemap.xml`, `/robots.txt`) that Apache handles through `.htaccess`. The
router refuses to run anywhere except the built-in server.

## Database and admin panel

The portfolio section is database-driven and edited through an admin panel at
`/admin/`. Everything else on the site is file-based.

### First-time setup

```bash
php bin/db-migrate.php                  # create the schema
php bin/create-admin.php your-username  # create a sign-in (prompts for a password)
php bin/seed-portfolio.php              # load the five entries that ship in data.php
```

Then sign in at `/admin/`.

### Configuration

With no environment variables set, the site uses SQLite at
`storage/database.sqlite` — no database server needed. For production, set these
in your host's environment-variable panel (never commit them):

| Variable | Purpose |
| --- | --- |
| `DB_DRIVER` | `mysql` or `sqlite` (default `sqlite`) |
| `DB_HOST`, `DB_PORT` | MySQL host and port |
| `DB_NAME`, `DB_USER`, `DB_PASS` | MySQL credentials |
| `DB_SQLITE` | Alternative SQLite path |

**If you stay on SQLite in production, keep the database file unreachable from
the web.** `storage/.htaccess` denies access on Apache; on nginx add the deny
block below, or point `DB_SQLITE` at a directory outside the web root. MySQL
avoids the question entirely.

### What the admin panel does

- Sign in with a hashed password, sessions expiring after an hour idle
- Create, edit, reorder, publish/unpublish, and delete portfolio entries
- Upload an image per entry, with alt text
- Set per-entry SEO fields: slug, meta title, meta description, keywords
- Drafts are visible only in the admin; published entries appear on
  `/portfolio/`, get their own page at `/portfolio/<slug>/`, and enter the sitemap

Security measures: CSRF tokens on every state-changing request, failed sign-ins
throttled per IP (8 per 15 minutes), `noindex` headers throughout, and uploads
validated by `getimagesize()` then re-encoded through GD under a random filename
rather than being moved into place — so a PHP payload renamed `.jpg` is rejected,
and a real image is stripped of anything hidden after the image data.

### Graceful degradation

If the database is unavailable or has no published entries, `/portfolio/` falls
back to the entries in `includes/data.php` rather than rendering empty. That also
means the site works before setup has been run.

### Password reset

There is no email-based reset by design. Re-run
`php bin/create-admin.php <username>` on the server to set a new password.

## URL structure

| URL | File |
| --- | --- |
| `/` | `index.php` |
| `/about-us/` | `about-us/index.php` |
| `/services/` | `services/index.php` |
| `/services/wikipedia-page-creation/` | `services/wikipedia-page-creation/index.php` |
| `/services/wikipedia-page-editing/` | `services/wikipedia-page-editing/index.php` |
| `/services/wikipedia-content-writing/` | `services/wikipedia-content-writing/index.php` |
| `/services/wikipedia-page-management/` | `services/wikipedia-page-management/index.php` |
| `/services/wikipedia-reputation-management/` | `services/wikipedia-reputation-management/index.php` |
| `/our-process/` | `our-process/index.php` |
| `/portfolio/` | `portfolio/index.php` |
| `/faq/` | `faq/index.php` |
| `/contact/` | `contact/index.php` |
| `/privacy-policy/` | `privacy-policy/index.php` |
| `/terms-conditions/` | `terms-conditions/index.php` |
| `/portfolio/<slug>/` | `portfolio/item.php` (via rewrite, one per database entry) |
| `/admin/` | `admin/index.php` — sign-in |
| `/admin/portfolio/` | `admin/portfolio/index.php` — list, publish, reorder, delete |
| `/sitemap.xml` | `sitemap.php` (via rewrite) |
| `/robots.txt` | `robots.php` (via rewrite) |
| 404 | `404.php` |

Routing needs no rewrite rules: each page is a directory containing `index.php`,
which resolves natively on Apache, nginx, and the PHP built-in server. Slugs are
keyword-led and lower-case with hyphens, and every URL ends in a trailing slash —
`url()` in `includes/config.php` is the only place that formats them.

## Project layout

```
includes/
  bootstrap.php      Loads everything below; the only require a page needs
  config.php         Brand constants, URL/base-path detection, view helpers
  data.php           Services, process, portfolio, testimonials, FAQ, routes
  seo.php            <head> renderer: meta, canonical, OG, Twitter, JSON-LD
  components.php     Reusable partials (page hero, breadcrumbs, cards, CTA)
  header.php         Opening layout and site navigation
  footer.php         Site footer and script tag
  icons.php          Inline SVG symbol library
  service-page.php   Shared template behind all five service detail pages
  db.php             PDO connection (MySQL or SQLite) and schema migration
  portfolio-repo.php Portfolio queries, slugs, and the file-based fallback
  admin/
    auth.php         Sign-in, sessions, CSRF, login throttling
    uploads.php      Image validation and re-encoding
    layout.php       Admin shell (noindex, no public CSS or JS)
admin/               Sign-in and the portfolio manager
bin/
  db-migrate.php       Create or update the database schema
  create-admin.php     Create an admin user or reset a password
  seed-portfolio.php   Load the portfolio entries from data.php
  check-seo-gates.php  Verify every page against the content gates
  build-seo-files.php  Writes static sitemap.xml + robots.txt for hosts
                       without .htaccess support
  build-og-images.php  Regenerate the 1200x630 social cards
assets/              Brand imagery; uploads/ holds admin-uploaded media
storage/             SQLite database (gitignored, denied to the web)
styles.css           Public site styling
admin.css            Admin panel styling, entirely separate
script.js            Motion, navigation, carousels, FAQ, star field
router-dev.php       Rewrite rules for the built-in development server only
.htaccess            Canonical redirects, rewrites, caching, headers
```

Adding a page means creating `<slug>/index.php`, setting its `$page` array, and
adding the slug to `sitemap_routes()` in `includes/data.php`. Adding a service
means one entry in `services()` plus a three-line `index.php` — the nav, cards,
detail page, sitemap, and schema all pick it up automatically.

## SEO

Each page defines a `$page` array that `seo_head()` turns into:

- a unique `<title>` and meta description, written for the Wikipedia editorial /
  reputation-management search space
- page-specific `keywords`, `robots`, and a self-referencing `canonical`
- `hreflang` (`en` plus `x-default`) pointing at the canonical URL
- complete Open Graph tags — `og:title`, `og:description`, `og:url`, `og:type`,
  `og:site_name`, `og:locale`, and `og:image` with real width/height read from
  the file on disk
- Twitter/X `summary_large_image` card tags
- a JSON-LD `@graph` containing `Organization` + `ProfessionalService`,
  `WebSite`, `WebPage`, and `BreadcrumbList`, plus per-page types: `Service` and
  `OfferCatalog` on service pages, `FAQPage` on `/faq/`, `HowTo` on
  `/our-process/`, `ItemList` on `/` `/services/` and `/portfolio/`,
  `AboutPage` on `/about-us/`, and `ContactPage` on `/contact/`

`dateModified` comes from each page file's modification time, and visible
breadcrumbs mirror the `BreadcrumbList` exactly.

Deliberately absent: `aggregateRating`. Review markup without verifiable reviews
behind it is a manual-action risk, so add it only alongside real, published
reviews.

### Content gates

The copy in `includes/data.php` and the page files is written to the content
gates in the [claude-seo](https://github.com/AgriciDaniel/claude-seo) skill, and
`bin/check-seo-gates.php` verifies them:

| Gate | Target |
| --- | --- |
| Word count | Homepage 500+, service page 800+, FAQ 800+, about/category 400+ |
| Title tag | 30–60 characters, unique per page |
| Meta description | 120–160 characters, unique per page |
| H1 | Exactly one, containing the page's primary keyword |
| Primary keyword | Present in the H1 and the first 100 words |
| Keyword density | Under 3% (measured excluding the sitewide footer) |
| Internal links | 3+ per page with descriptive anchor text |
| Image alt text | 10–125 characters, descriptive |

Each service page follows the skill's service-page template: a plain-language
definition, who the service is for, how the engagement runs, how pricing works,
outcomes, why work with us, and five service-specific FAQs written answer-first
at roughly 40–60 words so they stand alone if quoted.

Run the checker against a local server:

```bash
php -S localhost:8000 router-dev.php &
php bin/check-seo-gates.php http://localhost:8000
```

### Live site checks

`bin/check-live-seo.php` audits a deployed site for the problems that stop Google
indexing it — unreachable sitemap, `noindex`, broken sitemap URLs, www/non-www
duplication, missing HTTPS redirect, soft 404s, and exposed private files:

```bash
php bin/check-live-seo.php https://thewikipediastudio.com
```

It exits non-zero while any blocker remains. `docs/SEO-LAUNCH-CHECKLIST.md` is the
prioritised task list that goes with it.

### Known E-E-A-T gap

Google's helpful-content guidance asks *who* created a page. The service pages
carry a visible "Reviewed \<month\> · Written by the editorial team" line and
`/about-us/` documents the two-editor review standard, but there are no named
editors with credentials anywhere on the site, because inventing them would be
fabricating professional qualifications. Adding real bios — names, backgrounds,
and Wikipedia editing experience — is the single biggest remaining content
improvement, and it needs input from the business.

The same applies to the testimonials and the headline metrics (500+ pages, 98%
approval rate, 25+ editors) carried over from the original design: they should
be confirmed as accurate before launch. `aggregateRating` schema is deliberately
absent for the same reason.

### Canonical domain

`SITE_URL` is detected from the request (scheme, `X-Forwarded-Proto`, and `Host`),
so the same code produces correct absolute URLs on staging and production. Two
optional hardening steps for production:

- set a `SITE_URL` environment variable (e.g. `https://www.thewikipediastudio.com`)
  to pin the origin regardless of the `Host` header, or
- list your hostnames in `SITE_ALLOWED_HOSTS` in `includes/config.php`

Sub-directory deployments work too — `BASE_PATH` is derived by comparing the
project directory against the document root.

## Server configuration

`.htaccess` covers Apache: HTTPS and `index.php` redirects, `/sitemap.xml` and
`/robots.txt` rewrites, a 404 handler, compression, cache headers, and security
headers.

On nginx (Kinsta and similar), `.htaccess` is ignored. Routing still works, but
add the equivalents to the server block:

```nginx
error_page 404 /404.php;

location = /sitemap.xml { try_files $uri /sitemap.php; }
location = /robots.txt  { try_files $uri /robots.php; }

# Database-driven portfolio detail pages
location ~ ^/portfolio/([A-Za-z0-9-]+)/?$ {
    try_files $uri $uri/ /portfolio/item.php?slug=$1&$args;
}

location ^~ /includes/ { deny all; }
location ^~ /bin/      { deny all; }
location ^~ /storage/  { deny all; }   # the SQLite database lives here

# Uploaded files are data, never code
location ^~ /assets/uploads/ {
    location ~ \.php$ { deny all; }
}
```

Or skip the rewrites entirely and generate static files at deploy time:

```bash
php bin/build-seo-files.php https://www.thewikipediastudio.com
```

That writes `sitemap.xml` and `robots.txt` as plain files. The `.htaccess`
rewrites are conditional on those files being absent, so generating them is safe
on Apache as well.

## Contact form

`/contact/` posts to itself, validates server-side, and sends through PHP's
`mail()` before redirecting to `?sent=1` (POST/redirect/GET, so a refresh cannot
resubmit). It carries a CSRF token in the session and a hidden honeypot field,
and strips newlines from header values. If `mail()` is unavailable the page says
so and shows the direct email address instead of failing silently.

To send through SMTP instead, replace the `mail()` call in
`contact/index.php` with your transport of choice.

## Notes

- `privacy-policy/` and `terms-conditions/` are written to match what the site
  actually does, but they are starting points — have them reviewed before launch.
- Google Fonts loads when a connection is available and falls back to system
  fonts when it is not.
- Portfolio entries are anonymised categories; client work stays confidential.
- All motion and interactivity remain vanilla CSS and JavaScript.
