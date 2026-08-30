/*
 * Contri & Project Cost Splitter - file:// compatible bundle
 * Built from the original ES-module source.
 * This file intentionally contains all local modules so index.html can be
 * opened directly from disk without a web server.
 */
(function () {
'use strict';

// ---- data.js ----
const __data = (() => {
/**
 * Multi-Group & Clean Slate Data Store for Contri Cost Splitter
 * Dynamic URL Hash Encoding for GitHub Pages & Cloud Hosting
 */

const EMOJIS = ['👨‍💼', '👩‍🎨', '👨‍💻', '👩‍💻', '👨‍🔧', '👩‍🔬', '👨‍🚀', '👩‍🚒', '🦸‍♂️', '🧙‍♀️', '🧑‍🍳', '🕺'];
const MEMBER_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6'];

const CATEGORIES = [
  { id: 'materials', name: 'Materials & Supplies', icon: '📦' },
  { id: 'tools', name: 'Tools & Equipment', icon: '🛠️' },
  { id: 'food', name: 'Food & Refreshments', icon: '🍕' },
  { id: 'travel', name: 'Travel & Transport', icon: '🚗' },
  { id: 'hosting', name: 'Services & Bills', icon: '☁️' },
  { id: 'misc', name: 'Miscellaneous', icon: '📑' }
];

const INITIAL_GROUPS_STORE = {
  activeGroupId: 'group-1',
  groups: [
    {
      id: 'group-1',
      name: 'Main Project Group',
      createdDate: new Date().toISOString().split('T')[0],
      members: [
        { id: 'm1', name: 'Person 1', role: 'Member', avatar: '👨‍💼', color: '#10B981' },
        { id: 'm2', name: 'Person 2', role: 'Member', avatar: '👩‍🎨', color: '#6366F1' },
        { id: 'm3', name: 'Person 3', role: 'Member', avatar: '👨‍💻', color: '#F59E0B' },
        { id: 'm4', name: 'Person 4', role: 'Member', avatar: '👩‍💻', color: '#EC4899' }
      ],
      contri: {
        targetPerMember: 0,
        contributions: {}
      },
      expenses: []
    }
  ]
};

const STORAGE_KEY = 'CONTRI_SPLITTER_MULTI_GROUP_V3';

function loadStore() {
  // Check if opening via shareable link URL hash first
  const hashData = loadFromURLHash();
  if (hashData) {
    saveStore(hashData);
    history.replaceState(null, '', window.location.pathname);
    return hashData;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.groups && data.groups.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
  return INITIAL_GROUPS_STORE;
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Error saving localStorage:', e);
  }
}

function resetStoreToCleanSlate() {
  const store = {
    activeGroupId: 'group-1',
    groups: [
      {
        id: 'group-1',
        name: 'Project 1',
        createdDate: new Date().toISOString().split('T')[0],
        members: [
          { id: 'm1', name: 'Person 1', role: 'Member', avatar: '👨‍💼', color: '#10B981' },
          { id: 'm2', name: 'Person 2', role: 'Member', avatar: '👩‍🎨', color: '#6366F1' },
          { id: 'm3', name: 'Person 3', role: 'Member', avatar: '👨‍💻', color: '#F59E0B' },
          { id: 'm4', name: 'Person 4', role: 'Member', avatar: '👩‍💻', color: '#EC4899' }
        ],
        contri: {
          targetPerMember: 0,
          contributions: {}
        },
        expenses: []
      }
    ]
  };
  saveStore(store);
  return store;
}

/**
 * Encodes current project/group state into a compressed shareable URL
 * Dynamically uses window.location.origin and relative path for GitHub Pages
 */
function generateShareableURLs(store) {
  try {
    const activeGroup = store.groups.find(g => g.id === store.activeGroupId) || store.groups[0];
    const payload = {
      activeGroupId: activeGroup.id,
      groups: [activeGroup]
    };
    const jsonStr = JSON.stringify(payload);
    const encoded = encodeURIComponent(btoa(jsonStr));

    const origin = (window.location.origin && window.location.origin !== 'null') 
      ? window.location.origin 
      : '';
    const pathname = window.location.pathname;

    const fullShareUrl = `${origin}${pathname}#share=${encoded}`;

    return {
      wifiUrl: fullShareUrl,
      currentUrl: fullShareUrl,
      rawHash: `#share=${encoded}`
    };
  } catch (e) {
    console.error('Error generating share link:', e);
    return { wifiUrl: window.location.href, currentUrl: window.location.href };
  }
}

/**
 * Decodes state from URL hash if user opened a shared link
 */
function loadFromURLHash() {
  try {
    const hash = window.location.hash;
    if (hash && hash.includes('#share=')) {
      const encoded = hash.split('#share=')[1];
      if (encoded) {
        const jsonStr = atob(decodeURIComponent(encoded));
        const data = JSON.parse(jsonStr);
        if (data && data.groups) {
          return data;
        }
      }
    }
  } catch (e) {
    console.error('Error loading state from share URL:', e);
  }
  return null;
}

return { EMOJIS, MEMBER_COLORS, CATEGORIES, INITIAL_GROUPS_STORE, loadStore, saveStore, resetStoreToCleanSlate, generateShareableURLs, loadFromURLHash };
})();

// ---- settlement.js ----
const __settlement = (() => {
/**
 * Settlement & Math Engine for Flexible N-Person Cost & Contri Splitter (INR ₹)
 */

function calculateSummary(members, expenses, contri) {
  const memberStats = {};
  
  const targetPerMember = (contri && Number(contri.targetPerMember)) || 0;
  const contributions = (contri && contri.contributions) || {};

  // Initialize member stats dynamically for N members
  members.forEach(m => {
    const paidInPot = Number(contributions[m.id]) || 0;
    memberStats[m.id] = {
      member: m,
      outOfPocketPaid: 0,
      fairShareLiability: 0,
      contriPaid: paidInPot,
      contriTarget: targetPerMember,
      contriBalance: paidInPot - targetPerMember,
      projectExpenseNet: 0,
      contriNet: 0,
      netBalance: 0,
      paidExpensesCount: 0,
      categorySpending: {}
    };
  });

  let totalProjectCost = 0;
  let totalOutOfPocketSpent = 0;
  let totalContriSpent = 0;

  // Process all expenses
  expenses.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    totalProjectCost += amount;

    // Track payer
    if (exp.paidBy === 'contri') {
      totalContriSpent += amount;
    } else if (memberStats[exp.paidBy]) {
      totalOutOfPocketSpent += amount;
      memberStats[exp.paidBy].outOfPocketPaid += amount;
      memberStats[exp.paidBy].paidExpensesCount += 1;
    }

    // Track split liabilities among participants (or default to all members if empty)
    const participants = (exp.participants && exp.participants.length > 0) 
      ? exp.participants 
      : members.map(m => m.id);

    if (participants.length > 0) {
      if (exp.splitType === 'custom' && exp.customSplits) {
        Object.entries(exp.customSplits).forEach(([mId, share]) => {
          if (memberStats[mId]) {
            const shareAmt = Number(share) || 0;
            memberStats[mId].fairShareLiability += shareAmt;
            addCategorySpending(memberStats[mId], exp.category, shareAmt);
          }
        });
      } else {
        // Equal split among participants
        const sharePerPerson = amount / participants.length;
        participants.forEach(mId => {
          if (memberStats[mId]) {
            memberStats[mId].fairShareLiability += sharePerPerson;
            addCategorySpending(memberStats[mId], exp.category, sharePerPerson);
          }
        });
      }
    }
  });

  // Calculate Net balances
  const totalTargetContri = targetPerMember * members.length;
  let totalContriCollected = 0;

  Object.values(memberStats).forEach(stat => {
    totalContriCollected += stat.contriPaid;
    // Project Net = Paid out of pocket - fair share liability
    stat.projectExpenseNet = stat.outOfPocketPaid - stat.fairShareLiability;
    
    // Contri Net = Paid into contri pot - target pot contribution (only if target is set > 0)
    if (targetPerMember > 0) {
      stat.contriNet = stat.contriPaid - stat.contriTarget;
    } else {
      // If no target is set, contri paid counts as out-of-pocket contribution towards pot
      stat.contriNet = stat.contriPaid;
    }

    // Combined Total Net = project expense net + contri net
    stat.netBalance = stat.projectExpenseNet + (targetPerMember > 0 ? stat.contriNet : 0);
  });

  const remainingContriPool = totalContriCollected - totalContriSpent;

  // Compute Optimal Settlements (Who owes whom)
  const settlements = computeOptimalSettlements(memberStats);

  return {
    totalProjectCost,
    totalOutOfPocketSpent,
    totalContriSpent,
    totalTargetContri,
    totalContriCollected,
    remainingContriPool,
    averageFairShare: members.length > 0 ? totalProjectCost / members.length : 0,
    memberStats,
    settlements
  };
}

function addCategorySpending(stat, category, amount) {
  const cat = category || 'misc';
  stat.categorySpending[cat] = (stat.categorySpending[cat] || 0) + amount;
}

/**
 * Min-Cash-Flow Algorithm to settle debts in minimum number of transactions
 */
function computeOptimalSettlements(memberStats) {
  const creditors = []; // Owed money (> +0.01)
  const debtors = [];   // Owes money (< -0.01)

  Object.values(memberStats).forEach(stat => {
    const net = Math.round(stat.netBalance * 100) / 100;
    if (net > 0.01) {
      creditors.push({ id: stat.member.id, name: stat.member.name, avatar: stat.member.avatar, amount: net });
    } else if (net < -0.01) {
      debtors.push({ id: stat.member.id, name: stat.member.name, avatar: stat.member.avatar, amount: Math.abs(net) });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const payment = Math.min(debtor.amount, creditor.amount);
    const roundedPayment = Math.round(payment * 100) / 100;

    if (roundedPayment > 0) {
      transactions.push({
        id: `tx-${i}-${j}-${Date.now()}`,
        fromId: debtor.id,
        fromName: debtor.name,
        fromAvatar: debtor.avatar,
        toId: creditor.id,
        toName: creditor.name,
        toAvatar: creditor.avatar,
        amount: roundedPayment
      });
    }

    debtor.amount -= payment;
    creditor.amount -= payment;

    if (Math.abs(debtor.amount) < 0.01) i++;
    if (Math.abs(creditor.amount) < 0.01) j++;
  }

  return transactions;
}

/**
 * Indian Rupee (INR ₹) Currency Formatter
 */
function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

return { calculateSummary, computeOptimalSettlements, formatCurrency };
})();

// ---- components/navbar.js ----
const __navbar = (() => {
const { formatCurrency } = __settlement;
/**
 * Navigation Bar Component with Group Switcher & Share Link
 */

function renderNavbar(store, activeTab, contriRemaining, { onNavigate, onOpenGroupModal, onOpenSettingsModal, onSwitchGroup, onShareLink }) {
  const nav = document.createElement('header');
  nav.className = 'navbar';

  const currentGroup = store.groups.find(g => g.id === store.activeGroupId) || store.groups[0];

  nav.innerHTML = `
    <div class="nav-container">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <a href="#" class="brand-logo" id="nav-brand">
          <span style="font-size: 1.6rem;">💸</span>
          <span>Contri Splitter</span>
          <span class="brand-badge">INR ₹</span>
        </a>

        <!-- Active Group / Project Dropdown -->
        <div style="display: flex; align-items: center; gap: 0.4rem; background: rgba(30, 41, 59, 0.7); border: 1px solid var(--border-glass); padding: 0.35rem 0.75rem; border-radius: var(--radius-md);">
          <span style="font-size: 0.9rem;">📁</span>
          <select id="group-nav-select" class="form-select" style="background: transparent; border: none; padding: 0; font-weight: 700; color: #fff; cursor: pointer; font-size: 0.9rem; outline: none; max-width: 180px;">
            ${store.groups.map(g => `
              <option value="${g.id}" ${g.id === currentGroup.id ? 'selected' : ''}>${escapeHtml(g.name)} (${(g.members || []).length} members)</option>
            `).join('')}
          </select>
          <button class="btn-secondary" id="manage-groups-btn" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background: rgba(255,255,255,0.08);" title="Manage / Add Groups">
            ⚙️ Groups
          </button>
        </div>
      </div>

      <div class="nav-links">
        <button class="nav-btn ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
          <span>📊 Dashboard</span>
        </button>
        <button class="nav-btn ${activeTab === 'expenses' ? 'active' : ''}" data-tab="expenses">
          <span>📜 Expenses</span>
        </button>
        <button class="nav-btn ${activeTab === 'contri' ? 'active' : ''}" data-tab="contri">
          <span>🏦 Contri Pool</span>
        </button>
        <button class="nav-btn ${activeTab === 'member-spending' ? 'active' : ''}" data-tab="member-spending">
          <span>👤 Member Spending</span>
        </button>
        <button class="nav-btn ${activeTab === 'settlements' ? 'active' : ''}" data-tab="settlements">
          <span>⚡ Settlements</span>
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button class="btn-primary" id="nav-share-btn" style="padding: 0.45rem 0.85rem; font-size: 0.82rem; background: linear-gradient(135deg, #10b981, #059669);" title="Copy Shareable Link for Others">
          🔗 Share Link
        </button>

        <div style="font-size: 0.8rem; background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 0.35rem;">
          <span>🏦 Pot:</span>
          <strong>${formatCurrency(contriRemaining)}</strong>
        </div>

        <button class="btn-secondary" id="nav-settings-btn" style="padding: 0.5rem 0.75rem;" title="Manage Members & Clear Data">
          👥 Members
        </button>
      </div>
    </div>
  `;

  nav.querySelector('#nav-brand')?.addEventListener('click', (e) => {
    e.preventDefault();
    onNavigate('dashboard');
  });

  nav.querySelector('#group-nav-select')?.addEventListener('change', (e) => {
    onSwitchGroup(e.target.value);
  });

  nav.querySelector('#manage-groups-btn')?.addEventListener('click', onOpenGroupModal);
  nav.querySelector('#nav-settings-btn')?.addEventListener('click', onOpenSettingsModal);
  nav.querySelector('#nav-share-btn')?.addEventListener('click', onShareLink);

  nav.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      onNavigate(tab);
    });
  });

  return nav;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderNavbar };
})();

