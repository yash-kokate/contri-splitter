/**
 * Dedicated Contri (Contribution Pool) Management Page
 */
import { formatCurrency } from '../settlement.js';

export function renderContriPage(currentGroup, summary, { onUpdateContriTarget, onUpdateMemberContribution, onNavigate }) {
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
