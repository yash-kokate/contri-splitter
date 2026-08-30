/**
 * Flexible Member Customization & Data Clear Modal
 */
import { EMOJIS, MEMBER_COLORS } from '../data.js';

export function renderSettingsModal(currentGroup, { onSaveMembers, onClearAllExpenses, onClose }) {
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
