const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Optional: store calculation history in memory (persists during session)
let history = [];
const MAX_HISTORY = 50;

app.post('/api/history', (req, res) => {
  const { expression, result } = req.body;
  if (expression != null && result != null) {
    history.unshift({ expression, result, time: new Date().toISOString() });
    history = history.slice(0, MAX_HISTORY);
  }
  res.json({ ok: true });
});

app.get('/api/history', (req, res) => {
  res.json(history);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Calculator server running at http://localhost:${PORT}`);
});
