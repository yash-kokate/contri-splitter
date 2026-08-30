/**
 * Main Application Controller & Router (Supabase Auth & Realtime Database Syncing)
 */
import { loadStore, saveStore, generateShareableURLs } from './data.js';
import { calculateSummary } from './settlement.js';
import { 
  getSupabase, 
  getCurrentUser, 
  syncGroupToSupabase, 
  fetchGroupFromSupabase, 
  subscribeToGroupChanges 
} from './supabaseClient.js';

import { renderNavbar } from './components/navbar.js';
import { renderDashboard } from './components/dashboard.js';
import { renderExpenseList } from './components/expenses.js';
import { renderContriPage } from './components/contri.js';
import { renderMemberSpendingPage } from './components/memberSpending.js';
import { renderSettlementView } from './components/settlementView.js';
import { renderExpenseFormModal } from './components/expenseFormModal.js';
import { renderSettingsModal } from './components/settingsModal.js';
import { renderGroupModal } from './components/groupModal.js';
import { renderAuthModal } from './components/authModal.js';

class App {
  constructor() {
    this.store = loadStore();
    this.activeTab = 'dashboard';
    this.selectedMemberId = null;
    this.currentUser = null;
    this.activeRealtimeChannel = null;
    this.appElement = document.getElementById('app');

    this.init();
  }

  async init() {
    // 1. Initialize Supabase Auth listener
    const sb = getSupabase();
    if (sb) {
      this.currentUser = await getCurrentUser();
      sb.auth.onAuthStateChange((event, session) => {
        this.currentUser = session ? session.user : null;
        this.render();
      });
    }

    // 2. Check URL Hash for deep-linked group ID (#group=xyz)
    await this.checkURLDeepLink();

    // 3. Initial Render & Subscribe to Realtime Changes
    this.render();
    this.subscribeRealtime();
  }

  async checkURLDeepLink() {
    const hash = window.location.hash;
    if (hash && hash.includes('#group=')) {
      const groupId = hash.split('#group=')[1];
      if (groupId) {
        const remoteGroup = await fetchGroupFromSupabase(groupId);
        if (remoteGroup) {
          // Merge or replace group in store
          const existingIdx = this.store.groups.findIndex(g => g.id === groupId);
          if (existingIdx !== -1) {
            this.store.groups[existingIdx] = remoteGroup;
          } else {
            this.store.groups.unshift(remoteGroup);
          }
          this.store.activeGroupId = groupId;
          saveStore(this.store);
          this.showToast(`Loaded live group "${remoteGroup.name}" from Supabase`, '⚡');
        }
      }
    }
  }

  subscribeRealtime() {
    if (this.activeRealtimeChannel) {
      try { this.activeRealtimeChannel.unsubscribe(); } catch(e) {}
    }

    const currentGroup = this.getCurrentGroup();
    if (currentGroup && currentGroup.id) {
      this.activeRealtimeChannel = subscribeToGroupChanges(currentGroup.id, (remoteGroup) => {
        const idx = this.store.groups.findIndex(g => g.id === remoteGroup.id);
        if (idx !== -1) {
          this.store.groups[idx] = remoteGroup;
          saveStore(this.store);
          this.render();
          this.showToast('Real-time sync update received! ⚡', '🔄');
        }
      });
    }
  }

  getCurrentGroup() {
    return this.store.groups.find(g => g.id === this.store.activeGroupId) || this.store.groups[0];
  }

  getSummary() {
    const group = this.getCurrentGroup();
    return calculateSummary(group.members || [], group.expenses || [], group.contri || {});
  }

  async save() {
    saveStore(this.store);
    this.render();

    // Trigger Supabase Real-Time Sync across shared links
    const group = this.getCurrentGroup();
    if (group) {
      const synced = await syncGroupToSupabase(group);
      if (synced) {
        console.log('Group synced to Supabase successfully!');
      }
    }
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
    const currentGroup = this.getCurrentGroup();
    const { currentUrl } = generateShareableURLs(this.store);

    // Generate direct Supabase Real-Time Group Link
    const baseUrl = window.location.origin + window.location.pathname;
    const realTimeUrl = `${baseUrl}#group=${currentGroup.id}`;

    // Auto copy live link
    navigator.clipboard.writeText(realTimeUrl).then(() => {
      this.showToast('Live Supabase share link copied to clipboard!', '⚡');
    }).catch(() => {});

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">🔗 Real-Time Supabase Share Link</h3>
          <button class="close-btn" id="modal-close-x">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Live Supabase Realtime Sync Link -->
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1.1rem; border-radius: var(--radius-md);">
            <div style="font-weight: 700; color: #34d399; font-size: 0.95rem; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>⚡ Live Supabase Real-Time Sync Link</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.65rem;">
              Share this link with anyone! When they open it, expenses and Contri payments sync <strong>live in real-time</strong> across all connected devices!
            </p>
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" class="form-input" readonly value="${realTimeUrl}" id="share-live-input" style="font-size: 0.8rem; flex: 1; background: rgba(15,23,42,0.9); font-weight: 600;">
              <button class="btn-primary" id="btn-copy-live" style="white-space: nowrap; font-size: 0.8rem; padding: 0.5rem 0.8rem;">
                📋 Copy Link
              </button>
            </div>
          </div>

          <!-- Mobile QR Code Scanner -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-glass); padding: 1.1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 0.25rem;">
                📷 Scan Live QR Code
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted);">
                Open your smartphone camera and scan to view <strong>${escapeHtml(currentGroup.name)}</strong> live on your phone!
              </p>
            </div>
            <div id="qrcode-canvas-container" style="background: #fff; padding: 6px; border-radius: 8px; flex-shrink: 0;"></div>
          </div>

          <!-- Export JSON Backup -->
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid var(--border-glass); padding: 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">
                📁 Offline State Link / JSON Backup
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Backup project file for Google Drive or WhatsApp sharing.
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

    overlay.querySelector('#btn-copy-live')?.addEventListener('click', () => {
      navigator.clipboard.writeText(realTimeUrl);
      this.showToast('Copied live Supabase link to clipboard!', '⚡');
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
        window.QRCode.toCanvas(canvas, realTimeUrl, { width: 110, margin: 1 }, (error) => {
          if (error) console.error('QR code error:', error);
        });
      }
    }, 100);
  }

  openAuthModal() {
    const modal = renderAuthModal(
      this.currentUser,
      {
        onAuthSuccess: (user) => {
          this.currentUser = user;
          if (user) {
            this.showToast(`Signed in as ${user.email}`, '👤');
          } else {
            this.showToast('Signed out of Supabase', '👋');
          }
          this.render();
        },
        onClose: () => {}
      }
    );
    document.body.appendChild(modal);
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
      this.currentUser,
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
          this.subscribeRealtime();
          this.save();
        },
        onShareLink: () => this.openShareLinkModal(),
        onOpenAuthModal: () => this.openAuthModal()
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
          this.subscribeRealtime();
          this.save();
        },
        onSwitchGroup: (gId) => {
          this.store.activeGroupId = gId;
          const target = this.getCurrentGroup();
          this.showToast(`Switched to "${target.name}"`, '📁');
          this.subscribeRealtime();
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
          this.subscribeRealtime();
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
