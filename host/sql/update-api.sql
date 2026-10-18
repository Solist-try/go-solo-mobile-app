-- Mobile doorway for the existing Go Solo PHP site.
-- Paste this once in phpMyAdmin, with the site database selected, after the earlier updates.
-- It adds revocable sign-in tokens for the iOS and Android apps.
-- It does not drop tables or rewrite members, stories, or conversations.
-- A second paste is safe. The script records api-2026-10-18 in schema_updates.

CREATE TABLE IF NOT EXISTS schema_updates (
  update_key VARCHAR(80) NOT NULL,
  applied_at DATETIME NOT NULL,
  PRIMARY KEY (update_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_tokens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  kind ENUM('access', 'refresh') NOT NULL,
  family CHAR(32) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_tokens_hash (token_hash),
  KEY api_tokens_family (family),
  KEY api_tokens_user (user_id),
  CONSTRAINT api_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_attempts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY api_attempts_email (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @api_key := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conversation_messages' AND COLUMN_NAME = 'client_key'
);
SET @api_key_sql := IF(
  @api_key = 0,
  'ALTER TABLE conversation_messages ADD COLUMN client_key CHAR(36) NULL DEFAULT NULL, ADD UNIQUE KEY conversation_messages_client (client_key)',
  'SELECT 1'
);
PREPARE api_stmt FROM @api_key_sql;
EXECUTE api_stmt;
DEALLOCATE PREPARE api_stmt;

SET @planted_goal := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planted_seeds' AND COLUMN_NAME = 'goal'
);
SET @planted_goal_sql := IF(@planted_goal = 0, 'ALTER TABLE planted_seeds ADD COLUMN goal TEXT NULL', 'SELECT 1');
PREPARE api_stmt FROM @planted_goal_sql;
EXECUTE api_stmt;
DEALLOCATE PREPARE api_stmt;

SET @planted_status := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planted_seeds' AND COLUMN_NAME = 'status'
);
SET @planted_status_sql := IF(
  @planted_status = 0,
  'ALTER TABLE planted_seeds ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''active''',
  'SELECT 1'
);
PREPARE api_stmt FROM @planted_status_sql;
EXECUTE api_stmt;
DEALLOCATE PREPARE api_stmt;

SET @planted_note := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planted_seeds' AND COLUMN_NAME = 'reflection'
);
SET @planted_note_sql := IF(@planted_note = 0, 'ALTER TABLE planted_seeds ADD COLUMN reflection TEXT NULL', 'SELECT 1');
PREPARE api_stmt FROM @planted_note_sql;
EXECUTE api_stmt;
DEALLOCATE PREPARE api_stmt;

INSERT INTO schema_updates (update_key, applied_at) VALUES ('api-2026-10-18', NOW())
ON DUPLICATE KEY UPDATE applied_at = applied_at;
