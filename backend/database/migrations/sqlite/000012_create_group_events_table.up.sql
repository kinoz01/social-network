CREATE TABLE group_events (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    title VARCHAR NOT NULL CHECK(length(trim(title)) > 0),
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
    FOREIGN KEY (group_id) REFERENCES groups (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS delete_expired_event AFTER INSERT ON group_events BEGIN
DELETE FROM group_events
WHERE
    start_time < DATETIME ('now');

END;