// ---- components/dashboard.js ----
const __dashboard = (() => {
const { formatCurrency } = __settlement;
/**
 * Dashboard Component View (Contri Pool & INR ₹)
 */

function renderDashboard(currentGroup, summary, { onAddExpense, onNavigate }) {
  const container = document.createElement('div');
  container.className = 'dashboard-view';

  const members = currentGroup.members || [];
  const memberCount = members.length;

  // 1. Metrics Bar
  const metricsHTML = `
    <div class="grid-metrics">
      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Total Project Cost</span>
          <div class="metric-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">💳</div>
        </div>
        <div class="metric-value">${formatCurrency(summary.totalProjectCost)}</div>
        <div class="metric-footer">
          <span>Out-of-Pocket: ${formatCurrency(summary.totalOutOfPocketSpent)}</span> · 
          <span>Contri Pool: ${formatCurrency(summary.totalContriSpent)}</span>
        </div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Contri Pool Remaining</span>
          <div class="metric-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">🏦</div>
        </div>
        <div class="metric-value" style="color: ${summary.remainingContriPool >= 0 ? '#34d399' : '#f87171'}">
          ${formatCurrency(summary.remainingContriPool)}
        </div>
        <div class="metric-footer">
          <span>Target: ${formatCurrency(summary.totalTargetContri)}</span> · 
          <span>Collected: ${formatCurrency(summary.totalContriCollected)}</span>
        </div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Per-Person Fair Share</span>
          <div class="metric-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">⚖️</div>
        </div>
        <div class="metric-value">${formatCurrency(summary.averageFairShare)}</div>
        <div class="metric-footer">Target share for each of ${memberCount} members</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Active Settlements</span>
          <div class="metric-icon" style="background: rgba(236, 72, 153, 0.15); color: #f472b6;">🔄</div>
        </div>
        <div class="metric-value">${summary.settlements.length} Transfers</div>
        <div class="metric-footer">Minimal payments needed to balance all accounts</div>
      </div>
    </div>
  `;

  // 2. Dynamic Members N-Grid Section
  const membersGridHTML = `
    <div class="section-header">
      <div class="section-title">
        <span>👥 Member Balances (${memberCount} Members)</span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-primary" id="dash-add-exp-btn">+ Add Expense</button>
        <button class="btn-secondary" id="dash-contri-btn">Manage Contri Pool</button>
      </div>
    </div>

    <div class="members-grid">
      ${members.map(m => {
        const stat = summary.memberStats[m.id] || { outOfPocketPaid: 0, fairShareLiability: 0, contriPaid: 0, contriTarget: 0, netBalance: 0 };
        const net = stat.netBalance;
        let badgeClass = 'even';
        let badgeText = 'Even (₹0.00)';

        if (net > 0.01) {
          badgeClass = 'creditor';
          badgeText = `Gets back ${formatCurrency(net)}`;
        } else if (net < -0.01) {
          badgeClass = 'debtor';
          badgeText = `Owes ${formatCurrency(Math.abs(net))}`;
        }

        const potStatus = stat.contriTarget > 0 
          ? (stat.contriPaid >= stat.contriTarget ? '✅ Fully Paid' : (stat.contriPaid > 0 ? '⚠️ Partial' : '❌ Unpaid'))
          : (stat.contriPaid > 0 ? `Paid ${formatCurrency(stat.contriPaid)}` : 'No Contri Paid');

        return `
          <div class="glass-panel member-card" style="--member-color: ${m.color}">
            <div class="member-header">
              <div class="member-info">
                <div class="avatar-circle" style="border-color: ${m.color}">${m.avatar}</div>
                <div>
                  <div class="member-name">${escapeHtml(m.name)}</div>
                  <div class="member-role">${escapeHtml(m.role || 'Member')}</div>
                </div>
              </div>
              <div class="net-badge ${badgeClass}">${badgeText}</div>
            </div>

            <div class="member-stats-row">
              <div class="stat-item">
                <div class="stat-label">Spent</div>
                <div class="stat-val" style="color: #34d399;">${formatCurrency(stat.outOfPocketPaid)}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Fair Share</div>
                <div class="stat-val" style="color: #fbbf24;">${formatCurrency(stat.fairShareLiability)}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Contri Pot</div>
                <div class="stat-val" style="color: #818cf8;">${formatCurrency(stat.contriPaid)}</div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">
              <span>Contri Status: <strong>${potStatus}</strong></span>
              <button class="btn-member-report" data-mid="${m.id}" style="background: transparent; border: none; color: var(--accent-indigo); cursor: pointer; font-weight: 600;">
                View Deep Dive →
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // 3. Quick Settlement Preview Card
  let settlementsHTML = '';
  if (summary.settlements.length === 0) {
    settlementsHTML = `
      <div class="glass-panel" style="padding: 1.5rem; text-align: center; color: #34d399;">
        🎉 <strong>All accounts are completely balanced! No pending debts between members.</strong>
      </div>
    `;
  } else {
    settlementsHTML = `
      <div class="section-header">
        <div class="section-title">
          <span>⚡ Smart Settlement Summary (Min-Cash-Flow)</span>
        </div>
        <button class="btn-secondary" id="dash-view-settlements">View Complete Settlement Matrix →</button>
      </div>

      <div class="glass-panel" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
        ${summary.settlements.map(s => `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.6); padding: 0.85rem 1.25rem; border-radius: var(--radius-sm); border-left: 3px solid #f43f5e;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 1.2rem;">${s.fromAvatar}</span>
              <div>
                <strong style="color: #fff;">${escapeHtml(s.fromName)}</strong>
                <span style="color: var(--text-muted); font-size: 0.85rem;"> pays </span>
                <strong style="color: #fff;">${escapeHtml(s.toName)}</strong>
                <span style="font-size: 1.2rem; margin-left: 0.25rem;">${s.toAvatar}</span>
              </div>
            </div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #f43f5e;">
              ${formatCurrency(s.amount)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = metricsHTML + membersGridHTML + settlementsHTML;

  // Event Listeners
  container.querySelector('#dash-add-exp-btn')?.addEventListener('click', onAddExpense);
  container.querySelector('#dash-contri-btn')?.addEventListener('click', () => onNavigate('contri'));
  container.querySelector('#dash-view-settlements')?.addEventListener('click', () => onNavigate('settlements'));

  container.querySelectorAll('.btn-member-report').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const memberId = e.currentTarget.getAttribute('data-mid');
      onNavigate('member-spending', { memberId });
    });
  });

  return container;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderDashboard };
})();

