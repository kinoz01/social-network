CREATE TABLE like_reaction (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    post_id TEXT NULL,
    comment_id TEXT NULL,
    react_type TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts (post_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments (comment_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id, comment_id)
);