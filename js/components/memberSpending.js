/**
 * Member Spending Deep Dive View (Dynamic Members, INR ₹, Contri)
 */
import { formatCurrency } from '../settlement.js';
import { CATEGORIES } from '../data.js';

export function renderMemberSpendingPage(currentGroup, summary, initialMemberId, { onNavigate }) {
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
