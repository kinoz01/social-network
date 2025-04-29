CREATE TABLE group_users (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    users_id TEXT NOT NULL,
    UNIQUE(group_id, users_id),
    FOREIGN KEY (group_id) REFERENCES groups (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (users_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);