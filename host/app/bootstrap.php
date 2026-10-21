<?php

declare(strict_types=1);

date_default_timezone_set('UTC');

$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$GLOBALS['base_path'] = ($scriptDir === '/' || $scriptDir === '.') ? '' : rtrim($scriptDir, '/');

if (!is_file(__DIR__ . '/../config.php')) {
    require __DIR__ . '/../views/errors/setup.php';
    exit;
}

$config = require __DIR__ . '/../config.php';
$GLOBALS['config'] = $config;

$cookiePath = $GLOBALS['base_path'] === '' ? '/' : $GLOBALS['base_path'] . '/';
session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 30,
    'path' => $cookiePath,
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_name('gosolo');
session_start();

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

require __DIR__ . '/helpers.php';
require __DIR__ . '/writing.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/copy.php';

try {
    db();
    one('SELECT setting_key FROM settings LIMIT 1');
} catch (Throwable $e) {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if (str_contains($uri, '/api/')) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'error' => ['code' => 'server', 'message' => 'The house could not be opened.'],
        ]);
        exit;
    }
    http_response_code(500);
    require __DIR__ . '/../views/errors/database.php';
    exit;
}

$apiPath = request_path();
if (str_starts_with($apiPath, '/api/')) {
    require __DIR__ . '/api.php';
    api_prepare();
    // Login and refresh set the session inside the request. Calling current_user()
    // before that caches an empty member, so last-seen runs only when a token is already present.
    if (api_bearer() !== '') {
        touch_last_seen();
    }
    api_handle();
    exit;
}

touch_last_seen();