// ---- components/expenses.js ----
const __expenses = (() => {
const { formatCurrency } = __settlement; const { CATEGORIES } = __data;
/**
 * Project Expense Ledger Component View (Dynamic Members, INR ₹, Contri)
 */


function renderExpenseList(currentGroup, summary, { onAddExpense, onEditExpense, onDeleteExpense, onExportCSV }) {
  const container = document.createElement('div');
  container.className = 'expenses-view';

  const members = currentGroup.members || [];
  const expenses = currentGroup.expenses || [];

  let selectedCategory = 'all';
  let selectedPayer = 'all';
  let searchQuery = '';

  function getFilteredExpenses() {
    return expenses.filter(exp => {
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;
      if (selectedPayer !== 'all' && exp.paidBy !== selectedPayer) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = exp.title.toLowerCase().includes(q);
        const notesMatch = (exp.notes || '').toLowerCase().includes(q);
        if (!titleMatch && !notesMatch) return false;
      }
      return true;
    });
  }

  function renderContent() {
    const filtered = getFilteredExpenses();

    const categoryOptionsHTML = CATEGORIES.map(c => `
      <option value="${c.id}" ${selectedCategory === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>
    `).join('');

    const payerOptionsHTML = `
      <option value="all" ${selectedPayer === 'all' ? 'selected' : ''}>All Payers</option>
      <option value="contri" ${selectedPayer === 'contri' ? 'selected' : ''}>🏦 Contri Pool Fund</option>
      ${members.map(m => `
        <option value="${m.id}" ${selectedPayer === m.id ? 'selected' : ''}>${m.avatar} ${escapeHtml(m.name)}</option>
      `).join('')}
    `;

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">📜 Project Expense Ledger (${escapeHtml(currentGroup.name)})</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.2rem;">
            Track all out-of-pocket expenses and Contri pool distributions in ₹ INR.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary" id="exp-export-btn">📥 Export CSV</button>
          <button class="btn-primary" id="exp-add-btn">+ Log Expense</button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="glass-panel" style="padding: 1rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; flex: 1;">
          <input type="text" id="exp-search-input" class="form-input" style="max-width: 280px;" placeholder="🔍 Search expenses..." value="${escapeHtml(searchQuery)}">
          
          <select id="exp-cat-select" class="form-select" style="max-width: 200px;">
            <option value="all">All Categories</option>
            ${categoryOptionsHTML}
          </select>

          <select id="exp-payer-select" class="form-select" style="max-width: 200px;">
            ${payerOptionsHTML}
          </select>
        </div>

        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Showing <strong>${filtered.length}</strong> of ${expenses.length} expenses
        </div>
      </div>

      <!-- Expense Table -->
      <div class="glass-panel table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Title</th>
              <th>Category</th>
              <th>Paid By</th>
              <th>Split Rule</th>
              <th style="text-align: right;">Amount (₹)</th>
              <th style="text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🧾</div>
                  No expenses logged yet for this project. Click <strong>"+ Log Expense"</strong> to add one!
                </td>
              </tr>
            ` : filtered.map(exp => {
              const catObj = CATEGORIES.find(c => c.id === exp.category) || { icon: '📑', name: exp.category };
              let payerName = 'Unknown';
              let payerAvatar = '👤';
              let payerStyle = 'color: #fff;';

              if (exp.paidBy === 'contri') {
                payerName = 'Contri Pool Fund';
                payerAvatar = '🏦';
                payerStyle = 'color: #fbbf24; font-weight: 600;';
              } else {
                const member = members.find(m => m.id === exp.paidBy);
                if (member) {
                  payerName = member.name;
                  payerAvatar = member.avatar;
                  payerStyle = `color: ${member.color}; font-weight: 600;`;
                }
              }

              const splitCount = (exp.participants || []).length;
              const splitText = exp.splitType === 'equal' 
                ? `Split (${splitCount}/${members.length} members)` 
                : 'Custom split';

              return `
                <tr>
                  <td style="color: var(--text-muted); font-size: 0.85rem;">${exp.date || 'N/A'}</td>
                  <td>
                    <div style="font-weight: 600; color: #fff;">${escapeHtml(exp.title)}</div>
                    ${exp.notes ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(exp.notes)}</div>` : ''}
                  </td>
                  <td>
                    <span style="font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 0.2rem 0.5rem; border-radius: 4px;">
                      ${catObj.icon} ${escapeHtml(catObj.name)}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.4rem; ${payerStyle}">
                      <span>${payerAvatar}</span>
                      <span>${escapeHtml(payerName)}</span>
                    </div>
                  </td>
                  <td style="font-size: 0.8rem; color: var(--text-muted);">${splitText}</td>
                  <td style="text-align: right; font-weight: 700; color: #fff; font-size: 0.95rem;">
                    ${formatCurrency(exp.amount)}
                  </td>
                  <td style="text-align: center;">
                    <div style="display: flex; gap: 0.35rem; justify-content: center;">
                      <button class="btn-edit-exp btn-secondary" data-id="${exp.id}" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;">✏️ Edit</button>
                      <button class="btn-del-exp btn-secondary" data-id="${exp.id}" style="padding: 0.3rem 0.5rem; font-size: 0.75rem; color: #f43f5e;">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bind Event Listeners
    container.querySelector('#exp-add-btn')?.addEventListener('click', onAddExpense);
    container.querySelector('#exp-export-btn')?.addEventListener('click', onExportCSV);

    const searchInput = container.querySelector('#exp-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderContent();
      });
    }

    const catSelect = container.querySelector('#exp-cat-select');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        selectedCategory = e.target.value;
        renderContent();
      });
    }

    const payerSelect = container.querySelector('#exp-payer-select');
    if (payerSelect) {
      payerSelect.addEventListener('change', (e) => {
        selectedPayer = e.target.value;
        renderContent();
      });
    }

    container.querySelectorAll('.btn-edit-exp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const exp = expenses.find(x => x.id === id);
        if (exp) onEditExpense(exp);
      });
    });

    container.querySelectorAll('.btn-del-exp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this expense?')) {
          onDeleteExpense(id);
        }
      });
    });
  }

  renderContent();
  return container;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderExpenseList };
})();

// ---- components/contri.js ----
const __contri = (() => {
const { formatCurrency } = __settlement;
/**
 * Dedicated Contri (Contribution Pool) Management Page
 */

function renderContriPage(currentGroup, summary, { onUpdateContriTarget, onUpdateMemberContribution, onNavigate }) {
  const container = document.createElement('div');
  container.className = 'contri-view';

  const members = currentGroup.members || [];
  const contri = currentGroup.contri || {};
  const targetPerMember = Number(contri.targetPerMember) || 0;
  const totalTargetPool = targetPerMember * members.length;

  let totalCollected = 0;
  members.forEach(m => {
    totalCollected += (contri.contributions && contri.contributions[m.id]) || 0;
  });

  const contriExpenses = (currentGroup.expenses || []).filter(e => e.paidBy === 'contri');
  const totalContriSpent = contriExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remainingPool = totalCollected - totalContriSpent;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🏦 Contri (Contribution Pool) Tracker</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
          Manage shared group pot contributions for <strong>${escapeHtml(currentGroup.name)}</strong>.
        </p>
      </div>
      <button class="btn-primary" id="edit-target-btn">⚙️ ${targetPerMember > 0 ? 'Edit Target' : 'Set Target Pot Share'}</button>
    </div>

    <!-- Educational Explanation Card -->
    <div class="glass-panel" style="padding: 1.1rem 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid var(--accent-amber); background: rgba(245, 158, 11, 0.08);">
      <div style="font-weight: 700; color: #fbbf24; font-size: 0.95rem; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.4rem;">
        <span>💡 What is a Contri Pot?</span>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-main); line-height: 1.4;">
        <strong>Contri</strong> (short for <em>Contribution Pool / Kitty Fund</em>) is a central pot where members pool money together upfront for a project or trip. 
        When an expense is marked as <strong>"Paid from Contri Pool"</strong>, it is paid directly out of this central fund instead of an individual's wallet.
      </div>
    </div>

    <!-- Summary Metrics Grid -->
    <div class="grid-metrics" style="margin-bottom: 2rem;">
      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Target Contri Pool</span>
          <div class="metric-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">🎯</div>
        </div>
        <div class="metric-value">${targetPerMember > 0 ? formatCurrency(totalTargetPool) : 'Optional'}</div>
        <div class="metric-footer">${targetPerMember > 0 ? `${formatCurrency(targetPerMember)} per member (${members.length} members)` : 'No fixed target set'}</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Collected in Pot</span>
          <div class="metric-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">📥</div>
        </div>
        <div class="metric-value" style="color: #34d399;">${formatCurrency(totalCollected)}</div>
        <div class="metric-footer">${totalTargetPool > 0 ? `${Math.round((totalCollected / totalTargetPool) * 100)}% collected` : 'Total pooled funds'}</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Spent from Contri</span>
          <div class="metric-icon" style="background: rgba(244, 63, 94, 0.15); color: #fbbf24;">📤</div>
        </div>
        <div class="metric-value" style="color: #fbbf24;">${formatCurrency(totalContriSpent)}</div>
        <div class="metric-footer">${contriExpenses.length} expenses paid from pool</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Remaining Cash in Pot</span>
          <div class="metric-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">💰</div>
        </div>
        <div class="metric-value" style="color: ${remainingPool >= 0 ? '#34d399' : '#f87171'}">
          ${formatCurrency(remainingPool)}
        </div>
        <div class="metric-footer">Available balance on hand</div>
      </div>
    </div>

    <!-- Member Contributions Table -->
    <div class="section-header">
      <div class="section-title">
        <span>📋 Member Pot Contribution Tracker (${members.length} Members)</span>
      </div>
    </div>

    <div class="glass-panel table-container" style="margin-bottom: 2rem;">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Target Pot Share</th>
            <th>Amount Paid into Pot</th>
            <th>Dues Remaining</th>
            <th>Payment Status</th>
            <th style="text-align: center;">Quick Action</th>
          </tr>
        </thead>
        <tbody>
          ${members.map(m => {
            const paid = (contri.contributions && contri.contributions[m.id]) || 0;
            const due = targetPerMember > 0 ? Math.max(0, targetPerMember - paid) : 0;

            let statusBadge = '<span style="background: rgba(148, 163, 184, 0.15); color: #cbd5e1; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.78rem;">No Target</span>';
            if (targetPerMember > 0) {
              if (paid >= targetPerMember) {
                statusBadge = '<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.78rem;">✅ Fully Paid</span>';
              } else if (paid > 0) {
                statusBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.78rem;">⚠️ Partial (${formatCurrency(paid)})</span>`;
              } else {
                statusBadge = `<span style="background: rgba(244, 63, 94, 0.15); color: #fb7185; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.78rem;">❌ Unpaid</span>`;
              }
            } else if (paid > 0) {
              statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.78rem;">Paid ${formatCurrency(paid)}</span>`;
            }

            return `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.2rem;">${m.avatar}</span>
                    <div>
                      <strong style="color: #fff;">${escapeHtml(m.name)}</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(m.role || 'Member')}</div>
                    </div>
                  </div>
                </td>
                <td style="font-weight: 600; color: #fff;">${targetPerMember > 0 ? formatCurrency(targetPerMember) : 'Flexible'}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="number" step="50" min="0" class="form-input input-contri-paid" data-mid="${m.id}" value="${paid}" style="width: 120px; padding: 0.35rem 0.6rem; font-size: 0.85rem;">
                    <button class="btn-save-contri-paid btn-secondary" data-mid="${m.id}" style="padding: 0.35rem 0.6rem; font-size: 0.75rem;">Save</button>
                  </div>
                </td>
                <td style="color: ${due > 0 ? '#f43f5e' : '#34d399'}; font-weight: 600;">
                  ${targetPerMember > 0 ? (due > 0 ? formatCurrency(due) : '₹0.00 (Cleared)') : 'N/A'}
                </td>
                <td>${statusBadge}</td>
                <td style="text-align: center;">
                  ${targetPerMember > 0 && paid < targetPerMember ? `
                    <button class="btn-mark-full btn-outline-emerald" data-mid="${m.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: var(--radius-sm); cursor: pointer;">
                      Mark Paid (${formatCurrency(targetPerMember)})
                    </button>
                  ` : `
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Cleared</span>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Contri Pool Expenses Table -->
    <div class="section-header">
      <div class="section-title">
        <span>📤 Expenses Funded Directly from Contri Pool</span>
      </div>
    </div>

    <div class="glass-panel table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Category</th>
            <th>Split Rule</th>
            <th style="text-align: right;">Amount Spent</th>
          </tr>
        </thead>
        <tbody>
          ${contriExpenses.length === 0 ? `
            <tr>
              <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                No expenses have been paid out of the Contri pool yet.
              </td>
            </tr>
          ` : contriExpenses.map(e => `
            <tr>
              <td style="color: var(--text-muted); font-size: 0.85rem;">${e.date || 'N/A'}</td>
              <td style="font-weight: 600; color: #fff;">${escapeHtml(e.title)}</td>
              <td><span style="background: rgba(255,255,255,0.06); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${escapeHtml(e.category)}</span></td>
              <td style="font-size: 0.8rem; color: var(--text-muted);">Split equally among ${(e.participants || []).length} members</td>
              <td style="text-align: right; font-weight: 700; color: #fb7185;">${formatCurrency(e.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Bind Event Listeners
  container.querySelector('#edit-target-btn')?.addEventListener('click', () => {
    const input = prompt('Enter target Contri contribution per member (₹ INR, or 0 for flexible):', targetPerMember);
    if (input !== null) {
      const val = parseFloat(input);
      if (!isNaN(val) && val >= 0) {
        onUpdateContriTarget(val);
      }
    }
  });

  container.querySelectorAll('.btn-save-contri-paid').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mId = e.currentTarget.getAttribute('data-mid');
      const inputEl = container.querySelector(`.input-contri-paid[data-mid="${mId}"]`);
      if (inputEl) {
        const val = parseFloat(inputEl.value) || 0;
        onUpdateMemberContribution(mId, val);
      }
    });
  });

  container.querySelectorAll('.btn-mark-full').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mId = e.currentTarget.getAttribute('data-mid');
      onUpdateMemberContribution(mId, targetPerMember);
    });
  });

  return container;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderContriPage };
})();

// ---- components/memberSpending.js ----
const __memberSpending = (() => {
const { formatCurrency } = __settlement; const { CATEGORIES } = __data;
/**
 * Member Spending Deep Dive View (Dynamic Members, INR ₹, Contri)
 */


function renderMemberSpendingPage(currentGroup, summary, initialMemberId, { onNavigate }) {
  const container = document.createElement('div');
  container.className = 'member-spending-view';

  const members = currentGroup.members || [];
  const expenses = currentGroup.expenses || [];

  let currentMemberId = initialMemberId || members[0]?.id || 'm1';

  function renderContent() {
    const member = members.find(m => m.id === currentMemberId) || members[0];
    if (!member) {
      container.innerHTML = `<div class="glass-panel" style="padding: 2rem; text-align: center; color: var(--text-muted);">No members found in this group. Please add members in settings.</div>`;
      return;
    }

    const stat = summary.memberStats[member.id] || {};
    const paidByMember = expenses.filter(e => e.paidBy === member.id);

    // Category breakdown math
    const catTotals = stat.categorySpending || {};
    const maxCatVal = Math.max(...Object.values(catTotals), 1);

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">📊 Individual Spending & Expense Report</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
            Detailed breakdown of how much each person spent in <strong>${escapeHtml(currentGroup.name)}</strong>.
          </p>
        </div>
      </div>

      <!-- Member Selector Tabs -->
      <div class="glass-panel" style="padding: 0.75rem; margin-bottom: 2rem; display: flex; gap: 0.5rem; overflow-x: auto;">
        ${members.map(m => `
          <button class="member-tab-btn ${m.id === member.id ? 'active' : ''}" data-mid="${m.id}" style="
            display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.1rem; border-radius: var(--radius-md);
            border: 1px solid ${m.id === member.id ? m.color : 'rgba(255,255,255,0.08)'};
            background: ${m.id === member.id ? 'rgba(30, 41, 59, 0.9)' : 'transparent'};
            color: ${m.id === member.id ? '#fff' : 'var(--text-muted)'};
            font-weight: ${m.id === member.id ? '700' : '500'};
            cursor: pointer; transition: all 0.2s ease; whitespace: nowrap;
          ">
            <span style="font-size: 1.2rem;">${m.avatar}</span>
            <span>${escapeHtml(m.name)}</span>
          </button>
        `).join('')}
      </div>

      <!-- Selected Member Summary Profile Card -->
      <div class="glass-panel" style="padding: 1.75rem; margin-bottom: 2rem; border-left: 6px solid ${member.color}; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; align-items: center;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="avatar-circle" style="width: 60px; height: 60px; font-size: 2rem; border-color: ${member.color};">${member.avatar}</div>
          <div>
            <h3 style="font-size: 1.4rem; font-weight: 700; color: #fff;">${escapeHtml(member.name)}</h3>
            <div style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(member.role || 'Team Member')}</div>
          </div>
        </div>

        <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total Out-of-Pocket Spent</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #34d399; margin-top: 0.2rem;">
            ${formatCurrency(stat.outOfPocketPaid)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${stat.paidExpensesCount || 0} direct expenses paid</div>
        </div>

        <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total Fair Share Liability</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #fbbf24; margin-top: 0.2rem;">
            ${formatCurrency(stat.fairShareLiability)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">Share of project expenses</div>
        </div>

        <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Contri Pot Paid</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #818cf8; margin-top: 0.2rem;">
            ${formatCurrency(stat.contriPaid)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">
            ${stat.contriTarget > 0 ? `Target: ${formatCurrency(stat.contriTarget)}` : 'Flexible pot contribution'}
          </div>
        </div>
      </div>

      <!-- Category Breakdown Chart & Expenses Grid -->
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; margin-bottom: 2rem;">
        
        <!-- Category Visual Progress Bars -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 1.25rem;">
            🏷️ Spending by Category
          </h4>
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${CATEGORIES.map(c => {
              const val = catTotals[c.id] || 0;
              const pct = Math.round((val / maxCatVal) * 100);
              return `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.35rem;">
                    <span>${c.icon} ${escapeHtml(c.name)}</span>
                    <strong style="color: #fff;">${formatCurrency(val)}</strong>
                  </div>
                  <div style="height: 8px; width: 100%; background: rgba(15,23,42,0.8); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${pct}%; background: ${member.color}; border-radius: 4px; transition: width 0.4s ease;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Expenses Paid by This Member -->
        <div class="glass-panel table-container">
          <div style="padding: 1.25rem 1.25rem 0 1.25rem; font-weight: 700; color: #fff; font-size: 1rem;">
            🧾 Itemized Out-of-Pocket Receipts Paid by ${escapeHtml(member.name)} (${paidByMember.length})
          </div>
          <table class="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th style="text-align: right;">Amount Paid (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${paidByMember.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    No out-of-pocket expenses logged by ${escapeHtml(member.name)} yet.
                  </td>
                </tr>
              ` : paidByMember.map(e => `
                <tr>
                  <td style="color: var(--text-muted); font-size: 0.85rem;">${e.date || 'N/A'}</td>
                  <td style="font-weight: 600; color: #fff;">${escapeHtml(e.title)}</td>
                  <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(e.category)}</td>
                  <td style="text-align: right; font-weight: 700; color: #34d399;">${formatCurrency(e.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event listeners
    container.querySelectorAll('.member-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentMemberId = e.currentTarget.getAttribute('data-mid');
        renderContent();
      });
    });
  }

  renderContent();
  return container;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderMemberSpendingPage };
})();

