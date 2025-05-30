CREATE TABLE
    IF NOT EXISTS followers (
        id TEXT PRIMARY KEY,
        follower_id TEXT NOT NULL,
        followed_id TEXT NOT NULL,
        UNIQUE (follower_id, followed_id),
        FOREIGN KEY (follower_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (followed_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
        CHECK (follower_id != followed_id)
    );