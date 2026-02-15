const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const themeToggle = document.getElementById('themeToggle');
const historyList = document.getElementById('historyList');
const historyPanel = document.getElementById('historyPanel');

let current = '0';
let previous = '';
let operation = null;
let shouldResetDisplay = false;
const API = '/api';

function updateDisplay() {
  resultEl.textContent = formatDisplay(current);
  expressionEl.textContent = previous + (operation ? ` ${getOpSymbol(operation)}` : '');
}

function formatDisplay(value) {
  const str = String(value);
  if (str.length > 12) return Number(value).toExponential(4);
  return str;
}

function getOpSymbol(op) {
  const map = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  return map[op] || op;
}

function inputDigit(d) {
  if (shouldResetDisplay) {
    current = d === '.' ? '0.' : d;
    shouldResetDisplay = false;
  } else {
    if (d === '.' && current.includes('.')) return;
    if (d === '0' && current === '0') return;
    if (d !== '.' && current === '0') current = d;
    else current += d;
  }
  updateDisplay();
}

function inputOperator(op) {
  const num = parseFloat(current);
  if (previous !== '' && !shouldResetDisplay) {
    const prev = parseFloat(previous);
    const computed = compute(prev, num, operation);
    current = String(computed);
    sendHistory(`${prev} ${getOpSymbol(operation)} ${num}`, computed);
    resultEl.textContent = formatDisplay(current);
  }
  previous = current;
  operation = op;
  shouldResetDisplay = true;
  updateDisplay();
}

function compute(a, b, op) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? 'Error' : a / b;
    default: return b;
  }
}

function equals() {
  if (operation == null) return;
  const num = parseFloat(current);
  const prev = parseFloat(previous);
  const res = compute(prev, num, operation);
  sendHistory(`${prev} ${getOpSymbol(operation)} ${num}`, res);
  current = res === 'Error' ? '0' : String(res);
  previous = '';
  operation = null;
  shouldResetDisplay = true;
  updateDisplay();
}

function clear() {
  current = '0';
  previous = '';
  operation = null;
  shouldResetDisplay = false;
  updateDisplay();
}

function toggleSign() {
  current = String(-parseFloat(current));
  updateDisplay();
}

function percent() {
  current = String(parseFloat(current) / 100);
  updateDisplay();
}

function backspace() {
  if (current.length <= 1) current = '0';
  else current = current.slice(0, -1);
  updateDisplay();
}

function advanced(adv) {
  const x = parseFloat(current);
  let res;
  switch (adv) {
    case 'sqrt': res = x < 0 ? 'Error' : Math.sqrt(x); break;
    case 'power': res = x * x; break;
    case 'inv': res = x === 0 ? 'Error' : 1 / x; break;
    case 'sin': res = Math.sin(x * Math.PI / 180); break;
    case 'cos': res = Math.cos(x * Math.PI / 180); break;
    case 'tan': res = Math.tan(x * Math.PI / 180); break;
    case 'log': res = x <= 0 ? 'Error' : Math.log10(x); break;
    case 'ln': res = x <= 0 ? 'Error' : Math.log(x); break;
    case 'pi': res = Math.PI; break;
    case 'e': res = Math.E; break;
    default: return;
  }
  current = res === 'Error' ? current : String(res);
  shouldResetDisplay = true;
  updateDisplay();
}

async function sendHistory(expr, result) {
  try {
    await fetch(API + '/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression: expr, result })
    });
    loadHistory();
  } catch (_) {}
}

async function loadHistory() {
  try {
    const res = await fetch(API + '/history');
    const list = await res.json();
    historyList.innerHTML = list.slice(0, 10).map(({ expression, result }) =>
      `<li data-expr="${escapeAttr(expression)}" data-result="${escapeAttr(String(result))}">${escape(expression)} = ${escape(formatDisplay(result))}</li>`
    ).join('');
  } catch (_) {}
}

function escape(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
function escapeAttr(s) {
  return escape(s).replace(/"/g, '&quot;');
}

historyList.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const result = li.dataset.result;
  if (result != null) {
    current = result;
    previous = '';
    operation = null;
    shouldResetDisplay = true;
    updateDisplay();
  }
});

themeToggle.addEventListener('click', () => {
  const theme = document.body.getAttribute('data-theme');
  const next = theme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', next);
  localStorage.setItem('calc-theme', next);
});

const savedTheme = localStorage.getItem('calc-theme');
if (savedTheme) document.body.setAttribute('data-theme', savedTheme);

document.querySelectorAll('.key-num').forEach(btn => {
  btn.addEventListener('click', () => inputDigit(btn.dataset.num));
});
document.querySelectorAll('.key-op').forEach(btn => {
  btn.addEventListener('click', () => inputOperator(btn.dataset.op));
});
document.querySelectorAll('.key-adv').forEach(btn => {
  btn.addEventListener('click', () => advanced(btn.dataset.adv));
});

document.getElementById('themeToggle').addEventListener('click', () => {});

document.querySelector('[data-action="clear"]').addEventListener('click', clear);
document.querySelector('[data-action="equals"]').addEventListener('click', equals);
document.querySelector('[data-action="toggleSign"]').addEventListener('click', toggleSign);
document.querySelector('[data-action="percent"]').addEventListener('click', percent);
document.querySelector('[data-action="backspace"]').addEventListener('click', backspace);

document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
  else if (e.key === '.') inputDigit('.');
  else if (e.key === '+') inputOperator('+');
  else if (e.key === '-') inputOperator('-');
  else if (e.key === '*') inputOperator('*');
  else if (e.key === '/') { e.preventDefault(); inputOperator('/'); }
  else if (e.key === 'Enter') { e.preventDefault(); equals(); }
  else if (e.key === 'Escape') clear();
  else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
});

loadHistory();
updateDisplay();
