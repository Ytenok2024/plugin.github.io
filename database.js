const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        token_count INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS publications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        description TEXT NOT NULL,
        user_id INTEGER,
        likes INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Создание таблицы для хранения лайков
    db.run(`CREATE TABLE IF NOT EXISTS user_likes (
        user_id INTEGER,
        publication_id INTEGER,
        PRIMARY KEY (user_id, publication_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (publication_id) REFERENCES publications(id)
    )`);
});

module.exports = db;
