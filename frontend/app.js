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
    { id: 1, name: 'Campus Canteen Rice & Curry', category: 'canteen',   amount: 380, time: 'Today 1:15 PM' },
    { id: 2, name: '138 Bus Fare to Campus',      category: 'transport', amount: 120, time: 'Today 8:10 AM' },
    { id: 3, name: 'Study Materials – Photocopy', category: 'study',     amount: 75,  time: 'Yesterday 3:40 PM' },
  ],
  nextId: 4,
};

const CATEGORY_META = {
  canteen:   { label: 'Canteen & Food', iconClass: 'canteen',   svgPath: '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="#FF7043"/>' },
  transport: { label: 'Transport',      iconClass: 'transport', svgPath: '<path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" fill="#1565C0"/>' },
  education: { label: 'Education',      iconClass: 'study',     svgPath: '<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm-2-4H8V6h6v2z" fill="#7B1FA2"/>' },
  health:    { label: 'Health',         iconClass: 'health',    svgPath: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#2E7D32"/>' },
  study:     { label: 'Education',      iconClass: 'study',     svgPath: '<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm-2-4H8V6h6v2z" fill="#7B1FA2"/>' },
  other:     { label: 'Other',          iconClass: 'other',     svgPath: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="#546E7A"/>' },
};

/* ────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ────────────────────────────────────────────
   TOAST
──────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const toast = $('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ────────────────────────────────────────────
   CLOCK
──────────────────────────────────────────── */
function updateClock() {
  const el = document.querySelector('.status-time');
  if (!el) return;
  const now = new Date();
  el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

/* ────────────────────────────────────────────
   RENDER – HOME EXPENSES
──────────────────────────────────────────── */
function renderExpenses(list) {
  const expenseList = $('expenseList');
  if (!expenseList) return;
  expenseList.innerHTML = '';
  list.forEach((exp, i) => {
    const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
    const item = document.createElement('div');
    item.className = 'expense-item';
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
    item.addEventListener('click', () => showToast(`${meta.label}: Rs. ${exp.amount} — ${exp.time}`));
    expenseList.appendChild(item);
  });
}

/* ────────────────────────────────────────────
   RENDER – ACTIVITY LIST
──────────────────────────────────────────── */
function renderActivityList(filter) {
  const list = $('activityList');
  if (!list) return;
  const items = filter === 'all'
    ? state.expenses
    : state.expenses.filter(e => e.category === filter);
  list.innerHTML = '';
  if (items.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:32px 0;">No transactions found.</p>';
    return;
  }
  items.forEach((exp, i) => {
    const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
    const item = document.createElement('div');
    item.className = 'expense-item';
    item.style.animationDelay = `${i * 0.05}s`;
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
    list.appendChild(item);
  });
}

/* ────────────────────────────────────────────
   UPDATE STATS
──────────────────────────────────────────── */
function updateStats() {
  const balanceEl = document.querySelector('.balance-amount');
  const spentEl   = document.querySelector('.stat-item:last-child .stat-value');
  const dailyEl   = document.querySelector('.limit-right');
  if (balanceEl) balanceEl.textContent = `Rs. ${state.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  if (spentEl)   spentEl.textContent   = `Rs. ${state.totalSpent.toLocaleString()}`;
  if (dailyEl)   dailyEl.textContent   = `Rs. ${state.dailySpent} Spent Today`;
}

/* ────────────────────────────────────────────
   QUICK INPUT PARSER
──────────────────────────────────────────── */
function parseQuickInput(raw) {
  const trimmed = raw.trim();
  const match   = trimmed.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const name   = match[1].trim();
  const amount = parseFloat(match[2]);
  if (!name || isNaN(amount) || amount <= 0) return null;

  let category = 'other';
  const lower  = name.toLowerCase();
  if (/canteen|food|lunch|rice|curry|cafe|eat|snack|bath/.test(lower))  category = 'canteen';
  else if (/bus|transport|train|fare|tuktuk|cab|van|uber/.test(lower))  category = 'transport';
  else if (/book|photo|study|education|library|copy|print/.test(lower)) category = 'education';
  else if (/medicine|health|clinic|doctor|pharmacy/.test(lower))        category = 'health';
  return { name, amount, category };
}

/* ────────────────────────────────────────────
   ADD EXPENSE
──────────────────────────────────────────── */
function addExpense(name, amount, category) {
  const now    = new Date();
  const h      = now.getHours();
  const m      = String(now.getMinutes()).padStart(2, '0');
  const ampm   = h >= 12 ? 'PM' : 'AM';
  const hr     = h % 12 || 12;
  const exp    = { id: state.nextId++, name, category, amount, time: `Today ${hr}:${m} ${ampm}` };
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
  const addModal = $('addModal');
  if (addModal) {
    addModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = $('expName'); if (f) f.focus(); }, 300);
  }
}

function closeModal() {
  const addModal = $('addModal');
  if (addModal) {
    addModal.classList.remove('open');
    document.body.style.overflow = '';
    const n = $('expName');   if (n) n.value = '';
    const a = $('expAmount'); if (a) a.value = '';
    const c = $('expCategory'); if (c) c.value = 'canteen';
  }
}

/* ────────────────────────────────────────────
   COUNTER ANIMATION
──────────────────────────────────────────── */
function animateCounter(el, target, prefix, suffix, decimals) {
  const duration = 700;
  const start    = Date.now();
  function tick() {
    const elapsed  = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const current  = target * ease;
    el.textContent = prefix + current.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ────────────────────────────────────────────
   NAV – SCREEN SWITCHING
──────────────────────────────────────────── */
function activateTab(tabId) {
  // Highlight active nav button
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Show the matching screen, hide all others
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${tabId}`);
  if (screen) {
    screen.classList.add('active');
    // Scroll each screen's own scroll-content to top
    const sc = screen.querySelector('.scroll-content');
    if (sc) sc.scrollTop = 0;
  }

  // Populate activity list fresh each time
  if (tabId === 'activity') {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    const allChip = document.querySelector('.filter-chip[data-filter="all"]');
    if (allChip) allChip.classList.add('active');
    renderActivityList('all');
  }

  // Animate report bars when entering Reports tab
  if (tabId === 'reports') {
    setTimeout(() => {
      document.querySelectorAll('.report-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width || '0%';
      });
    }, 80);
  }
}

/* ────────────────────────────────────────────
   AI CHAT
──────────────────────────────────────────── */
function appendAIMessage(text, role) {
  const chat = $('aiChat');
  if (!chat) return;
  const bubble = document.createElement('div');
  bubble.className = `ai-bubble ${role}`;
  if (role === 'ai') {
    bubble.innerHTML = `<div class="ai-avatar">🤖</div><div class="ai-text">${text}</div>`;
  } else {
    bubble.innerHTML = `<div class="ai-text user-text-bubble">${escHtml(text)}</div>`;
  }
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

function getAIReply(msg) {
  const lower = msg.toLowerCase();
  if (/balance|how much|left/.test(lower))
    return `💰 Your current balance is <strong>Rs. ${state.balance.toLocaleString()}</strong>. You've spent Rs. ${state.totalSpent.toLocaleString()} this month.`;
  if (/canteen|food|eat|lunch/.test(lower))
    return `🍛 You've spent <strong>Rs. ${state.expenses.filter(e=>e.category==='canteen').reduce((s,e)=>s+e.amount,0).toLocaleString()}</strong> on canteen so far. Try cooking at home a few days to save!`;
  if (/transport|bus|fare/.test(lower))
    return `🚌 Transport spending looks reasonable. Consider a monthly bus pass if available — it can save up to 20%!`;
  if (/save|saving|tips/.test(lower))
    return `💡 Top tips: 1) Pack lunch 3x/week. 2) Walk short distances. 3) Buy used textbooks. 4) Share transport costs with classmates.`;
  if (/limit|budget/.test(lower))
    return `🎯 Your daily limit is <strong>Rs. ${state.dailyLimit}</strong> and you've spent <strong>Rs. ${state.dailySpent}</strong> today.`;
  return `🤖 I'm your finance advisor! Ask me about your balance, spending, saving tips, or budget limits.`;
}

/* ────────────────────────────────────────────
   INIT  ← all DOM access is HERE, inside DOMContentLoaded
──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Initial render
  renderExpenses(state.expenses.slice(0, 3));
  updateStats();
  updateClock();
  setInterval(updateClock, 30000);

  // Animate balance counter
  const balEl = document.querySelector('.balance-amount');
  if (balEl) animateCounter(balEl, state.balance, 'Rs. ', '', 2);

  /* ── BOTTOM NAV ── */
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  /* ── QUICK ENTRY ── */
  const quickInput   = $('quickInput');
  const quickSendBtn = $('quickSendBtn');

  function handleQuickEntry() {
    if (!quickInput) return;
    const raw = quickInput.value.trim();
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

  if (quickSendBtn) quickSendBtn.addEventListener('click', handleQuickEntry);
  if (quickInput)   quickInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleQuickEntry(); });

  /* ── BALANCE CARD → OPEN MODAL ── */
  const balanceCard = $('balanceCard');
  if (balanceCard) balanceCard.addEventListener('click', openModal);

  /* ── NOTIFICATIONS ── */
  const notifBtn = $('notifBtn');
  if (notifBtn) notifBtn.addEventListener('click', () => showToast('🔔 No new notifications'));

  /* ── AVATAR ── */
  const avatarBtn = $('avatarBtn');
  if (avatarBtn) avatarBtn.addEventListener('click', () => showToast('👤 Kasun Perera – Undergrad Student'));

  /* ── MODAL ── */
  const addModal    = $('addModal');
  const modalClose  = $('modalClose');
  const modalSubmit = $('modalSubmit');

  if (modalClose)  modalClose.addEventListener('click', closeModal);
  if (addModal)    addModal.addEventListener('click', e => { if (e.target === addModal) closeModal(); });

  if (modalSubmit) {
    modalSubmit.addEventListener('click', () => {
      const name     = ($('expName')     || {}).value?.trim() || '';
      const amount   = parseFloat(($('expAmount') || {}).value || '0');
      const category = ($('expCategory') || {}).value || 'other';
      if (!name)                     { showToast('⚠️ Enter a description'); return; }
      if (isNaN(amount) || amount <= 0) { showToast('⚠️ Enter a valid amount'); return; }
      closeModal();
      addExpense(name, amount, category);
    });
  }

  /* ── SEE ALL ── */
  const seeAllBtn = $('seeAllBtn');
  if (seeAllBtn) {
    seeAllBtn.addEventListener('click', () => {
      const expenseList = $('expenseList');
      if (!expenseList) return;
      const isExpanded = expenseList.childElementCount > 3;
      if (isExpanded) {
        renderExpenses(state.expenses.slice(0, 3));
        seeAllBtn.textContent = 'See All';
      } else {
        renderExpenses(state.expenses);
        seeAllBtn.textContent = 'Show Less';
      }
    });
  }

  /* ── ACTIVITY FILTER CHIPS ── */
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderActivityList(chip.dataset.filter);
    });
  });

  /* ── AI CHAT ── */
  const aiSendBtn = $('aiSendBtn');
  const aiInput   = $('aiInput');

  function sendAIMessage() {
    if (!aiInput) return;
    const msg = aiInput.value.trim();
    if (!msg) return;
    appendAIMessage(msg, 'user');
    aiInput.value = '';
    setTimeout(() => appendAIMessage(getAIReply(msg), 'ai'), 800);
  }

  if (aiSendBtn) aiSendBtn.addEventListener('click', sendAIMessage);
  if (aiInput)   aiInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendAIMessage(); });

  /* ── PROFILE MENU ── */
  const profileMenuMsgs = {
    pmEditProfile: '✏️ Edit Profile – coming soon!',
    pmSetLimit:    '🎯 Set Daily Limit – coming soon!',
    pmExport:      '📤 Exported! (demo)',
    pmAbout:       'ℹ️ Pocket Cash v1.0 – Smart Student Finance',
  };
  Object.keys(profileMenuMsgs).forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('click', () => showToast(profileMenuMsgs[id]));
  });

  /* ── ESC CLOSES MODAL ── */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  console.log('✅ Pocket Cash App initialized – nav ready');
});
