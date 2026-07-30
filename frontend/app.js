/* ╔══════════════════════════════════════════════════════════════╗
   ║              POCKET CASH – APP LOGIC                         ║
   ╚══════════════════════════════════════════════════════════════╝ */

'use strict';

/* ────────────────────────────────────────────
   STATE
──────────────────────────────────────────── */
const state = {
  balance: 18450,
  monthlyAllowance: 25000,
  totalSpent: 6550,
  dailySpent: 380,
  dailyLimit: 850,
  expenses: [
    { id: 1, name: 'Campus Canteen Rice & Curry', category: 'canteen', amount: 380,  time: 'Today 1:15 PM' },
    { id: 2, name: '138 Bus Fare to Campus',      category: 'transport', amount: 120, time: 'Today 8:10 AM' },
    { id: 3, name: 'Study Materials – Photocopy', category: 'study',    amount: 75,  time: 'Yesterday 3:40 PM' },
  ],
  nextId: 4,
};

const CATEGORY_META = {
  canteen:   { label: 'Canteen & Food',  iconClass: 'canteen',   svgPath: '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="#FF7043"/>' },
  transport: { label: 'Transport',       iconClass: 'transport',  svgPath: '<path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" fill="#1565C0"/>' },
  education: { label: 'Education',       iconClass: 'study',      svgPath: '<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm-2-4H8V6h6v2z" fill="#7B1FA2"/>' },
  health:    { label: 'Health',          iconClass: 'health',     svgPath: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#2E7D32"/>' },
  other:     { label: 'Other',           iconClass: 'other',      svgPath: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="#546E7A"/>' },
};

/* ────────────────────────────────────────────
   DOM REFS
──────────────────────────────────────────── */
const $  = (id) => document.getElementById(id);
const $q = (sel) => document.querySelector(sel);

const expenseList  = $('expenseList');
const quickInput   = $('quickInput');
const addModal     = $('addModal');
const modalClose   = $('modalClose');
const modalSubmit  = $('modalSubmit');
const toast        = $('toast');

/* ────────────────────────────────────────────
   RENDER
──────────────────────────────────────────── */
function renderExpenses(list) {
  expenseList.innerHTML = '';
  list.forEach((exp, i) => {
    const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
    const item = document.createElement('div');
    item.className = 'expense-item';
    item.dataset.id = exp.id;
    item.style.animationDelay = `${i * 0.06}s`;
    item.innerHTML = `
      <div class="expense-icon ${meta.iconClass}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">${meta.svgPath}</svg>
      </div>
      <div class="expense-details">
        <p class="expense-name">${escHtml(exp.name)}</p>
        <p class="expense-meta">${escHtml(meta.label)} &bull; ${escHtml(exp.time)}</p>
      </div>
      <div class="expense-amount debit">-Rs. ${exp.amount.toLocaleString()}</div>
    `;
    item.addEventListener('click', () => showExpenseDetail(exp));
    expenseList.appendChild(item);
  });
}

function updateStats() {
  const balanceEl = $q('.balance-amount');
  const spentEl   = $q('.stat-item:last-child .stat-value');
  const dailyEl   = $q('.limit-right');
  if (balanceEl) balanceEl.textContent = `Rs. ${state.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  if (spentEl)   spentEl.textContent   = `Rs. ${state.totalSpent.toLocaleString()}`;
  if (dailyEl)   dailyEl.textContent   = `Rs. ${state.dailySpent} Spent Today`;
}

/* ────────────────────────────────────────────
   QUICK INPUT PARSER
   Supports patterns like:
   "Canteen Bath 350"  → { name: "Canteen Bath", amount: 350 }
   "Bus Fare 80"       → { name: "Bus Fare", amount: 80 }
──────────────────────────────────────────── */
function parseQuickInput(raw) {
  const trimmed = raw.trim();
  const match   = trimmed.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const name   = match[1].trim();
  const amount = parseFloat(match[2]);
  if (!name || isNaN(amount) || amount <= 0) return null;

  // Guess category from keywords
  let category = 'other';
  const lower  = name.toLowerCase();
  if (/canteen|food|lunch|rice|curry|cafe|eat|snack|bath/.test(lower))      category = 'canteen';
  else if (/bus|transport|train|fare|tuktuk|cab|van|uber/.test(lower))      category = 'transport';
  else if (/book|photo|study|education|library|copy|print/.test(lower))     category = 'education';
  else if (/medicine|health|clinic|doctor|pharmacy/.test(lower))            category = 'health';

  return { name, amount, category };
}

function guessCategory(name) {
  const lower = name.toLowerCase();
  if (/canteen|food|lunch|rice|curry|cafe|eat|snack/.test(lower)) return 'canteen';
  if (/bus|transport|train|fare/.test(lower))                     return 'transport';
  if (/book|study|education|copy|print/.test(lower))              return 'education';
  if (/medicine|health|doctor/.test(lower))                       return 'health';
  return 'other';
}

/* ────────────────────────────────────────────
   ADD EXPENSE
──────────────────────────────────────────── */
function addExpense(name, amount, category) {
  const now   = new Date();
  const timeStr = `Today ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
  const exp   = {
    id: state.nextId++,
    name,
    category,
    amount,
    time: timeStr,
  };
  state.expenses.unshift(exp);
  state.balance    -= amount;
  state.totalSpent += amount;
  state.dailySpent += amount;
  updateStats();
  renderExpenses(state.expenses.slice(0, 3));
  showToast(`✅ Added: ${name} – Rs. ${amount}`);
}

/* ────────────────────────────────────────────
   MODAL
──────────────────────────────────────────── */
function openModal() {
  addModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('expName').focus(), 300);
}

function closeModal() {
  addModal.classList.remove('open');
  document.body.style.overflow = '';
  $('expName').value   = '';
  $('expAmount').value = '';
  $('expCategory').value = 'canteen';
}

function showExpenseDetail(exp) {
  const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
  showToast(`${meta.label}: Rs. ${exp.amount} — ${exp.time}`);
}

/* ────────────────────────────────────────────
   TOAST
──────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ────────────────────────────────────────────
   UTILITY
──────────────────────────────────────────── */
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ────────────────────────────────────────────
   CLOCK
──────────────────────────────────────────── */
function updateClock() {
  const el = $q('.status-time');
  if (!el) return;
  const now = new Date();
  el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

/* ────────────────────────────────────────────
   NAV TABS
──────────────────────────────────────────── */
function activateTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');

  const msgs = {
    activity: '📋 Activity – all transactions',
    ai:       '🤖 AI Advisor – coming soon!',
    reports:  '📊 Reports – coming soon!',
    profile:  '👤 Profile – coming soon!',
  };
  if (msgs[tabId]) showToast(msgs[tabId]);
}

/* ────────────────────────────────────────────
   BALANCE CARD ANIMATION
──────────────────────────────────────────── */
function animateCounter(el, target, prefix, suffix, decimals) {
  const duration = 700;
  const start    = Date.now();
  const from     = 0;
  function tick() {
    const elapsed  = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const current  = from + (target - from) * ease;
    el.textContent = prefix + current.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ────────────────────────────────────────────
   INIT
──────────────────────────────────────────── */
function init() {
  // Render initial expenses
  renderExpenses(state.expenses.slice(0, 3));
  updateStats();

  // Clock
  updateClock();
  setInterval(updateClock, 30000);

  // Animate balance on load
  const balEl = $q('.balance-amount');
  if (balEl) animateCounter(balEl, state.balance, 'Rs. ', '', 2);

  // Quick send button
  $('quickSendBtn').addEventListener('click', handleQuickEntry);
  quickInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleQuickEntry();
  });

  function handleQuickEntry() {
    const raw    = quickInput.value.trim();
    if (!raw) { showToast('💬 Type something like "Canteen 350"'); return; }
    const parsed = parseQuickInput(raw);
    if (!parsed) {
      showToast('⚠️ Format: Description Amount  e.g. "Canteen 350"');
      quickInput.focus();
      return;
    }
    quickInput.value = '';
    addExpense(parsed.name, parsed.amount, parsed.category);
  }

  // Modal open via balance card click
  $('balanceCard').addEventListener('click', openModal);

  // Notification button
  $('notifBtn').addEventListener('click', () => {
    showToast('🔔 No new notifications');
  });

  // Avatar
  $('avatarBtn').addEventListener('click', () => {
    showToast('👤 Kasun Perera – Undergrad Student');
  });

  // Modal close
  modalClose.addEventListener('click', closeModal);
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) closeModal();
  });

  // Modal submit
  modalSubmit.addEventListener('click', () => {
    const name     = $('expName').value.trim();
    const amount   = parseFloat($('expAmount').value);
    const category = $('expCategory').value;

    if (!name)              { showToast('⚠️ Enter a description'); return; }
    if (isNaN(amount) || amount <= 0) { showToast('⚠️ Enter a valid amount'); return; }

    closeModal();
    addExpense(name, amount, category);
  });

  // See All button
  $('seeAllBtn').addEventListener('click', () => {
    const isExpanded = expenseList.childElementCount > 3;
    if (isExpanded) {
      renderExpenses(state.expenses.slice(0, 3));
      $('seeAllBtn').textContent = 'See All';
    } else {
      renderExpenses(state.expenses);
      $('seeAllBtn').textContent = 'Show Less';
    }
  });

  // Nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // Keyboard ESC closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  console.log('✅ Pocket Cash App initialized');
}

document.addEventListener('DOMContentLoaded', init);
