CREATE TABLE follow_requests (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    followed_id TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted')), 
    created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
    UNIQUE(follower_id, followed_id),
    FOREIGN KEY (follower_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CHECK(follower_id != followed_id)
);