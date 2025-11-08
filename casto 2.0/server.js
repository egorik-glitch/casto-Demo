const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Путь к файлу с сообщениями
const CHAT_FILE = path.join(__dirname, 'casto_messages.json');

// Создаём файл, если его нет
if (!fs.existsSync(CHAT_FILE)) {
  fs.writeFileSync(CHAT_FILE, '[]');
}

// Статические файлы (index.html и т.д.)
app.use(express.static('public'));
app.use(express.json());

// Получить сообщения (с фильтрацией по ^ник)
app.get('/messages', (req, res) => {
  const username = req.query.username || 'Аноним';

  fs.readFile(CHAT_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Ошибка чтения файла:', err);
      return res.status(500).send('Не удалось прочитать файл');
    }

    let messages = [];
    try {
      messages = data.trim() ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Файл повреждён, возвращаем пустой');
    }

    // Показываем: общие + только адресованные пользователю
    const filtered = messages.filter(msg => {
      const content = (msg.content || '').trim();
      if (!content.startsWith('^')) return true;

      const match = content.match(/^\^(\w+)/);
      if (!match) return true;

      const targetNick = match[1];
      return targetNick === username.trim();
    });

    res.json(filtered);
  });
});

// Отправить сообщение
app.post('/messages', (req, res) => {
  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).send('Нет автора или текста');
  }

  fs.readFile(CHAT_FILE, 'utf8', (err, data) => {
    let messages = [];
    try {
      messages = data.trim() ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Файл повреждён, создаём новый');
    }

    messages.push({
      author: author.trim(),
      content: content.trim(),
      timestamp: new Date().toISOString()
    });

    fs.writeFile(CHAT_FILE, JSON.stringify(messages, null, 2), (err) => {
      if (err) {
        console.error('Ошибка записи:', err);
        return res.status(500).send('Не удалось сохранить');
      }
      res.status(201).send('OK');
    });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('🔷 Casto запущен: http://localhost:3000');
  console.log('🛠 Сообщения хранятся в: ' + CHAT_FILE);
});
