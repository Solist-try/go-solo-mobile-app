<?php

declare(strict_types=1);

require_once __DIR__ . '/site.php';
require_once __DIR__ . '/desk.php';
require_once __DIR__ . '/rooms.php';
require_once __DIR__ . '/talk.php';
require_once __DIR__ . '/life.php';
require_once __DIR__ . '/pin.php';
require_once __DIR__ . '/path.php';

function api_prepare(): void
{
    api_cors();
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
    $token = api_bearer();
    if ($token === '' || !api_tokens_ready()) {
        return;
    }
    $row = one(
        'SELECT user_id FROM api_tokens WHERE token_hash = ? AND kind = ? AND revoked_at IS NULL AND expires_at > NOW()',
        [hash('sha256', $token), 'access']
    );
    if ($row) {
        $_SESSION['user_id'] = (int) $row['user_id'];
    }
}

function api_handle(): void
{
    try {
        api_route();
    } catch (Throwable $e) {
        error_log('Go Solo API: ' . $e->getMessage());
        api_fail(500, 'server', 'That did not finish. The words are still here.');
    }
}

function api_route(): void
{
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    $path = request_path();
    $path = preg_replace('#^/api/v1#', '', $path) ?: '/';
    if ($path === '/') {
        $path = '';
    }

    if ($method === 'GET' && $path === '') {
        api_ok(api_shell());
    }
    if ($method === 'GET' && $path === '/version') {
        api_ok(['service' => 'go-solo', 'api' => 'v1', 'house' => 'php', 'tokens' => api_tokens_ready()]);
    }
    if ($method === 'POST' && $path === '/session') {
        api_login();
    }
    if ($method === 'POST' && $path === '/session/refresh') {
        api_refresh();
    }
    if ($method === 'POST' && $path === '/session/end') {
        api_logout();
    }
    if ($method === 'POST' && $path === '/join') {
        api_join();
    }
    if ($method === 'POST' && $path === '/forgot') {
        api_forgot();
    }
    if ($method === 'POST' && $path === '/password') {
        api_password();
    }
    if ($method === 'POST' && $path === '/account/delete') {
        api_delete();
    }
    if ($method === 'POST' && $path === '/profile') {
        api_profile();
    }
    if ($method === 'POST' && $path === '/communication') {
        api_communication();
    }
    if ($method === 'POST' && $path === '/growing') {
        api_growing();
    }
    if ($method === 'POST' && $path === '/growing/status') {
        api_growing_status();
    }
    if ($method === 'POST' && $path === '/help') {
        api_help();
    }
    if ($method === 'POST' && $path === '/seeds/plant') {
        api_plant();
    }
    if ($method === 'POST' && $path === '/seeds/status') {
        api_planted_status();
    }
    if ($method === 'POST' && $path === '/seeds/support') {
        api_seed_support();
    }
    if ($method === 'POST' && $path === '/waypoints/join') {
        api_waypoint(true);
    }
    if ($method === 'POST' && $path === '/waypoints/leave') {
        api_waypoint(false);
    }
    if ($method === 'POST' && $path === '/media') {
        api_media_create();
    }
    if ($method === 'GET' && preg_match('#^/media/([0-9]+|avatar)$#', $path, $mediaMatch)) {
        api_media_show($mediaMatch[1]);
    }
    if ($method === 'DELETE' && preg_match('#^/media/([0-9]+|avatar)$#', $path, $mediaMatch)) {
        api_media_delete($mediaMatch[1]);
    }
    if ($method === 'POST' && $path === '/media/remove') {
        api_media_delete(api_field('id', 20));
    }
    if ($method === 'GET' && $path === '/readings/note') {
        api_reading_note(false);
    }
    if ($method === 'POST' && $path === '/readings/note') {
        api_reading_note(true);
    }
    if ($method === 'POST' && $path === '/devices') {
        api_device(false);
    }
    if ($method === 'DELETE' && $path === '/devices') {
        api_device(true);
    }
    if ($method === 'POST' && $path === '/devices/remove') {
        api_device(true);
    }
    if ($method === 'POST' && $path === '/campfire') {
        api_campfire();
    }
    if ($method === 'POST' && $path === '/stories') {
        api_story(false);
    }
    if ($method === 'POST' && $path === '/stories/update') {
        api_story(true);
    }
    if ($method === 'POST' && $path === '/comments') {
        api_comment();
    }
    if ($method === 'POST' && $path === '/skills') {
        api_skill();
    }
    if ($method === 'POST' && $path === '/same') {
        api_same();
    }
    if ($method === 'POST' && $path === '/same/consent') {
        api_same_consent();
    }
    if ($method === 'POST' && $path === '/conversations') {
        api_conversation();
    }
    if ($method === 'POST' && $path === '/conversations/message') {
        api_message();
    }
    if ($method === 'POST' && $path === '/conversations/choice') {
        api_conversation_choice();
    }
    if ($method === 'POST' && $path === '/conversations/flag') {
        api_conversation_flag();
    }
    if ($method === 'POST' && $path === '/reports') {
        api_report();
    }
    if ($method === 'POST' && $path === '/blocks') {
        api_block(true);
    }
    if ($method === 'POST' && $path === '/blocks/remove') {
        api_block(false);
    }
    if ($method === 'POST' && $path === '/notices/read') {
        api_notices();
    }
    if ($method === 'POST' && $path === '/pins/hide') {
        api_pin_hide();
    }
    if ($method === 'POST' && $path === '/pins/reveal') {
        api_pin_reveal();
    }
    if ($method === 'POST' && $path === '/steward') {
        api_steward();
    }
    if ($method === 'POST' && $path === '/sessions/keep') {
        api_keep_chair();
    }
    api_fail(404, 'not_found', 'That room is not on this house.');
}

function api_tokens_ready(): bool
{
    static $ready = null;
    if ($ready !== null) {
        return $ready;
    }
    $row = one(
        'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        ['api_tokens']
    );
    $ready = (int) ($row['n'] ?? 0) === 1;
    return $ready;
}

function api_cors(): void
{
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    $site = rtrim((string) ($GLOBALS['config']['site_url'] ?? ''), '/');
    $allowed = $origin !== '' && (
        $origin === $site
        || preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) === 1
    );
    if ($allowed) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Go-Solo-Authorization');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    }
}

function api_bearer(): string
{
    $header = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
        return $matches[1];
    }
    $alternate = (string) ($_SERVER['HTTP_X_GO_SOLO_AUTHORIZATION'] ?? '');
    if (preg_match('/^[a-f0-9]{64}$/', $alternate) === 1) {
        return $alternate;
    }
    return '';
}

function api_input(): array
{
    static $body = null;
    if ($body !== null) {
        return $body;
    }
    $raw = file_get_contents('php://input') ?: '';
    $decoded = json_decode($raw, true);
    $body = is_array($decoded) ? $decoded : [];
    return $body;
}

function api_text(string $key, int $max = 5000): string
{
    return api_field($key, $max);
}

function api_field(string $key, int $max = 5000): string
{
    $value = $_POST[$key] ?? null;
    if ($value === null) {
        $value = api_input()[$key] ?? '';
    }
    if (is_int($value) || is_float($value)) {
        $value = (string) $value;
    }
    if (!is_string($value)) {
        return '';
    }
    return clip(trim($value), $max);
}

function api_ok(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function api_fail(int $status, string $code, string $message): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode(['ok' => false, 'error' => ['code' => $code, 'message' => $message]], JSON_UNESCAPED_UNICODE);
    exit;
}

function api_member(): array
{
    $user = current_user();
    if (!$user) {
        api_fail(401, 'unauthorized', 'Sign in to continue.');
    }
    return $user;
}

function api_time(?string $value): string
{
    if (!$value) {
        return '';
    }
    $stamp = strtotime($value);
    return $stamp ? gmdate('c', $stamp) : '';
}

function api_public_media(string $path): string
{
    $path = trim($path);
    if ($path === '') {
        return '';
    }
    if (preg_match('#^https?://#', $path)) {
        return $path;
    }
    return absolute_url('/' . ltrim($path, '/'));
}

function api_issue(int $userId): array
{
    if (!api_tokens_ready()) {
        api_fail(503, 'unavailable', 'The mobile doorway is not on this house yet.');
    }
    $family = bin2hex(random_bytes(16));
    $access = bin2hex(random_bytes(32));
    $refresh = bin2hex(random_bytes(32));
    exec_sql(
        'INSERT INTO api_tokens (user_id, token_hash, kind, family, expires_at, created_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())',
        [$userId, hash('sha256', $access), 'access', $family]
    );
    exec_sql(
        'INSERT INTO api_tokens (user_id, token_hash, kind, family, expires_at, created_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())',
        [$userId, hash('sha256', $refresh), 'refresh', $family]
    );
    $_SESSION['user_id'] = $userId;
    return ['access' => $access, 'refresh' => $refresh, 'expiresIn' => 900];
}

function api_login(): void
{
    $email = strtolower(api_text('email', 190));
    $password = (string) (api_input()['password'] ?? '');
    if (!api_tokens_ready()) {
        api_fail(503, 'unavailable', 'The mobile doorway is not on this house yet.');
    }
    $recent = count_of(
        'SELECT COUNT(*) AS n FROM api_attempts WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)',
        [$email]
    );
    if ($recent >= 8) {
        api_fail(429, 'rate_limited', 'Too many tries. Wait a little, then try again.');
    }
    $row = one('SELECT id, password_hash, status FROM users WHERE email = ?', [$email]);
    if (!$row || !password_verify($password, (string) $row['password_hash'])) {
        exec_sql('INSERT INTO api_attempts (email, created_at) VALUES (?, NOW())', [$email]);
        api_fail(401, 'unauthorized', 'That email and password do not match.');
    }
    if ($row['status'] === 'suspended') {
        api_fail(403, 'forbidden', 'This account is resting. Write through Contact if that is a surprise.');
    }
    if ($row['status'] === 'banned') {
        api_fail(403, 'forbidden', 'This account is closed.');
    }
    exec_sql('UPDATE users SET last_seen_at = NOW() WHERE id = ?', [(int) $row['id']]);
    $tokens = api_issue((int) $row['id']);
    api_ok($tokens + ['shell' => api_shell()]);
}

