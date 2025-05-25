CREATE TABLE
    group_invitations (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        invitee_id TEXT NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rejected')),
        invited_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
        UNIQUE (group_id, invitee_id),
        FOREIGN KEY (group_id) REFERENCES groups (id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (invitee_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
    );