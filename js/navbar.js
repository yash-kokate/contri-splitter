/**
 * Navigation Bar Component with Group Switcher, Share Link, and Supabase Auth Status
 */
import { formatCurrency } from '../settlement.js';

export function renderNavbar(store, activeTab, contriRemaining, currentUser, { onNavigate, onOpenGroupModal, onOpenSettingsModal, onSwitchGroup, onShareLink, onOpenAuthModal }) {
  const nav = document.createElement('header');
  nav.className = 'navbar';

  const currentGroup = store.groups.find(g => g.id === store.activeGroupId) || store.groups[0];

  const userBadgeHTML = currentUser
    ? `<button class="btn-secondary" id="nav-user-btn" style="padding: 0.4rem 0.75rem; font-size: 0.8rem; border-color: rgba(16,185,129,0.4);" title="${escapeHtml(currentUser.email)}">
        👤 ${escapeHtml(currentUser.email.split('@')[0])}
       </button>`
    : `<button class="btn-secondary" id="nav-user-btn" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" title="Sign In with Supabase">
        🔑 Sign In
       </button>`;

  nav.innerHTML = `
    <div class="nav-container">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <a href="#" class="brand-logo" id="nav-brand">
          <span style="font-size: 1.6rem;">💸</span>
          <span>Contri Splitter</span>
          <span class="brand-badge" style="background: linear-gradient(135deg, #10b981, #06b6d4);">⚡ Supabase</span>
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

      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <button class="btn-primary" id="nav-share-btn" style="padding: 0.45rem 0.85rem; font-size: 0.82rem; background: linear-gradient(135deg, #10b981, #059669);" title="Copy Real-Time Shareable Link">
          🔗 Live Share Link
        </button>

        <div style="font-size: 0.8rem; background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 0.35rem;">
          <span>🏦 Pot:</span>
          <strong>${formatCurrency(contriRemaining)}</strong>
        </div>

        ${userBadgeHTML}

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
  nav.querySelector('#nav-user-btn')?.addEventListener('click', onOpenAuthModal);

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
