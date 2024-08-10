const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database(':memory:');

app.use(bodyParser.json());
app.use(express.static('public')); // Раздача статических файлов

// Создайте таблицу пользователей
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, tokens INTEGER)");
});

// Регистрация пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (row) {
            return res.status(400).json({ message: 'Пользователь уже существует!' });
        } else {
            const userId = (Math.floor(Math.random() * 10000)); // Генерация ID
            const userTokens = username === 'specialUser' ? 9999 : 0; // Специальный ID
            db.run("INSERT INTO users (id, username, password, tokens) VALUES (?, ?, ?, ?)",
                [userId, username, password, userTokens]);
            return res.status(201).json({ message: 'Регистрация успешна!', userId, userTokens });
        }
    });
});

// Вход пользователя
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (row) {
            return res.json({ 
                message: `Добро пожаловать, ${username}!`, 
                userId: row.id, 
                tokens: row.tokens 
            });
        } else {
            return res.status(400).json({ message: 'Неверное имя пользователя или пароль.' });
        }
    });
});

app.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
