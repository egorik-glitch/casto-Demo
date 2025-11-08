const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

const MESSAGES_FILE = './casto_messages.json';

// Создаём файл, если его нет
if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, '[]');
}

app.use(express.static('public'));
app.use(express.json());

// Получить все сообщения
app.get('/messages', (req, res) => {
  fs.readFile(MESSAGES_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Ошибка чтения');
    res.json(JSON.parse(data));
  });
});

// Отправить сообщение
app.post('/send', (req, res) => {
  const { author, text, timestamp } = req.body;
  if (!author || !text || !timestamp) {
    return res.status(400).send('Нет данных');
  }

  fs.readFile(MESSAGES_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Ошибка');
    const messages = JSON.parse(data);
    messages.push({ author, text, timestamp });
    fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), (err) => {
      if (err) return res.status(500).send('Ошибка записи');

      // Рассылка всем через WebSocket
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'new_message',
            message: { author, text, timestamp }
          }));
        }
      });

      res.send('OK');
    });
  });
});

// Удалить сообщение
app.post('/delete', (req, res) => {
  const { author, timestamp } = req.body;
  fs.readFile(MESSAGES_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Ошибка');
    let messages = JSON.parse(data);
    const index = messages.findIndex(m => m.timestamp == timestamp && m.author === author);
    if (index === -1) return res.status(403).send('Нельзя');

    messages.splice(index, 1);
    fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), () => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'delete_message', timestamp }));
        }
      });
      res.send('OK');
    });
  });
});

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`Casto запущен: http://localhost:${PORT}`);
});

// WebSocket (для обновлений)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ noServer: server });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
    } catch (e) {
      console.log('Ошибка WebSocket:', e);
    }
  });
});
