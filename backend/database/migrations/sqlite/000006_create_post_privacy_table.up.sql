CREATE TABLE post_privacy (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    allowed_users TEXT,
    FOREIGN KEY (post_id) REFERENCES posts (post_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (allowed_users) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);