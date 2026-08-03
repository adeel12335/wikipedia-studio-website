<?php
/**
 * Portfolio data access.
 *
 * Public pages call portfolio_published(), which falls back to the file-based
 * portfolio_items() in data.php when the database is unavailable or empty. That
 * keeps the marketing site working during setup, and if the database ever goes
 * down the portfolio degrades to static content instead of a blank page.
 */

declare(strict_types=1);

const PORTFOLIO_STATUSES = ['draft', 'published'];

/** Turn a title into a URL-safe slug. */
function portfolio_slugify(string $value): string
{
    $value = trim($value);
    // Transliterate what we can, then strip anything that is not URL-safe.
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT', $value);
        if ($converted !== false) {
            $value = $converted;
        }
    }
    $value = strtolower((string) preg_replace('/[^A-Za-z0-9]+/', '-', $value));

    return trim($value, '-') ?: 'item';
}

/** A slug that is not already taken, optionally ignoring one row's own slug. */
function portfolio_unique_slug(string $slug, ?int $ignoreId = null): string
{
    $slug = portfolio_slugify($slug);
    $base = $slug;
    $n    = 2;

    while (true) {
        $sql = 'SELECT id FROM portfolio_items WHERE slug = :slug';
        $params = ['slug' => $slug];
        if ($ignoreId !== null) {
            $sql .= ' AND id <> :id';
            $params['id'] = $ignoreId;
        }
        $statement = db()->prepare($sql . ' LIMIT 1');
        $statement->execute($params);

        if ($statement->fetch() === false) {
            return $slug;
        }

        $slug = $base . '-' . $n;
        $n++;
    }
}

/**
 * Published items for the public site, in display order.
 *
 * @return array<int, array<string, mixed>>
 */
function portfolio_published(): array
{
    if (!db_ready()) {
        return portfolio_fallback_items();
    }

    try {
        $rows = db()
            ->query("SELECT * FROM portfolio_items WHERE status = 'published' ORDER BY sort_order ASC, id ASC")
            ->fetchAll();
    } catch (Throwable $exception) {
        return portfolio_fallback_items();
    }

    return $rows !== [] ? $rows : portfolio_fallback_items();
}

/** One published item by slug, or null. */
function portfolio_find_published(string $slug): ?array
{
    if (!db_ready()) {
        return null;
    }

    $statement = db()->prepare("SELECT * FROM portfolio_items WHERE slug = :slug AND status = 'published' LIMIT 1");
    $statement->execute(['slug' => $slug]);
    $row = $statement->fetch();

    return $row === false ? null : $row;
}

/**
 * Every item including drafts, for the admin list.
 *
 * @return array<int, array<string, mixed>>
 */
function portfolio_all(): array
{
    return db()->query('SELECT * FROM portfolio_items ORDER BY sort_order ASC, id ASC')->fetchAll();
}

