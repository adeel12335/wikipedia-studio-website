<?php
/**
 * Router for PHP's built-in development server.
 *
 *   php -S localhost:8000 router-dev.php
 *
 * The built-in server does not read .htaccess, so without this the rewritten
 * URLs (/portfolio/<slug>/, /sitemap.xml, /robots.txt) 404 locally even though
 * they work on Apache. This file only reproduces those rules in development;
 * production serves through .htaccess or the nginx config in README.md.
 */

declare(strict_types=1);

// Only the CLI development server may use this file. If it ever ends up on a
// real web server, it does nothing.
if (PHP_SAPI !== 'cli-server') {
    http_response_code(404);
    exit;
}

$path   = (string) parse_url((string) $_SERVER['REQUEST_URI'], PHP_URL_PATH);
$target = __DIR__ . $path;

// /portfolio/<slug>/ -> portfolio/item.php?slug=<slug>
if (preg_match('#^/portfolio/([A-Za-z0-9-]+)/?$#', $path, $matches) && !is_file($target) && !is_dir($target)) {
    $_GET['slug'] = $matches[1];

    require __DIR__ . '/portfolio/item.php';

    return true;
}

if ($path === '/sitemap.xml') {
    require __DIR__ . '/sitemap.php';

    return true;
}

if ($path === '/robots.txt') {
    require __DIR__ . '/robots.php';

    return true;
}

// Unknown paths get the 404 page, mirroring "ErrorDocument 404 /404.php" so that
// local testing sees the same status codes production returns.
if (!is_file($target) && !is_dir($target)) {
    http_response_code(404);

    require __DIR__ . '/404.php';

    return true;
}

// Anything else: let the built-in server serve it normally.
return false;
