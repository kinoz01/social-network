CREATE TABLE comments (
    comment_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    content TEXT NOT NULL CHECK(length(trim(content)) > 0 AND length(content) <= 2000),
    img_comment TEXT CHECK(img_comment IS NULL OR 
        (img_comment LIKE '%.jpg' OR 
         img_comment LIKE '%.png' OR 
         img_comment LIKE '%.webp')
    ),
    created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id)  ON DELETE CASCADE
);
