const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3003;

const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

function readTasks() {
  ensureDataDir();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeTasks(tasks) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

app.get('/api/tasks', (req, res) => {
  try {
    res.json(readTasks());
  } catch (e) {
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const tasks = readTasks();
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title: req.body.title || 'Untitled',
      done: false,
      dueDate: req.body.dueDate || null,
      dueTime: req.body.dueTime || null,
      createdAt: new Date().toISOString()
    };
    tasks.push(task);
    writeTasks(tasks);
    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add task' });
  }
});

app.patch('/api/tasks/:id', (req, res) => {
  try {
    const tasks = readTasks();
    const i = tasks.findIndex(t => t.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Task not found' });
    tasks[i] = { ...tasks[i], ...req.body };
    writeTasks(tasks);
    res.json(tasks[i]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    let tasks = readTasks();
    tasks = tasks.filter(t => t.id !== req.params.id);
    writeTasks(tasks);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`To-Do app running at http://localhost:${PORT}`);
});
