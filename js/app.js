/**
 * Main Application Controller & Multi-Group Router (INR ₹, Contri & Cross-Device Sharing)
 */
import { loadStore, saveStore, generateShareableURLs } from './data.js';
import { calculateSummary } from './settlement.js';

import { renderNavbar } from './components/navbar.js';
import { renderDashboard } from './components/dashboard.js';
import { renderExpenseList } from './components/expenses.js';
import { renderContriPage } from './components/contri.js';
import { renderMemberSpendingPage } from './components/memberSpending.js';
import { renderSettlementView } from './components/settlementView.js';
import { renderExpenseFormModal } from './components/expenseFormModal.js';
import { renderSettingsModal } from './components/settingsModal.js';
import { renderGroupModal } from './components/groupModal.js';

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
