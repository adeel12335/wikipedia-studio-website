<?php
/**
 * Post-launch SEO audit against a live site.
 *
 *   php bin/check-live-seo.php https://thewikipediastudio.com
 *
 * Checks the things that stop Google indexing a site, in the order they matter.
 * Run it from anywhere with PHP and outbound network access — it only makes
 * ordinary HTTP requests, so it works against production safely.
 *
 * Exits non-zero if any BLOCKER is found.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("This script is for command-line use only.\n");
}

$base = rtrim((string) ($argv[1] ?? ''), '/');

if ($base === '' || !preg_match('#^https?://[^/\s]+$#', $base)) {
    fwrite(STDERR, "Usage: php bin/check-live-seo.php https://example.com\n");
    exit(1);
}

$blockers = [];
$warnings = [];

/**
 * Fetch a URL without following redirects, so redirect behaviour can be checked.
 *
 * @return array{code: int, headers: array<int, string>, body: string, location: ?string}
 */
function fetch(string $url, bool $follow = false, string $method = 'GET'): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => $follow,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HEADER         => true,
        CURLOPT_NOBODY         => $method === 'HEAD',
        CURLOPT_USERAGENT      => 'claude-seo-live-check/1.0 (+compatible; like Googlebot)',
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $raw  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $size = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        return ['code' => 0, 'headers' => ['curl error: ' . $err], 'body' => '', 'location' => null];
    }

    $headerText = substr((string) $raw, 0, $size);
    $body       = substr((string) $raw, $size);
    $headers    = array_values(array_filter(array_map('trim', explode("\n", $headerText))));

    $location = null;
    foreach ($headers as $header) {
        if (stripos($header, 'location:') === 0) {
            $location = trim(substr($header, 9));
        }
    }

    return ['code' => $code, 'headers' => $headers, 'body' => $body, 'location' => $location];
}

/** Print a result line. */
function line(string $label, string $status, string $detail = ''): void
{
    printf("  %-9s %-34s %s\n", '[' . $status . ']', $label, $detail);
}

function header_value(array $response, string $name): ?string
{
    foreach ($response['headers'] as $header) {
        if (stripos($header, $name . ':') === 0) {
            return trim(substr($header, strlen($name) + 1));
        }
    }

    return null;
}

echo "\nLive SEO check: {$base}\n";
echo str_repeat('=', 62) . "\n\n";

/* ---------------------------------------------------------------------------
 * 1. Is the site reachable at all?
 * ------------------------------------------------------------------------ */

echo "Reachability\n";

$home = fetch($base . '/', true);

if ($home['code'] === 0) {
    line('homepage', 'BLOCKER', implode(' ', $home['headers']));
    $blockers[] = 'The homepage could not be fetched at all. Check DNS, TLS, and that the host is serving the site.';
    echo "\nCannot continue without a reachable homepage.\n";
    exit(1);
}

if ($home['code'] !== 200) {
    line('homepage', 'BLOCKER', 'HTTP ' . $home['code']);
    $blockers[] = "The homepage returns HTTP {$home['code']}. Nothing will be indexed until it returns 200.";
} else {
    line('homepage', 'ok', 'HTTP 200, ' . number_format(strlen($home['body'])) . ' bytes');
}

// A password-protected staging site returns 401, or a login form on 200.
if ($home['code'] === 401 || stripos($home['body'], 'staging') !== false && stripos($home['body'], 'password') !== false) {
    $blockers[] = 'The site looks password-protected. Remove HTTP auth / staging protection before Google can crawl it.';
    line('not password-gated', 'BLOCKER', 'looks protected');
}

/* ---------------------------------------------------------------------------
 * 2. Indexability
 * ------------------------------------------------------------------------ */

echo "\nIndexability\n";

