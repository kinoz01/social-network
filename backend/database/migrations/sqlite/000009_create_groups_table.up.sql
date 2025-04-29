CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    groups_name TEXT,
    group_owner TEXT NOT NULL,
    desciption TEXT,
    created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime')),
    FOREIGN KEY (group_owner) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);