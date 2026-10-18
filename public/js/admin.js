// FormCrafts Admin Dashboard
class AdminApp {
  constructor() {
    this.forms = [];
    this.responses = [];
    this.currentFormId = null;
    this.glossary = [];
    this.webhooks = [];
    this.embedData = null;
    this.importCacheKey = null;
    this.importSource = null;
  }

  async init() {
    this.initTheme();
    this.setupEventListeners();
    this.setupTabs();
    this.setupDropdowns();
    await this.loadConfig();
    await this.loadForms();
    await this.loadGlossary();
    this.updateCounts();
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
    
    // User dropdown
    const userMenuBtn = document.getElementById('user-menu-btn');
    userMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('user-dropdown')?.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      document.getElementById('user-dropdown')?.classList.remove('open');
    });

    // Modals
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal(btn.closest('.modal-overlay').id));
    });

    // Settings
    document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettings());
    document.getElementById('save-default-settings')?.addEventListener('click', () => this.saveDefaultSettings());
    document.getElementById('save-branding')?.addEventListener('click', () => this.saveBranding());
    document.getElementById('save-theme')?.addEventListener('click', () => this.saveTheme());
    document.getElementById('theme-primary-color')?.addEventListener('input', (e) => {
      document.getElementById('theme-primary-hex').value = e.target.value;
    });
    document.getElementById('theme-primary-hex')?.addEventListener('input', (e) => {
      document.getElementById('theme-primary-color').value = e.target.value;
    });

    // Glossary
    document.getElementById('add-glossary-term')?.addEventListener('click', () => this.openGlossaryModal());
    document.getElementById('save-glossary-term')?.addEventListener('click', () => this.saveGlossaryTerm());

    // Webhooks
    document.getElementById('add-webhook')?.addEventListener('click', () => this.openWebhookModal());
    document.getElementById('save-webhook')?.addEventListener('click', () => this.saveWebhook());

    // Import
    document.getElementById('btn-import-google')?.addEventListener('click', () => this.importGoogleForm());
    document.getElementById('btn-import-microsoft')?.addEventListener('click', () => this.importMicrosoftForm());
    document.getElementById('cancel-import')?.addEventListener('click', () => this.hideImportPreview());
    document.getElementById('cancel-import-2')?.addEventListener('click', () => this.hideImportPreview());
    document.getElementById('apply-import')?.addEventListener('click', () => this.applyImport());

    // Share tab
    document.getElementById('share-form-select')?.addEventListener('change', (e) => this.loadShareData(e.target.value));
    document.getElementById('copy-direct-url')?.addEventListener('click', () => this.copyToClipboard('share-direct-url'));
    document.getElementById('generate-tracked-url')?.addEventListener('click', () => this.generateTrackedUrl());
    document.getElementById('copy-whatsapp-text')?.addEventListener('click', () => this.copyToClipboard('whatsapp-message'));
    document.getElementById('copy-linkedin-text')?.addEventListener('click', () => this.copyToClipboard('linkedin-message'));
    document.getElementById('copy-gmail-text')?.addEventListener('click', () => this.copyGmailText());
    document.getElementById('utm-source')?.addEventListener('input', () => this.updateDirectUrl());
    document.getElementById('utm-medium')?.addEventListener('input', () => this.updateDirectUrl());
    document.getElementById('utm-campaign')?.addEventListener('input', () => this.updateDirectUrl());

    // Embed tab
    document.getElementById('embed-form-select')?.addEventListener('change', (e) => this.loadEmbedData(e.target.value));
    document.querySelectorAll('#embed-tabs .tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchEmbedTab(tab.dataset.embedTab));
    });
    document.getElementById('copy-embed-code')?.addEventListener('click', () => this.copyToClipboard('embed-code'));
    document.getElementById('embed-responsive')?.addEventListener('change', () => this.updateEmbedCode());
    document.getElementById('embed-height')?.addEventListener('input', () => this.updateEmbedCode());

    // Analytics
    document.getElementById('analytics-form-select')?.addEventListener('change', (e) => this.loadAnalytics(e.target.value));

    // Responses
    document.getElementById('responses-form-filter')?.addEventListener('change', (e) => this.loadResponses(e.target.value));
    document.getElementById('export-all-responses')?.addEventListener('click', () => this.exportAllResponses());

    // Delete modal
    document.getElementById('confirm-delete')?.addEventListener('click', () => this.confirmDelete());

    // Preview form button
    document.getElementById('preview-form-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentFormId) {
        window.open(`/form/${this.currentFormId}`, '_blank');
      }
    });

    // Initialize theme
    const savedTheme = localStorage.getItem('formcrafts_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  setupTabs() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  setupDropdowns() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      const btn = dropdown.querySelector('button');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown.open').forEach(d => {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
      });

      menu?.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          dropdown.classList.remove('open');
        });
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    });
  }

  switchTab(tabId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('hidden', content.id !== `tab-${tabId}`);
    });

    // Load tab-specific data
    switch (tabId) {
      case 'forms': this.loadForms(); break;
      case 'responses': this.loadResponses(); break;
      case 'analytics': this.loadAnalytics(); break;
      case 'import': this.hideImportPreview(); break;
      case 'share': this.loadShareForms(); break;
      case 'embed': this.loadEmbedForms(); break;
      case 'settings': this.loadSettings(); break;
      case 'branding': this.loadBranding(); break;
      case 'glossary': this.renderGlossary(); break;
      case 'webhooks': this.loadWebhooks(); break;
    }

    // Close mobile sidebar
    document.querySelectorAll('.builder-sidebar').forEach(s => s.classList.remove('open'));
  }

  async loadConfig() {
    try {
      const res = await fetch('/api/config');
      const cfg = await res.json();
      document.getElementById('admin-title').textContent = cfg.appName || 'FormCrafts';
      document.getElementById('brand-tag').textContent = cfg.brandTag || 'Professional Form Builder';
      document.getElementById('setting-app-name').value = cfg.appName || 'FormCrafts';
      document.getElementById('setting-admin-pin').value = cfg.adminPin || 'admin123';
      document.getElementById('setting-allow-glossary').checked = cfg.allowGlossary !== false;
      document.getElementById('setting-show-progress').checked = cfg.defaultFormSettings?.showProgress !== false;
      document.getElementById('setting-collect-email').checked = cfg.defaultFormSettings?.collectEmail || false;
      document.getElementById('setting-allow-multiple').checked = cfg.defaultFormSettings?.allowMultiple || false;
      document.getElementById('setting-confirmation').value = cfg.defaultFormSettings?.confirmationMessage || 'Thank you for your submission!';
      document.getElementById('setting-redirect').value = cfg.defaultFormSettings?.redirectUrl || '';
      document.getElementById('setting-brand-tag').value = cfg.brandTag || 'Professional Form Builder';
      document.getElementById('setting-page-title').value = cfg.pageTitleSuffix || '| FormCrafts';
      document.getElementById('preview-tag-text').textContent = cfg.brandTag || 'Professional Form Builder';
      document.getElementById('theme-primary-color').value = cfg.primaryColor || '#3b82f6';
      document.getElementById('theme-primary-hex').value = cfg.primaryColor || '#3b82f6';
      document.getElementById('theme-default-mode').value = cfg.defaultTheme || 'light';
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }

  async loadForms() {
    try {
      const res = await fetch('/api/forms');
      const data = await res.json();
      this.forms = data.forms || [];
      this.renderFormsTable();
      this.updateFormSelects();
    } catch (e) {
      console.error('Failed to load forms:', e);
      this.showToast('Failed to load forms', 'error');
    }
  }

  renderFormsTable() {
    const tbody = document.getElementById('forms-table-body');
    const empty = document.getElementById('forms-empty');
    const container = document.getElementById('forms-table-container');

    if (this.forms.length === 0) {
      container?.classList.add('hidden');
      empty?.classList.remove('hidden');
      return;
    }

    container?.classList.remove('hidden');
    empty?.classList.add('hidden');

    tbody.innerHTML = this.forms.map(form => `
      <tr data-form-id="${form.id}">
        <td>
          <input type="checkbox" class="form-checkbox" onchange="event.stopPropagation()">
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:var(--space-3);">
            <div class="avatar" style="background:var(--color-primary-light);color:var(--color-primary);">${this.getFormIcon(form)}</div>
            <div>
              <div style="font-weight:500;color:var(--color-text);">${this.escapeHtml(form.title)}</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${this.escapeHtml(form.description || 'No description')}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${form.published ? 'badge-success' : 'badge-gray'}">
            ${form.published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td>
          <span style="font-weight:600;color:var(--color-primary);">${form.responseCount || 0}</span>
        </td>
        <td style="color:var(--color-text-muted);font-size:var(--text-sm);">
          ${form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : '—'}
        </td>
        <td>
          <div style="display:flex;gap:var(--space-1);">
            <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();app.openBuilder('${form.id}')" title="Edit in Builder"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/></svg></button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();app.previewForm('${form.id}')" title="Preview"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();app.shareForm('${form.id}')" title="Share"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><path d="M13 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/></svg></button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();app.duplicateForm('${form.id}')" title="Duplicate"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
            <button class="btn btn-ghost btn-sm btn-icon danger" onclick="event.stopPropagation();app.deleteForm('${form.id}')" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');

    document.getElementById('forms-count').textContent = this.forms.length;
  }

  getFormIcon(form) {
    if (form.title.toLowerCase().includes('survey')) return '📊';
    if (form.title.toLowerCase().includes('contact')) return '📧';
    if (form.title.toLowerCase().includes('feedback')) return '💬';
    if (form.title.toLowerCase().includes('registration')) return '📝';
    if (form.title.toLowerCase().includes('order')) return '🛒';
    return '📋';
  }

  updateFormSelects() {
    const selects = [
      'responses-form-filter',
      'analytics-form-select',
      'share-form-select',
      'embed-form-select'
    ];

    selects.forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Forms</option>' + this.forms.map(f => 
          `<option value="${f.id}" ${f.id === currentValue ? 'selected' : ''}>${this.escapeHtml(f.title)}</option>`
        ).join('');
      }
    });
  }

  updateCounts() {
    const totalResponses = this.forms.reduce((sum, f) => sum + (f.responseCount || 0), 0);
    document.getElementById('responses-count').textContent = totalResponses;
  }

  async loadResponses(formId = '') {
    const container = document.getElementById('responses-table-container');
    const empty = document.getElementById('responses-empty');
    const tbody = document.getElementById('responses-table-body');

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-12);"><div class="spinner" style="margin:0 auto;"></div></td></tr>';
    container?.classList.remove('hidden');
    empty?.classList.add('hidden');

    try {
      let allResponses = [];
      const formsToLoad = formId ? [formId] : this.forms.map(f => f.id);

      for (const fid of formsToLoad) {
        const res = await fetch(`/api/forms/${fid}/responses`);
        const data = await res.json();
        const form = this.forms.find(f => f.id === fid);
        data.responses.forEach(r => {
          allResponses.push({ ...r, formTitle: form?.title || 'Unknown Form', formId: fid });
        });
      }

      this.responses = allResponses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (this.responses.length === 0) {
        container?.classList.add('hidden');
        empty?.classList.remove('hidden');
        return;
      }

      container?.classList.remove('hidden');
      tbody.innerHTML = this.responses.map((r, idx) => `
        <tr>
          <td><input type="checkbox" class="form-checkbox" onchange="event.stopPropagation()"></td>
          <td>
            <span class="badge badge-gray">${this.escapeHtml(r.formTitle)}</span>
          </td>
          <td>
            <div style="font-weight:500;">${this.escapeHtml(r.answers?.name || r.answers?.email || 'Anonymous')}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${this.escapeHtml(r.answers?.email || '')}</div>
          </td>
          <td style="color:var(--color-text-muted);font-size:var(--text-sm);">${new Date(r.timestamp).toLocaleString()}</td>
          <td>
            <span class="badge badge-success">Complete</span>
          </td>
          <td>
            <div style="display:flex;gap:var(--space-1);">
              <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();app.viewResponse('${r.formId}','${r.id}')" title="View"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
              <button class="btn btn-ghost btn-sm btn-icon danger" onclick="event.stopPropagation();app.deleteResponse('${r.formId}','${r.id}')" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Failed to load responses:', e);
      this.showToast('Failed to load responses', 'error');
    }
  }

  async loadAnalytics(formId = '') {
    const statsContainer = document.getElementById('analytics-stats');
    const fieldsContainer = document.getElementById('analytics-fields');
    const select = document.getElementById('analytics-form-select');

    if (!formId) {
      select.value = '';
      document.getElementById('stat-views').textContent = '—';
      document.getElementById('stat-submissions').textContent = '—';
      document.getElementById('stat-conversion').textContent = '—';
      document.getElementById('stat-time').textContent = '—';
      fieldsContainer.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8);">
          <div class="empty-state-icon">📈</div>
          <h3 class="empty-state-title">Select a form to view analytics</h3>
          <p class="empty-state-desc">Choose a form from the dropdown above to see detailed field-level analytics</p>
        </div>
      `;
      return;
    }

    try {
      const [formRes, responsesRes] = await Promise.all([
        fetch(`/api/forms/${formId}`),
        fetch(`/api/forms/${formId}/responses`)
      ]);
      const form = await formRes.json();
      const responsesData = await responsesRes.json();
      const responses = responsesData.responses || [];

      // Calculate stats (mock for now)
      const views = responses.length * 3; // Mock
      const submissions = responses.length;
      const conversion = views > 0 ? Math.round((submissions / views) * 100) : 0;
      const avgTime = '2:34'; // Mock

      document.getElementById('stat-views').textContent = views.toLocaleString();
      document.getElementById('stat-submissions').textContent = submissions.toLocaleString();
      document.getElementById('stat-conversion').textContent = `${conversion}%`;
      document.getElementById('stat-time').textContent = avgTime;

      // Field analytics
      let fieldsHtml = '';
      form.pages.forEach(page => {
        page.fields.forEach(field => {
          const fieldResponses = responses.map(r => r.answers?.[field.id]).filter(v => v !== undefined && v !== '');
          const completionRate = responses.length > 0 ? Math.round((fieldResponses.length / responses.length) * 100) : 0;
          
          fieldsHtml += `
            <div style="padding:var(--space-4);background:var(--color-bg-secondary);border-radius:var(--radius-md);margin-bottom:var(--space-3);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2);">
                <div>
                  <div style="font-weight:500;">${this.escapeHtml(field.label || field.title || field.id)}</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${field.type} • ${this.escapeHtml(page.title)}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:var(--text-xl);font-weight:700;color:var(--color-primary);">${completionRate}%</div>
                  <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${fieldResponses.length} / ${responses.length}</div>
                </div>
              </div>
              <div style="height:6px;background:var(--color-border-light);border-radius:var(--radius-full);overflow:hidden;">
                <div style="height:100%;width:${completionRate}%;background:var(--color-primary);border-radius:var(--radius-full);transition:width var(--transition-base);"></div>
              </div>
            </div>
          `;
        });
      });

      fieldsContainer.innerHTML = fieldsHtml || '<p style="color:var(--color-text-muted);text-align:center;padding:var(--space-8);">No fields in this form</p>';
    } catch (e) {
      console.error('Failed to load analytics:', e);
      this.showToast('Failed to load analytics', 'error');
    }
  }

  // Form Actions
  openBuilder(formId) {
    const token = sessionStorage.getItem('formcrafts_token') || localStorage.getItem('formcrafts_token') || '';
    window.open(`/builder/${formId}?token=${token}`, '_blank');
  }

  previewForm(formId) {
    window.open(`/form/${formId}`, '_blank');
  }

  shareForm(formId) {
    this.switchTab('share');
    setTimeout(() => {
      const select = document.getElementById('share-form-select');
      if (select) {
        select.value = formId;
        select.dispatchEvent(new Event('change'));
      }
    }, 100);
  }

  async duplicateForm(formId) {
    try {
      const res = await fetch(`/api/forms/${formId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.showToast('Form duplicated successfully', 'success');
        this.loadForms();
      }
    } catch (e) {
      this.showToast('Failed to duplicate form', 'error');
    }
  }

  deleteForm(formId) {
    const form = this.forms.find(f => f.id === formId);
    if (!form) return;
    document.getElementById('delete-form-name').textContent = form.title;
    document.getElementById('delete-responses-too').checked = false;
    this.currentFormId = formId;
    this.openModal('delete-modal');
  }

  async confirmDelete() {
    const formId = this.currentFormId;
    const deleteResponses = document.getElementById('delete-responses-too').checked;
    
    try {
      await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
      this.showToast('Form deleted', 'success');
      this.closeModal('delete-modal');
      this.loadForms();
    } catch (e) {
      this.showToast('Failed to delete form', 'error');
    }
  }

  async viewResponse(formId, responseId) {
    try {
      const res = await fetch(`/api/forms/${formId}/responses/${responseId}`);
      const response = await res.json();
      
      let html = '<div style="max-height:60vh;overflow-y:auto;">';
      html += '<table class="table" style="margin:0;">';
      Object.entries(response.answers || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          html += `<tr><td style="font-weight:500;width:30%;">${this.escapeHtml(key)}</td><td>${this.escapeHtml(String(value))}</td></tr>`;
        }
      });
      html += '</table></div>';
      
      this.showModal('Response Details', html, [
        { text: 'Close', class: 'btn-secondary', onclick: 'app.closeModal(\'view-response-modal\')' }
      ], 'view-response-modal');
    } catch (e) {
      this.showToast('Failed to load response', 'error');
    }
  }

  async deleteResponse(formId, responseId) {
    if (!confirm('Delete this response?')) return;
    try {
      await fetch(`/api/forms/${formId}/responses/${responseId}`, { method: 'DELETE' });
      this.showToast('Response deleted', 'success');
      this.loadResponses(document.getElementById('responses-form-filter').value);
    } catch (e) {
      this.showToast('Failed to delete response', 'error');
    }
  }

  async exportAllResponses() {
    const formId = document.getElementById('responses-form-filter').value;
    if (!formId) {
      this.showToast('Please select a form', 'warning');
      return;
    }
    window.open(`/api/forms/${formId}/responses/export`, '_blank');
  }

  // Import
  async importGoogleForm() {
    const url = document.getElementById('google-form-url').value.trim();
    if (!url) { this.showToast('Please enter a Google Form URL', 'warning'); return; }
    
    const btn = document.getElementById('btn-import-google');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Fetching...';
    
    try {
      const res = await fetch('/api/import/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        this.showImportPreview(data.schema, data.cacheKey, 'google');
      } else {
        this.showToast(data.error || 'Failed to import', 'error');
      }
    } catch (e) {
      this.showToast('Import failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false; btn.innerHTML = '<span>🔍</span> Fetch & Preview';
    }
  }

  async importMicrosoftForm() {
    const url = document.getElementById('microsoft-form-url').value.trim();
    if (!url) { this.showToast('Please enter a Microsoft Forms URL', 'warning'); return; }
    
    const btn = document.getElementById('btn-import-microsoft');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Fetching...';
    
    try {
      const res = await fetch('/api/import/microsoft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        this.showImportPreview(data.schema, data.cacheKey, 'microsoft');
      } else {
        this.showToast(data.error || 'Failed to import', 'error');
      }
    } catch (e) {
      this.showToast('Import failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false; btn.innerHTML = '<span>🔍</span> Fetch & Preview';
    }
  }

  showImportPreview(schema, cacheKey, source) {
    this.importCacheKey = cacheKey;
    this.importSource = source;
    
    document.getElementById('import-form-title').value = schema.title || '';
    document.getElementById('import-form-description').value = schema.description || '';
    
    // Render questions preview
    let html = '';
    if (schema.pages) {
      schema.pages.forEach(page => {
        if (page.fields && page.fields.length > 0) {
          html += `<div style="margin-bottom:var(--space-3);"><strong style="color:var(--color-primary);">${this.escapeHtml(page.title)}</strong></div>`;
          page.fields.forEach(field => {
            html += `<div style="padding:var(--space-2);background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-sm);margin-bottom:var(--space-2);font-size:var(--text-sm);">
              <div style="display:flex;gap:var(--space-2);align-items:center;">
                <span class="badge badge-gray">${field.type}</span>
                <span style="font-weight:500;">${this.escapeHtml(field.label || field.title || 'Untitled')}</span>
                ${field.required ? '<span class="badge badge-danger" style="font-size:var(--text-xs);">Required</span>' : ''}
              </div>
            </div>`;
          });
        }
      });
    }
    document.getElementById('import-questions-preview').innerHTML = html || '<p style="color:var(--color-text-muted);">No questions found</p>';
    
    document.getElementById('import-preview-section').classList.remove('hidden');
    document.getElementById('import-preview-section').scrollIntoView({ behavior: 'smooth' });
  }

  hideImportPreview() {
    document.getElementById('import-preview-section').classList.add('hidden');
    document.getElementById('google-form-url').value = '';
    document.getElementById('microsoft-form-url').value = '';
    this.importCacheKey = null;
  }

  async applyImport() {
    const title = document.getElementById('import-form-title').value.trim();
    const description = document.getElementById('import-form-description').value.trim();
    
    if (!title) { this.showToast('Please enter a form title', 'warning'); return; }
    if (!this.importCacheKey) { this.showToast('No import data', 'error'); return; }

    const btn = document.getElementById('apply-import');
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Importing...';

    try {
      const res = await fetch('/api/import/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheKey: this.importCacheKey, title, description })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Form imported successfully!', 'success');
        this.hideImportPreview();
        this.loadForms();
        this.switchTab('forms');
      } else {
        this.showToast(data.error || 'Import failed', 'error');
      }
    } catch (e) {
      this.showToast('Import failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false; btn.innerHTML = '<span>✅</span> Import Form';
    }
  }

  // Share
  async loadShareForms() {
    // Already loaded in updateFormSelects
  }

  async loadShareData(formId) {
    const content = document.getElementById('share-content');
    const empty = document.getElementById('share-empty');
    const form = this.forms.find(f => f.id === formId);

    if (!form) {
      content?.classList.add('hidden');
      empty?.classList.remove('hidden');
      return;
    }

    this.currentFormId = formId;
    content?.classList.remove('hidden');
    empty?.classList.add('hidden');

    const baseUrl = `${window.location.origin}/form/${formId}`;
    document.getElementById('share-direct-url').value = baseUrl;
    this.updateDirectUrl();

    // Load share links with QR codes
    try {
      const [waRes, liRes, gmRes] = await Promise.all([
        fetch(`/api/forms/${formId}/share/whatsapp`),
        fetch(`/api/forms/${formId}/share/linkedin`),
        fetch(`/api/forms/${formId}/share/gmail`)
      ]);
      const [waData, liData, gmData] = await Promise.all([waRes.json(), liRes.json(), gmRes.json()]);

      // WhatsApp
      document.getElementById('whatsapp-message').value = waData.messageText;
      document.getElementById('whatsapp-share-btn').href = waData.shareUrl;
      document.getElementById('whatsapp-qr').src = waData.qrCode;

      // LinkedIn
      document.getElementById('linkedin-message').value = liData.messageText || `Check out this form: ${liData.formUrl}`;
      document.getElementById('linkedin-share-btn').href = liData.shareUrl;
      document.getElementById('linkedin-qr').src = liData.qrCode;

      // Gmail
      document.getElementById('gmail-subject').value = gmData.subject;
      document.getElementById('gmail-body').value = gmData.body;
      document.getElementById('gmail-share-btn').href = gmData.shareUrl;
      document.getElementById('gmail-qr').src = gmData.qrCode;
    } catch (e) {
      console.error('Failed to load share data:', e);
    }
  }

  updateDirectUrl() {
    const baseUrl = document.getElementById('share-direct-url').value;
    const source = document.getElementById('utm-source').value;
    const medium = document.getElementById('utm-medium').value;
    const campaign = document.getElementById('utm-campaign').value;
    
    let url = baseUrl;
    const params = [];
    if (source) params.push(`utm_source=${encodeURIComponent(source)}`);
    if (medium) params.push(`utm_medium=${encodeURIComponent(medium)}`);
    if (campaign) params.push(`utm_campaign=${encodeURIComponent(campaign)}`);
    if (params.length) url += (url.includes('?') ? '&' : '?') + params.join('&');
    
    document.getElementById('share-direct-url').value = url;
  }

  generateTrackedUrl() {
    this.updateDirectUrl();
    this.copyToClipboard('share-direct-url');
    this.showToast('Tracked URL copied!', 'success');
  }

  copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.select();
      document.execCommand('copy');
      this.showToast('Copied to clipboard!', 'success');
    }
  }

  copyGmailText() {
    const subject = document.getElementById('gmail-subject').value;
    const body = document.getElementById('gmail-body').value;
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    this.showToast('Gmail content copied!', 'success');
  }

  // Embed
  async loadEmbedForms() {
    // Already loaded
  }

  async loadEmbedData(formId) {
    const content = document.getElementById('embed-content');
    const empty = document.getElementById('embed-empty');

    if (!formId) {
      content?.classList.add('hidden');
      empty?.classList.remove('hidden');
      return;
    }

    this.currentFormId = formId;
    content?.classList.remove('hidden');
    empty?.classList.add('hidden');

    try {
      const res = await fetch(`/api/forms/${formId}/embed`);
      const data = await res.json();
      this.embedData = data;
      this.updateEmbedCode();
      document.getElementById('embed-preview').src = data.formUrl;
    } catch (e) {
      console.error('Failed to load embed data:', e);
    }
  }

  switchEmbedTab(tab) {
    document.querySelectorAll('#embed-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.embedTab === tab));
    this.updateEmbedCode();
  }

  updateEmbedCode() {
    if (!this.embedData) return;
    
    const responsive = document.getElementById('embed-responsive')?.checked;
    const height = document.getElementById('embed-height')?.value || 600;
    const activeTab = document.querySelector('#embed-tabs .tab.active')?.dataset.embedTab || 'iframe';
    
    let code = this.embedData.embedCodes[activeTab] || this.embedData.embedCodes.iframe;
    
    if (activeTab === 'iframe') {
      code = code.replace('width="100%"', responsive ? 'width="100%"' : 'width="640px"');
      code = code.replace('height="600"', `height="${height}"`);
    }
    
    document.getElementById('embed-code').value = code;
  }

  // Settings
  async saveSettings() {
    const cfg = {
      appName: document.getElementById('setting-app-name').value,
      adminPin: document.getElementById('setting-admin-pin').value,
      allowGlossary: document.getElementById('setting-allow-glossary').checked
    };
    await this.saveConfig(cfg);
    this.showToast('Settings saved', 'success');
  }

  async saveDefaultSettings() {
    const cfg = {
      defaultFormSettings: {
        showProgress: document.getElementById('setting-show-progress').checked,
        collectEmail: document.getElementById('setting-collect-email').checked,
        allowMultiple: document.getElementById('setting-allow-multiple').checked,
        confirmationMessage: document.getElementById('setting-confirmation').value,
        redirectUrl: document.getElementById('setting-redirect').value
      }
    };
    await this.saveConfig(cfg);
    this.showToast('Default form settings saved', 'success');
  }

  async saveBranding() {
    const cfg = {
      brandTag: document.getElementById('setting-brand-tag').value,
      pageTitleSuffix: document.getElementById('setting-page-title').value
    };
    await this.saveConfig(cfg);
    document.getElementById('brand-tag').textContent = cfg.brandTag;
    document.getElementById('preview-tag-text').textContent = cfg.brandTag;
    this.showToast('Branding saved', 'success');
  }

  async saveTheme() {
    const cfg = {
      primaryColor: document.getElementById('theme-primary-color').value,
      defaultTheme: document.getElementById('theme-default-mode').value
    };
    await this.saveConfig(cfg);
    
    // Apply theme CSS variable
    document.documentElement.style.setProperty('--color-primary', cfg.primaryColor);
    this.showToast('Theme saved', 'success');
  }

  async saveConfig(cfg) {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
  }

  // Glossary
  async loadGlossary() {
    try {
      const res = await fetch('/api/glossary');
      const data = await res.json();
      this.glossary = data.glossary || [];
      this.renderGlossary();
    } catch (e) {
      console.error('Failed to load glossary:', e);
    }
  }

  renderGlossary() {
    const container = document.getElementById('glossary-list');
    if (!container) return;
    
    if (this.glossary.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8);">
          <div class="empty-state-icon">📖</div>
          <h3 class="empty-state-title">No glossary terms</h3>
          <p class="empty-state-desc">Add terms to show in the respondent glossary pane</p>
          <button class="btn btn-primary" onclick="app.openGlossaryModal()"><span>➕</span> Add First Term</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.glossary.map((term, idx) => `
      <div class="glossary-item" style="padding:var(--space-4);border-bottom:1px solid var(--color-border);display:flex;align-items:flex-start;gap:var(--space-3);">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;color:var(--color-text);">${this.escapeHtml(term.term)}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${this.escapeHtml(term.category)}</div>
          <div style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-top:var(--space-1);">${this.escapeHtml(term.definition)}</div>
        </div>
        <div style="display:flex;gap:var(--space-1);flex-shrink:0;">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="app.editGlossaryTerm(${idx})" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/></svg></button>
          <button class="btn btn-ghost btn-sm btn-icon danger" onclick="app.deleteGlossaryTerm(${idx})" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      </div>
    `).join('');
  }

  openGlossaryModal(term = null, index = -1) {
    const modal = document.getElementById('glossary-modal');
    const title = document.getElementById('glossary-modal-title');
    const form = document.getElementById('glossary-form');
    
    form?.reset();
    document.getElementById('glossary-term-id').value = '';
    
    if (term) {
      title.textContent = 'Edit Glossary Term';
      document.getElementById('glossary-term').value = term.term;
      document.getElementById('glossary-category').value = term.category;
      document.getElementById('glossary-definition').value = term.definition;
      document.getElementById('glossary-term-id').value = index;
    } else {
      title.textContent = 'Add Glossary Term';
    }
    
    this.openModal('glossary-modal');
  }

  editGlossaryTerm(index) {
    this.openGlossaryModal(this.glossary[index], index);
  }

  async saveGlossaryTerm() {
    const term = {
      term: document.getElementById('glossary-term').value.trim(),
      category: document.getElementById('glossary-category').value.trim(),
      definition: document.getElementById('glossary-definition').value.trim()
    };
    
    if (!term.term || !term.category || !term.definition) {
      this.showToast('Please fill all fields', 'warning');
      return;
    }

    const index = document.getElementById('glossary-term-id').value;
    
    try {
      await fetch('/api/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', term, index: index ? parseInt(index) : undefined })
      });
      this.showToast(index ? 'Term updated' : 'Term added', 'success');
      this.closeModal('glossary-modal');
      this.loadGlossary();
    } catch (e) {
      this.showToast('Failed to save term', 'error');
    }
  }

  async deleteGlossaryTerm(index) {
    if (!confirm('Delete this term?')) return;
    try {
      await fetch('/api/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', index })
      });
      this.showToast('Term deleted', 'success');
      this.loadGlossary();
    } catch (e) {
      this.showToast('Failed to delete term', 'error');
    }
  }

  // Webhooks
  async loadWebhooks() {
    // Mock - would load from storage
    this.webhooks = JSON.parse(localStorage.getItem('formcrafts_webhooks') || '[]');
    this.renderWebhooks();
  }

  renderWebhooks() {
    const tbody = document.getElementById('webhooks-table-body');
    if (this.webhooks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-12);"><div class="empty-state-icon">🔗</div><p style="color:var(--color-text-muted);margin-top:var(--space-2);">No webhooks configured</p></td></tr>';
      return;
    }
    tbody.innerHTML = this.webhooks.map((wh, idx) => `
      <tr>
        <td>${this.escapeHtml(wh.name)}</td>
        <td><code style="font-size:var(--text-xs);">${this.escapeHtml(wh.url)}</code></td>
        <td>${wh.events.join(', ')}</td>
        <td><span class="badge ${wh.active ? 'badge-success' : 'badge-gray'}">${wh.active ? 'Active' : 'Inactive'}</span></td>
        <td style="color:var(--color-text-muted);font-size:var(--text-sm);">${wh.lastTriggered ? new Date(wh.lastTriggered).toLocaleString() : 'Never'}</td>
        <td><button class="btn btn-ghost btn-sm btn-icon danger" onclick="app.deleteWebhook(${idx})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/></svg></button></td>
      </tr>
    `).join('');
  }

  openWebhookModal(webhook = null, index = -1) {
    const modal = document.getElementById('webhook-modal');
    const title = document.getElementById('webhook-modal-title');
    const form = document.getElementById('webhook-form');
    
    form?.reset();
    document.getElementById('webhook-id').value = '';
    
    if (webhook) {
      title.textContent = 'Edit Webhook';
      document.getElementById('webhook-name').value = webhook.name;
      document.getElementById('webhook-url').value = webhook.url;
      document.getElementById('webhook-active').checked = webhook.active;
      document.querySelectorAll('.webhook-event').forEach(cb => {
        cb.checked = webhook.events.includes(cb.value);
      });
      document.getElementById('webhook-id').value = index;
    } else {
      title.textContent = 'Add Webhook';
      document.getElementById('webhook-active').checked = true;
      document.querySelectorAll('.webhook-event').forEach(cb => {
        cb.checked = cb.value === 'form.submit';
      });
    }
    
    this.openModal('webhook-modal');
  }

  async saveWebhook() {
    const webhook = {
      name: document.getElementById('webhook-name').value.trim(),
      url: document.getElementById('webhook-url').value.trim(),
      events: Array.from(document.querySelectorAll('.webhook-event:checked')).map(cb => cb.value),
      active: document.getElementById('webhook-active').checked
    };
    
    if (!webhook.name || !webhook.url) {
      this.showToast('Please fill name and URL', 'warning');
      return;
    }

    const index = document.getElementById('webhook-id').value;
    this.webhooks = JSON.parse(localStorage.getItem('formcrafts_webhooks') || '[]');
    if (index) {
      this.webhooks[index] = webhook;
    } else {
      this.webhooks.push(webhook);
    }
    localStorage.setItem('formcrafts_webhooks', JSON.stringify(this.webhooks));
    
    this.showToast(index ? 'Webhook updated' : 'Webhook added', 'success');
    this.closeModal('webhook-modal');
    this.renderWebhooks();
  }

  deleteWebhook(index) {
    if (!confirm('Delete this webhook?')) return;
    this.webhooks.splice(index, 1);
    localStorage.setItem('formcrafts_webhooks', JSON.stringify(this.webhooks));
    this.renderWebhooks();
  }

  // Modal helpers
  openModal(id) {
    document.getElementById(id)?.classList.add('open');
  }

  closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
  }

  showModal(title, content, buttons = [], id = 'dynamic-modal') {
    // Remove existing
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = id;
    modal.innerHTML = `
      <div class="modal" style="max-width:600px;">
        <div class="modal-header">
          <h3 class="modal-title">${this.escapeHtml(title)}</h3>
          <button class="modal-close" onclick="app.closeModal('${id}')">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        <div class="modal-footer">
          ${buttons.map(b => `<button class="btn ${b.class || 'btn-secondary'}" onclick="${b.onclick}">${b.text}</button>`).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('open'));
  }

  // Theme
  initTheme() {
    const saved = localStorage.getItem('formcrafts_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);
    // Sync theme changes across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'formcrafts_theme' && e.newValue) {
        document.documentElement.setAttribute('data-theme', e.newValue);
        this.updateThemeIcon(e.newValue);
      }
    });
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('formcrafts_theme', next);
    this.updateThemeIcon(next);
  }

  updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Toast
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span style="flex:1;">${this.escapeHtml(message)}</span>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="this.parentElement.remove()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&': '&', '<': '<', '>': '>', '"': '"', "'": '''}[c]));
  }
}

// Initialize on DOM ready
let app = null;

document.addEventListener('DOMContentLoaded', () => {
  app = new AdminApp();
  app.init();
});

// Make app globally accessible
window.app = app;