$robotsMeta = '';
if (preg_match('#<meta[^>]+name=["\']robots["\'][^>]*content=["\']([^"\']+)#i', $home['body'], $m)) {
    $robotsMeta = strtolower($m[1]);
}
$robotsHeader = strtolower((string) header_value($home, 'X-Robots-Tag'));

if (str_contains($robotsMeta, 'noindex') || str_contains($robotsHeader, 'noindex')) {
    line('no noindex', 'BLOCKER', 'noindex found: ' . trim($robotsMeta . ' ' . $robotsHeader));
    $blockers[] = 'The homepage carries a noindex directive. Google will not index the site while that is present.';
} else {
    line('no noindex', 'ok', $robotsMeta !== '' ? $robotsMeta : 'no robots meta (defaults to indexable)');
}

$robots = fetch($base . '/robots.txt');
if ($robots['code'] === 200) {
    $hasSitemap = stripos($robots['body'], 'sitemap:') !== false;
    $blocksAll  = (bool) preg_match('/^\s*disallow:\s*\/\s*$/mi', $robots['body']);

    if ($blocksAll) {
        line('robots.txt', 'BLOCKER', 'contains "Disallow: /"');
        $blockers[] = 'robots.txt disallows the whole site. Remove the blanket Disallow rule.';
    } else {
        line('robots.txt', 'ok', 'HTTP 200' . ($hasSitemap ? ', declares a sitemap' : ''));
    }

    if (!$hasSitemap) {
        line('robots sitemap line', 'warn', 'no Sitemap: directive');
        $warnings[] = 'robots.txt has no Sitemap: line. Not fatal, but it is the cheapest way to point crawlers at the sitemap.';
    }
} else {
    line('robots.txt', 'warn', 'HTTP ' . $robots['code']);
    $warnings[] = "robots.txt returns HTTP {$robots['code']}. Crawling still works, but the Sitemap: directive is lost. On nginx, add the location block from README.md, or run bin/build-seo-files.php to write a static file.";
}

/* ---------------------------------------------------------------------------
 * 3. Sitemap
 * ------------------------------------------------------------------------ */

echo "\nSitemap\n";

$sitemap = fetch($base . '/sitemap.xml');

if ($sitemap['code'] !== 200) {
    line('/sitemap.xml', 'BLOCKER', 'HTTP ' . $sitemap['code']);
    $blockers[] = "/sitemap.xml returns HTTP {$sitemap['code']}. Either add the nginx location block from README.md, or run: php bin/build-seo-files.php {$base}";
    $sitemapUrls = [];
} else {
    $xml = @simplexml_load_string($sitemap['body']);
    if ($xml === false) {
        line('/sitemap.xml', 'BLOCKER', 'not valid XML');
        $blockers[] = '/sitemap.xml does not parse as XML. Google will reject it.';
        $sitemapUrls = [];
    } else {
        $sitemapUrls = [];
        foreach ($xml->url as $entry) {
            $sitemapUrls[] = (string) $entry->loc;
        }
        line('/sitemap.xml', 'ok', count($sitemapUrls) . ' URLs, valid XML');

        // Every loc must be on the canonical host, or Search Console rejects it.
        $wrongHost = array_filter($sitemapUrls, static fn (string $u): bool => !str_starts_with($u, $base . '/'));
        if ($wrongHost !== []) {
            line('sitemap host matches', 'BLOCKER', count($wrongHost) . ' URLs on another host, e.g. ' . reset($wrongHost));
            $blockers[] = 'Sitemap URLs point at a different host than the one you submitted. Set the SITE_URL environment variable to the canonical origin, or fix the host redirect.';
        } else {
            line('sitemap host matches', 'ok', 'all URLs on ' . $base);
        }
    }
}

/* ---------------------------------------------------------------------------
 * 4. Every sitemap URL must actually work
 * ------------------------------------------------------------------------ */

