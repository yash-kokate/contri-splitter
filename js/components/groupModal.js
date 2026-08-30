/**
 * Group & Workspace Manager Modal (Multi-Project/Event Support)
 */
import { EMOJIS, MEMBER_COLORS } from '../data.js';

export function renderGroupModal(store, { onCreateGroup, onSwitchGroup, onDeleteGroup, onRenameGroup, onClose }) {
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