// ---- components/settlementView.js ----
const __settlementView = (() => {
const { formatCurrency } = __settlement;
/**
 * Complete Settlement Matrix & Transaction Flow View (Dynamic Members, INR ₹, Contri)
 */

function renderSettlementView(currentGroup, summary, { onMarkSettled }) {
  const container = document.createElement('div');
  container.className = 'settlement-view';

  const members = currentGroup.members || [];
  const settlements = summary.settlements;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">⚡ Smart Debt Settlement Matrix (${escapeHtml(currentGroup.name)})</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
          Min-Cash-Flow mathematical resolution to balance all ${members.length} members with the minimal possible transfers.
        </p>
      </div>
    </div>

    <!-- Active Settlements List -->
    <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem;">
      <h3 style="font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>🔄 Required Payments (${settlements.length})</span>
      </h3>

      ${settlements.length === 0 ? `
        <div style="text-align: center; padding: 2.5rem; color: #34d399;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
          <h4 style="font-size: 1.2rem; font-weight: 700; color: #fff;">All Accounts Completely Settled!</h4>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
            No pending balances or transfers required between any of the members.
          </p>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${settlements.map(s => `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: rgba(15, 23, 42, 0.7); padding: 1.25rem 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-glass); border-left: 4px solid var(--accent-rose);">
              
              <!-- Debtor -->
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div class="avatar-circle" style="width: 46px; height: 46px; font-size: 1.5rem;">${s.fromAvatar}</div>
                <div>
                  <div style="font-weight: 700; color: #fff; font-size: 1.05rem;">${escapeHtml(s.fromName)}</div>
                  <div style="font-size: 0.75rem; color: #f43f5e; font-weight: 600;">OWES MONEY</div>
                </div>
              </div>

              <!-- Arrow Transfer indicator -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.2rem;">
                <div style="font-size: 1.25rem; font-weight: 700; color: #f43f5e; background: rgba(244, 63, 94, 0.1); padding: 0.35rem 1rem; border-radius: 20px; border: 1px solid rgba(244, 63, 94, 0.3);">
                  ${formatCurrency(s.amount)}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">pays →</div>
              </div>

              <!-- Creditor -->
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div>
                  <div style="font-weight: 700; color: #fff; font-size: 1.05rem; text-align: right;">${escapeHtml(s.toName)}</div>
                  <div style="font-size: 0.75rem; color: #34d399; font-weight: 600; text-align: right;">GETS PAID</div>
                </div>
                <div class="avatar-circle" style="width: 46px; height: 46px; font-size: 1.5rem;">${s.toAvatar}</div>
              </div>

              <!-- Action button -->
              <div>
                <button class="btn-settle-item btn-primary" data-from="${s.fromName}" data-to="${s.toName}" data-amount="${s.amount}" style="font-size: 0.8rem; padding: 0.5rem 0.9rem;">
                  ✓ Mark Paid
                </button>
              </div>

            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Member Net Breakdown Grid -->
    <div class="section-header">
      <div class="section-title">
        <span>📊 Comprehensive Member Net Position Summary (${members.length} Members)</span>
      </div>
    </div>

    <div class="glass-panel table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Out-of-Pocket Spent</th>
            <th>Fair Share Liability</th>
            <th>Project Expense Net</th>
            <th>Contri Pot Paid</th>
            <th style="text-align: right;">Combined Net Balance</th>
          </tr>
        </thead>
        <tbody>
          ${members.map(m => {
            const stat = summary.memberStats[m.id] || { outOfPocketPaid: 0, fairShareLiability: 0, projectExpenseNet: 0, contriNet: 0, netBalance: 0 };
            const net = stat.netBalance;
            let netColor = '#cbd5e1';
            if (net > 0.01) netColor = '#34d399';
            else if (net < -0.01) netColor = '#f87171';

            return `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span>${m.avatar}</span>
                    <strong style="color: #fff;">${escapeHtml(m.name)}</strong>
                  </div>
                </td>
                <td style="color: #34d399; font-weight: 600;">${formatCurrency(stat.outOfPocketPaid)}</td>
                <td style="color: #fbbf24; font-weight: 600;">${formatCurrency(stat.fairShareLiability)}</td>
                <td style="color: ${stat.projectExpenseNet >= 0 ? '#34d399' : '#f87171'}; font-weight: 600;">
                  ${formatCurrency(stat.projectExpenseNet)}
                </td>
                <td style="color: #818cf8; font-weight: 600;">
                  ${formatCurrency(stat.contriPaid)}
                </td>
                <td style="text-align: right; font-weight: 700; color: ${netColor}; font-size: 1.05rem;">
                  ${formatCurrency(net)}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Event Listeners
  container.querySelectorAll('.btn-settle-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const from = e.currentTarget.getAttribute('data-from');
      const to = e.currentTarget.getAttribute('data-to');
      const amount = e.currentTarget.getAttribute('data-amount');
      onMarkSettled({ from, to, amount });
    });
  });

  return container;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderSettlementView };
})();

// ---- components/expenseFormModal.js ----
const __expenseFormModal = (() => {
const { CATEGORIES } = __data;
/**
 * Modal Component for Adding / Editing Expenses (Dynamic Members, INR ₹, Contri)
 */

function renderExpenseFormModal(currentGroup, existingExpense, onSave, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';

  const members = currentGroup.members || [];
  const isEdit = Boolean(existingExpense);
  const titleVal = existingExpense?.title || '';
  const amountVal = existingExpense?.amount || '';
  const paidByVal = existingExpense?.paidBy || members[0]?.id || 'm1';
  const categoryVal = existingExpense?.category || 'materials';
  const dateVal = existingExpense?.date || new Date().toISOString().split('T')[0];
  const notesVal = existingExpense?.notes || '';
  const participantsVal = existingExpense?.participants || members.map(m => m.id);

  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">${isEdit ? '✏️ Edit Project Expense' : '➕ Log New Project Expense'}</h3>
        <button class="close-btn" id="modal-close-x">✕</button>
      </div>

      <form id="expense-form" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Expense Title *</label>
          <input type="text" id="form-title" class="form-input" required placeholder="e.g. Microcontrollers, Dinner Bill, Taxi..." value="${escapeHtml(titleVal)}">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Amount (₹ INR) *</label>
            <input type="number" step="0.01" min="0.01" id="form-amount" class="form-input" required placeholder="0.00" value="${amountVal}">
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="form-category" class="form-select">
              ${CATEGORIES.map(c => `
                <option value="${c.id}" ${categoryVal === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Paid By *</label>
            <select id="form-paidby" class="form-select">
              <option value="contri" ${paidByVal === 'contri' ? 'selected' : ''}>🏦 Contri Pool Fund (Central Pot)</option>
              <optgroup label="Out-of-Pocket Member Spending">
                ${members.map(m => `
                  <option value="${m.id}" ${paidByVal === m.id ? 'selected' : ''}>${m.avatar} ${escapeHtml(m.name)}</option>
                `).join('')}
              </optgroup>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" id="form-date" class="form-input" value="${dateVal}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Split Among Members (Participant Checkboxes)</label>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; background: rgba(15, 23, 42, 0.6); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
            ${members.map(m => {
              const isChecked = participantsVal.includes(m.id);
              return `
                <label style="display: flex; align-items: center; gap: 0.5rem; color: #fff; font-size: 0.85rem; cursor: pointer;">
                  <input type="checkbox" class="part-checkbox" value="${m.id}" ${isChecked ? 'checked' : ''}>
                  <span>${m.avatar} ${escapeHtml(m.name)}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes / Description (Optional)</label>
          <textarea id="form-notes" class="form-textarea" rows="2" placeholder="Itemized details, shop name, UPI transaction ID...">${escapeHtml(notesVal)}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
          <button type="button" class="btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Save Changes' : 'Add Expense'}</button>
        </div>
      </form>
    </div>
  `;

  // Bind close events
  overlay.querySelector('#modal-close-x')?.addEventListener('click', closeModal);
  overlay.querySelector('#modal-cancel-btn')?.addEventListener('click', closeModal);

  function closeModal() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
    onClose?.();
  }

  // Form Submission
  overlay.querySelector('#expense-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = overlay.querySelector('#form-title').value.trim();
    const amount = parseFloat(overlay.querySelector('#form-amount').value);
    const category = overlay.querySelector('#form-category').value;
    const paidBy = overlay.querySelector('#form-paidby').value;
    const date = overlay.querySelector('#form-date').value;
    const notes = overlay.querySelector('#form-notes').value.trim();

    const checkedBoxes = Array.from(overlay.querySelectorAll('.part-checkbox:checked')).map(cb => cb.value);
    if (checkedBoxes.length === 0) {
      alert('Please select at least 1 member participant to split this expense.');
      return;
    }

    const payload = {
      id: existingExpense ? existingExpense.id : `exp-${Date.now()}`,
      title,
      amount,
      category,
      paidBy,
      date,
      notes,
      splitType: 'equal',
      participants: checkedBoxes,
      customSplits: {}
    };

    onSave(payload);
    closeModal();
  });

  return overlay;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderExpenseFormModal };
})();

// ---- components/settingsModal.js ----
const __settingsModal = (() => {
const { EMOJIS, MEMBER_COLORS } = __data;
/**
 * Flexible Member Customization & Data Clear Modal
 */

function renderSettingsModal(currentGroup, { onSaveMembers, onClearAllExpenses, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';

  let members = JSON.parse(JSON.stringify(currentGroup.members || []));

  function renderModalBody() {
    overlay.querySelector('.modal-content').innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">⚙️ Manage Members & Settings (${escapeHtml(currentGroup.name)})</h3>
        <button class="close-btn" id="modal-close-x">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        
        <!-- Member List Editor -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: #fff;">
              👥 Group Members (${members.length})
            </h4>
            <button type="button" class="btn-primary" id="btn-add-member" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
              + Add Member
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 320px; overflow-y: auto; padding-right: 0.25rem;">
            ${members.map((m, idx) => `
              <div style="display: flex; gap: 0.5rem; align-items: center; background: rgba(15, 23, 42, 0.6); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
                <select class="form-select select-avatar" data-idx="${idx}" style="width: 60px; padding: 0.3rem;">
                  ${EMOJIS.map(e => `<option value="${e}" ${m.avatar === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>

                <input type="text" class="form-input input-member-name" data-idx="${idx}" value="${escapeHtml(m.name)}" placeholder="Member Name" style="flex: 1;">
                <input type="text" class="form-input input-member-role" data-idx="${idx}" value="${escapeHtml(m.role || '')}" placeholder="Role / Info" style="flex: 1;">

                ${members.length > 2 ? `
                  <button type="button" class="btn-remove-member btn-secondary" data-idx="${idx}" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; color: #f43f5e;" title="Remove member">
                    🗑️
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Danger Zone: Clear Expenses -->
        <div style="border-top: 1px solid var(--border-glass); padding-top: 1rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.35rem;">
            🧹 Clear All Expenses & Pot Data
          </h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Wipe out all expenses and Countri pot payments for this group to start fresh with ₹0 balance.
          </p>
          <button type="button" class="btn-secondary" id="btn-clear-expenses" style="color: #f43f5e; border-color: rgba(244,63,94,0.3);">
            🗑️ Clear All Expenses Now
          </button>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--border-glass); padding-top: 1rem;">
          <button type="button" class="btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button type="button" class="btn-primary" id="btn-save-members">Save Changes</button>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    overlay.querySelector('#modal-close-x')?.addEventListener('click', closeModal);
    overlay.querySelector('#modal-cancel-btn')?.addEventListener('click', closeModal);

    overlay.querySelector('#btn-add-member')?.addEventListener('click', () => {
      readInputs();
      const newId = `m-${Date.now()}`;
      const randomEmoji = EMOJIS[members.length % EMOJIS.length];
      const randomColor = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
      members.push({
        id: newId,
        name: `Person ${members.length + 1}`,
        role: 'Member',
        avatar: randomEmoji,
        color: randomColor
      });
      renderModalBody();
    });

    overlay.querySelectorAll('.btn-remove-member').forEach(btn => {
      btn.addEventListener('click', (e) => {
        readInputs();
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        members.splice(idx, 1);
        renderModalBody();
      });
    });

    overlay.querySelector('#btn-save-members')?.addEventListener('click', () => {
      readInputs();
      onSaveMembers(members);
      closeModal();
    });

    overlay.querySelector('#btn-clear-expenses')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all expenses and Countri contributions for this group?')) {
        onClearAllExpenses();
        closeModal();
      }
    });
  }

  function readInputs() {
    overlay.querySelectorAll('.input-member-name').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'));
      if (members[idx]) {
        members[idx].name = el.value.trim() || `Person ${idx + 1}`;
      }
    });
    overlay.querySelectorAll('.input-member-role').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'));
      if (members[idx]) {
        members[idx].role = el.value.trim();
      }
    });
    overlay.querySelectorAll('.select-avatar').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'));
      if (members[idx]) {
        members[idx].avatar = el.value;
      }
    });
  }

  function closeModal() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
    onClose?.();
  }

  overlay.appendChild(document.createElement('div')).className = 'modal-content';
  renderModalBody();

  return overlay;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderSettingsModal };
})();

// ---- components/groupModal.js ----
const __groupModal = (() => {
const { EMOJIS, MEMBER_COLORS } = __data;
/**
 * Group & Workspace Manager Modal (Multi-Project/Event Support)
 */

function renderGroupModal(store, { onCreateGroup, onSwitchGroup, onDeleteGroup, onRenameGroup, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 620px;">
      <div class="modal-header">
        <h3 class="modal-title">📁 Project & Group Manager</h3>
        <button class="close-btn" id="modal-close-x">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Create New Group Box -->
        <div style="background: rgba(15, 23, 42, 0.7); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.75rem;">
            ➕ Create New Project / Event Group
          </h4>
          <form id="create-group-form" style="display: flex; gap: 0.75rem;">
            <input type="text" id="new-group-name" class="form-input" required placeholder="e.g. Goa Trip 2026, Flat Rent Kitty..." style="flex: 1;">
            <button type="submit" class="btn-primary" style="white-space: nowrap;">Create Group</button>
          </form>
        </div>

        <!-- Groups List -->
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.75rem;">
            📂 Existing Groups (${store.groups.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 280px; overflow-y: auto;">
            ${store.groups.map(g => {
              const isActive = g.id === store.activeGroupId;
              const expCount = (g.expenses || []).length;
              const memCount = (g.members || []).length;

              return `
                <div style="display: flex; align-items: center; justify-content: space-between; background: ${isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(30, 41, 59, 0.6)'}; padding: 0.85rem 1.1rem; border-radius: var(--radius-md); border: 1px solid ${isActive ? '#6366f1' : 'var(--border-glass)'};">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <strong style="color: #fff; font-size: 1rem;">${escapeHtml(g.name)}</strong>
                      ${isActive ? '<span style="background: #6366f1; color: #fff; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 10px; font-weight: 600;">ACTIVE</span>' : ''}
                    </div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.25rem;">
                      👥 ${memCount} members · 🧾 ${expCount} expenses · Created ${g.createdDate || 'Recently'}
                    </div>
                  </div>

                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    ${!isActive ? `
                      <button class="btn-switch-g btn-primary" data-gid="${g.id}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                        Switch →
                      </button>
                    ` : `
                      <span style="font-size: 0.8rem; color: #34d399; font-weight: 600;">Selected</span>
                    `}
                    ${store.groups.length > 1 ? `
                      <button class="btn-del-g btn-secondary" data-gid="${g.id}" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; color: #f43f5e;" title="Delete group">
                        🗑️
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--border-glass); padding-top: 1rem;">
          <button type="button" class="btn-secondary" id="modal-close-btn">Close</button>
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('#modal-close-x')?.addEventListener('click', closeModal);
  overlay.querySelector('#modal-close-btn')?.addEventListener('click', closeModal);

  function closeModal() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
    onClose?.();
  }

  overlay.querySelector('#create-group-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = overlay.querySelector('#new-group-name').value.trim();
    if (name) {
      onCreateGroup(name);
      closeModal();
    }
  });

  overlay.querySelectorAll('.btn-switch-g').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const gId = e.currentTarget.getAttribute('data-gid');
      onSwitchGroup(gId);
      closeModal();
    });
  });

  overlay.querySelectorAll('.btn-del-g').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const gId = e.currentTarget.getAttribute('data-gid');
      if (confirm('Are you sure you want to delete this group and all its expenses?')) {
        onDeleteGroup(gId);
        closeModal();
      }
    });
  });

  return overlay;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderGroupModal };
})();

// ---- components/countri.js ----
const __countri = (() => {
const { formatCurrency } = __settlement;
/**
 * Dedicated Countri (Committee Pool) Management Page (Dynamic N Members & INR ₹)
 */

function renderCountriPage(currentGroup, summary, { onUpdateCountriTarget, onUpdateMemberContribution, onNavigate }) {
  const container = document.createElement('div');
  container.className = 'countri-view';

  const members = currentGroup.members || [];
  const countri = currentGroup.countri || {};
  const targetPerMember = countri.targetPerMember || 1000;
  const totalTargetPool = targetPerMember * members.length;

  let totalCollected = 0;
  members.forEach(m => {
    totalCollected += (countri.contributions && countri.contributions[m.id]) || 0;
  });

  const countriExpenses = (currentGroup.expenses || []).filter(e => e.paidBy === 'countri');
  const totalCountriSpent = countriExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remainingPool = totalCollected - totalCountriSpent;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">🏦 Countri (Committee Pool) Tracker</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
          Manage central group pot contributions in ₹ INR for <strong>${escapeHtml(currentGroup.name)}</strong>.
        </p>
      </div>
      <button class="btn-primary" id="edit-target-btn">⚙️ Edit Target Contribution</button>
    </div>

    <!-- Summary Metrics Grid -->
    <div class="grid-metrics" style="margin-bottom: 2rem;">
      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Target Countri Pool</span>
          <div class="metric-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">🎯</div>
        </div>
        <div class="metric-value">${formatCurrency(totalTargetPool)}</div>
        <div class="metric-footer">${formatCurrency(targetPerMember)} per member (${members.length} members)</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Collected in Pot</span>
          <div class="metric-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">📥</div>
        </div>
        <div class="metric-value" style="color: #34d399;">${formatCurrency(totalCollected)}</div>
        <div class="metric-footer">${totalTargetPool > 0 ? Math.round((totalCollected / totalTargetPool) * 100) : 0}% of target collected</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Spent from Countri</span>
          <div class="metric-icon" style="background: rgba(244, 63, 94, 0.15); color: #fb7185;">📤</div>
        </div>
        <div class="metric-value" style="color: #fb7185;">${formatCurrency(totalCountriSpent)}</div>
        <div class="metric-footer">${countriExpenses.length} expenses paid from pool</div>
      </div>

      <div class="glass-panel metric-card">
        <div class="metric-header">
          <span>Remaining Cash in Pot</span>
          <div class="metric-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">💰</div>
        </div>
        <div class="metric-value" style="color: ${remainingPool >= 0 ? '#34d399' : '#f87171'}">
          ${formatCurrency(remainingPool)}
        </div>
        <div class="metric-footer">Available balance on hand</div>
      </div>
    </div>

    <!-- Member Contributions Table -->
    <div class="section-header">
      <div class="section-title">
        <span>📋 Member Pot Contribution Tracker (${members.length} Members)</span>
      </div>
    </div>

    <div class="glass-panel table-container" style="margin-bottom: 2rem;">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Target Pot Share</th>
            <th>Amount Paid into Pot</th>
            <th>Dues Remaining</th>
            <th>Payment Status</th>
            <th style="text-align: center;">Quick Action</th>
          </tr>
        </thead>
        <tbody>
          ${members.map(m => {
            const paid = (countri.contributions && countri.contributions[m.id]) || 0;
            const due = targetPerMember - paid;

            let statusBadge = `<span style="background: rgba(244, 63, 94, 0.15); color: #fb7185; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.78rem;">❌ Unpaid (${formatCurrency(due)})</span>`;
            if (paid >= targetPerMember) {
              statusBadge = '<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.78rem;">✅ Fully Paid</span>';
            } else if (paid > 0) {
              statusBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.78rem;">⚠️ Partial (${formatCurrency(paid)})</span>`;
            }

            return `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.2rem;">${m.avatar}</span>
                    <div>
                      <strong style="color: #fff;">${escapeHtml(m.name)}</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(m.role || 'Member')}</div>
                    </div>
                  </div>
                </td>
                <td style="font-weight: 600; color: #fff;">${formatCurrency(targetPerMember)}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="number" step="50" min="0" class="form-input input-countri-paid" data-mid="${m.id}" value="${paid}" style="width: 120px; padding: 0.35rem 0.6rem; font-size: 0.85rem;">
                    <button class="btn-save-countri-paid btn-secondary" data-mid="${m.id}" style="padding: 0.35rem 0.6rem; font-size: 0.75rem;">Save</button>
                  </div>
                </td>
                <td style="color: ${due > 0 ? '#f43f5e' : '#34d399'}; font-weight: 600;">
                  ${due > 0 ? formatCurrency(due) : '₹0.00 (Cleared)'}
                </td>
                <td>${statusBadge}</td>
                <td style="text-align: center;">
                  ${paid < targetPerMember ? `
                    <button class="btn-mark-full btn-outline-emerald" data-mid="${m.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: var(--radius-sm); cursor: pointer;">
                      Mark Paid (${formatCurrency(targetPerMember)})
                    </button>
                  ` : `
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Fully Cleared</span>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Countri Pool Expenses Table -->
    <div class="section-header">
      <div class="section-title">
        <span>📤 Expenses Funded Directly from Countri Pool</span>
      </div>
    </div>

    <div class="glass-panel table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Category</th>
            <th>Split Rule</th>
            <th style="text-align: right;">Amount Spent</th>
          </tr>
        </thead>
        <tbody>
          ${countriExpenses.length === 0 ? `
            <tr>
              <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                No expenses have been paid out of the Countri pool yet.
              </td>
            </tr>
          ` : countriExpenses.map(e => `
            <tr>
              <td style="color: var(--text-muted); font-size: 0.85rem;">${e.date || 'N/A'}</td>
              <td style="font-weight: 600; color: #fff;">${escapeHtml(e.title)}</td>
              <td><span style="background: rgba(255,255,255,0.06); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${escapeHtml(e.category)}</span></td>
              <td style="font-size: 0.8rem; color: var(--text-muted);">Split equally among ${(e.participants || []).length} members</td>
              <td style="text-align: right; font-weight: 700; color: #fb7185;">${formatCurrency(e.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Bind Event Listeners
  container.querySelector('#edit-target-btn')?.addEventListener('click', () => {
    const input = prompt('Enter target Countri contribution per member (₹ INR):', targetPerMember);
    if (input !== null) {
      const val = parseFloat(input);
      if (!isNaN(val) && val >= 0) {
        onUpdateCountriTarget(val);
      }
    }
  });

  container.querySelectorAll('.btn-save-countri-paid').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mId = e.currentTarget.getAttribute('data-mid');
      const inputEl = container.querySelector(`.input-countri-paid[data-mid="${mId}"]`);
      if (inputEl) {
        const val = parseFloat(inputEl.value) || 0;
        onUpdateMemberContribution(mId, val);
      }
    });
  });

  container.querySelectorAll('.btn-mark-full').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mId = e.currentTarget.getAttribute('data-mid');
      onUpdateMemberContribution(mId, targetPerMember);
    });
  });

  return container;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

return { renderCountriPage };
})();

// ---- app.js ----
const { loadStore, saveStore, generateShareableURLs } = __data;
const { calculateSummary } = __settlement;
const { renderNavbar } = __navbar;
const { renderDashboard } = __dashboard;
const { renderExpenseList } = __expenses;
const { renderContriPage } = __contri;
const { renderMemberSpendingPage } = __memberSpending;
const { renderSettlementView } = __settlementView;
const { renderExpenseFormModal } = __expenseFormModal;
const { renderSettingsModal } = __settingsModal;
const { renderGroupModal } = __groupModal;

/**
 * Main Application Controller & Multi-Group Router (INR ₹, Contri & Cross-Device Sharing)
 */










class App {
  constructor() {
    this.store = loadStore();
    this.activeTab = 'dashboard';
    this.selectedMemberId = null;
    this.appElement = document.getElementById('app');
    
    this.init();
  }

  init() {
    this.render();
  }

  getCurrentGroup() {
    return this.store.groups.find(g => g.id === this.store.activeGroupId) || this.store.groups[0];
  }

  getSummary() {
    const group = this.getCurrentGroup();
    return calculateSummary(group.members || [], group.expenses || [], group.contri || {});
  }

  save() {
    saveStore(this.store);
    this.render();
  }

  showToast(message, icon = '✅') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  exportCSV() {
    const group = this.getCurrentGroup();
    const expenses = group.expenses || [];
    let csv = 'ID,Date,Title,Category,Amount_INR,PaidBy,Participants,Notes\n';

    expenses.forEach(e => {
      const parts = (e.participants || []).join(';');
      const notes = (e.notes || '').replace(/"/g, '""');
      csv += `"${e.id}","${e.date || ''}","${e.title}","${e.category}",${e.amount},"${e.paidBy}","${parts}","${notes}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Project expenses exported to CSV', '📥');
  }

  exportProjectJSON() {
    const group = this.getCurrentGroup();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(group, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${group.name.replace(/\s+/g, '_')}_ContriSplit.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('Project JSON exported for Google Drive / WhatsApp sharing', '📁');
  }

  openShareLinkModal() {
    const { wifiUrl } = generateShareableURLs(this.store);

    // Auto copy Wi-Fi shareable link
    navigator.clipboard.writeText(wifiUrl).then(() => {
      this.showToast('Wi-Fi mobile link copied to clipboard!', '📋');
    }).catch(() => {});

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">🔗 Share Project Across Devices</h3>
          <button class="close-btn" id="modal-close-x">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Option 1: Mobile Wi-Fi Link -->
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1.1rem; border-radius: var(--radius-md);">
            <div style="font-weight: 700; color: #34d399; font-size: 0.95rem; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>📱 Option 1: Share via Wi-Fi Link (Works on Any Device on Wi-Fi)</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.65rem;">
              Instead of <code>localhost</code> (which only works on your PC), use this network IP link. Anyone connected to your Wi-Fi or Hotspot can open it on their phone or laptop!
            </p>
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" class="form-input" readonly value="${wifiUrl}" id="share-wifi-input" style="font-size: 0.8rem; flex: 1; background: rgba(15,23,42,0.9); font-weight: 600;">
              <button class="btn-primary" id="btn-copy-wifi" style="white-space: nowrap; font-size: 0.8rem; padding: 0.5rem 0.8rem;">
                📋 Copy Link
              </button>
            </div>
          </div>

          <!-- Option 2: Mobile QR Code Camera Scanner -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-glass); padding: 1.1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 0.25rem;">
                📷 Option 2: Scan QR Code with Phone Camera
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted);">
                Open your smartphone camera and scan this code to load <strong>${escapeHtml(this.getCurrentGroup().name)}</strong> directly on your mobile device!
              </p>
            </div>
            <div id="qrcode-canvas-container" style="background: #fff; padding: 6px; border-radius: 8px; flex-shrink: 0;"></div>
          </div>

          <!-- Option 3: Export & Send File via WhatsApp / Google Drive -->
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid var(--border-glass); padding: 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">
                📁 Option 3: Export Backup File (.json)
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Share via WhatsApp, Telegram, or Google Drive for offline backup.
              </div>
            </div>
            <button class="btn-secondary" id="btn-export-json" style="font-size: 0.8rem; padding: 0.45rem 0.85rem;">
              📥 Export JSON
            </button>
          </div>

          <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--border-glass); padding-top: 1rem;">
            <button class="btn-secondary" id="modal-close-btn">Close</button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#modal-close-x')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#modal-close-btn')?.addEventListener('click', () => overlay.remove());

    overlay.querySelector('#btn-copy-wifi')?.addEventListener('click', () => {
      navigator.clipboard.writeText(wifiUrl);
      this.showToast('Copied Wi-Fi link to clipboard!', '📋');
    });

    overlay.querySelector('#btn-export-json')?.addEventListener('click', () => {
      this.exportProjectJSON();
    });

    document.body.appendChild(overlay);

    // Render QR Code inside canvas
    setTimeout(() => {
      const containerEl = overlay.querySelector('#qrcode-canvas-container');
      if (containerEl && window.QRCode) {
        containerEl.innerHTML = '';
        const canvas = document.createElement('canvas');
        containerEl.appendChild(canvas);
        window.QRCode.toCanvas(canvas, wifiUrl, { width: 110, margin: 1 }, (error) => {
          if (error) console.error('QR code error:', error);
        });
      }
    }, 100);
  }

  render() {
    if (!this.appElement) return;
    this.appElement.innerHTML = '';

    const currentGroup = this.getCurrentGroup();
    const summary = this.getSummary();

    // 1. Render Header / Navbar
    const navbar = renderNavbar(
      this.store,
      this.activeTab,
      summary.remainingContriPool,
      {
        onNavigate: (tab, params) => {
          this.activeTab = tab;
          if (params?.memberId) this.selectedMemberId = params.memberId;
          this.render();
        },
        onOpenGroupModal: () => this.openGroupModal(),
        onOpenSettingsModal: () => this.openSettingsModal(),
        onSwitchGroup: (gId) => {
          this.store.activeGroupId = gId;
          const target = this.getCurrentGroup();
          this.showToast(`Switched to "${target.name}"`, '📁');
          this.save();
        },
        onShareLink: () => this.openShareLinkModal()
      }
    );
    this.appElement.appendChild(navbar);

    // 2. Render Main Body Container
    const main = document.createElement('main');
    main.className = 'main-content';

    let pageContent;

    switch (this.activeTab) {
      case 'dashboard':
        pageContent = renderDashboard(currentGroup, summary, {
          onAddExpense: () => this.openExpenseModal(),
          onNavigate: (tab, params) => {
            this.activeTab = tab;
            if (params?.memberId) this.selectedMemberId = params.memberId;
            this.render();
          }
        });
        break;

      case 'expenses':
        pageContent = renderExpenseList(currentGroup, summary, {
          onAddExpense: () => this.openExpenseModal(),
          onEditExpense: (exp) => this.openExpenseModal(exp),
          onDeleteExpense: (id) => {
            currentGroup.expenses = (currentGroup.expenses || []).filter(e => e.id !== id);
            this.showToast('Expense deleted', '🗑️');
            this.save();
          },
          onExportCSV: () => this.exportCSV()
        });
        break;

      case 'contri':
        pageContent = renderContriPage(currentGroup, summary, {
          onUpdateContriTarget: (newTarget) => {
            if (!currentGroup.contri) currentGroup.contri = {};
            currentGroup.contri.targetPerMember = newTarget;
            this.showToast(`Target Contri contribution set to ₹${newTarget}`, '🎯');
            this.save();
          },
          onUpdateMemberContribution: (memberId, amount) => {
            if (!currentGroup.contri) currentGroup.contri = {};
            if (!currentGroup.contri.contributions) currentGroup.contri.contributions = {};
            currentGroup.contri.contributions[memberId] = amount;
            const member = currentGroup.members.find(m => m.id === memberId);
            this.showToast(`Updated Contri payment for ${member?.name || 'member'} to ₹${amount}`, '💳');
            this.save();
          },
          onNavigate: (tab) => {
            this.activeTab = tab;
            this.render();
          }
        });
        break;

      case 'member-spending':
        pageContent = renderMemberSpendingPage(currentGroup, summary, this.selectedMemberId, {
          onNavigate: (tab) => {
            this.activeTab = tab;
            this.render();
          }
        });
        break;

      case 'settlements':
        pageContent = renderSettlementView(currentGroup, summary, {
          onMarkSettled: ({ from, to, amount }) => {
            this.showToast(`${from} paid ₹${amount} to ${to}! Debt cleared.`, '🎉');
            this.triggerConfetti();
          }
        });
        break;

      default:
        pageContent = renderDashboard(currentGroup, summary, {});
        break;
    }

    main.appendChild(pageContent);
    this.appElement.appendChild(main);
  }

  openExpenseModal(existingExpense = null) {
    const currentGroup = this.getCurrentGroup();
    const modal = renderExpenseFormModal(
      currentGroup,
      existingExpense,
      (payload) => {
        if (!currentGroup.expenses) currentGroup.expenses = [];
        if (existingExpense) {
          const idx = currentGroup.expenses.findIndex(e => e.id === existingExpense.id);
          if (idx !== -1) currentGroup.expenses[idx] = payload;
          this.showToast('Expense updated successfully!', '✏️');
        } else {
          currentGroup.expenses.unshift(payload);
          this.showToast('New expense logged successfully!', '➕');
        }
        this.save();
      },
      () => {}
    );
    document.body.appendChild(modal);
  }

  openSettingsModal() {
    const currentGroup = this.getCurrentGroup();
    const modal = renderSettingsModal(
      currentGroup,
      {
        onSaveMembers: (newMembers) => {
          currentGroup.members = newMembers;
          this.showToast('Group members updated!', '👥');
          this.save();
        },
        onClearAllExpenses: () => {
          currentGroup.expenses = [];
          if (!currentGroup.contri) currentGroup.contri = {};
          currentGroup.contri.contributions = {};
          this.showToast('All expenses and pot cleared for this group!', '🧹');
          this.save();
        },
        onClose: () => {}
      }
    );
    document.body.appendChild(modal);
  }

  openGroupModal() {
    const modal = renderGroupModal(
      this.store,
      {
        onCreateGroup: (name) => {
          const newGroupId = `group-${Date.now()}`;
          const newGroup = {
            id: newGroupId,
            name: name,
            createdDate: new Date().toISOString().split('T')[0],
            members: [
              { id: 'm1', name: 'Person 1', role: 'Member', avatar: '👨‍💼', color: '#10B981' },
              { id: 'm2', name: 'Person 2', role: 'Member', avatar: '👩‍🎨', color: '#6366F1' },
              { id: 'm3', name: 'Person 3', role: 'Member', avatar: '👨‍💻', color: '#F59E0B' }
            ],
            contri: { targetPerMember: 0, contributions: {} },
            expenses: []
          };
          this.store.groups.push(newGroup);
          this.store.activeGroupId = newGroupId;
          this.showToast(`Created group "${name}"`, '➕');
          this.save();
        },
        onSwitchGroup: (gId) => {
          this.store.activeGroupId = gId;
          const target = this.getCurrentGroup();
          this.showToast(`Switched to "${target.name}"`, '📁');
          this.save();
        },
        onDeleteGroup: (gId) => {
          if (this.store.groups.length <= 1) {
            alert('Cannot delete the only remaining group!');
            return;
          }
          this.store.groups = this.store.groups.filter(g => g.id !== gId);
          if (this.store.activeGroupId === gId) {
            this.store.activeGroupId = this.store.groups[0].id;
          }
          this.showToast('Group deleted', '🗑️');
          this.save();
        },
        onClose: () => {}
      }
    );
    document.body.appendChild(modal);
  }

  triggerConfetti() {
    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});


})();
