CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    related_user_id TEXT NULL,
    related_group_id TEXT NULL,
    related_event_id TEXT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (related_group_id) REFERENCES groups (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (related_event_id) REFERENCES group_events (id) ON UPDATE CASCADE ON DELETE CASCADE,
     CHECK (
        related_user_id IS NOT NULL OR
        related_group_id IS NOT NULL OR
        related_event_id IS NOT NULL
    )
);