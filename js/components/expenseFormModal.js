/**
 * Modal Component for Adding / Editing Expenses (Dynamic Members, INR ₹, Contri)
 */
import { CATEGORIES } from '../data.js';

export function renderExpenseFormModal(currentGroup, existingExpense, onSave, onClose) {
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
