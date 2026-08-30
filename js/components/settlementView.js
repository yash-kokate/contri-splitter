/**
 * Complete Settlement Matrix & Transaction Flow View (Dynamic Members, INR ₹, Contri)
 */
import { formatCurrency } from '../settlement.js';

export function renderSettlementView(currentGroup, summary, { onMarkSettled }) {
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
