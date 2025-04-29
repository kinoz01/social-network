CREATE TABLE 
users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT DEFAULT "",
    date_birth INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    image TEXT DEFAULT "default-profile.png",
    about TEXT DEFAULT "",
    privacy TEXT DEFAULT "public",
    created_at INTEGER NOT NULL
);