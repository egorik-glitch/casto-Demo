const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Путь к файлу с сообщениями
const CHAT_FILE = path.join(__dirname, 'casto_messages.json'); // можно назвать D_chat.json или casto.json

// Создаём файл, если его нет
if (!fs.existsSync(CHAT_FILE)) {
  fs.writeFileSync(CHAT_FILE, JSON.stringify([]));
}

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Получить все сообщения
app.get('/messages', (req, res) => {
  fs.readFile(CHAT_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Ошибка чтения файла');
    res.json(JSON.parse(data));
  });
});

// Отправить сообщение
app.post('/messages', (req, res) => {
  const { author, content } = req.body;
  if (!author || !content) return res.status(400).send('Автор или текст отсутствуют');

  fs.readFile(CHAT_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Ошибка');

    const messages = JSON.parse(data);
    messages.push({ author, content, timestamp: new Date().toISOString() });

    fs.writeFile(CHAT_FILE, JSON.stringify(messages, null, 2), (err) => {
      if (err) return res.status(500).send('Ошибка записи');
      res.status(201).send('Сообщение добавлено в Casto!');
    });
  });
});

app.listen(PORT, () => {
  console.log(`🔷 Casto запущен: http://localhost:${PORT}`);
  console.log(`🛠 Сообщения хранятся в: ${CHAT_FILE}`);
});
