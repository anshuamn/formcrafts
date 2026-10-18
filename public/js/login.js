// FormCrafts Login Page
class LoginApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuth();
  }

  setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));

    // Password toggle
    document.getElementById('toggle-password').addEventListener('click', () => this.togglePassword());

    // Social login buttons
    document.getElementById('login-google').addEventListener('click', () => this.socialLogin('google'));
    document.getElementById('login-microsoft').addEventListener('click', () => this.socialLogin('microsoft'));

    // Signup link
    document.getElementById('signup-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showToast('Sign up coming soon!', 'info');
    });

    // Enter key on inputs
    document.querySelectorAll('#login-form input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('login-form').dispatchEvent(new Event('submit'));
        }
      });
    });
  }

  async checkAuth() {
    // Check if already logged in (sessionStorage for demo)
    const token = sessionStorage.getItem('formcrafts_token');
    if (token) {
      try {
        const res = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          window.location.href = `/admin?token=${encodeURIComponent(token)}`;
          return;
        }
      } catch (e) {
        sessionStorage.removeItem('formcrafts_token');
      }
    }
  }

  async handleLogin(e) {
    console.log('=== handleLogin called ===', e);
    e.preventDefault();
    console.log('preventDefault called');

    const btn = document.getElementById('login-btn');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember').checked;

    console.log('Form values:', { email, password: password ? '***' : '', remember });

    if (!email || !password) {
      this.showToast('Please enter email and password', 'warning');
      return;
    }

    this.setLoading(btn, true);

    try {
      // Call the real API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const token = data.token;

      sessionStorage.setItem('formcrafts_token', token);
      if (remember) {
        localStorage.setItem('formcrafts_token', token);
      }

      this.showToast('Welcome back!', 'success');

      setTimeout(() => {
        window.location.href = `/admin?token=${encodeURIComponent(token)}`;
      }, 800);

    } catch (error) {
      this.showToast('Login failed: ' + error.message, 'error');
    } finally {
      this.setLoading(btn, false);
    }
  }

  togglePassword() {
    const input = document.getElementById('login-password');
    const toggle = document.getElementById('toggle-password');
    const isPassword = input.type === 'password';

    input.type = isPassword ? 'text' : 'password';
    toggle.querySelector('.eye-open').classList.toggle('hidden', isPassword);
    toggle.querySelector('.eye-closed').classList.toggle('hidden', !isPassword);
  }

  socialLogin(provider) {
    this.showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`, 'info');
  }

  setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loadingEl = btn.querySelector('.btn-loading');

    btn.disabled = loading;
    text.classList.toggle('hidden', loading);
    loadingEl.classList.toggle('hidden', !loading);
  }

  showToast(message, type = 'info') {
    // Create toast container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span style="flex:1;">${this.escapeHtml(message)}</span>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&': '&', '<': '<', '>': '>', '"': '"', "'": '''}[c]));
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.loginApp = new LoginApp();
});