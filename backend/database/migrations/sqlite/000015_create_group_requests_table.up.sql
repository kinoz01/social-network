CREATE TABLE
    IF NOT EXISTS group_requests (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        requester_id TEXT NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (group_id, requester_id),
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
        FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE
    );