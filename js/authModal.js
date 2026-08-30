/**
 * Supabase User Authentication Modal Component
 */
import { signInWithEmail, signUpWithEmail, signOutUser } from '../supabaseClient.js';

export function renderAuthModal(currentUser, { onAuthSuccess, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';

  let isSignUpMode = false;

  function renderContent() {
    if (currentUser) {
      // User is already signed in
      overlay.innerHTML = `
        <div class="modal-content" style="max-width: 440px; text-align: center;">
          <div class="modal-header">
            <h3 class="modal-title">👤 User Account</h3>
            <button class="close-btn" id="modal-close-x">✕</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1.25rem; align-items: center; padding: 1rem 0;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #6366f1); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #fff;">
              👤
            </div>
            <div>
              <div style="font-weight: 700; font-size: 1.1rem; color: #fff;">${escapeHtml(currentUser.email)}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Connected to Supabase Authentication</div>
            </div>

            <div style="display: flex; gap: 0.75rem; width: 100%; justify-content: center; margin-top: 0.5rem;">
              <button class="btn-secondary" id="modal-close-btn" style="flex: 1;">Close</button>
              <button class="btn-primary" id="btn-signout" style="flex: 1; background: #f43f5e;">Sign Out</button>
            </div>
          </div>
        </div>
      `;

      overlay.querySelector('#modal-close-x')?.addEventListener('click', closeModal);
      overlay.querySelector('#modal-close-btn')?.addEventListener('click', closeModal);
      overlay.querySelector('#btn-signout')?.addEventListener('click', async () => {
        await signOutUser();
        onAuthSuccess(null);
        closeModal();
      });
      return;
    }

    // Sign In / Sign Up Form
    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title">${isSignUpMode ? '✨ Create Supabase Account' : '🔑 Sign In to Contri Splitter'}</h3>
          <button class="close-btn" id="modal-close-x">✕</button>
        </div>

        <form id="auth-form" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" id="auth-email" class="form-input" required placeholder="name@domain.com">
          </div>

          <div class="form-group">
            <label class="form-label">Password *</label>
            <input type="password" id="auth-password" class="form-input" required minlength="6" placeholder="••••••••">
          </div>

          <div id="auth-error-msg" style="color: #f43f5e; font-size: 0.85rem; font-weight: 500; display: none;"></div>

          <button type="submit" class="btn-primary" id="auth-submit-btn" style="width: 100%; padding: 0.75rem;">
            ${isSignUpMode ? 'Create Account' : 'Sign In'}
          </button>

          <div style="text-align: center; border-top: 1px solid var(--border-glass); padding-top: 1rem; margin-top: 0.5rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              ${isSignUpMode ? 'Already have an account?' : "Don't have an account yet?"}
            </span>
            <button type="button" id="toggle-mode-btn" style="background: transparent; border: none; color: var(--accent-indigo); font-weight: 600; font-size: 0.85rem; cursor: pointer; margin-left: 0.35rem;">
              ${isSignUpMode ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    `;

    overlay.querySelector('#modal-close-x')?.addEventListener('click', closeModal);

    overlay.querySelector('#toggle-mode-btn')?.addEventListener('click', () => {
      isSignUpMode = !isSignUpMode;
      renderContent();
    });

    overlay.querySelector('#auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = overlay.querySelector('#auth-email').value.trim();
      const password = overlay.querySelector('#auth-password').value;
      const errorEl = overlay.querySelector('#auth-error-msg');
      const submitBtn = overlay.querySelector('#auth-submit-btn');

      errorEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerText = 'Processing...';

      try {
        let res;
        if (isSignUpMode) {
          res = await signUpWithEmail(email, password);
        } else {
          res = await signInWithEmail(email, password);
        }
        if (res.user) {
          onAuthSuccess(res.user);
          closeModal();
        }
      } catch (err) {
        errorEl.innerText = err.message || 'Authentication failed. Please check credentials.';
        errorEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = isSignUpMode ? 'Create Account' : 'Sign In';
      }
    });
  }

  function closeModal() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
    onClose?.();
  }

  renderContent();
  return overlay;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