if ($sitemapUrls !== []) {
    echo "\nSitemap URLs\n";

    $broken = [];
    $redirecting = [];

    foreach ($sitemapUrls as $url) {
        $response = fetch($url);
        if ($response['code'] === 200) {
            continue;
        }
        if (in_array($response['code'], [301, 302, 307, 308], true)) {
            $redirecting[$url] = $response['code'] . ' -> ' . (string) $response['location'];
            continue;
        }
        $broken[$url] = $response['code'];
    }

    if ($broken !== []) {
        foreach ($broken as $url => $code) {
            line('broken', 'BLOCKER', $code . ' ' . $url);
        }
        $blockers[] = count($broken) . ' URL(s) in the sitemap do not return 200. Submitting a sitemap full of errors damages trust in it. If these are /portfolio/<slug>/ pages, the rewrite rule is missing — see the nginx block in README.md.';
    }

    if ($redirecting !== []) {
        foreach ($redirecting as $url => $detail) {
            line('redirects', 'warn', $detail);
        }
        $warnings[] = 'Sitemaps should list final URLs, not redirects. Update the sitemap or the redirect.';
    }

    if ($broken === [] && $redirecting === []) {
        line('all URLs 200', 'ok', count($sitemapUrls) . ' checked');
    }
}

/* ---------------------------------------------------------------------------
 * 5. One canonical host and scheme
 * ------------------------------------------------------------------------ */

echo "\nCanonical host\n";

$parts = parse_url($base);
$host  = (string) ($parts['host'] ?? '');
$isWww = str_starts_with($host, 'www.');
$other = $isWww ? substr($host, 4) : 'www.' . $host;

$otherResponse = fetch(($parts['scheme'] ?? 'https') . '://' . $other . '/');

if ($otherResponse['code'] === 200) {
    line('www/non-www', 'warn', $other . ' also returns 200');
    $warnings[] = "Both {$host} and {$other} serve the site with HTTP 200. Pick one and 301-redirect the other, otherwise the same pages exist at two addresses.";
} elseif (in_array($otherResponse['code'], [301, 308], true)) {
    line('www/non-www', 'ok', $other . ' -> 301');
} elseif ($otherResponse['code'] === 0) {
    line('www/non-www', 'ok', $other . ' does not resolve');
} else {
    line('www/non-www', 'ok', $other . ' returns ' . $otherResponse['code']);
}

if (($parts['scheme'] ?? '') === 'https') {
    $insecure = fetch('http://' . $host . '/');
    if (in_array($insecure['code'], [301, 308], true)) {
        line('http -> https', 'ok', '301');
    } elseif ($insecure['code'] === 200) {
        line('http -> https', 'BLOCKER', 'http serves 200 without redirecting');
        $blockers[] = 'The site is reachable over plain http without a redirect. Force https with a 301.';
    } else {
        line('http -> https', 'ok', 'HTTP ' . $insecure['code']);
    }
}

$canonical = null;
if (preg_match('#<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)#i', $home['body'], $m)) {
    $canonical = $m[1];
}

if ($canonical === null) {
    line('canonical tag', 'BLOCKER', 'missing on the homepage');
    $blockers[] = 'The homepage has no canonical tag.';
} elseif (rtrim($canonical, '/') !== rtrim($base, '/')) {
    line('canonical tag', 'warn', $canonical);
    $warnings[] = "The homepage canonical is {$canonical} but you are testing {$base}. Set SITE_URL so canonicals always use the host you want indexed.";
} else {
    line('canonical tag', 'ok', $canonical);
}

/* ---------------------------------------------------------------------------
 * 6. Page-level essentials on the homepage
 * ------------------------------------------------------------------------ */

echo "\nHomepage tags\n";

preg_match('#<title>(.*?)</title>#si', $home['body'], $titleMatch);
$title = trim(html_entity_decode($titleMatch[1] ?? ''));
$titleLength = mb_strlen($title);
line('title', $titleLength >= 30 && $titleLength <= 60 ? 'ok' : 'warn', $titleLength . ' chars: ' . $title);
if ($titleLength === 0) {
    $blockers[] = 'The homepage has no title tag.';
}

