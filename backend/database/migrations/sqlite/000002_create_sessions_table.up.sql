CREATE TABLE
    IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
    );

CREATE TRIGGER IF NOT EXISTS delete_expired_insert BEFORE INSERT ON sessions BEGIN
DELETE FROM sessions
WHERE
    expires_at < DATETIME ('now');

END;

CREATE TRIGGER IF NOT EXISTS delete_expired_delete BEFORE DELETE ON sessions BEGIN
DELETE FROM sessions
WHERE
    expires_at < DATETIME ('now');

END;