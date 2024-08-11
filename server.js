const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = require('./database');
const app = express();
const PORT = 3000;

// Используем body-parser для обработки JSON и URL-encoded данных
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Обслуживание статических файлов из папки public
app.use(express.static('public'));

const saltRounds = 10;

// Регистрация пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            return res.status(500).send('Ошибка при хешировании пароля.');
        }
        db.run(`INSERT INTO users (username, password, token_count) VALUES (?, ?, ?)`, [username, hash, 0], function(err) {
            if (err) {
                return res.status(400).send('Ошибка: ' + err.message);
            }
            res.send('Пользователь зарегистрирован с ID: ' + this.lastID);
        });
    });
});

// Обновленная часть входа
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            return res.status(400).send('Ошибка: ' + err.message);
        }
        if (!row) {
            return res.status(401).send('Неверное имя пользователя или пароль');
        }
        
        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                return res.status(500).send('Ошибка при сравнении паролей.');
            }
            if (result) {
                // Возвращаем JSON с данными пользователя
                return res.json({
                    username: row.username,
                    id: row.id,
                    token_count: row.token_count
                });
            } else {
                res.status(401).send('Неверное имя пользователя или пароль');
            }
        });
    });
});

app.post('/createPublication', (req, res) => {
    const { title, link, description, userId } = req.body;

    if (!isValidGoogleDriveLink(link)) {
        return res.status(400).send({ message: 'Ссылка должна быть на Google Диск.' });
    }

    db.run(`INSERT INTO publications (title, link, description, user_id, likes) VALUES (?, ?, ?, ?, ?)`, [title, link, description, userId, 0], function(err) {
        if (err) {
            return res.status(400).send({ message: 'Ошибка: ' + err.message });
        }
        res.send({ message: 'Публикация создана с ID: ' + this.lastID });
    });
});

// Получение всех публикаций
app.get('/publications', (req, res) => {
    db.all(`SELECT * FROM publications ORDER BY likes DESC`, [], (err, rows) => {
        if (err) {
            return res.status(400).send('Ошибка: ' + err.message);
        }
        res.json(rows);
    });
});

// Лайк публикации с проверкой на ранее выполненный лайк
app.post('/likePublication/:id', (req, res) => {
    const id = req.params.id;
    const userId = req.body.userId;

    // Проверка, ставил ли пользователь лайк ранее
    db.get(`SELECT * FROM user_likes WHERE user_id = ? AND publication_id = ?`, [userId, id], (err, row) => {
        if (err) {
            return res.status(400).send('Ошибка: ' + err.message);
        }
        if (row) {
            return res.status(400).send('Вы уже поставили лайк на эту публикацию.');
        }

        // Добавляем лайк к публикации и сохраняем лайк пользователя
        db.run(`UPDATE publications SET likes = likes + 1 WHERE id = ?`, [id], function(err) {
            if (err) {
                return res.status(400).send('Ошибка: ' + err.message);
            }

            db.run(`INSERT INTO user_likes (user_id, publication_id) VALUES (?, ?)`, [userId, id], function(err) {
                if (err) {
                    return res.status(400).send('Ошибка: ' + err.message);
                }
                res.send({ message: 'Лайк добавлен.' });
            });
        });
    });
});


app.delete('/deletePublication/:id', (req, res) => {
    const id = req.params.id;
    const userId = req.body.userId; // Прием userId из тела запроса

    db.get(`SELECT * FROM publications WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(400).send('Ошибка: ' + err.message);
        }
        if (!row) {
            return res.status(404).send('Публикация не найдена.');
        }
        if (row.user_id !== userId) {
            return res.status(403).send('У вас нет прав для удаления этой публикации.');
        }

        db.run(`DELETE FROM publications WHERE id = ?`, [id], function(err) {
            if (err) {
                return res.status(400).send('Ошибка: ' + err.message);
            }
            res.send({ message: 'Публикация удалена.' });
        });
    });
});


function isValidGoogleDriveLink(link) {
    const regex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/.+/;
    return regex.test(link);
}




// Обработка добавления токенов
app.post('/addToken', (req, res) => {
    const { username } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err || !row) {
            return res.status(400).send('Ошибка: ' + (err ? err.message : 'Пользователь не найден'));
        }

        if (row.id === 10) {
            return res.send('Пользователь с ID 10 имеет бесконечное количество токенов.');
        }

        db.run(`UPDATE users SET token_count = token_count + 1 WHERE username = ?`, [username], function(updateErr) {
            if (updateErr) {
                return res.status(400).send('Ошибка при добавлении токена: ' + updateErr.message);
            }
            res.send(`Текущий счётчик токенов для ${username}: ${row.token_count + 1}`);
        });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер работает на http://localhost:${PORT}`);
});