function api_refresh(): void
{
    if (!api_tokens_ready()) {
        api_fail(503, 'unavailable', 'The mobile doorway is not on this house yet.');
    }
    $refresh = (string) (api_input()['refresh'] ?? '');
    $row = one(
        'SELECT id, user_id, family, revoked_at, expires_at FROM api_tokens WHERE token_hash = ? AND kind = ?',
        [hash('sha256', $refresh), 'refresh']
    );
    if (!$row) {
        api_fail(401, 'unauthorized', 'Sign in to continue.');
    }
    if ($row['revoked_at'] !== null || strtotime((string) $row['expires_at']) < time()) {
        exec_sql('UPDATE api_tokens SET revoked_at = NOW() WHERE family = ? AND revoked_at IS NULL', [(string) $row['family']]);
        api_fail(401, 'unauthorized', 'Sign in to continue.');
    }
    $user = one('SELECT id, status FROM users WHERE id = ?', [(int) $row['user_id']]);
    if (!$user || $user['status'] !== 'active') {
        api_fail(403, 'forbidden', 'This account is closed.');
    }
    exec_sql('UPDATE api_tokens SET revoked_at = NOW() WHERE family = ? AND revoked_at IS NULL', [(string) $row['family']]);
    $tokens = api_issue((int) $user['id']);
    api_ok($tokens + ['shell' => api_shell()]);
}

function api_logout(): void
{
    api_member();
    $refresh = (string) (api_input()['refresh'] ?? '');
    if ($refresh !== '' && api_tokens_ready()) {
        $row = one('SELECT family FROM api_tokens WHERE token_hash = ?', [hash('sha256', $refresh)]);
        if ($row) {
            exec_sql('UPDATE api_tokens SET revoked_at = NOW() WHERE family = ? AND revoked_at IS NULL', [(string) $row['family']]);
        }
    }
    $_SESSION = [];
    api_ok(api_shell_public());
}