preg_match('#<meta[^>]+name=["\']description["\'][^>]*content=["\']([^"\']*)#i', $home['body'], $descMatch);
$descLength = mb_strlen(trim(html_entity_decode($descMatch[1] ?? '')));
line('meta description', $descLength >= 120 && $descLength <= 160 ? 'ok' : 'warn', $descLength . ' chars');

$h1Count = preg_match_all('#<h1[\s>]#i', $home['body']);
line('single H1', $h1Count === 1 ? 'ok' : 'warn', $h1Count . ' found');

$hasOg = str_contains($home['body'], 'property="og:title"');
line('open graph', $hasOg ? 'ok' : 'warn', $hasOg ? 'present' : 'missing');

$jsonLdOk = false;
if (preg_match('#<script type="application/ld\+json">(.*?)</script>#s', $home['body'], $m)) {
    $jsonLdOk = json_decode(str_replace('<\/', '/', $m[1]), true) !== null;
}
line('json-ld', $jsonLdOk ? 'ok' : 'warn', $jsonLdOk ? 'parses' : 'missing or invalid');

/* ---------------------------------------------------------------------------
 * 7. Things that affect ranking rather than indexing
 * ------------------------------------------------------------------------ */

echo "\nHousekeeping\n";

$notFound = fetch($base . '/a-page-that-does-not-exist-' . bin2hex(random_bytes(4)) . '/');
line('404 handling', $notFound['code'] === 404 ? 'ok' : 'warn', 'HTTP ' . $notFound['code']);
if ($notFound['code'] === 200) {
    $warnings[] = 'A missing page returns HTTP 200 instead of 404. Soft 404s waste crawl budget and can get indexed.';
}

$adminResponse = fetch($base . '/admin/');
$adminRobots   = strtolower((string) header_value($adminResponse, 'X-Robots-Tag'));
if ($adminResponse['code'] === 200 && !str_contains($adminRobots, 'noindex')) {
    line('admin noindex', 'warn', 'no X-Robots-Tag on /admin/');
    $warnings[] = 'The admin panel does not send a noindex header. It should never appear in search results.';
} else {
    line('admin noindex', 'ok', $adminResponse['code'] === 200 ? 'noindex header present' : 'HTTP ' . $adminResponse['code']);
}

foreach (['/storage/database.sqlite', '/includes/config.php', '/bin/create-admin.php'] as $private) {
    $response = fetch($base . $private);
    $exposed  = $response['code'] === 200 && strlen($response['body']) > 0;
    line('private: ' . $private, $exposed ? 'BLOCKER' : 'ok', 'HTTP ' . $response['code']);
    if ($exposed) {
        $blockers[] = "{$private} is downloadable over the web. Add the deny rules from README.md immediately.";
    }
}

$compression = (string) header_value($home, 'Content-Encoding');
line('compression', $compression !== '' ? 'ok' : 'warn', $compression !== '' ? $compression : 'none advertised');

/* ---------------------------------------------------------------------------
 * Summary
 * ------------------------------------------------------------------------ */

echo "\n" . str_repeat('=', 62) . "\n";

if ($blockers === [] && $warnings === []) {
    echo "\nNothing found. The site is crawlable and the sitemap is clean.\n\n";
    exit(0);
}

if ($blockers !== []) {
    echo "\n" . count($blockers) . " BLOCKER(S) — fix before submitting to Google:\n\n";
    foreach ($blockers as $i => $blocker) {
        echo '  ' . ($i + 1) . '. ' . $blocker . "\n\n";
    }
}

if ($warnings !== []) {
    echo count($warnings) . " warning(s) — worth fixing, not blocking:\n\n";
    foreach ($warnings as $i => $warning) {
        echo '  ' . ($i + 1) . '. ' . $warning . "\n\n";
    }
}

exit($blockers === [] ? 0 : 1);
