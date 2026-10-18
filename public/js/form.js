// FormCrafts Respondent Form View
class FormApp {
  constructor() {
    this.form = null;
    this.formId = null;
    this.currentPageIndex = 0;
    this.answers = {};
    this.errors = {};
    this.startTime = Date.now();
    this.isSubmitting = false;
    this.init();
  }

  async init() {
    this.formId = this.getFormIdFromUrl();
    if (!this.formId) {
      this.showError('Invalid form URL');
      return;
    }
    
    this.setupEventListeners();
    await this.loadForm();
    this.render();
    this.startAutoSave();
  }

  getFormIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/form\/([^/?]+)/);
    return match ? match[1] : null;
  }

  setupEventListeners() {
    // Navigation
    document.getElementById('btn-prev-page')?.addEventListener('click', () => this.prevPage());
    document.getElementById('btn-next-page')?.addEventListener('click', () => this.nextPage());
    document.getElementById('btn-submit')?.addEventListener('click', () => this.submitForm());

    // Glossary
    document.getElementById('glossary-toggle')?.addEventListener('click', () => this.toggleGlossary());
    document.getElementById('close-glossary')?.addEventListener('click', () => this.closeGlossary());
    document.getElementById('glossary-search')?.addEventListener('input', (e) => this.filterGlossary(e.target.value));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !e.target.closest('.choice-item')) {
        e.preventDefault();
        if (this.currentPageIndex < this.form.pages.length - 1) this.nextPage();
        else this.submitForm();
      }
    });

    // Form inputs - delegate for dynamic content
    document.getElementById('form-pages')?.addEventListener('input', (e) => this.handleInput(e));
    document.getElementById('form-pages')?.addEventListener('change', (e) => this.handleChange(e));

    // File upload drag & drop
    document.getElementById('form-pages')?.addEventListener('dragover', (e) => this.handleDragOver(e));
    document.getElementById('form-pages')?.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    document.getElementById('form-pages')?.addEventListener('drop', (e) => this.handleDrop(e));

    // Auto-save draft to localStorage
    window.addEventListener('beforeunload', () => this.saveDraft());
  }

  async loadForm() {
    try {
      const res = await fetch(`/api/forms/${this.formId}/respondent`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('This form is not published yet');
        if (res.status === 404) throw new Error('Form not found');
        throw new Error('Failed to load form');
      }
      this.form = await res.json();
      
      // Load draft if exists
      this.loadDraft();
    } catch (e) {
      this.showError(e.message);
    }
  }

  render() {
    if (!this.form) return;
    
    // Update page title
    document.title = `${this.form.title} ${this.form.meta?.pageTitleSuffix || '| FormCrafts'}`;
    document.getElementById('page-title').textContent = document.title;
    
    // Update header
    document.getElementById('form-brand-title').textContent = this.form.meta?.appName || 'FormCrafts';
    document.getElementById('form-brand-tag').querySelector('span:last-child').textContent = this.form.meta?.brandTag || 'Professional Form Builder';
    document.getElementById('form-header-icon').textContent = this.form.icon || '📝';
    document.getElementById('form-header-title').textContent = this.form.title;
    document.getElementById('form-header-desc').textContent = this.form.description || '';
    
    // Render pages
    this.renderPages();
    
    // Render glossary
    this.renderGlossary();
    
    // Show/hide progress bar
    const showProgress = this.form.settings?.showProgress && this.form.pages.length > 1;
    document.getElementById('form-progress-bar')?.classList.toggle('hidden', !showProgress);
    document.getElementById('form-progress-mini')?.classList.toggle('hidden', !showProgress);
    
    // Update navigation
    this.updateNavigation();
    this.updateProgress();
  }

  renderPages() {
    const container = document.getElementById('form-pages');
    if (!container) return;
    
    container.innerHTML = this.form.pages.map((page, idx) => `
      <div class="form-page ${idx === this.currentPageIndex ? '' : 'hidden'}" data-page-index="${idx}">
        ${page.title || page.description ? `
          <div class="page-header">
            ${page.title ? `<h2 class="page-title">${this.escapeHtml(page.title)}</h2>` : ''}
            ${page.description ? `<p class="page-desc">${this.escapeHtml(page.description)}</p>` : ''}
          </div>
        ` : ''}
        <div class="page-fields">
          ${page.fields.map(field => this.renderField(field)).join('')}
        </div>
      </div>
    `).join('');
    
    // Re-attach event listeners for new elements
    this.bindFieldEvents();
  }

  renderField(field) {
    if (field.hidden) return `<div class="form-field hidden" data-field-id="${field.id}"></div>`;
    
    let fieldHtml = '';
    const value = this.answers[field.id] || field.defaultValue || '';
    const error = this.errors[field.id];
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'phone':
      case 'url':
        fieldHtml = this.renderInputField(field, value, error);
        break;
      case 'textarea':
        fieldHtml = this.renderTextareaField(field, value, error);
        break;
      case 'date':
      case 'time':
        fieldHtml = this.renderInputField(field, value, error);
        break;
      case 'radio':
      case 'checkbox':
      case 'yesno':
        fieldHtml = this.renderChoiceField(field, value, error);
        break;
      case 'select':
        fieldHtml = this.renderSelectField(field, value, error);
        break;
      case 'likert':
        fieldHtml = this.renderLikertField(field, value, error);
        break;
      case 'likert_matrix':
        fieldHtml = this.renderLikertMatrixField(field, value, error);
        break;
      case 'rating':
        fieldHtml = this.renderRatingField(field, value, error);
        break;
      case 'scale':
        fieldHtml = this.renderScaleField(field, value, error);
        break;
      case 'file':
        fieldHtml = this.renderFileField(field, value, error);
        break;
      case 'signature':
        fieldHtml = this.renderSignatureField(field, value, error);
        break;
      case 'section':
        fieldHtml = this.renderSectionField(field);
        break;
      case 'divider':
        fieldHtml = '<hr class="divider-field">';
        break;
      case 'html':
        fieldHtml = `<div class="html-content">${field.content || ''}</div>`;
        break;
      case 'page_break':
        fieldHtml = ''; // Handled by page structure
        break;
      case 'consent':
        fieldHtml = this.renderConsentField(field, value, error);
        break;
      case 'name':
        fieldHtml = this.renderNameField(field, value, error);
        break;
      case 'address':
        fieldHtml = this.renderAddressField(field, value, error);
        break;
      default:
        fieldHtml = this.renderInputField(field, value, error);
    }

    return `
      <div class="form-field ${error ? 'has-error' : ''}" data-field-id="${field.id}" data-field-type="${field.type}" data-required="${field.required}">
        ${fieldHtml}
        ${error ? `<p class="field-error visible">${this.escapeHtml(error)}</p>` : ''}
      </div>
    `;
  }

  renderInputField(field, value, error) {
    const typeMap = { email: 'email', number: 'number', phone: 'tel', url: 'url', date: 'date', time: 'time', text: 'text' };
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <input type="${typeMap[field.type] || 'text'}" class="form-input ${error ? 'error' : ''}" name="${field.id}" value="${this.escapeHtml(value)}" placeholder="${this.escapeHtml(field.placeholder)}" ${field.required ? 'required' : ''} autocomplete="${this.getAutocomplete(field.type)}">
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderTextareaField(field, value, error) {
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <textarea class="form-input ${error ? 'error' : ''}" name="${field.id}" placeholder="${this.escapeHtml(field.placeholder)}" ${field.required ? 'required' : ''}>${this.escapeHtml(value)}</textarea>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderChoiceField(field, value, error) {
    const isRadio = field.type === 'radio' || field.type === 'yesno';
    const options = field.options || [];
    const selectedValue = Array.isArray(value) ? value : [value];
    
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="choices-list">
        ${options.map((opt, idx) => {
          const isSelected = selectedValue.includes(opt.value);
          return `
            <label class="choice-item ${isSelected ? 'selected' : ''} ${error ? 'error' : ''}">
              <input type="${isRadio ? 'radio' : 'checkbox'}" name="${field.id}" value="${this.escapeHtml(opt.value)}" ${isSelected ? 'checked' : ''} ${field.required ? 'required' : ''}>
              <span class="choice-label">${this.escapeHtml(opt.label)}</span>
            </label>
          `;
        }).join('')}
        ${field.otherOption ? `
          <div class="choice-other">
            <label class="choice-item ${selectedValue.includes('other') ? 'selected' : ''}">
              <input type="${isRadio ? 'radio' : 'checkbox'}" name="${field.id}" value="other" ${selectedValue.includes('other') ? 'checked' : ''}>
              <span class="choice-label">Other</span>
            </label>
            <input type="text" class="form-input" name="${field.id}_other" placeholder="Please specify..." value="${this.escapeHtml(this.answers[field.id + '_other'] || '')}" ${selectedValue.includes('other') ? '' : 'style="display:none;"'}>
          </div>
        ` : ''}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderSelectField(field, value, error) {
    const options = field.options || [];
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <select class="form-input ${error ? 'error' : ''}" name="${field.id}" ${field.required ? 'required' : ''}>
        <option value="">Select an option</option>
        ${options.map(opt => `<option value="${this.escapeHtml(opt.value)}" ${value === opt.value ? 'selected' : ''}>${this.escapeHtml(opt.label)}</option>`).join('')}
      </select>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderLikertField(field, value, error) {
    const statements = field.statements || [{ text: field.label }];
    const scale = field.scale || { min: 1, max: 5, labels: { 1: 'Strongly Disagree', 5: 'Strongly Agree' }};
    const cols = Object.keys(scale.labels).length;
    const answers = value || {};
    
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="likert-scale" style="--likert-cols: ${cols};">
        <div class="likert-header">
          <div class="likert-header-label">Statement</div>
          ${Object.entries(scale.labels).map(([key, label]) => `<div class="likert-header-label">${this.escapeHtml(label)}</div>`).join('')}
        </div>
        ${statements.map((stmt, sIdx) => {
          const stmtKey = stmt.id || `stmt_${sIdx}`;
          const selected = answers[stmtKey];
          return `
            <div class="likert-statement" style="--likert-cols: ${cols};">
              <div class="likert-statement-text">${this.escapeHtml(stmt.text)}</div>
              <div class="likert-options">
                ${Object.entries(scale.labels).map(([key, label]) => `
                  <label class="likert-option">
                    <input type="radio" name="${field.id}_${stmtKey}" value="${key}" ${selected === key ? 'checked' : ''} ${field.required ? 'required' : ''}>
                    <span class="likert-option-label">${key}</span>
                    <span class="likert-option-text">${this.escapeHtml(label)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderLikertMatrixField(field, value, error) {
    const columns = field.columns || [];
    const statements = field.statements || [];
    const answers = value || {};
    
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      ${field.instruction ? `<p class="field-help" style="font-style:italic;margin-bottom:var(--space-4);">${this.escapeHtml(field.instruction)}</p>` : ''}
      <div class="likert-scale" style="--likert-cols: ${columns.length};">
        <div class="likert-header">
          <div class="likert-header-label">${this.escapeHtml(field.label)}</div>
          ${columns.map(col => `<div class="likert-header-label">${this.escapeHtml(col.label)}</div>`).join('')}
        </div>
        ${statements.map((stmt, sIdx) => {
          const stmtKey = stmt.id || `stmt_${sIdx}`;
          const selected = answers[stmtKey];
          return `
            <div class="likert-statement" style="--likert-cols: ${columns.length};">
              <div class="likert-statement-text">${this.escapeHtml(stmt.text)}</div>
              <div class="likert-options">
                ${columns.map((col, cIdx) => `
                  <label class="likert-option">
                    <input type="radio" name="${field.id}_${stmtKey}" value="${cIdx}" ${selected === cIdx ? 'checked' : ''} ${field.required ? 'required' : ''}>
                    <span class="likert-option-label">${cIdx + 1}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderRatingField(field, value, error) {
    const max = field.maxRating || 5;
    const selected = parseInt(value) || 0;
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="rating-field" data-field-id="${field.id}">
        ${Array.from({ length: max }, (_, i) => `
          <label class="rating-star ${i < selected ? 'filled' : ''}" data-value="${i + 1}">
            <input type="radio" name="${field.id}" value="${i + 1}" ${i + 1 === selected ? 'checked' : ''} ${field.required ? 'required' : ''}>
            ★
          </label>
        `).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderScaleField(field, value, error) {
    const min = 1, max = 10;
    const selected = parseInt(value) || 0;
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="scale-field">
        ${Array.from({ length: max }, (_, i) => `
          <div class="scale-option">
            <input type="radio" name="${field.id}" value="${i + 1}" id="${field.id}_${i + 1}" ${i + 1 === selected ? 'checked' : ''} ${field.required ? 'required' : ''}>
            <label class="scale-label ${i + 1 === selected ? 'selected' : ''}" for="${field.id}_${i + 1}">
              <span class="scale-value">${i + 1}</span>
            </label>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--color-text-muted);margin-top:var(--space-2);">
        <span>${this.escapeHtml(field.minLabel || 'Not at all')}</span>
        <span>${this.escapeHtml(field.maxLabel || 'Extremely')}</span>
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderFileField(field, value, error) {
    const files = value || [];
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="file-upload ${error ? 'error' : ''}" data-field-id="${field.id}">
        <input type="file" name="${field.id}" ${field.required ? 'required' : ''} ${(field.maxFiles || 1) > 1 ? 'multiple' : ''} accept="${this.escapeHtml(field.accept)}" style="display:none;">
        <div class="file-upload-icon">📎</div>
        <div class="file-upload-text">Drag & drop files here or click to browse</div>
        <div class="file-upload-hint">Max ${field.maxSize || 10}MB • ${field.accept ? field.accept : 'All file types'}</div>
      </div>
      <div class="file-list">
        ${files.map((file, idx) => `
          <div class="file-item">
            <span class="file-item-icon">${this.getFileIcon(file.name)}</span>
            <div class="file-item-info">
              <div class="file-item-name">${this.escapeHtml(file.name)}</div>
              <div class="file-item-size">${this.formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="file-item-remove" onclick="app.removeFile('${field.id}', ${idx})">✕</button>
          </div>
        `).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderSignatureField(field, value, error) {
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="signature-wrapper">
        <canvas class="signature-pad ${error ? 'error' : ''}" data-field-id="${field.id}" width="600" height="200"></canvas>
        <div class="signature-actions">
          <button type="button" class="btn btn-secondary btn-sm" onclick="app.clearSignature('${field.id}')"><span>🗑️</span> Clear</button>
        </div>
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderSectionField(field) {
    return `
      <div class="section-header">
        <h3 class="section-title">${this.escapeHtml(field.title || field.label)}</h3>
        ${field.description ? `<p class="section-desc">${this.escapeHtml(field.description)}</p>` : ''}
      </div>
    `;
  }

  renderConsentField(field, value, error) {
    return `
      <div class="consent-field ${error ? 'has-error' : ''}">
        <div class="consent-text">${this.escapeHtml(field.consentText)}</div>
        <div class="consent-options">
          <label class="choice-item ${value === 'agree' ? 'selected' : ''}">
            <input type="radio" name="${field.id}" value="agree" ${value === 'agree' ? 'checked' : ''} ${field.required ? 'required' : ''}>
            <span class="choice-label">I agree</span>
          </label>
          <label class="choice-item ${value === 'disagree' ? 'selected' : ''}">
            <input type="radio" name="${field.id}" value="disagree" ${value === 'disagree' ? 'checked' : ''}>
            <span class="choice-label">I disagree</span>
          </label>
        </div>
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderNameField(field, value, error) {
    const val = value || {};
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="name-field">
        <div class="form-field">
          <label class="field-label">${this.escapeHtml(field.firstNameLabel || 'First Name')}${field.required ? '<span class="field-required">*</span>' : ''}</label>
          <input type="text" class="form-input ${error ? 'error' : ''}" name="${field.id}_first" value="${this.escapeHtml(val.first || '')}" placeholder="First name" ${field.required ? 'required' : ''}>
        </div>
        <div class="form-field">
          <label class="field-label">${this.escapeHtml(field.lastNameLabel || 'Last Name')}${field.required ? '<span class="field-required">*</span>' : ''}</label>
          <input type="text" class="form-input ${error ? 'error' : ''}" name="${field.id}_last" value="${this.escapeHtml(val.last || '')}" placeholder="Last name" ${field.required ? 'required' : ''}>
        </div>
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderAddressField(field, value, error) {
    const fields = field.fields || ['street', 'city', 'state', 'zip', 'country'];
    const labels = { street: 'Street Address', city: 'City', state: 'State/Province', zip: 'ZIP/Postal Code', country: 'Country' };
    const val = value || {};
    
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="address-field">
        ${fields.map(f => `
          <div class="form-field">
            <label class="field-label">${this.escapeHtml(labels[f] || f)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
            <input type="text" class="form-input ${error ? 'error' : ''}" name="${field.id}_${f}" value="${this.escapeHtml(val[f] || '')}" placeholder="${this.escapeHtml(labels[f] || f)}" ${field.required ? 'required' : ''}>
          </div>
        `).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  bindFieldEvents() {
    // Rating stars
    document.querySelectorAll('.rating-star').forEach(star => {
      star.addEventListener('click', (e) => {
        const fieldId = e.currentTarget.closest('.rating-field').dataset.fieldId;
        const value = parseInt(e.currentTarget.dataset.value);
        this.setAnswer(fieldId, value);
        this.updateRatingDisplay(fieldId, value);
      });
    });

    // Scale options
    document.querySelectorAll('.scale-option input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.setAnswer(e.target.name, e.target.value);
      });
    });

    // Signature pads
    document.querySelectorAll('.signature-pad').forEach(canvas => {
      this.initSignaturePad(canvas);
    });

    // File uploads
    document.querySelectorAll('.file-upload').forEach(upload => {
      upload.addEventListener('click', (e) => {
        if (e.target === upload || e.target.classList.contains('file-upload-icon') || e.target.classList.contains('file-upload-text') || e.target.classList.contains('file-upload-hint')) {
          upload.querySelector('input[type="file"]').click();
        }
      });
      upload.querySelector('input[type="file"]').addEventListener('change', (e) => this.handleFileSelect(e));
    });

    // Choice items
    document.querySelectorAll('.choice-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const input = item.querySelector('input');
        if (input) {
          input.click();
          input.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  initSignaturePad(canvas) {
    const ctx = canvas.getContext('2d');
    const fieldId = canvas.dataset.fieldId;
    let drawing = false;
    
    canvas.style.cursor = 'crosshair';
    canvas.style.touchAction = 'none';
    
    // Draw existing signature if any
    const sigData = this.answers[fieldId];
    if (sigData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = sigData;
    }
    
    const getCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX || e.touches[0].clientX) - rect.left,
        y: (e.clientY || e.touches[0].clientY) - rect.top
      };
    };
    
    const startDrawing = (e) => {
      drawing = true;
      const { x, y } = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    
    const draw = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = getCoords(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };
    
    const stopDrawing = () => {
      if (drawing) {
        drawing = false;
        this.setAnswer(fieldId, canvas.toDataURL());
      }
    };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
  }

  clearSignature(fieldId) {
    const canvas = document.querySelector(`.signature-pad[data-field-id="${fieldId}"]`);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.setAnswer(fieldId, '');
    }
  }

  // Event Handlers
  handleInput(e) {
    const target = e.target;
    const fieldId = target.name;
    if (!fieldId) return;
    
    this.setAnswer(fieldId, target.value);
    this.clearError(fieldId);
  }

  handleChange(e) {
    const target = e.target;
    const fieldId = target.name;
    if (!fieldId) return;
    
    if (target.type === 'radio' || target.type === 'checkbox') {
      const field = this.findField(fieldId);
      if (field?.type === 'radio' || field?.type === 'yesno') {
        this.setAnswer(fieldId, target.value);
      } else if (field?.type === 'checkbox') {
        const checkboxes = document.querySelectorAll(`input[name="${fieldId}"]:checked`);
        this.setAnswer(fieldId, Array.from(checkboxes).map(cb => cb.value));
      }
      
      // Handle "Other" option
      const otherInput = document.querySelector(`input[name="${fieldId}_other"]`);
      if (otherInput) {
        otherInput.style.display = target.value === 'other' && target.checked ? 'block' : 'none';
      }
    } else if (target.type === 'checkbox') {
      this.setAnswer(fieldId, target.checked);
    } else if (target.tagName === 'SELECT') {
      this.setAnswer(fieldId, target.value);
    }
    
    this.clearError(fieldId);
  }

  handleFileSelect(e) {
    const input = e.target;
    const fieldId = input.name;
    const field = this.findField(fieldId);
    const maxFiles = field?.maxFiles || 1;
    const maxSize = (field?.maxSize || 10) * 1024 * 1024;
    
    const files = Array.from(input.files).slice(0, maxFiles);
    const validFiles = files.filter(f => {
      if (f.size > maxSize) {
        this.showToast(`File ${f.name} exceeds ${field?.maxSize || 10}MB limit`, 'warning');
        return false;
      }
      return true;
    });
    
    const existingFiles = this.answers[fieldId] || [];
    const newFiles = validFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
      // Store as base64 for draft saving (in production, upload to server)
      data: null // Will be set via FileReader
    }));
    
    // Read files as base64 for draft
    Promise.all(newFiles.map(f => this.readFileAsBase64(f))).then(base64Files => {
      this.setAnswer(fieldId, [...existingFiles, ...base64Files]);
      this.renderFieldInPlace(fieldId);
    });
    
    input.value = ''; // Reset for re-selection
  }

  readFileAsBase64(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ ...file, data: reader.result });
      reader.readAsDataURL(file);
    });
  }

  removeFile(fieldId, index) {
    const files = this.answers[fieldId] || [];
    files.splice(index, 1);
    this.setAnswer(fieldId, files);
    this.renderFieldInPlace(fieldId);
  }

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.querySelectorAll('.file-upload').forEach(el => el.classList.add('drag-over'));
  }

  handleDragLeave(e) {
    e.currentTarget.querySelectorAll('.file-upload').forEach(el => el.classList.remove('drag-over'));
  }

  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.querySelectorAll('.file-upload').forEach(el => el.classList.remove('drag-over'));
    
    const upload = e.target.closest('.file-upload');
    if (upload) {
      const input = upload.querySelector('input[type="file"]');
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event('change'));
    }
  }

  // Validation
  validatePage(pageIndex) {
    const page = this.form.pages[pageIndex];
    let isValid = true;
    this.errors = {};
    
    page.fields.forEach(field => {
      if (field.hidden) return;
      if (field.type === 'page_break') return;
      if (field.type === 'section' || field.type === 'divider' || field.type === 'html') return;
      
      const value = this.answers[field.id];
      
      // Required check
      if (field.required) {
        const isEmpty = this.isEmptyValue(value, field.type);
        if (isEmpty) {
          this.errors[field.id] = field.errorMessage || 'This field is required';
          isValid = false;
        }
      }
      
      // Validation
      if (!this.errors[field.id] && value !== undefined && value !== '' && !this.isEmptyValue(value, field.type)) {
        if (!this.validateField(value, field)) {
          this.errors[field.id] = field.errorMessage || this.getValidationMessage(field.validation);
          isValid = false;
        }
      }
    });
    
    return isValid;
  }

  isEmptyValue(value, type) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  }

  validateField(value, field) {
    switch (field.validation) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        return /^https?:\/\/.+/.test(value);
      case 'number':
        return !isNaN(Number(value));
      case 'min_length':
        return value.length >= parseInt(field.validationValue);
      case 'max_length':
        return value.length <= parseInt(field.validationValue);
      case 'pattern':
        try { return new RegExp(field.validationValue).test(value); } catch { return true; }
      default:
        return true;
    }
  }

  getValidationMessage(type) {
    const messages = {
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
      number: 'Please enter a valid number',
      min_length: `Must be at least ${this.answers[field.id]?.validationValue} characters`,
      max_length: `Must be no more than ${this.answers[field.id]?.validationValue} characters`,
      pattern: 'Invalid format'
    };
    return messages[type] || 'Invalid value';
  }

  clearError(fieldId) {
    delete this.errors[fieldId];
    const fieldEl = document.querySelector(`.form-field[data-field-id="${fieldId}"]`);
    if (fieldEl) {
      fieldEl.classList.remove('has-error');
      fieldEl.querySelector('.field-error')?.classList.remove('visible');
      fieldEl.querySelectorAll('.form-input, .choice-item, .rating-star, .scale-label').forEach(el => el.classList.remove('error'));
    }
  }

  // Navigation
  nextPage() {
    if (!this.validatePage(this.currentPageIndex)) {
      this.renderFieldErrors();
      this.showToast('Please fix the errors above', 'warning');
      return;
    }
    
    if (this.currentPageIndex < this.form.pages.length - 1) {
      this.currentPageIndex++;
      this.renderPageTransition();
    } else {
      this.submitForm();
    }
  }

  prevPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.renderPageTransition();
    }
  }

  renderPageTransition() {
    const pages = document.querySelectorAll('.form-page');
    pages.forEach((page, idx) => {
      page.classList.toggle('hidden', idx !== this.currentPageIndex);
    });
    this.updateNavigation();
    this.updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateNavigation() {
    const isFirst = this.currentPageIndex === 0;
    const isLast = this.currentPageIndex === this.form.pages.length - 1;
    
    document.getElementById('btn-prev-page').style.display = isFirst ? 'none' : 'inline-flex';
    document.getElementById('btn-next-page').style.display = isLast ? 'none' : 'inline-flex';
    document.getElementById('btn-submit').style.display = isLast ? 'inline-flex' : 'none';
  }

  updateProgress() {
    const totalPages = this.form.pages.length;
    const currentPage = this.currentPageIndex + 1;
    const percent = Math.round((currentPage / totalPages) * 100);
    
    document.getElementById('progress-current').textContent = `Page ${currentPage}`;
    document.getElementById('progress-total').textContent = `of ${totalPages}`;
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${percent}%`;
    document.getElementById('progress-mini-fill').style.width = `${percent}%`;
    document.getElementById('progress-mini-text').textContent = `${currentPage} of ${totalPages}`;
  }

  renderFieldErrors() {
    Object.entries(this.errors).forEach(([fieldId, error]) => {
      const fieldEl = document.querySelector(`.form-field[data-field-id="${fieldId}"]`);
      if (fieldEl) {
        fieldEl.classList.add('has-error');
        let errorEl = fieldEl.querySelector('.field-error');
        if (!errorEl) {
          errorEl = document.createElement('p');
          errorEl.className = 'field-error';
          fieldEl.appendChild(errorEl);
        }
        errorEl.textContent = error;
        errorEl.classList.add('visible');
        fieldEl.querySelectorAll('.form-input, .choice-item').forEach(el => el.classList.add('error'));
      }
    });
  }

  // Answer Management
  setAnswer(fieldId, value) {
    this.answers[fieldId] = value;
    this.saveDraft();
  }

  findField(fieldId) {
    for (const page of this.form.pages) {
      const field = page.fields.find(f => f.id === fieldId);
      if (field) return field;
    }
    return null;
  }

  // Draft Auto-save
  saveDraft() {
    const draft = {
      answers: this.answers,
      currentPageIndex: this.currentPageIndex,
      timestamp: Date.now()
    };
    localStorage.setItem(`formcrafts_draft_${this.formId}`, JSON.stringify(draft));
  }

  loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(`formcrafts_draft_${this.formId}`) || '{}');
      if (draft.answers && Date.now() - draft.timestamp < 86400000) { // 24 hours
        this.answers = draft.answers;
        this.currentPageIndex = draft.currentPageIndex || 0;
      }
    } catch (e) {}
  }

  clearDraft() {
    localStorage.removeItem(`formcrafts_draft_${this.formId}`);
  }

  startAutoSave() {
    setInterval(() => this.saveDraft(), 10000); // Every 10 seconds
  }

  // Submission
  async submitForm() {
    // Validate all pages
    for (let i = 0; i < this.form.pages.length; i++) {
      if (!this.validatePage(i)) {
        this.currentPageIndex = i;
        this.renderPageTransition();
        this.renderFieldErrors();
        this.showToast('Please fix the errors above', 'warning');
        return;
      }
    }
    
    // Check consent fields
    for (const page of this.form.pages) {
      for (const field of page.fields) {
        if (field.type === 'consent' && this.answers[field.id] === 'disagree') {
          this.showConsentDeclined();
          return;
        }
      }
    }
    
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    
    const btn = document.getElementById('btn-submit');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Submitting...';
    
    try {
      const completionTime = Math.round((Date.now() - this.startTime) / 1000);
      
      const res = await fetch(`/api/forms/${this.formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: this.answers,
          metadata: {
            source: 'web',
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            completionTime,
            utm: this.getUtmParams()
          }
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        this.clearDraft();
        this.showSuccess(data);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (e) {
      console.error('Submit error:', e);
      this.showToast('Submission failed: ' + e.message, 'error');
    } finally {
      this.isSubmitting = false;
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }

  getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      term: params.get('utm_term'),
      content: params.get('utm_content')
    };
  }

  showSuccess(data) {
    document.getElementById('success-response-id').textContent = data.responseId;
    document.getElementById('success-timestamp').textContent = new Date(data.timestamp).toLocaleString();
    document.getElementById('success-details').style.display = 'block';
    document.getElementById('success-modal')?.classList.add('open');
  }

  showConsentDeclined() {
    this.showModal('Consent Required', `
      <div style="text-align:center;padding:var(--space-8);">
        <div style="font-size:4rem;margin-bottom:var(--space-4);">📋</div>
        <h3 style="font-family:var(--font-heading);font-size:var(--text-xl);margin-bottom:var(--space-2);">Consent Not Given</h3>
        <p style="color:var(--color-text-secondary);">You must agree to the consent terms to submit this form.</p>
      </div>
    `, [{ text: 'OK', class: 'btn-primary', onclick: 'app.closeModal(\'consent-modal\')' }], 'consent-modal');
  }

  // Glossary
  renderGlossary() {
    const container = document.getElementById('glossary-content');
    if (!container) return;
    
    const glossary = this.form.meta?.glossary || this.form.glossary || [];
    if (glossary.length === 0) {
      container.innerHTML = '<div class="glossary-empty">No glossary terms available</div>';
      document.getElementById('glossary-toggle')?.classList.add('hidden');
      return;
    }
    
    document.getElementById('glossary-toggle')?.classList.remove('hidden');
    
    container.innerHTML = glossary.map(term => `
      <div class="glossary-term-item" data-term="${this.escapeHtml(term.term).toLowerCase()}">
        <div class="glossary-term-category">${this.escapeHtml(term.category)}</div>
        <div class="glossary-term-name">${this.escapeHtml(term.term)}</div>
        <div class="glossary-term-definition">${this.escapeHtml(term.definition)}</div>
      </div>
    `).join('');
  }

  filterGlossary(query) {
    const terms = document.querySelectorAll('.glossary-term-item');
    const q = query.toLowerCase();
    terms.forEach(term => {
      const match = term.dataset.term.includes(q);
      term.classList.toggle('hidden', !match);
    });
  }

  toggleGlossary() {
    document.getElementById('glossary-pane')?.classList.toggle('open');
  }

  closeGlossary() {
    document.getElementById('glossary-pane')?.classList.remove('open');
  }

  // Helper: Update single field in place
  renderFieldInPlace(fieldId) {
    const field = this.findField(fieldId);
    if (!field) return;
    
    const container = document.querySelector(`.form-field[data-field-id="${fieldId}"]`);
    if (!container) return;
    
    const error = this.errors[fieldId];
    let fieldHtml = '';
    const value = this.answers[fieldId] || field.defaultValue || '';
    
    switch (field.type) {
      case 'file':
        fieldHtml = this.renderFileField(field, value, error);
        break;
      // Add other types as needed
    }
    
    if (fieldHtml) {
      container.innerHTML = fieldHtml + (error ? `<p class="field-error visible">${this.escapeHtml(error)}</p>` : '');
      this.bindFieldEvents();
    }
  }

  updateRatingDisplay(fieldId, value) {
    const stars = document.querySelectorAll(`.rating-field[data-field-id="${fieldId}"] .rating-star`);
    stars.forEach((star, idx) => {
      star.classList.toggle('filled', idx < value);
    });
  }

  // Modal helpers
  showModal(title, content, buttons = [], id = 'dynamic-modal') {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = id;
    modal.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <h3 class="modal-title">${this.escapeHtml(title)}</h3>
          <button class="modal-close" onclick="app.closeModal('${id}')">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        <div class="modal-footer" style="justify-content:center;">
          ${buttons.map(b => `<button class="btn ${b.class || 'btn-secondary'}" onclick="${b.onclick}">${b.text}</button>`).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('open'));
  }

  closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span style="flex:1;">${this.escapeHtml(message)}</span>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="this.parentElement.remove()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/></svg></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  showError(message) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:var(--space-6);background:var(--color-bg);">
        <div class="card" style="max-width:480px;text-align:center;padding:var(--space-8);">
          <div style="font-size:4rem;margin-bottom:var(--space-4);">📋</div>
          <h2 style="font-family:var(--font-heading);font-size:var(--text-2xl);margin-bottom:var(--space-2);">Unable to Load Form</h2>
          <p style="color:var(--color-text-secondary);margin-bottom:var(--space-6);">${this.escapeHtml(message)}</p>
          <a href="/admin" class="btn btn-primary">Go to Dashboard</a>
        </div>
      </div>
    `;
  }

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&': '&', '<': '<', '>': '>', '"': '"', "'": '''}[c]));
  }

  getAutocomplete(type) {
    const map = { email: 'email', phone: 'tel', url: 'url', name: 'name' };
    return map[type] || 'off';
  }

  getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', zip: '📦', rar: '📦' };
    return icons[ext] || '📎';
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FormApp();
});