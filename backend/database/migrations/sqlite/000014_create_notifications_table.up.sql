CREATE TABLE
    notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        sender_id TEXT NULL,
        related_group_id TEXT NULL,
        related_event_id TEXT NULL,
        related_invitation_id TEXT NULL,
        related_request_id TEXT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
        FOREIGN KEY (receiver_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (related_group_id) REFERENCES groups (id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (related_event_id) REFERENCES group_events (id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (related_invitation_id) REFERENCES group_invitations(id) ON DELETE CASCADE,
        FOREIGN KEY (related_request_id) REFERENCES group_requests(id) ON DELETE CASCADE,
        CHECK (
            sender_id IS NOT NULL
            OR related_group_id IS NOT NULL
            OR related_event_id IS NOT NULL
            OR related_invitation_id IS NOT NULL 
            OR related_request_id IS NOT NULL
        )
    );