/** One item by id, for the admin edit form. */
function portfolio_find(int $id): ?array
{
    $statement = db()->prepare('SELECT * FROM portfolio_items WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();

    return $row === false ? null : $row;
}

/**
 * Insert or update an item. Returns the row id.
 *
 * @param array<string, mixed> $data
 */
function portfolio_save(array $data, ?int $id = null): int
{
    $fields = [
        'slug'             => (string) $data['slug'],
        'title'            => (string) $data['title'],
        'category'         => (string) ($data['category'] ?? ''),
        'summary'          => (string) ($data['summary'] ?? ''),
        'body'             => (string) ($data['body'] ?? ''),
        'external_url'     => ($data['external_url'] ?? '') !== '' ? (string) $data['external_url'] : null,
        'image_path'       => ($data['image_path'] ?? '') !== '' ? (string) $data['image_path'] : null,
        'image_alt'        => ($data['image_alt'] ?? '') !== '' ? (string) $data['image_alt'] : null,
        'meta_title'       => ($data['meta_title'] ?? '') !== '' ? (string) $data['meta_title'] : null,
        'meta_description' => ($data['meta_description'] ?? '') !== '' ? (string) $data['meta_description'] : null,
        'keywords'         => ($data['keywords'] ?? '') !== '' ? (string) $data['keywords'] : null,
        'status'           => in_array($data['status'] ?? 'draft', PORTFOLIO_STATUSES, true) ? (string) $data['status'] : 'draft',
        'sort_order'       => (int) ($data['sort_order'] ?? 0),
        'updated_at'       => db_now(),
    ];

    if ($id === null) {
        $fields['created_at'] = db_now();
        $columns = implode(', ', array_keys($fields));
        $binds   = ':' . implode(', :', array_keys($fields));
        db()->prepare("INSERT INTO portfolio_items ({$columns}) VALUES ({$binds})")->execute($fields);

        return (int) db()->lastInsertId();
    }

    $assignments = implode(', ', array_map(static fn (string $k): string => "{$k} = :{$k}", array_keys($fields)));
    $fields['id'] = $id;
    db()->prepare("UPDATE portfolio_items SET {$assignments} WHERE id = :id")->execute($fields);

    return $id;
}

/** Delete an item and return its stored image path so the file can be removed. */
function portfolio_delete(int $id): ?string
{
    $item = portfolio_find($id);
    if ($item === null) {
        return null;
    }

    db()->prepare('DELETE FROM portfolio_items WHERE id = :id')->execute(['id' => $id]);

    return $item['image_path'] ?? null;
}

/** Toggle published/draft and return the new status. */
function portfolio_toggle_status(int $id): ?string
{
    $item = portfolio_find($id);
    if ($item === null) {
        return null;
    }

    $next = $item['status'] === 'published' ? 'draft' : 'published';
    db()->prepare('UPDATE portfolio_items SET status = :status, updated_at = :now WHERE id = :id')
        ->execute(['status' => $next, 'now' => db_now(), 'id' => $id]);

    return $next;
}

/** Move an item one place up or down in the display order. */
function portfolio_move(int $id, string $direction): void
{
    $items = portfolio_all();
    $ids   = array_column($items, 'id');
    $index = array_search($id, array_map('intval', $ids), true);

    if ($index === false) {
        return;
    }

    $target = $direction === 'up' ? $index - 1 : $index + 1;
    if ($target < 0 || $target >= count($ids)) {
        return;
    }

    [$ids[$index], $ids[$target]] = [$ids[$target], $ids[$index]];

    $statement = db()->prepare('UPDATE portfolio_items SET sort_order = :order WHERE id = :id');
    foreach ($ids as $position => $rowId) {
        $statement->execute(['order' => $position, 'id' => (int) $rowId]);
    }
}

/** The next sort_order value, so new items land at the end of the list. */
function portfolio_next_sort_order(): int
{
    $max = db()->query('SELECT MAX(sort_order) AS max_order FROM portfolio_items')->fetch();

    return (int) ($max['max_order'] ?? 0) + 1;
}

/**
 * File-based items, shaped like database rows.
 *
 * Used before the database is set up, and as a safety net if it becomes
 * unreachable. Slugs are derived so the detail-page links still resolve once
 * the same items have been seeded.
 *
 * @return array<int, array<string, mixed>>
 */
function portfolio_fallback_items(): array
{
    $rows = [];

    foreach (portfolio_items() as $position => $item) {
        $rows[] = [
            'id'               => null,
            'slug'             => portfolio_slugify($item['title']),
            'title'            => $item['title'],
            'category'         => $item['title'],
            'summary'          => $item['copy'],
            'body'             => $item['detail'],
            'external_url'     => null,
            'image_path'       => $item['image'],
            'image_alt'        => $item['alt'],
            'meta_title'       => null,
            'meta_description' => null,
            'keywords'         => null,
            'status'           => 'published',
            'sort_order'       => $position,
            'created_at'       => null,
            'updated_at'       => null,
            'is_fallback'      => true,
        ];
    }

    return $rows;
}

/**
 * Heading for a detail page, with the primary keyword in it.
 *
 * Item titles are short category labels ("Business Leader") or names, so on
 * their own they carry no keyword. "Wikipedia page" is appended unless the title
 * already says it, which keeps admin-written titles from reading twice over.
 *
 * Returns escaped HTML: page_hero() prints the heading unescaped so that authored
 * headings can highlight a word with <span>.
 */
function portfolio_heading(array $work): string
{
    $title = (string) $work['title'];

    if (stripos($title, 'wikipedia') !== false) {
        return e($title);
    }

    return e($title) . ' <span>Wikipedia</span> page';
}

/**
 * Meta description for a detail page.
 *
 * The summary alone is usually 80-100 characters, short enough that search
 * results look truncated and thin. Sentences are appended until the description
 * reaches the 120-character mark; seo_head() trims anything over 160.
 */
function portfolio_meta_description(array $work): string
{
    // Start from the authored description, falling back to the summary. Padding
    // then applies to either: the admin form already enforces 120-160 on anything
    // typed there, so a stored value below that came from a seed or an import.
    $description = trim((string) ($work['meta_description'] ?? ''));

    if ($description === '') {
        $description = trim((string) $work['summary']);
    }

    $additions = [
        'Wikipedia engagement notes from ' . SITE_NAME . '.',
        'Sourcing, scope, and what the coverage would not support.',
    ];

    foreach ($additions as $addition) {
        if (mb_strlen($description) >= 120) {
            break;
        }
        $description = rtrim($description, ' ') . ' ' . $addition;
    }

    return $description;
}

/**
 * Web path for an item's image, whether it came from the seeded assets or from
 * an admin upload.
 */
function portfolio_image_url(?string $path): ?string
{
    if ($path === null || $path === '') {
        return null;
    }

    return asset($path);
}
