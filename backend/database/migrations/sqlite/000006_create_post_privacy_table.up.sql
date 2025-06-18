CREATE TABLE post_privacy (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    allowed_users TEXT,
    FOREIGN KEY (allowed_users) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);