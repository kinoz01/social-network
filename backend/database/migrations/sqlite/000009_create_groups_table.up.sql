CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    group_name TEXT,
    group_owner TEXT NOT NULL,
    description TEXT,
    group_pic TEXT,
    created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
    FOREIGN KEY (group_owner) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);