/**
 * Dashboard Component View (Contri Pool & INR ₹)
 */
import { formatCurrency } from '../settlement.js';

export function renderDashboard(currentGroup, summary, { onAddExpense, onNavigate }) {
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
