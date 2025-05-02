CREATE TABLE private_chats (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL CHECK(length(content) > 0),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
    CHECK(sender_id != receiver_id),
    FOREIGN KEY (sender_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);