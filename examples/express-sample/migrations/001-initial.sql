CREATE TABLE post (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    categoryId TEXT,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL
);

CREATE TABLE category (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);