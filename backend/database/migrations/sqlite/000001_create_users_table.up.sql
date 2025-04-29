CREATE TABLE
    IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        username TEXT UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birthday TEXT NOT NULL,
        about_me TEXT,
        profile_pic TEXT NOT NULL DEFAULT 'avatar.webp',
        account_type TEXT NOT NULL DEFAULT 'public' CHECK (account_type IN ('public', 'private')),
        created_at TIMESTAMP DEFAULT (DATETIME ('now', 'localtime'))
    );