<?php
/**
 * Site-wide configuration, URL detection, and small view helpers.
 *
 * Every page includes this file first. Nothing here prints output, so pages stay
 * free to send headers (redirects, 404 status) before the layout is rendered.
 */

declare(strict_types=1);

/* PHP 8 string helpers, kept here as tiny compatibility shims for local
 * XAMPP installs that still run PHP 7.4. Production on PHP 8+ uses the native
 * implementations. */
if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

if (!function_exists('str_contains')) {
    function str_contains(string $haystack, string $needle): bool
    {
        return $needle === '' || strpos($haystack, $needle) !== false;
    }
}

/* --------------------------------------------------------------------------
 * Brand constants
 * ----------------------------------------------------------------------- */

const SITE_NAME       = 'The Wikipedia Studio';
const SITE_TAGLINE    = 'Professional Wikipedia Editorial Services';
const SITE_EMAIL      = 'hello@thewikipediastudio.com';
const SITE_PHONE      = '+1 (800) 453-7801';
const SITE_PHONE_RAW  = '+18004537801';
const SITE_LOCALE     = 'en_US';
const SITE_LANG       = 'en';
const SITE_TWITTER    = '@wikipediastudio';
const CONTACT_TO      = SITE_EMAIL;

/**
 * Hosts allowed to appear in canonical/OG URLs. Leave empty to accept whatever
 * host the request arrives on (handy on staging). Filling it in blocks Host
 * header injection from poisoning canonical tags on production.
 */
const SITE_ALLOWED_HOSTS = [];

/* --------------------------------------------------------------------------
 * Origin + base path detection
 * ----------------------------------------------------------------------- */

/**
 * Absolute origin (scheme + host) for the current request.
 *
 * Override with a SITE_URL environment variable when the site sits behind a
 * proxy or CDN that rewrites the Host header — e.g. SITE_URL=https://example.com
 */
function ws_detect_origin(): string
{
    $override = getenv('SITE_URL');
    if (is_string($override) && $override !== '') {
        return rtrim($override, '/');
    }

    $https = ($_SERVER['HTTPS'] ?? '') !== '' && strtolower((string) $_SERVER['HTTPS']) !== 'off';
    $forwarded = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    $scheme = ($https || $forwarded === 'https' || (int) ($_SERVER['SERVER_PORT'] ?? 80) === 443)
        ? 'https'
        : 'http';

    $host = (string) ($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost');
    $host = preg_replace('/[^A-Za-z0-9.\-:]/', '', $host) ?: 'localhost';

    if (SITE_ALLOWED_HOSTS !== [] && !in_array($host, SITE_ALLOWED_HOSTS, true)) {
        $host = SITE_ALLOWED_HOSTS[0];
    }

    return $scheme . '://' . $host;
}

/**
 * Sub-directory the site is served from, '' when it lives at the domain root.
 * Detected by comparing the project directory with the document root, so the
 * same code works at https://example.com/ and https://example.com/studio/.
 */
function ws_detect_base_path(): string
{
    $docRoot = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
    $docRoot = $docRoot !== '' ? (realpath($docRoot) ?: '') : '';
    $appRoot = dirname(__DIR__);

    if ($docRoot === '') {
        return '';
    }

    $docRoot = rtrim(str_replace('\\', '/', $docRoot), '/');
    $appRoot = rtrim(str_replace('\\', '/', $appRoot), '/');

    if ($docRoot === $appRoot || !str_starts_with($appRoot, $docRoot . '/')) {
        return '';
    }

    return rtrim(substr($appRoot, strlen($docRoot)), '/');
}

define('SITE_ORIGIN', ws_detect_origin());
define('BASE_PATH', ws_detect_base_path());
define('SITE_URL', SITE_ORIGIN . BASE_PATH);
define('APP_ROOT', dirname(__DIR__));

/* --------------------------------------------------------------------------
 * View helpers
 * ----------------------------------------------------------------------- */

/** Escape a value for HTML output. */
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Root-relative URL for a page slug, always with a trailing slash so every
 * page has exactly one canonical address.
 */
function url(string $slug = ''): string
{
    $slug = trim($slug, '/');

    return $slug === '' ? BASE_PATH . '/' : BASE_PATH . '/' . $slug . '/';
}

/** Absolute URL for a page slug — used for canonical, OG, and sitemap output. */
function abs_url(string $slug = ''): string
{
    return SITE_ORIGIN . url($slug);
}

/**
 * Root-relative URL for a static file, with a cache-busting version stamp taken
 * from the file's modification time.
 */
function asset(string $path, bool $version = false): string
{
    $path = '/' . ltrim($path, '/');
    $url  = BASE_PATH . $path;

    if ($version) {
        $file = APP_ROOT . $path;
        if (is_file($file)) {
            $url .= '?v=' . filemtime($file);
        }
    }

    return $url;
}

/** Absolute URL for a static file — OG and schema images must be absolute. */
function asset_url(string $path): string
{
    return SITE_ORIGIN . asset($path);
}

/** Trim a string to a length that survives search-result truncation intact. */
function meta_trim(string $text, int $limit = 160): string
{
    $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
    if (mb_strlen($text) <= $limit) {
        return $text;
    }

    $cut = mb_substr($text, 0, $limit - 1);
    $lastSpace = mb_strrpos($cut, ' ');

    return rtrim($lastSpace ? mb_substr($cut, 0, $lastSpace) : $cut, " ,.;:") . '…';
}

/** True when $slug is the page currently being rendered, or a parent of it. */
function nav_is_active(string $slug, string $currentSlug): bool
{
    $slug = trim($slug, '/');
    $currentSlug = trim($currentSlug, '/');

    if ($slug === '') {
        return $currentSlug === '';
    }

    return $slug === $currentSlug || str_starts_with($currentSlug, $slug . '/');
}

/* --------------------------------------------------------------------------
 * Primary navigation
 * ----------------------------------------------------------------------- */

/** @return array<int, array{slug: string, label: string}> */
function nav_items(): array
{
    return [
        ['slug' => '',              'label' => 'Home'],
        ['slug' => 'about-us',      'label' => 'About Us'],
        ['slug' => 'services',      'label' => 'Services'],
        ['slug' => 'our-process',   'label' => 'Our Process'],
        ['slug' => 'portfolio',     'label' => 'Portfolio'],
        ['slug' => 'faq',           'label' => 'Resources'],
        ['slug' => 'contact',       'label' => 'Contact'],
    ];
}
