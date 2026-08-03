<?php
/**
 * Database connection and schema.
 *
 * Works on MySQL and SQLite so the same code runs on production hosting and on
 * a laptop with nothing installed. Configure with environment variables:
 *
 *   DB_DRIVER   mysql | sqlite     (default: sqlite)
 *   DB_HOST     MySQL host         (default: 127.0.0.1)
 *   DB_PORT     MySQL port         (default: 3306)
 *   DB_NAME     MySQL database name
 *   DB_USER     MySQL user
 *   DB_PASS     MySQL password
 *   DB_SQLITE   SQLite file path   (default: storage/database.sqlite)
 *
 * On Kinsta and similar hosts, set these in the environment-variable panel
 * rather than committing them.
 */

declare(strict_types=1);

/** Read a configuration value from the environment. */
function db_env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);

    return ($value === false || $value === '') ? $default : $value;
}

/** Absolute path to the SQLite database file. */
function db_sqlite_path(): string
{
    $configured = db_env('DB_SQLITE');
    if ($configured !== null) {
        return $configured;
    }

    return APP_ROOT . '/storage/database.sqlite';
}

/** Which driver is in use for this request. */
function db_driver(): string
{
    return strtolower((string) db_env('DB_DRIVER', 'sqlite'));
}

/**
 * Shared PDO handle. Throws PDOException if the database is unreachable — the
 * public pages catch that and fall back to file-based content.
 */
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    if (db_driver() === 'mysql') {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            db_env('DB_HOST', '127.0.0.1'),
            db_env('DB_PORT', '3306'),
            (string) db_env('DB_NAME', '')
        );
        $pdo = new PDO($dsn, (string) db_env('DB_USER', ''), (string) db_env('DB_PASS', ''), $options);

        return $pdo;
    }

    $path = db_sqlite_path();
    $dir  = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $pdo = new PDO('sqlite:' . $path, null, null, $options);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA foreign_keys = ON');

    return $pdo;
}

/** True when the database is reachable and migrated. */
function db_ready(): bool
{
    static $ready = null;

    if ($ready !== null) {
        return $ready;
    }

    try {
        db()->query('SELECT 1 FROM portfolio_items LIMIT 1');
        $ready = true;
    } catch (Throwable $exception) {
        $ready = false;
    }

    return $ready;
}

/**
 * Create or update the schema. Safe to run repeatedly.
 */
function db_migrate(): array
{
    $pdo    = db();
    $mysql  = db_driver() === 'mysql';
    $log    = [];

    // Portable column fragments: the two engines spell these differently.
    $id        = $mysql ? 'INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $timestamp = $mysql ? 'DATETIME NOT NULL' : 'TEXT NOT NULL';
    $suffix    = $mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS portfolio_items (
            id {$id},
            slug VARCHAR(160) NOT NULL,
            title VARCHAR(160) NOT NULL,
            category VARCHAR(80) NOT NULL DEFAULT '',
            summary VARCHAR(300) NOT NULL DEFAULT '',
            body TEXT NULL,
            external_url VARCHAR(500) NULL,
            image_path VARCHAR(255) NULL,
            image_alt VARCHAR(180) NULL,
            meta_title VARCHAR(120) NULL,
            meta_description VARCHAR(220) NULL,
            keywords VARCHAR(320) NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'draft',
            sort_order INT NOT NULL DEFAULT 0,
            created_at {$timestamp},
            updated_at {$timestamp}
        ){$suffix}
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_users (
            id {$id},
            username VARCHAR(80) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at {$timestamp},
            last_login_at " . ($mysql ? 'DATETIME NULL' : 'TEXT NULL') . "
        ){$suffix}
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_login_attempts (
            id {$id},
            ip VARCHAR(64) NOT NULL,
            attempted_at {$timestamp}
        ){$suffix}
    ");

    // Unique indexes are created separately so the statements work on both
    // engines regardless of whether the table already existed.
    foreach ([
        'CREATE UNIQUE INDEX IF NOT EXISTS portfolio_items_slug ON portfolio_items (slug)',
        'CREATE INDEX IF NOT EXISTS portfolio_items_status ON portfolio_items (status, sort_order)',
        'CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username ON admin_users (username)',
        'CREATE INDEX IF NOT EXISTS admin_login_attempts_ip ON admin_login_attempts (ip, attempted_at)',
    ] as $statement) {
        try {
            $pdo->exec($statement);
        } catch (PDOException $e) {
            // MySQL before 8.0.29 has no IF NOT EXISTS for indexes; a duplicate
            // index error means the index is already there, which is fine.
            if (!str_contains($e->getMessage(), 'Duplicate key name') && !str_contains($e->getMessage(), 'already exists')) {
                throw $e;
            }
        }
    }

    $log[] = 'Schema is up to date (' . db_driver() . ').';

    return $log;
}

/** Current timestamp in the format both engines store happily. */
function db_now(): string
{
    return date('Y-m-d H:i:s');
}
