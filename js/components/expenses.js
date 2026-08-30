/**
 * Project Expense Ledger Component View (Dynamic Members, INR ₹, Contri)
 */
import { formatCurrency } from '../settlement.js';
import { CATEGORIES } from '../data.js';

export function renderExpenseList(currentGroup, summary, { onAddExpense, onEditExpense, onDeleteExpense, onExportCSV }) {
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