function api_join(): void
{
    if (current_user()) {
        api_ok(api_shell());
    }
    $name = clip(api_text('name', 80), 80);
    $email = strtolower(api_text('email', 190));
    $password = (string) (api_input()['password'] ?? '');
    if ($name === '' || !valid_email($email)) {
        api_fail(422, 'validation', 'A name and a real email are enough to begin.');
    }
    if (strlen($password) < 8) {
        api_fail(422, 'validation', 'Use at least 8 characters.');
    }
    if (one('SELECT id FROM users WHERE email = ?', [$email])) {
        api_fail(409, 'conflict', 'That email already has a chair here. Try logging in.');
    }
    $db = db();
    try {
        $db->beginTransaction();
        exec_sql(
            'INSERT INTO users (email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, NOW())',
            [$email, password_hash($password, PASSWORD_DEFAULT), 'member', 'active']
        );
        $id = (int) $db->lastInsertId();
        if (conversations_ready()) {
            exec_sql(
                'INSERT INTO profiles (user_id, display_name, bio, location, avatar_path, contact_frequency, check_in_style, show_location, conversations_pref, conversations_choice_made) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 0)',
                [$id, $name, '', '', '', '', '', 'context']
            );
        } else {
            exec_sql(
                'INSERT INTO profiles (user_id, display_name, bio, location, avatar_path, contact_frequency, check_in_style, show_location) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                [$id, $name, '', '', '', '', '']
            );
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        api_fail(500, 'server', 'That did not save. Try again in a moment.');
    }
    log_activity($id, 'Joined Go Solo');
    $tokens = api_issue($id);
    api_ok($tokens + ['shell' => api_shell()]);
}

function api_forgot(): void
{
    $email = strtolower(api_text('email', 190));
    if (valid_email($email)) {
        send_reset($email);
    }
    api_ok(['sent' => true]);
}

function api_password(): void
{
    $user = api_member();
    $current = (string) (api_input()['current'] ?? '');
    $next = (string) (api_input()['next'] ?? '');
    $row = one('SELECT password_hash FROM users WHERE id = ?', [(int) $user['id']]);
    if (!$row || !password_verify($current, (string) $row['password_hash'])) {
        api_fail(422, 'validation', 'The current password does not match.');
    }
    if (strlen($next) < 8) {
        api_fail(422, 'validation', 'Use at least 8 characters.');
    }
    exec_sql('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($next, PASSWORD_DEFAULT), (int) $user['id']]);
    api_ok(null);
}

function api_delete(): void
{
    $user = api_member();
    $confirm = api_text('confirm', 80);
    if ($confirm !== 'DELETE') {
        api_fail(422, 'validation', 'Type DELETE to close the account.');
    }
    if ($user['role'] === 'admin') {
        $others = count_of("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND id <> ?", [(int) $user['id']]);
        if ($others < 1) {
            api_fail(403, 'forbidden', 'The house still needs one steward.');
        }
    }
    if (api_tokens_ready()) {
        exec_sql('UPDATE api_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [(int) $user['id']]);
    }
    exec_sql('DELETE FROM users WHERE id = ?', [(int) $user['id']]);
    $_SESSION = [];
    api_ok(api_shell_public());
}

function api_profile(): void
{
    $user = api_member();
    $input = api_input();
    $profile = one('SELECT * FROM profiles WHERE user_id = ?', [(int) $user['id']]) ?: [];
    $name = array_key_exists('displayName', $input) ? api_text('displayName', 80) : (string) ($profile['display_name'] ?? '');
    if ($name === '') {
        $name = (string) ($user['display_name'] ?? '');
    }
    $bio = array_key_exists('bio', $input) ? sanitize_writing(api_text('bio', 5000)) : (string) ($profile['bio'] ?? '');
    $location = array_key_exists('location', $input) ? api_text('location', 120) : (string) ($profile['location'] ?? '');
    $show = array_key_exists('showLocation', $input) ? (!empty($input['showLocation']) ? 1 : 0) : (int) ($profile['show_location'] ?? 1);
    $frequency = array_key_exists('checkInFrequency', $input) ? api_text('checkInFrequency', 40) : (string) ($profile['contact_frequency'] ?? '');
    $style = array_key_exists('checkInStyle', $input) ? api_text('checkInStyle', 40) : (string) ($profile['check_in_style'] ?? '');
    exec_sql(
        'UPDATE profiles SET display_name = ?, bio = ?, location = ?, show_location = ?, contact_frequency = ?, check_in_style = ? WHERE user_id = ?',
        [$name, $bio, $location, $show, $frequency, $style, (int) $user['id']]
    );
    api_ok(api_shell());
}

function api_communication(): void
{
    $user = api_member();
    if (!conversations_ready()) {
        api_fail(503, 'unavailable', 'Communication choices are not on this house yet.');
    }
    $pref = api_text('preference', 20);
    $map = ['anyone' => 'anyone', 'contextual' => 'context', 'context' => 'context', 'none' => 'none'];
    if (!isset($map[$pref])) {
        api_fail(422, 'validation', 'Choose how people may reach you. Nothing is selected for you.');
    }
    exec_sql(
        'UPDATE profiles SET conversations_pref = ?, conversations_choice_made = 1 WHERE user_id = ?',
        [$map[$pref], (int) $user['id']]
    );
    api_ok(api_shell());
}

function api_growing(): void
{
    $user = api_member();
    $seeds = api_input()['seeds'] ?? [];
    if (!is_array($seeds)) {
        $seeds = [];
    }
    $db = db();
    $db->beginTransaction();
    try {
        exec_sql('DELETE FROM growing_seeds WHERE user_id = ?', [(int) $user['id']]);
        foreach ($seeds as $seed) {
            if (!is_array($seed)) {
                continue;
            }
            $title = clip(trim((string) ($seed['name'] ?? '')), 120);
            if ($title === '') {
                continue;
            }
            $status = (string) ($seed['status'] ?? 'active');
            if ($status === 'completed' || $status === 'grown') {
                $status = 'grown';
            } elseif ($status === 'archived') {
                $status = 'archived';
            } elseif ($status === 'resting') {
                $status = 'resting';
            } else {
                $status = 'active';
            }
            $support = !empty($seed['lookingForSupport']) ? 1 : 0;
            exec_sql(
                'INSERT INTO growing_seeds (user_id, title, status, looking_for_support, created_at) VALUES (?, ?, ?, ?, NOW())',
                [(int) $user['id'], $title, $status, $support]
            );
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        api_fail(500, 'server', 'Those seeds could not be saved.');
    }
    api_ok(api_shell());
}

function api_growing_status(): void
{
    $user = api_member();
    $id = (int) api_text('id', 20);
    $status = api_text('status', 20);
    $note = api_text('note', 2000);
    $map = ['active' => 'active', 'resting' => 'resting', 'grown' => 'grown', 'completed' => 'grown', 'archived' => 'archived'];
    if ($status === '' && $note !== '' && table_has_column('growing_seeds', 'reflection')) {
        exec_sql(
            'UPDATE growing_seeds SET reflection = ?, status_at = NOW(), status_by = ? WHERE id = ? AND user_id = ?',
            [$note, (int) $user['id'], $id, (int) $user['id']]
        );
        api_ok(api_shell());
    }
    if (!isset($map[$status])) {
        api_fail(422, 'validation', 'That status is not used here.');
    }
    if ($note !== '' && table_has_column('growing_seeds', 'reflection')) {
        exec_sql(
            'UPDATE growing_seeds SET status = ?, reflection = ?, status_at = NOW(), status_by = ? WHERE id = ? AND user_id = ?',
            [$map[$status], $note, (int) $user['id'], $id, (int) $user['id']]
        );
    } else {
        exec_sql(
            'UPDATE growing_seeds SET status = ? WHERE id = ? AND user_id = ?',
            [$map[$status], $id, (int) $user['id']]
        );
    }
    api_ok(api_shell());
}

function api_help(): void
{
    $user = api_member();
    $kind = api_text('kind', 20);
    $table = $kind === 'plant' ? 'help_offers' : 'help_requests';
    $titles = api_input()['titles'] ?? [];
    if (!is_array($titles)) {
        $titles = [];
    }
    replace_titles($table, (int) $user['id'], array_map(static fn ($title): string => (string) $title, $titles));
    api_ok(api_shell());
}

function api_plant(): void
{
    $user = api_member();
    $seedId = (int) api_text('seedId', 20);
    $seed = one('SELECT id FROM seeds WHERE id = ? AND archived = 0', [$seedId]);
    if (!$seed) {
        api_fail(404, 'not_found', 'That seed is not on the shelf.');
    }
    $goal = api_text('goal', 2000);
    if (table_has_column('planted_seeds', 'goal')) {
        exec_sql(
            'INSERT INTO planted_seeds (user_id, seed_id, goal, created_at) VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE goal = IF(VALUES(goal) = \'\', goal, VALUES(goal))',
            [(int) $user['id'], $seedId, $goal]
        );
    } else {
        exec_sql(
            'INSERT IGNORE INTO planted_seeds (user_id, seed_id, created_at) VALUES (?, ?, NOW())',
            [(int) $user['id'], $seedId]
        );
    }
    api_ok(api_shell());
}

function api_planted_pair(): array
{
    $raw = api_text('id', 40);
    if (preg_match('/^planted-(\d+)-(\d+)$/', $raw, $matches) === 1) {
        return [(int) $matches[1], (int) $matches[2]];
    }
    $seedId = (int) (api_text('seedId', 20) !== '' ? api_text('seedId', 20) : $raw);
    return [0, $seedId];
}

function api_planted_status(): void
{
    $user = api_member();
    if (!table_has_column('planted_seeds', 'status')) {
        api_fail(503, 'unavailable', 'Seed status is not on this house yet.');
    }
    [$owner, $seedId] = api_planted_pair();
    $mine = (int) $user['id'];
    if ($owner > 0 && $owner !== $mine) {
        api_fail(403, 'forbidden', 'That seed is not yours.');
    }
    $row = one('SELECT user_id, seed_id FROM planted_seeds WHERE user_id = ? AND seed_id = ?', [$mine, $seedId]);
    if (!$row) {
        api_fail(404, 'not_found', 'That seed is not yours.');
    }
    $status = api_text('status', 20);
    $note = api_text('note', 2000);
    $map = ['active' => 'active', 'resting' => 'resting', 'completed' => 'completed', 'grown' => 'completed'];
    if ($status !== '' && !isset($map[$status])) {
        api_fail(422, 'validation', 'That status is not used here.');
    }
    if ($status === '' && $note === '') {
        api_fail(422, 'validation', 'Write a few words, or leave it for later.');
    }
    if ($status !== '') {
        exec_sql('UPDATE planted_seeds SET status = ? WHERE user_id = ? AND seed_id = ?', [$map[$status], $mine, $seedId]);
    }
    if ($note !== '' && table_has_column('planted_seeds', 'reflection')) {
        $existing = one('SELECT reflection FROM planted_seeds WHERE user_id = ? AND seed_id = ?', [$mine, $seedId]);
        $prior = trim((string) ($existing['reflection'] ?? ''));
        $next = $prior === '' ? $note : $prior . "\n\n" . $note;
        exec_sql('UPDATE planted_seeds SET reflection = ? WHERE user_id = ? AND seed_id = ?', [$next, $mine, $seedId]);
    }
    api_ok(api_shell());
}

function api_seed_support(): void
{
    $user = api_member();
    $id = (int) api_text('id', 20);
    $note = api_text('note', 2000);
    $seed = one('SELECT * FROM growing_seeds WHERE id = ?', [$id]);
    if (!$seed || (string) $seed['status'] !== 'active' || (int) $seed['looking_for_support'] !== 1) {
        api_fail(403, 'forbidden', 'This seed is not taking new support.');
    }
    if ((int) $seed['user_id'] === (int) $user['id']) {
        api_fail(403, 'forbidden', 'This seed is already yours.');
    }
    if (!conversations_ready()) {
        api_fail(503, 'unavailable', 'A support note needs conversations, and that room is not open yet.');
    }
    $subject = talk_subject('seed', 'growing', $id, (int) $user['id'], 0);
    if (!$subject) {
        api_fail(403, 'forbidden', 'A private conversation is not available right now.');
    }
    talk_create('seed', 'growing', $id, (string) $subject['label'], (string) $subject['note'], (int) $user['id'], (int) $subject['other'], $note);
    api_ok(api_shell());
}

function api_waypoint(bool $join): void
{
    $user = api_member();
    $id = (int) api_text('id', 20);
    $slug = api_text('slug', 80);
    $waypoint = $id > 0
        ? one('SELECT id FROM waypoints WHERE id = ? AND archived = 0', [$id])
        : one('SELECT id FROM waypoints WHERE slug = ? AND archived = 0', [$slug]);
    if (!$waypoint) {
        api_fail(404, 'not_found', 'That waypoint is not here.');
    }
    if ($join) {
        exec_sql(
            'INSERT IGNORE INTO waypoint_members (waypoint_id, user_id, created_at) VALUES (?, ?, NOW())',
            [(int) $waypoint['id'], (int) $user['id']]
        );
    } else {
        exec_sql('DELETE FROM waypoint_members WHERE waypoint_id = ? AND user_id = ?', [(int) $waypoint['id'], (int) $user['id']]);
    }
    api_ok(api_shell());
}

function api_reject_loose_image(): void
{
    $url = api_field('imageUrl', 500);
    if ($url === '') {
        return;
    }
    api_fail(422, 'validation', 'Send the photo as a file. A path from the phone is not kept.');
}

function api_media_pace(int $userId): void
{
    $key = 'media:' . $userId;
    $row = one(
        'SELECT COUNT(*) AS n FROM api_attempts WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)',
        [$key]
    );
    if ((int) ($row['n'] ?? 0) >= 20) {
        error_log('Go Solo API: media rate limited');
        api_fail(429, 'rate_limited', 'That is a lot of photos. Wait a little, then try again.');
    }
    exec_sql('INSERT INTO api_attempts (email, created_at) VALUES (?, NOW())', [$key]);
}

function api_upload_guard(string $field): ?string
{
    if (empty($_FILES[$field]) || !is_array($_FILES[$field])) {
        return 'Choose a photo first.';
    }
    $error = (int) ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error === UPLOAD_ERR_NO_FILE) {
        return 'Choose a photo first.';
    }
    if (function_exists('upload_problem')) {
        $problem = upload_problem($field);
        if ($problem) {
            return $problem;
        }
    }
    $info = @getimagesize((string) $_FILES[$field]['tmp_name']);
    if ($info === false) {
        return 'That file is not a photo this house can keep.';
    }
    $width = (int) $info[0];
    $height = (int) $info[1];
    if ($width < 1 || $height < 1 || $width > 8000 || $height > 8000 || ($width * $height) > 24000000) {
        return 'That photo is larger than this house can take.';
    }
    $name = (string) ($_FILES[$field]['name'] ?? '');
    if (preg_match('/\.(php|phtml|phar|cgi|pl|exe|sh)(\.|$)/i', $name)) {
        return 'That file is not a photo this house can keep.';
    }
    return null;
}

function api_unlink_upload(string $path): void
{
    if (preg_match('#^/uploads/(avatars|covers)/[A-Fa-f0-9]{16}\.(jpg|png|webp|gif)$#', $path) !== 1) {
        return;
    }
    $root = realpath(dirname(__DIR__) . '/uploads');
    $file = realpath(dirname(__DIR__) . $path);
    if (!$root || !$file || !is_file($file)) {
        return;
    }
    $prefix = $root . DIRECTORY_SEPARATOR;
    if (!str_starts_with($file, $prefix)) {
        return;
    }
    unlink($file);
}

function api_sweep_pending(int $userId): void
{
    $rows = q(
        'SELECT id, path FROM content_images WHERE user_id = ? AND parent_id = 0 AND created_at < DATE_SUB(NOW(), INTERVAL 2 DAY) LIMIT 8',
        [$userId]
    );
    foreach ($rows as $row) {
        exec_sql('DELETE FROM content_images WHERE id = ? AND user_id = ? AND parent_id = 0', [(int) $row['id'], $userId]);
        api_unlink_upload((string) $row['path']);
    }
}

function api_quiet_image(string $webPath): void
{
    if (preg_match('#^/uploads/(avatars|covers)/[A-Fa-f0-9]{16}\.(jpg|png|webp)$#', $webPath, $match) !== 1) {
        return;
    }
    if (!function_exists('imagecreatetruecolor')) {
        error_log('Go Solo API: image kept without re-encode');
        return;
    }
    $ext = $match[2];
    $full = dirname(__DIR__) . $webPath;
    if (!is_file($full)) {
        return;
    }
    $orientation = 1;
    if ($ext === 'jpg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($full);
        if (is_array($exif)) {
            $orientation = (int) ($exif['Orientation'] ?? 1);
        }
    }
    $source = match ($ext) {
        'jpg' => @imagecreatefromjpeg($full),
        'png' => @imagecreatefrompng($full),
        'webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($full) : false,
        default => false,
    };
    if (!$source) {
        error_log('Go Solo API: image kept without re-encode');
        return;
    }
    if (in_array($orientation, [3, 6, 8], true) && function_exists('imagerotate')) {
        $angle = $orientation === 3 ? 180 : ($orientation === 6 ? -90 : 90);
        $turned = @imagerotate($source, $angle, 0);
        if ($turned) {
            imagedestroy($source);
            $source = $turned;
        }
    }
    $width = imagesx($source);
    $height = imagesy($source);
    $max = 2000;
    $image = $source;
    if ($width > $max || $height > $max) {
        $scale = $max / max($width, $height);
        $nextWidth = max(1, (int) round($width * $scale));
        $nextHeight = max(1, (int) round($height * $scale));
        $resized = imagecreatetruecolor($nextWidth, $nextHeight);
        if ($ext !== 'jpg') {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
        }
        imagecopyresampled($resized, $source, 0, 0, 0, 0, $nextWidth, $nextHeight, $width, $height);
        imagedestroy($source);
        $image = $resized;
    }
    $temporary = $full . '.tmp';
    $saved = match ($ext) {
        'jpg' => imagejpeg($image, $temporary, 82),
        'png' => imagepng($image, $temporary),
        'webp' => function_exists('imagewebp') ? imagewebp($image, $temporary, 82) : false,
        default => false,
    };
    imagedestroy($image);
    if ($saved && is_file($temporary)) {
        rename($temporary, $full);
        return;
    }
    if (is_file($temporary)) {
        unlink($temporary);
    }
    error_log('Go Solo API: image kept without re-encode');
}

function api_safe_media(string $path): string
{
    $path = trim($path);
    if ($path === '' || str_contains($path, '..')) {
        return '';
    }
    if (preg_match('#^/(uploads/(avatars|covers|reading)|assets/images)/[A-Za-z0-9._/-]+$#', $path) !== 1) {
        return '';
    }
    return api_public_media($path);
}

function api_media_payload(string $id, string $path, string $alt, string $context): array
{
    return [
        'id' => $id,
        'url' => api_safe_media($path),
        'alt' => $alt,
        'context' => $context,
    ];
}

function api_media_create(): void
{
    $user = api_member();
    $userId = (int) $user['id'];
    api_media_pace($userId);
    $context = api_field('context', 20);
    if (!in_array($context, ['campfire', 'story', 'waypoint', 'comment', 'profile'], true)) {
        error_log('Go Solo API: media rejected, context');
        api_fail(422, 'validation', 'That photo does not belong to this room.');
    }
    $problem = api_upload_guard('file');
    if ($problem) {
        error_log('Go Solo API: media rejected, file');
        api_fail(422, 'validation', $problem);
    }
    if (!function_exists('store_upload')) {
        api_fail(503, 'unavailable', 'The house cannot store a photo yet.');
    }
    api_sweep_pending($userId);
    $path = store_upload('file', $context === 'profile' ? 'avatars' : 'covers');
    if ($path === null) {
        error_log('Go Solo API: media store failed');
        api_fail(422, 'validation', 'That photo did not land. Try again.');
    }
    api_quiet_image($path);
    $alt = clip(api_field('alt', 255), 255);
    if ($context === 'profile') {
        $previous = one('SELECT avatar_path FROM profiles WHERE user_id = ?', [$userId]);
        exec_sql('UPDATE profiles SET avatar_path = ? WHERE user_id = ?', [$path, $userId]);
        if ($previous && (string) $previous['avatar_path'] !== $path) {
            api_unlink_upload((string) $previous['avatar_path']);
        }
        api_ok(['media' => api_media_payload('avatar', $path, '', 'profile')]);
    }
    exec_sql(
        'INSERT INTO content_images (user_id, parent_type, parent_id, path, alt, created_at) VALUES (?, ?, 0, ?, ?, NOW())',
        [$userId, $context, $path, $alt]
    );
    api_ok(['media' => api_media_payload((string) db()->lastInsertId(), $path, $alt, $context)]);
}

function api_image_visible(string $type, int $parentId, int $viewer): bool
{
    if ($type === 'comment') {
        $comment = one('SELECT user_id, hidden FROM comments WHERE id = ?', [$parentId]);
        return $comment && ((int) $comment['hidden'] === 0 || (int) $comment['user_id'] === $viewer);
    }
    $table = match ($type) {
        'story' => 'stories',
        'campfire' => 'campfire_posts',
        'waypoint' => 'waypoint_posts',
        default => '',
    };
    if ($table === '') {
        return false;
    }
    $row = one("SELECT user_id, hidden FROM {$table} WHERE id = ?", [$parentId]);
    return $row && ((int) $row['hidden'] === 0 || (int) $row['user_id'] === $viewer);
}

function api_media_show(string $id): void
{
    $user = api_member();
    $userId = (int) $user['id'];
    if ($id === 'avatar') {
        $row = one('SELECT avatar_path FROM profiles WHERE user_id = ?', [$userId]);
        $path = (string) ($row['avatar_path'] ?? '');
        if ($path === '') {
            api_fail(404, 'not_found', 'There is no profile photo.');
        }
        api_ok(['media' => api_media_payload('avatar', $path, '', 'profile')]);
    }
    $row = one('SELECT id, user_id, parent_type, parent_id, path, alt FROM content_images WHERE id = ?', [(int) $id]);
    if (!$row) {
        api_fail(404, 'not_found', 'That photo is not here.');
    }
    $owner = (int) $row['user_id'] === $userId;
    $attached = (int) $row['parent_id'] > 0;
    if (!$owner && (!$attached || !api_image_visible((string) $row['parent_type'], (int) $row['parent_id'], $userId))) {
        api_fail(404, 'not_found', 'That photo is not here.');
    }
    api_ok(['media' => api_media_payload((string) $row['id'], (string) $row['path'], (string) $row['alt'], (string) $row['parent_type'])]);
}

function api_media_delete(string $id): void
{
    $user = api_member();
    $userId = (int) $user['id'];
    if ($id === 'avatar') {
        $row = one('SELECT avatar_path FROM profiles WHERE user_id = ?', [$userId]);
        exec_sql('UPDATE profiles SET avatar_path = ? WHERE user_id = ?', ['', $userId]);
        api_unlink_upload((string) ($row['avatar_path'] ?? ''));
        api_ok(['removed' => true]);
    }
    $row = one('SELECT id, path, user_id FROM content_images WHERE id = ?', [(int) $id]);
    if (!$row || (int) $row['user_id'] !== $userId) {
        api_fail(404, 'not_found', 'That photo is not yours.');
    }
    exec_sql('DELETE FROM content_images WHERE id = ? AND user_id = ?', [(int) $id, $userId]);
    api_unlink_upload((string) $row['path']);
    api_ok(['removed' => true]);
}

function api_claim_media(int $userId, int $mediaId, string $type, int $parentId, string $alt): string
{
    if ($mediaId <= 0) {
        return '';
    }
    if (!in_array($type, ['story', 'campfire', 'waypoint', 'comment'], true) || $parentId <= 0) {
        return 'That photo cannot be attached here.';
    }
    $row = one('SELECT id, user_id, parent_type, parent_id, path FROM content_images WHERE id = ?', [$mediaId]);
    if (!$row || (int) $row['user_id'] !== $userId) {
        return 'That photo is not yours.';
    }
    if ((string) $row['parent_type'] !== $type || (int) $row['parent_id'] !== 0) {
        return 'Choose the photo again, then share.';
    }
    if (preg_match('#^/uploads/covers/[A-Fa-f0-9]{16}\.(jpg|png|webp|gif)$#', (string) $row['path']) !== 1) {
        return 'That photo is not in the house folder.';
    }
    exec_sql(
        'UPDATE content_images SET parent_id = ?, alt = ? WHERE id = ? AND user_id = ? AND parent_id = 0',
        [$parentId, clip($alt, 255), $mediaId, $userId]
    );
    return '';
}

function api_stage_image(int $userId, string $type, int $parentId, array &$doomed): string
{
    $mediaId = (int) api_field('mediaId', 20);
    $clear = in_array(strtolower(api_field('clearImage', 10)), ['1', 'true'], true);
    $alt = api_field('imageAlt', 255);
    $doomed = [];
    if ($clear || $mediaId > 0) {
        $doomed = array_column(
            q('SELECT path FROM content_images WHERE parent_type = ? AND parent_id = ?', [$type, $parentId]),
            'path'
        );
        exec_sql('DELETE FROM content_images WHERE parent_type = ? AND parent_id = ?', [$type, $parentId]);
    }
    if ($mediaId > 0) {
        return api_claim_media($userId, $mediaId, $type, $parentId, $alt);
    }
    if (!$clear) {
        $current = one('SELECT id FROM content_images WHERE parent_type = ? AND parent_id = ? ORDER BY id LIMIT 1', [$type, $parentId]);
        if ($current) {
            exec_sql('UPDATE content_images SET alt = ? WHERE id = ?', [clip($alt, 255), (int) $current['id']]);
        }
    }
    return '';
}

function api_attached_image(string $type, int $id): array
{
    if ($id <= 0) {
        return ['url' => '', 'alt' => ''];
    }
    try {
        $row = one(
            'SELECT path, alt FROM content_images WHERE parent_type = ? AND parent_id = ? ORDER BY id LIMIT 1',
            [$type, $id]
        );
    } catch (Throwable $e) {
        return ['url' => '', 'alt' => ''];
    }
    if (!$row) {
        return ['url' => '', 'alt' => ''];
    }
    return [
        'url' => api_safe_media((string) $row['path']),
        'alt' => (string) $row['alt'],
    ];
}

function api_reading_note(bool $save): void
{
    $user = api_member();
    if (!function_exists('path_table') || !path_table('reading_notes')) {
        api_fail(503, 'unavailable', 'The reading notebook is not on this house yet.');
    }
    $slug = api_field('slug', 120);
    if ($slug === '') {
        $slug = clip(trim((string) ($_GET['slug'] ?? '')), 120);
    }
    if (preg_match('/^[a-z0-9-]{1,120}$/', $slug) !== 1) {
        api_fail(422, 'validation', 'That reading is not here.');
    }
    $reading = one('SELECT id FROM readings WHERE slug = ? AND status = ?', [$slug, 'published']);
    if (!$reading) {
        api_fail(404, 'not_found', 'That reading is not here.');
    }
    $readingId = (int) $reading['id'];
    $userId = (int) $user['id'];
    if (!$save) {
        $row = one('SELECT body FROM reading_notes WHERE user_id = ? AND reading_id = ?', [$userId, $readingId]);
        api_ok(['body' => (string) ($row['body'] ?? '')]);
    }
    $body = trim(api_field('body', 4000));
    if ($body === '') {
        exec_sql('DELETE FROM reading_notes WHERE user_id = ? AND reading_id = ?', [$userId, $readingId]);
        api_ok(['body' => '']);
    }
    exec_sql(
        'INSERT INTO reading_notes (user_id, reading_id, body, updated_at) VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE body = VALUES(body), updated_at = NOW()',
        [$userId, $readingId, $body]
    );
    api_ok(['body' => $body]);
}

function api_device(bool $remove): void
{
    $user = api_member();
    if (!function_exists('path_table') || !path_table('push_devices')) {
        api_fail(503, 'unavailable', 'This house cannot remember a phone for alerts yet.');
    }
    $token = api_field('token', 255);
    $platform = api_field('platform', 20);
    if (!in_array($platform, ['ios', 'android'], true) || preg_match('/^[A-Za-z0-9:_\\-\\.\\[\\]]{16,255}$/', $token) !== 1) {
        api_fail(422, 'validation', 'That phone registration is not usable.');
    }
    $userId = (int) $user['id'];
    if ($remove) {
        exec_sql('UPDATE push_devices SET revoked_at = NOW() WHERE user_id = ? AND token = ? AND revoked_at IS NULL', [$userId, $token]);
        api_ok(['registered' => false]);
    }
    $key = 'device:' . $userId;
    $count = one(
        'SELECT COUNT(*) AS n FROM api_attempts WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)',
        [$key]
    );
    if ((int) ($count['n'] ?? 0) >= 10) {
        api_fail(429, 'rate_limited', 'That is a little fast. Wait a moment, then try again.');
    }
    exec_sql('INSERT INTO api_attempts (email, created_at) VALUES (?, NOW())', [$key]);
    $existing = one('SELECT id FROM push_devices WHERE token = ?', [$token]);
    if ($existing) {
        exec_sql(
            'UPDATE push_devices SET user_id = ?, platform = ?, revoked_at = NULL WHERE id = ?',
            [$userId, $platform, (int) $existing['id']]
        );
    } else {
        exec_sql(
            'INSERT INTO push_devices (user_id, platform, token, created_at) VALUES (?, ?, ?, NOW())',
            [$userId, $platform, $token]
        );
    }
    api_ok(['registered' => true]);
}

function api_campfire(): void
{
    $user = api_member();
    $title = clip(api_text('title', 160), 160);
    $body = sanitize_writing(api_text('body', 20000));
    $waypointId = (int) api_text('waypointId', 20);
    if ($title === '' || writing_is_empty($body)) {
        api_fail(422, 'validation', 'Write something before you share it.');
    }
    api_reject_loose_image();
    if ($waypointId > 0 && (!rooms_ready() || !sits_with((int) $user['id'], $waypointId))) {
        api_fail(403, 'forbidden', 'Take a seat in that waypoint before starting a discussion.');
    }
    $pdo = db();
    $doomed = [];
    $pdo->beginTransaction();
    try {
        if ($waypointId > 0) {
            exec_sql(
                'INSERT INTO waypoint_posts (waypoint_id, user_id, title, body, created_at) VALUES (?, ?, ?, ?, NOW())',
                [$waypointId, (int) $user['id'], $title, $body]
            );
            $type = 'waypoint';
        } else {
            exec_sql(
                'INSERT INTO campfire_posts (user_id, title, body, hidden, locked, created_at) VALUES (?, ?, ?, 0, 0, NOW())',
                [(int) $user['id'], $title, $body]
            );
            $type = 'campfire';
        }
        $id = (int) $pdo->lastInsertId();
        $problem = api_stage_image((int) $user['id'], $type, $id, $doomed);
        if ($problem !== '') {
            $pdo->rollBack();
            api_fail(422, 'validation', $problem);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
    foreach ($doomed as $path) {
        api_unlink_upload((string) $path);
    }
    api_ok(api_shell());
}

function api_story(bool $update): void
{
    $user = api_member();
    $title = clip(api_text('title', 160), 160);
    $body = sanitize_writing(api_text('body', 20000));
    if ($title === '' || writing_is_empty($body)) {
        api_fail(422, 'validation', 'A story needs a title and what happened.');
    }
    api_reject_loose_image();
    $userId = (int) $user['id'];
    if ($update) {
        $id = (int) api_text('id', 20);
        $owned = one('SELECT id FROM stories WHERE id = ? AND user_id = ?', [$id, $userId]);
        if (!$owned) {
            api_fail(403, 'forbidden', 'You can edit a story you wrote.');
        }
    }
    $pdo = db();
    $doomed = [];
    $pdo->beginTransaction();
    try {
        if ($update) {
            $id = (int) api_text('id', 20);
            exec_sql(
                'UPDATE stories SET title = ?, body = ?, what_i_did = ?, image_path = ? WHERE id = ? AND user_id = ?',
                [$title, $body, $body, '', $id, $userId]
            );
        } else {
            exec_sql(
                'INSERT INTO stories (user_id, title, what_i_did, expectations, what_happened, would_do_again, body, image_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                [$userId, $title, $body, '', '', '', $body, '']
            );
            $id = (int) $pdo->lastInsertId();
        }
        $problem = api_stage_image($userId, 'story', $id, $doomed);
        if ($problem !== '') {
            $pdo->rollBack();
            api_fail(422, 'validation', $problem);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
    foreach ($doomed as $path) {
        api_unlink_upload((string) $path);
    }
    api_ok(api_shell());
}

function api_comment(): void
{
    $user = api_member();
    $body = sanitize_writing(api_text('body', 5000));
    if (writing_is_empty($body)) {
        api_fail(422, 'validation', 'Write a reply first.');
    }
    $target = api_text('targetId', 40);
    $type = api_text('targetType', 20);
    if ($type === 'out-there') {
        $table = 'stories';
        $commentType = 'story';
        $id = (int) $target;
    } elseif (str_starts_with($target, 'w-')) {
        $table = 'waypoint_posts';
        $commentType = 'waypoint';
        $id = (int) substr($target, 2);
    } else {
        $table = 'campfire_posts';
        $commentType = 'campfire';
        $id = (int) (str_starts_with($target, 'c-') ? substr($target, 2) : $target);
    }
    $parent = one("SELECT id, user_id FROM {$table} WHERE id = ? AND hidden = 0", [$id]);
    if (!$parent) {
        api_fail(404, 'not_found', 'That conversation is not here.');
    }
    api_reject_loose_image();
    $pdo = db();
    $doomed = [];
    $pdo->beginTransaction();
    try {
        exec_sql(
            'INSERT INTO comments (user_id, target_type, target_id, body, created_at) VALUES (?, ?, ?, ?, NOW())',
            [(int) $user['id'], $commentType, $id, $body]
        );
        $commentId = (int) $pdo->lastInsertId();
        $problem = api_stage_image((int) $user['id'], 'comment', $commentId, $doomed);
        if ($problem !== '') {
            $pdo->rollBack();
            api_fail(422, 'validation', $problem);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
    foreach ($doomed as $path) {
        api_unlink_upload((string) $path);
    }
    if ((int) $parent['user_id'] !== (int) $user['id']) {
        notify((int) $parent['user_id'], 'Someone replied.', '/' . ($commentType === 'story' ? 'out-there/' . $id : 'campfire/' . $id));
    }
    api_ok(api_shell());
}

function api_skill(): void
{
    $user = api_member();
    $action = api_text('action', 20);
    $title = clip(api_text('skill', 120), 120);
    $detail = api_text('description', 2000);
    if ($action === 'offer' || $action === 'request') {
        if ($title === '') {
            api_fail(422, 'validation', 'Name the skill first.');
        }
        $table = $action === 'offer' ? 'skill_offers' : 'skill_requests';
        exec_sql(
            "INSERT INTO {$table} (user_id, title, detail, created_at) VALUES (?, ?, ?, NOW())",
            [(int) $user['id'], $title, $detail]
        );
        api_ok(api_shell());
    }
    if ($action === 'interest') {
        $kind = api_text('kind', 20) === 'request' ? 'request' : 'offer';
        $id = (int) api_text('id', 20);
        $note = api_text('note', 2000);
        $subject = talk_subject('skill', $kind, $id, (int) $user['id'], 0);
        if (!$subject || !conversations_ready()) {
            api_fail(403, 'forbidden', 'A private conversation is not available right now.');
        }
        talk_create('skill', $kind, $id, (string) $subject['label'], (string) $subject['note'], (int) $user['id'], (int) $subject['other'], $note);
        api_ok(api_shell());
    }
    if ($action === 'consent') {
        $_POST['action'] = api_text('status', 20) === 'declined' ? 'decline' : 'accept';
        $link = one('SELECT * FROM skill_links WHERE id = ?', [(int) api_text('id', 20)]);
        if (!$link) {
            api_fail(404, 'not_found', 'That exchange is not here.');
        }
        $mine = (int) $user['id'];
        if ((int) $link['from_user_id'] !== $mine && (int) $link['to_user_id'] !== $mine) {
            api_fail(403, 'forbidden', 'This exchange is not yours.');
        }
        $side = (int) $link['from_user_id'] === $mine ? 'from' : 'to';
        $column = $side === 'from' ? 'consent_from' : 'consent_to';
        if ($_POST['action'] === 'accept') {
            exec_sql("UPDATE skill_links SET {$column} = 1 WHERE id = ? AND archived = 0", [(int) $link['id']]);
            $fresh = one('SELECT * FROM skill_links WHERE id = ? AND archived = 0', [(int) $link['id']]);
            if ($fresh && (int) $fresh['consent_from'] === 1 && (int) $fresh['consent_to'] === 1 && function_exists('path_open_chair')) {
                path_open_chair('skill', 'link', (int) $link['id'], (int) $fresh['from_user_id'], (int) $fresh['to_user_id'], site_text('path_room_name'), (string) $fresh['note']);
            }
        } else {
            exec_sql('UPDATE skill_links SET archived = 1 WHERE id = ?', [(int) $link['id']]);
        }
        api_ok(api_shell());
    }
    api_fail(422, 'validation', 'That skill action is not used here.');
}

function api_same(): void
{
    $user = api_member();
    $seedId = (int) api_text('seedId', 20);
    $note = api_text('goal', 2000);
    exec_sql(
        'INSERT INTO same_requests (user_id, seed_id, note, status, created_at) VALUES (?, ?, ?, ?, NOW())',
        [(int) $user['id'], $seedId > 0 ? $seedId : null, $note, 'open']
    );
    api_ok(api_shell());
}

function api_same_consent(): void
{
    $user = api_member();
    $id = (int) api_text('id', 20);
    $decision = api_text('decision', 20) === 'declined' ? 'decline' : 'accept';
    $match = one('SELECT * FROM same_matches WHERE id = ?', [$id]);
    if (!$match) {
        api_fail(404, 'not_found', 'That introduction is not here.');
    }
    $mine = (int) $user['id'];
    if ((int) $match['user_a_id'] !== $mine && (int) $match['user_b_id'] !== $mine) {
        api_fail(403, 'forbidden', 'This introduction is not yours.');
    }
    $side = (int) $match['user_a_id'] === $mine ? 'a' : 'b';
    $other = $side === 'a' ? (int) $match['user_b_id'] : (int) $match['user_a_id'];
    $status = (string) $match['status'];
    if ($decision === 'accept' && in_array($status, ['awaiting', 'suggested'], true) && !talk_blocked($mine, $other)) {
        exec_sql('UPDATE same_matches SET consent_' . $side . ' = 1, status_at = NOW() WHERE id = ?', [$id]);
        $fresh = one('SELECT * FROM same_matches WHERE id = ?', [$id]);
        if ($fresh && (int) $fresh['consent_a'] === 1 && (int) $fresh['consent_b'] === 1) {
            exec_sql('UPDATE same_matches SET status = ?, status_at = NOW() WHERE id = ?', ['open', $id]);
            if (function_exists('path_open_chair')) {
                path_open_chair('introduction', '', $id, $mine, $other, site_text('path_room_name'), (string) ($match['note'] ?? ''));
            }
        }
        api_ok(api_shell());
    }
    if ($decision === 'decline' && in_array($status, ['awaiting', 'suggested', 'open', 'approved'], true)) {
        $next = in_array($status, ['open', 'approved'], true) ? 'closed' : 'declined';
        exec_sql(
            'UPDATE same_matches SET status = ?, closed_by = ?, status_at = NOW() WHERE id = ?',
            [$next, $mine, $id]
        );
        api_ok(api_shell());
    }
    api_fail(403, 'forbidden', 'That introduction cannot be changed right now.');
}

function api_conversation(): void
{
    $user = api_member();
    if (!conversations_ready()) {
        api_fail(503, 'unavailable', 'Conversations are not on this house yet.');
    }
    $other = (int) api_text('targetId', 20);
    $note = api_text('note', 2000);
    if ($note === '') {
        api_fail(422, 'validation', 'An opening note needs a few words.');
    }
    $context = talk_shared_context((int) $user['id'], $other);
    $verified = $context !== null;
    $state = talk_public_state($user, $other, $verified);
    if ($state !== 'ready') {
        api_fail(403, 'forbidden', 'A private conversation is not available right now.');
    }
    if ($context) {
        $subject = talk_subject((string) $context['type'], (string) $context['kind'], (int) $context['id'], (int) $user['id'], (int) ($context['person'] ?? 0));
    } else {
        $subject = talk_subject('member', '', $other, (int) $user['id'], 0);
        $context = ['type' => 'member', 'kind' => '', 'id' => $other];
    }
    if (!$subject || (int) $subject['other'] !== $other) {
        api_fail(403, 'forbidden', 'A private conversation is not available right now.');
    }
    talk_create(
        (string) $context['type'],
        (string) $context['kind'],
        (int) $context['id'],
        (string) $subject['label'],
        (string) $subject['note'],
        (int) $user['id'],
        $other,
        $note
    );
    api_ok(api_shell());
}

function api_message(): void
{
    $user = api_member();
    $id = (int) api_text('conversationId', 20);
    $body = sanitize_writing(api_text('body', 5000));
    $key = api_text('clientKey', 36);
    $conversation = talk_load($id);
    if (!$conversation || !talk_participant($id, (int) $user['id'])) {
        api_fail(404, 'not_found', 'That conversation is not here.');
    }
    if (!talk_can_reply($conversation, (int) $user['id'])) {
        api_fail(403, 'forbidden', 'A private conversation is not available right now.');
    }
    if (writing_is_empty($body)) {
        api_fail(422, 'validation', 'Write a note first.');
    }
    if ($key !== '' && table_has_column('conversation_messages', 'client_key')) {
        $existing = one('SELECT id FROM conversation_messages WHERE client_key = ?', [$key]);
        if ($existing) {
            api_ok(api_shell());
        }
        exec_sql(
            'INSERT INTO conversation_messages (conversation_id, user_id, body, client_key, created_at) VALUES (?, ?, ?, ?, NOW())',
            [$id, (int) $user['id'], $body, $key]
        );
    } else {
        exec_sql(
            'INSERT INTO conversation_messages (conversation_id, user_id, body, created_at) VALUES (?, ?, ?, NOW())',
            [$id, (int) $user['id'], $body]
        );
    }
    $other = talk_other($id, (int) $user['id']);
    if ($other > 0) {
        notify($other, 'There is a new note in a conversation.', '/conversations/' . $id);
    }
    api_ok(api_shell());
}

function api_conversation_choice(): void
{
    $user = api_member();
    $id = (int) api_text('conversationId', 20);
    $choice = api_text('choice', 40);
    $phrase = sanitize_writing(api_text('phrase', 2000));
    $conversation = talk_load($id);
    if (!$conversation || !talk_participant($id, (int) $user['id'])) {
        api_fail(404, 'not_found', 'That conversation is not here.');
    }
    $mine = (int) $user['id'];
    $other = talk_other($id, $mine);
    if ($choice === 'continue' && talk_status($conversation) === 'requested' && (int) $conversation['opened_by'] !== $mine) {
        exec_sql('UPDATE conversations SET status = ? WHERE id = ? AND status = ?', ['open', $id, 'requested']);
        api_ok(api_shell());
    }
    if ($choice === 'decline' && talk_status($conversation) === 'requested' && (int) $conversation['opened_by'] !== $mine) {
        talk_forget_notes($id);
        exec_sql('UPDATE conversations SET status = ? WHERE id = ?', ['declined', $id]);
        api_ok(api_shell());
    }
    if (!talk_can_reply($conversation, $mine)) {
        api_fail(403, 'forbidden', 'A private conversation is not available right now.');
    }
    if (!writing_is_empty($phrase)) {
        exec_sql(
            'INSERT INTO conversation_messages (conversation_id, user_id, body, created_at) VALUES (?, ?, ?, NOW())',
            [$id, $mine, $phrase]
        );
        if ($other > 0) {
            notify($other, 'There is a new note in a conversation.', '/conversations/' . $id);
        }
    }
    if ($choice === 'space') {
        exec_sql('UPDATE profiles SET conversations_pref = ?, conversations_choice_made = 1 WHERE user_id = ?', ['none', $mine]);
    }
    api_ok(api_shell());
}

function api_conversation_flag(): void
{
    $user = api_member();
    $id = (int) api_text('conversationId', 20);
    $flag = api_text('flag', 20);
    $map = ['mute' => 'mute', 'unmute' => 'unmute', 'archive' => 'archive', 'restore' => 'restore', 'close' => 'close'];
    $conversation = talk_load($id);
    if (!$conversation || !isset($map[$flag]) || !talk_participant($id, (int) $user['id'])) {
        api_fail(404, 'not_found', 'That conversation is not here.');
    }
    if (function_exists('life_talk_action') && life_ready()) {
        life_talk_action($conversation, (int) $user['id'], $map[$flag]);
    }
    api_ok(api_shell());
}

function api_report(): void
{
    $user = api_member();
    $reason = api_text('reason', 2000);
    if (strlen($reason) < 8) {
        api_fail(422, 'validation', 'Say a little more, so a steward knows what to look at.');
    }
    $type = api_text('targetType', 40);
    $map = [
        'campfire' => 'campfire',
        'out-there' => 'story',
        'comment' => 'comment',
        'conversation' => 'conversation',
        'message' => 'conversation',
        'member' => 'profile',
    ];
    if (!isset($map[$type])) {
        api_fail(422, 'validation', 'That cannot be reported from here.');
    }
    $target = api_text('targetId', 40);
    $id = (int) (str_contains($target, '-') ? substr($target, 2) : $target);
    exec_sql(
        'INSERT INTO reports (reporter_id, target_type, target_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [(int) $user['id'], $map[$type], $id, $reason, 'pending']
    );
    api_ok(api_shell());
}

function api_block(bool $block): void
{
    $user = api_member();
    if (!talk_blocks_ready()) {
        api_fail(503, 'unavailable', 'Blocking is not on this house yet.');
    }
    $other = (int) api_text('userId', 20);
    if ($other <= 0 || $other === (int) $user['id']) {
        api_fail(422, 'validation', 'That member is not here.');
    }
    if ($block) {
        exec_sql('INSERT IGNORE INTO member_blocks (user_id, blocked_id, created_at) VALUES (?, ?, NOW())', [(int) $user['id'], $other]);
    } else {
        exec_sql('DELETE FROM member_blocks WHERE user_id = ? AND blocked_id = ?', [(int) $user['id'], $other]);
    }
    api_ok(api_shell());
}

function api_notices(): void
{
    $user = api_member();
    exec_sql('UPDATE notices SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL', [(int) $user['id']]);
    api_ok(api_shell());
}

function api_pin_hide(): void
{
    $user = api_member();
    $raw = api_text('targetId', 40);
    $type = api_text('targetType', 20);
    if (str_starts_with($raw, 'w-')) {
        $stored = 'waypoint';
        $id = (int) substr($raw, 2);
    } elseif (str_starts_with($raw, 'c-')) {
        $stored = 'campfire';
        $id = (int) substr($raw, 2);
    } elseif ($type === 'out-there' || $type === 'story') {
        $stored = 'story';
        $id = (int) $raw;
    } else {
        api_fail(422, 'validation', 'That welcome cannot be set aside.');
    }
    if ($id <= 0) {
        api_fail(422, 'validation', 'That welcome cannot be set aside.');
    }
    exec_sql(
        'INSERT IGNORE INTO pin_hides (user_id, subject_type, subject_id, created_at) VALUES (?, ?, ?, NOW())',
        [(int) $user['id'], $stored, $id]
    );
    api_ok(api_shell());
}

function api_pin_reveal(): void
{
    $user = api_member();
    exec_sql('DELETE FROM pin_hides WHERE user_id = ?', [(int) $user['id']]);
    api_ok(api_shell());
}

function api_steward(): void
{
    $user = api_member();
    if (!is_steward($user)) {
        api_fail(403, 'forbidden', 'This desk is for stewards.');
    }
    $kind = api_text('kind', 20);
    $raw = api_text('id', 40);
    $id = (int) (str_contains($raw, '-') ? substr($raw, 2) : $raw);
    $table = $kind === 'story' ? 'stories' : (str_starts_with($raw, 'w-') ? 'waypoint_posts' : 'campfire_posts');
    if (array_key_exists('hidden', api_input())) {
        exec_sql("UPDATE {$table} SET hidden = ? WHERE id = ?", [!empty(api_input()['hidden']) ? 1 : 0, $id]);
    }
    if (array_key_exists('pinned', api_input()) && function_exists('pin_set')) {
        $pinType = $table === 'stories' ? 'story' : ($table === 'waypoint_posts' ? 'waypoint' : 'campfire');
        pin_set($pinType, $id, !empty(api_input()['pinned']));
    }
    api_ok(api_shell());
}

function api_keep_chair(): void
{
    $user = api_member();
    $id = (int) api_text('id', 20);
    $conversation = talk_load($id);
    if (!$conversation || !function_exists('path_keep_chair')) {
        api_fail(404, 'not_found', 'That chair is not here.');
    }
    path_keep_chair($conversation, (int) $user['id']);
    api_ok(api_shell());
}

function api_shell(): array
{
    $user = current_user();
    $public = api_shell_public();
    if (!$user) {
        return $public;
    }
    $public['profile'] = api_profile_row($user, true);
    $public['world'] = api_world((int) $user['id']);
    $public['contactIds'] = api_contact_ids($user);
    $public['capabilities'] = [
        'conversations' => conversations_ready(),
        'blocks' => talk_blocks_ready(),
        'reports' => true,
        'seedSupport' => conversations_ready(),
        'sessions' => function_exists('path_ready') && path_ready(),
        'dismissals' => table_has_column('pin_hides', 'user_id'),
        'communicationColumn' => conversations_ready(),
    ];
    return $public;
}

function api_shell_public(): array
{
    return [
        'profile' => null,
        'content' => [
            'heroTitle' => site_text('hero_title'),
            'heroSubhead' => site_text('hero_subhead'),
            'heroSupport' => site_text('hero_support'),
            'heroTagline' => site_text('hero_philosophy'),
            'belief' => site_text('belief'),
            'founderName' => site_text('about_founder_name'),
            'founderEmail' => setting('founder_email', 'marge@gosolo.co.network'),
        ],
        'seeds' => api_seeds(),
        'waypoints' => api_waypoints(),
        'readings' => api_readings(),
        'world' => [
            'profiles' => [],
            'userSeeds' => [],
            'memberships' => [],
            'partnerships' => [],
            'offers' => [],
            'requests' => [],
            'connections' => [],
            'stories' => [],
            'campfire' => [],
            'comments' => [],
            'reactions' => [],
            'notifications' => [],
            'conversations' => [],
            'messages' => [],
            'blocks' => [],
            'reports' => [],
            'seedSupports' => [],
            'sessions' => [],
            'dismissedPins' => [],
        ],
        'capabilities' => [
            'conversations' => false,
            'blocks' => false,
            'reports' => false,
            'seedSupport' => false,
            'sessions' => false,
            'dismissals' => false,
            'communicationColumn' => false,
        ],
        'needsVerification' => false,
        'contactIds' => [],
    ];
}

function api_seeds(): array
{
    $rows = q('SELECT id, slug, title, description, prompt, kind, category FROM seeds WHERE archived = 0 ORDER BY id');
    return array_map(static function (array $row): array {
        return [
            'id' => (string) $row['id'],
            'title' => (string) $row['title'],
            'description' => (string) $row['description'],
            'prompt' => (string) $row['prompt'],
            'category' => (string) ($row['category'] ?: 'everyday'),
            'kind' => (string) $row['kind'],
            'timeframe' => '',
            'waypoints' => [],
        ];
    }, $rows);
}

function api_waypoints(): array
{
    $rows = q('SELECT id, slug, title, description, intro_line FROM waypoints WHERE archived = 0 ORDER BY id');
    return array_map(static function (array $row): array {
        return [
            'id' => (string) $row['id'],
            'slug' => (string) $row['slug'],
            'name' => (string) $row['title'],
            'summary' => (string) ($row['intro_line'] ?: $row['description']),
            'description' => (string) $row['description'],
            'focus' => [],
        ];
    }, $rows);
}

function api_reading_links(): array
{
    $links = [];
    $add = static function (string $slug, string $waypointSlug, string $name, int $discussions) use (&$links): void {
        if ($slug === '' || $waypointSlug === '') {
            return;
        }
        foreach ($links[$slug] ?? [] as $existing) {
            if ($existing['slug'] === $waypointSlug) {
                return;
            }
        }
        $links[$slug][] = [
            'slug' => $waypointSlug,
            'name' => $name,
            'discussions' => $discussions,
        ];
    };
    if (function_exists('rooms_ready') && rooms_ready()) {
        $rows = q(
            'SELECT r.slug AS reading_slug, w.slug, w.title,
                    (SELECT COUNT(*) FROM waypoint_posts p WHERE p.waypoint_id = w.id AND p.hidden = 0) AS discussions
             FROM waypoint_readings wr
             JOIN readings r ON r.id = wr.reading_id AND r.status = ?
             JOIN waypoints w ON w.id = wr.waypoint_id AND w.archived = 0',
            ['published']
        );
        foreach ($rows as $row) {
            $add((string) $row['reading_slug'], (string) $row['slug'], (string) $row['title'], (int) $row['discussions']);
        }
    }
    if (table_has_column('waypoints', 'featured_reading_id')) {
        $rows = q(
            'SELECT r.slug AS reading_slug, w.slug, w.title
             FROM waypoints w
             JOIN readings r ON r.id = w.featured_reading_id AND r.status = ?
             WHERE w.archived = 0 AND w.featured_reading_id IS NOT NULL',
            ['published']
        );
        foreach ($rows as $row) {
            $count = 0;
            if (function_exists('rooms_ready') && rooms_ready()) {
                $waypoint = one('SELECT id FROM waypoints WHERE slug = ?', [(string) $row['slug']]);
                $count = $waypoint
                    ? count_of('SELECT COUNT(*) AS n FROM waypoint_posts WHERE waypoint_id = ? AND hidden = 0', [(int) $waypoint['id']])
                    : 0;
            }
            $add((string) $row['reading_slug'], (string) $row['slug'], (string) $row['title'], $count);
        }
    }
    return $links;
}

function api_readings(): array
{
    $links = api_reading_links();
    $rows = q(
        'SELECT r.slug, r.title, r.standfirst, r.body, r.featured, c.slug AS category
         FROM readings r JOIN reading_categories c ON c.id = r.category_id
         WHERE r.status = ? ORDER BY r.featured DESC, r.featured_order, r.title',
        ['published']
    );
    return array_map(static function (array $row) use ($links): array {
        $parts = preg_split("/\n\s*\n/", trim(strip_tags((string) $row['body']))) ?: [];
        $slug = (string) $row['slug'];
        return [
            'slug' => $slug,
            'category' => (string) $row['category'],
            'title' => (string) $row['title'],
            'standfirst' => (string) $row['standfirst'],
            'paragraphs' => array_values(array_filter(array_map('trim', $parts))),
            'featured' => (int) ($row['featured'] ?? 0) === 1,
            'waypoints' => $links[$slug] ?? [],
        ];
    }, $rows);
}

function api_pref(string $value): string
{
    return $value === 'context' ? 'contextual' : ($value === 'none' ? 'none' : 'anyone');
}

function api_profile_row(array $user, bool $self): array
{
    $id = (int) $user['id'];
    $profile = one('SELECT * FROM profiles WHERE user_id = ?', [$id]) ?: [];
    $pref = (string) ($profile['conversations_pref'] ?? 'context');
    $growing = q('SELECT id, title, status, looking_for_support, created_at FROM growing_seeds WHERE user_id = ? ORDER BY id DESC', [$id]);
    return [
        'id' => (string) $id,
        'email' => $self ? (string) $user['email'] : '',
        'displayName' => (string) ($profile['display_name'] ?? ''),
        'bio' => (string) ($profile['bio'] ?? ''),
        'location' => !empty($profile['show_location']) || $self ? (string) ($profile['location'] ?? '') : '',
        'avatarUrl' => api_public_media((string) ($profile['avatar_path'] ?? '')),
        'intentions' => [],
        'interests' => [],
        'onboardingComplete' => !conversations_ready() || (int) ($profile['conversations_choice_made'] ?? 0) === 1,
        'onboardingStep' => (int) ($profile['conversations_choice_made'] ?? 0) === 1 ? 'arrive' : 'contact',
        'emailVerified' => true,
        'showLocation' => (int) ($profile['show_location'] ?? 1) === 1,
        'showWaypoints' => true,
        'notifyReplies' => true,
        'notifyWaypoints' => false,
        'notifyCheckins' => true,
        'notificationPrefs' => [
            'conversations' => true,
            'messages' => true,
            'seeds' => true,
            'skills' => true,
            'same' => true,
            'replies' => true,
            'notices' => (int) ($profile['mute_notices'] ?? 0) !== 1,
        ],
        'communicationPreference' => api_pref($pref),
        'takingSpace' => (int) ($profile['conversations_held'] ?? 0) === 1,
        'createdAt' => api_time((string) ($user['created_at'] ?? '')),
        'role' => (string) ($user['role'] ?? 'member'),
        'status' => (string) ($user['status'] ?? 'active'),
        'growing' => array_map(static function (array $seed): array {
            $status = (string) $seed['status'];
            return [
                'id' => (string) $seed['id'],
                'name' => (string) $seed['title'],
                'status' => $status === 'grown' ? 'completed' : $status,
                'since' => api_time((string) $seed['created_at']),
                'lookingForSupport' => (int) $seed['looking_for_support'] === 1,
            ];
        }, $growing),
        'helpGrowing' => array_column(user_titles('help_requests', $id), 'title'),
        'helpPlant' => array_column(user_titles('help_offers', $id), 'title'),
        'helpPlantNote' => '',
        'supportWith' => user_supports($id),
        'checkInFrequency' => (string) ($profile['contact_frequency'] ?? ''),
        'checkInStyle' => (string) ($profile['check_in_style'] ?? ''),
        'sameNotes' => '',
    ];
}

function api_world(int $viewer): array
{
    $people = q(
        'SELECT u.id, u.email, u.role, u.status, u.created_at FROM users u WHERE u.status = ? ORDER BY u.last_seen_at DESC LIMIT 80',
        ['active']
    );
    $profiles = [];
    foreach ($people as $person) {
        $profiles[] = api_profile_row($person, (int) $person['id'] === $viewer);
    }
    $userSeeds = api_user_seeds();
    $members = q('SELECT waypoint_id, user_id, created_at FROM waypoint_members ORDER BY created_at DESC LIMIT 200');
    $offers = q('SELECT id, user_id, title, detail, listing_status, created_at FROM skill_offers WHERE archived = 0 ORDER BY id DESC LIMIT 40');
    $requests = q('SELECT id, user_id, title, detail, listing_status, created_at FROM skill_requests WHERE archived = 0 ORDER BY id DESC LIMIT 40');
    $links = q('SELECT * FROM skill_links WHERE archived = 0 ORDER BY id DESC LIMIT 40');
    $matches = q('SELECT * FROM same_matches ORDER BY id DESC LIMIT 40');
    $stories = q('SELECT * FROM stories WHERE hidden = 0 OR user_id = ? ORDER BY pinned DESC, created_at DESC LIMIT 40', [$viewer]);
    $campfire = q('SELECT * FROM campfire_posts WHERE hidden = 0 OR user_id = ? ORDER BY pinned DESC, created_at DESC LIMIT 40', [$viewer]);
    $discussions = rooms_ready()
        ? q('SELECT * FROM waypoint_posts WHERE hidden = 0 OR user_id = ? ORDER BY pinned DESC, created_at DESC LIMIT 40', [$viewer])
        : [];
    $comments = q('SELECT * FROM comments WHERE hidden = 0 ORDER BY id DESC LIMIT 80');
    $notices = q('SELECT id, body, href, read_at, created_at FROM notices WHERE user_id = ? ORDER BY id DESC LIMIT 30', [$viewer]);
    $blocks = talk_blocks_ready()
        ? q('SELECT blocked_id, created_at FROM member_blocks WHERE user_id = ?', [$viewer])
        : [];
    $conversations = [];
    $messages = [];
    $sessions = [];
    if (conversations_ready()) {
        $rooms = q(
            'SELECT c.id FROM conversations c
             JOIN conversation_participants p ON p.conversation_id = c.id
             WHERE p.user_id = ? AND c.status <> ?
             ORDER BY c.id DESC LIMIT 40',
            [$viewer, 'declined']
        );
        foreach ($rooms as $room) {
            $loaded = talk_load((int) $room['id']);
            if (!$loaded || !talk_participant((int) $loaded['id'], $viewer)) {
                continue;
            }
            $other = talk_other((int) $loaded['id'], $viewer);
            $status = talk_status($loaded);
            $mapped = $status === 'requested' ? 'request' : ($status === 'declined' ? 'declined' : 'accepted');
            $conversations[] = [
                'id' => (string) $loaded['id'],
                'contextType' => 'direct',
                'contextId' => (string) ($loaded['context_id'] ?? ''),
                'contextLabel' => (string) ($loaded['context_label'] ?? ''),
                'requesterId' => (string) $loaded['opened_by'],
                'recipientId' => (string) $other,
                'status' => $mapped,
                'mutedBy' => [],
                'createdAt' => api_time((string) $loaded['created_at']),
                'updatedAt' => api_time((string) $loaded['created_at']),
            ];
            if ($status !== 'declined') {
                foreach (talk_messages((int) $loaded['id']) as $message) {
                    $messages[] = [
                        'id' => (string) $message['id'],
                        'conversationId' => (string) $loaded['id'],
                        'authorId' => (string) $message['user_id'],
                        'body' => (string) $message['body'],
                        'createdAt' => api_time((string) $message['created_at']),
                    ];
                }
            }
            if (!empty($loaded['expires_at'])) {
                $sessions[] = [
                    'id' => (string) $loaded['id'],
                    'contextType' => (string) $loaded['context_type'] === 'introduction' ? 'same' : 'skill-swap',
                    'contextId' => (string) $loaded['context_id'],
                    'memberA' => (string) $loaded['opened_by'],
                    'memberB' => (string) $other,
                    'startsAt' => api_time((string) $loaded['created_at']),
                    'endsAt' => api_time((string) $loaded['expires_at']),
                    'aAgreed' => true,
                    'bAgreed' => true,
                    'continuationA' => null,
                    'continuationB' => null,
                    'status' => 'scheduled',
                    'createdAt' => api_time((string) $loaded['created_at']),
                ];
            }
        }
    }
    $pins = table_has_column('pin_hides', 'user_id')
        ? q('SELECT subject_type, subject_id FROM pin_hides WHERE user_id = ?', [$viewer])
        : [];
    return [
        'profiles' => $profiles,
        'userSeeds' => $userSeeds,
        'memberships' => array_map(static fn (array $row): array => [
            'userId' => (string) $row['user_id'],
            'waypointId' => (string) $row['waypoint_id'],
            'joinedAt' => api_time((string) $row['created_at']),
        ], $members),
        'partnerships' => array_map(static function (array $row): array {
            $status = (string) $row['status'];
            return [
                'id' => (string) $row['id'],
                'seedId' => (string) ($row['seed_id'] ?? ''),
                'seekerId' => (string) $row['user_a_id'],
                'partnerId' => (string) $row['user_b_id'],
                'goal' => (string) $row['note'],
                'status' => in_array($status, ['open', 'approved'], true) ? 'matched' : 'seeking',
                'createdAt' => api_time((string) $row['created_at']),
                'checkIns' => [],
                'seekerConsent' => (int) ($row['consent_a'] ?? 0) === 1 ? 'accepted' : null,
                'partnerConsent' => (int) ($row['consent_b'] ?? 0) === 1 ? 'accepted' : null,
            ];
        }, $matches),
        'offers' => array_map(static fn (array $row): array => [
            'id' => (string) $row['id'],
            'userId' => (string) $row['user_id'],
            'skill' => (string) $row['title'],
            'description' => (string) $row['detail'],
            'createdAt' => api_time((string) $row['created_at']),
            'status' => (string) ($row['listing_status'] ?? 'open'),
        ], $offers),
        'requests' => array_map(static fn (array $row): array => [
            'id' => (string) $row['id'],
            'userId' => (string) $row['user_id'],
            'skill' => (string) $row['title'],
            'description' => (string) $row['detail'],
            'createdAt' => api_time((string) $row['created_at']),
            'status' => (string) ($row['listing_status'] ?? 'open'),
        ], $requests),
        'connections' => array_map(static function (array $row): array {
            $open = (int) ($row['consent_from'] ?? 1) === 1 && (int) ($row['consent_to'] ?? 1) === 1;
            return [
                'id' => (string) $row['id'],
                'fromUserId' => (string) $row['from_user_id'],
                'toUserId' => (string) $row['to_user_id'],
                'offerId' => (string) ($row['offer_id'] ?? ''),
                'requestId' => (string) ($row['request_id'] ?? ''),
                'note' => (string) $row['note'],
                'createdAt' => api_time((string) $row['created_at']),
                'status' => $open ? 'accepted' : 'interest',
            ];
        }, $links),
        'stories' => array_map(static function (array $row): array {
            return [
                'id' => (string) $row['id'],
                'authorId' => (string) $row['user_id'],
                'title' => (string) $row['title'],
                'whatDidYouDo' => (string) ($row['body'] ?: $row['what_i_did']),
                'expecting' => (string) $row['expectations'],
                'actuallyHappened' => (string) $row['what_happened'],
                'wouldDoAgain' => 'yes',
                'imageUrl' => ($storyImage = api_attached_image('story', (int) $row['id']))['url'] ?: api_safe_media((string) ($row['image_path'] ?? '')),
                'imageAlt' => $storyImage['alt'],
                'createdAt' => api_time((string) $row['created_at']),
                'hidden' => (int) $row['hidden'] === 1,
                'pinned' => (int) ($row['pinned'] ?? 0) === 1,
            ];
        }, $stories),
        'campfire' => array_merge(
            array_map(static fn (array $row): array => api_post($row, 'c-'), $campfire),
            array_map(static fn (array $row): array => api_post($row, 'w-'), $discussions)
        ),
        'comments' => array_map(static function (array $row): array {
            $type = (string) $row['target_type'];
            $id = (string) $row['target_id'];
            if ($type === 'waypoint') {
                $id = 'w-' . $id;
                $type = 'campfire';
            } elseif ($type === 'campfire') {
                $id = 'c-' . $id;
            } else {
                $type = 'out-there';
            }
            $commentImage = api_attached_image('comment', (int) $row['id']);
            return [
                'id' => (string) $row['id'],
                'authorId' => (string) $row['user_id'],
                'targetType' => $type,
                'targetId' => $id,
                'body' => (string) $row['body'],
                'imageUrl' => $commentImage['url'],
                'imageAlt' => $commentImage['alt'],
                'createdAt' => api_time((string) $row['created_at']),
                'hidden' => (int) $row['hidden'] === 1,
            ];
        }, $comments),
        'reactions' => [],
        'notifications' => array_map(static fn (array $row): array => [
            'id' => (string) $row['id'],
            'userId' => (string) $viewer,
            'title' => 'Go Solo',
            'body' => (string) $row['body'],
            'href' => (string) ($row['href'] ?? ''),
            'read' => !empty($row['read_at']),
            'createdAt' => api_time((string) $row['created_at']),
        ], $notices),
        'conversations' => $conversations,
        'messages' => $messages,
        'blocks' => array_map(static fn (array $row): array => [
            'id' => (string) $viewer . '-' . $row['blocked_id'],
            'blockerId' => (string) $viewer,
            'blockedId' => (string) $row['blocked_id'],
            'createdAt' => api_time((string) $row['created_at']),
        ], $blocks),
        'reports' => [],
        'seedSupports' => [],
        'sessions' => $sessions,
        'dismissedPins' => array_map(static function (array $row) use ($viewer): array {
            $type = (string) $row['subject_type'];
            $id = (string) $row['subject_id'];
            if ($type === 'campfire') {
                $id = 'c-' . $id;
            } elseif ($type === 'waypoint') {
                $id = 'w-' . $id;
                $type = 'campfire';
            } else {
                $type = 'out-there';
            }
            return [
                'userId' => (string) $viewer,
                'targetType' => $type === 'campfire' ? 'campfire' : 'out-there',
                'targetId' => $id,
            ];
        }, $pins),
    ];
}

function api_user_seeds(): array
{
    $goal = table_has_column('planted_seeds', 'goal');
    $status = table_has_column('planted_seeds', 'status');
    $reflection = table_has_column('planted_seeds', 'reflection');
    $extra = ($goal ? ', p.goal' : '') . ($status ? ', p.status' : '') . ($reflection ? ', p.reflection' : '');
    $rows = q(
        'SELECT p.user_id, p.seed_id, p.created_at, s.title' . $extra . ' FROM planted_seeds p JOIN seeds s ON s.id = p.seed_id ORDER BY p.created_at DESC LIMIT 80'
    );
    return array_map(static function (array $row) use ($goal, $status, $reflection): array {
        $state = $status ? (string) ($row['status'] ?? 'active') : 'active';
        if (!in_array($state, ['active', 'resting', 'completed'], true)) {
            $state = 'active';
        }
        $note = $reflection ? trim((string) ($row['reflection'] ?? '')) : '';
        $id = 'planted-' . $row['user_id'] . '-' . $row['seed_id'];
        return [
            'id' => $id,
            'userId' => (string) $row['user_id'],
            'seedId' => (string) $row['seed_id'],
            'title' => (string) $row['title'],
            'status' => $state,
            'goal' => $goal ? (string) ($row['goal'] ?? '') : '',
            'startedAt' => api_time((string) $row['created_at']),
            'checkIns' => $note === '' ? [] : [[
                'id' => $id . '-note',
                'at' => api_time((string) $row['created_at']),
                'note' => $note,
                'userId' => (string) $row['user_id'],
            ]],
        ];
    }, $rows);
}

function api_post(array $row, string $prefix): array
{
    $image = api_attached_image($prefix === 'w-' ? 'waypoint' : 'campfire', (int) $row['id']);
    return [
        'id' => $prefix . $row['id'],
        'authorId' => (string) $row['user_id'],
        'section' => 'general',
        'kind' => 'thought',
        'title' => (string) $row['title'],
        'body' => (string) $row['body'],
        'waypointId' => isset($row['waypoint_id']) ? (string) $row['waypoint_id'] : '',
        'imageUrl' => $image['url'],
        'imageAlt' => $image['alt'],
        'createdAt' => api_time((string) $row['created_at']),
        'hidden' => (int) ($row['hidden'] ?? 0) === 1,
        'pinned' => (int) ($row['pinned'] ?? 0) === 1,
        'locked' => (int) ($row['locked'] ?? 0) === 1,
    ];
}

function api_contact_ids(array $viewer): array
{
    if (!conversations_ready()) {
        return [];
    }
    $ids = [];
    $people = q('SELECT id FROM users WHERE status = ? AND id <> ? LIMIT 80', ['active', (int) $viewer['id']]);
    foreach ($people as $person) {
        $other = (int) $person['id'];
        $context = talk_shared_context((int) $viewer['id'], $other);
        if (talk_public_state($viewer, $other, $context !== null) === 'ready') {
            $ids[] = (string) $other;
        }
    }
    return $ids;
}
