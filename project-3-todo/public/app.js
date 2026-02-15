const taskInput = document.getElementById('taskInput');
const dueDate = document.getElementById('dueDate');
const dueTime = document.getElementById('dueTime');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const stats = document.getElementById('stats');
const themeToggle = document.getElementById('themeToggle');

const API = '/api/tasks';
let tasks = [];
let currentFilter = 'all';

function formatDue(dueDateVal, dueTimeVal) {
  if (!dueDateVal) return null;
  const d = new Date(dueDateVal);
  if (dueTimeVal) {
    const [h, m] = dueTimeVal.split(':');
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  }
  return d;
}

function isOverdue(task) {
  const due = formatDue(task.dueDate, task.dueTime);
  return due && new Date() > due && !task.done;
}

function dueLabel(task) {
  if (!task.dueDate) return '';
  const due = formatDue(task.dueDate, task.dueTime);
  const str = due.toLocaleDateString() + (task.dueTime ? ' ' + task.dueTime : '');
  return isOverdue(task) ? `Overdue: ${str}` : `Due: ${str}`;
}

async function loadTasks() {
  try {
    const res = await fetch(API);
    tasks = await res.json();
    render();
  } catch (e) {
    taskList.innerHTML = '<li class="task-item clay"><span>Failed to load tasks.</span></li>';
  }
}

function render() {
  const filtered = tasks.filter(t => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'active') return !t.done && !isOverdue(t);
    if (currentFilter === 'done') return t.done;
    if (currentFilter === 'overdue') return isOverdue(t);
    return true;
  });

  taskList.innerHTML = filtered.map(task => {
    const overdue = isOverdue(task);
    const dueText = dueLabel(task);
    return `
      <li class="task-item ${task.done ? 'done' : ''} ${overdue ? 'overdue' : ''}" data-id="${task.id}">
        <button class="task-check" aria-label="Toggle done">${task.done ? '✓' : ''}</button>
        <div class="task-body">
          <span class="task-title">${escapeHtml(task.title)}</span>
          ${dueText ? `<div class="task-due">${escapeHtml(dueText)}</div>` : ''}
        </div>
        <button class="task-delete" aria-label="Delete">×</button>
      </li>
    `;
  }).join('');

  const active = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;
  const overdue = tasks.filter(isOverdue).length;
  stats.textContent = `${active} active · ${done} done${overdue ? ` · ${overdue} overdue` : ''}`;

  taskList.querySelectorAll('.task-check').forEach(btn => {
    btn.addEventListener('click', () => toggleDone(btn.closest('.task-item').dataset.id));
  });
  taskList.querySelectorAll('.task-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTask(btn.closest('.task-item').dataset.id));
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        dueDate: dueDate.value || null,
        dueTime: dueTime.value || null
      })
    });
    const task = await res.json();
    tasks.push(task);
    taskInput.value = '';
    dueDate.value = '';
    dueTime.value = '';
    render();
  } catch (e) {
    console.error(e);
  }
}

async function toggleDone(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  try {
    const res = await fetch(`${API}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !task.done })
    });
    const updated = await res.json();
    const i = tasks.findIndex(t => t.id === id);
    tasks[i] = updated;
    render();
  } catch (e) {
    console.error(e);
  }
}

async function deleteTask(id) {
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== id);
    render();
  } catch (e) {
    console.error(e);
  }
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.getAttribute('data-theme');
  const next = theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('todo-theme', next);
});

const savedTheme = localStorage.getItem('todo-theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

loadTasks();
