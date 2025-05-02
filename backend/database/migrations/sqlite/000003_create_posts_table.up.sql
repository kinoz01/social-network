CREATE TABLE posts (
    post_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    group_id TEXT,
    body TEXT NOT NULL CHECK(length(body) > 0 AND length(body) <= 10000),
    img_post CHECK(img_post IS NULL OR
     img_post LIKE '%.jpg' OR
     img_post LIKE '%.png' OR
     img_post LIKE '%.webp'),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'private', 'group')),
    created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups (id) ON UPDATE CASCADE ON DELETE CASCADE
);