// FormCrafts Visual Form Builder
class FormBuilder {
  constructor() {
    this.form = null;
    this.formId = null;
    this.selectedFieldId = null;
    this.selectedPageId = null;
    this.draggedFieldType = null;
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.autoSaveTimer = null;
  }

  async init() {
    this.formId = this.getFormIdFromUrl();
    this.setupEventListeners();
    this.setupDragDrop();
    this.setupDeviceToggle();
    await this.loadForm();
    this.render();
    this.startAutoSave();
  }

  getFormIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/builder\/([^/?]+)/);
    return match ? match[1] : null;
  }

  setupEventListeners() {
    // Field palette drag
    document.querySelectorAll('.field-palette-item').forEach(item => {
      item.addEventListener('dragstart', (e) => this.onDragStart(e));
      item.addEventListener('dragend', (e) => this.onDragEnd(e));
      item.addEventListener('click', (e) => {
        if (!this.draggedFieldType) this.addFieldFromPalette(e.currentTarget.dataset.fieldType);
      });
    });

    // Form title
    document.getElementById('form-title-input')?.addEventListener('input', (e) => {
      this.updateFormTitle(e.target.value);
    });

    // Toolbar buttons
    document.getElementById('btn-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.redo());
    document.getElementById('btn-preview')?.addEventListener('click', () => this.openPreview());
    document.getElementById('btn-settings')?.addEventListener('click', () => this.openSettings());
    document.getElementById('btn-save-draft')?.addEventListener('click', () => this.saveForm());
    document.getElementById('btn-publish')?.addEventListener('click', () => this.publishForm());
    document.getElementById('btn-add-page')?.addEventListener('click', () => this.addPage());
    document.getElementById('add-first-field')?.addEventListener('click', () => this.addFieldFromPalette('text'));

    // Page tabs
    document.getElementById('page-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.page-tab');
      if (tab && !tab.classList.contains('page-tab-close')) {
        this.selectPage(tab.dataset.pageId);
      }
      if (e.target.classList.contains('page-tab-close')) {
        e.stopPropagation();
        this.deletePage(e.target.closest('.page-tab').dataset.pageId);
      }
    });

    // Properties panel
    document.getElementById('prop-label')?.addEventListener('input', (e) => this.updateFieldProp('label', e.target.value));
    document.getElementById('prop-placeholder')?.addEventListener('input', (e) => this.updateFieldProp('placeholder', e.target.value));
    document.getElementById('prop-help')?.addEventListener('input', (e) => this.updateFieldProp('helpText', e.target.value));
    document.getElementById('prop-required')?.addEventListener('change', (e) => this.updateFieldProp('required', e.target.checked));
    document.getElementById('prop-hidden')?.addEventListener('change', (e) => this.updateFieldProp('hidden', e.target.checked));
    document.getElementById('prop-validation')?.addEventListener('change', (e) => this.updateFieldProp('validation', e.target.value));
    document.getElementById('prop-validation-value')?.addEventListener('input', (e) => this.updateFieldProp('validationValue', e.target.value));
    document.getElementById('prop-error-message')?.addEventListener('input', (e) => this.updateFieldProp('errorMessage', e.target.value));
    document.getElementById('prop-default-value')?.addEventListener('input', (e) => this.updateFieldProp('defaultValue', e.target.value));

    // Options
    document.getElementById('add-option-btn')?.addEventListener('click', () => this.addOption());
    document.getElementById('prop-other-option')?.addEventListener('change', (e) => this.updateFieldProp('otherOption', e.target.checked));

    // Likert
    document.getElementById('add-statement-btn')?.addEventListener('click', () => this.addLikertStatement());

    // Logic
    document.getElementById('add-logic-btn')?.addEventListener('click', () => this.addLogicRule());

    // Field actions
    document.getElementById('duplicate-field-btn')?.addEventListener('click', () => this.duplicateField());
    document.getElementById('delete-field-btn')?.addEventListener('click', () => this.deleteField());

    // Page properties
    document.getElementById('page-prop-title')?.addEventListener('input', (e) => this.updatePageProp('title', e.target.value));
    document.getElementById('page-prop-desc')?.addEventListener('input', (e) => this.updatePageProp('description', e.target.value));
    document.getElementById('delete-page-btn')?.addEventListener('click', () => this.deletePage(this.selectedPageId));

    // Form settings properties
    document.getElementById('form-prop-title')?.addEventListener('input', (e) => this.updateFormSetting('title', e.target.value));
    document.getElementById('form-prop-desc')?.addEventListener('input', (e) => this.updateFormSetting('description', e.target.value));
    document.getElementById('form-prop-icon')?.addEventListener('input', (e) => this.updateFormSetting('icon', e.target.value));
    document.getElementById('form-prop-theme')?.addEventListener('change', (e) => this.updateFormSetting('theme', e.target.value));
    document.getElementById('form-prop-progress')?.addEventListener('change', (e) => this.updateFormSetting('showProgress', e.target.checked));
    document.getElementById('form-prop-email')?.addEventListener('change', (e) => this.updateFormSetting('collectEmail', e.target.checked));
    document.getElementById('form-prop-multiple')?.addEventListener('change', (e) => this.updateFormSetting('allowMultiple', e.target.checked));

    // Form logo upload
    document.getElementById('form-logo-upload')?.addEventListener('change', (e) => this.handleLogoUpload(e));
    document.getElementById('form-logo-btn')?.addEventListener('click', () => document.getElementById('form-logo-upload')?.click());
    document.getElementById('form-logo-remove')?.addEventListener('click', () => this.removeLogo());

    // Settings modal
    document.getElementById('save-form-settings')?.addEventListener('click', () => this.saveFormSettings());
    document.querySelectorAll('#settings-tabs .tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchSettingsTab(tab.dataset.settingsTab));
    });

    // Preview modal
    document.getElementById('preview-open-new')?.addEventListener('click', (e) => {
      e.target.href = `/form/${this.formId}?preview=1`;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.redo(); else this.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveForm();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        this.openPreview();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedFieldId && !e.target.matches('input, textarea, select')) {
          e.preventDefault();
          this.deleteField();
        }
      }
    });

    // Close properties on mobile
    document.getElementById('close-properties')?.addEventListener('click', () => {
      document.querySelector('.builder-sidebar-right')?.classList.remove('open');
    });
  }

  setupDragDrop() {
    const canvas = document.getElementById('form-pages');
    const dropZone = document.getElementById('drop-zone-indicator');

    canvas?.addEventListener('dragover', (e) => this.onDragOver(e));
    canvas?.addEventListener('dragleave', (e) => this.onDragLeave(e));
    canvas?.addEventListener('drop', (e) => this.onDrop(e));

    // Also handle drops on form header area for first field
    document.getElementById('form-header-section')?.addEventListener('dragover', (e) => this.onDragOver(e));
    document.getElementById('form-header-section')?.addEventListener('drop', (e) => this.onDrop(e));
    document.getElementById('canvas-empty')?.addEventListener('dragover', (e) => this.onDragOver(e));
    document.getElementById('canvas-empty')?.addEventListener('drop', (e) => this.onDrop(e));
  }

  setupDeviceToggle() {
    const btn = document.getElementById('device-toggle');
    const menu = document.querySelector('#device-toggle + .dropdown-menu');
    
    menu?.querySelectorAll('[data-device]').forEach(item => {
      item.addEventListener('click', () => {
        this.setDevice(item.dataset.device);
        btn?.querySelector('#device-icon').textContent = item.querySelector('span').textContent.trim();
        btn?.querySelector('#device-text').textContent = item.textContent.trim();
      });
    });
  }

  setDevice(device) {
    const frame = document.getElementById('device-frame');
    const screens = document.querySelectorAll('.device-screen');
    
    frame?.dataset.device = device;
    screens.forEach(screen => screen.classList.add('hidden'));
    document.getElementById(`device-${device}`)?.classList.remove('hidden');
  }

  async loadForm() {
    if (this.formId) {
      try {
        const res = await fetch(`/api/forms/${this.formId}`);
        this.form = await res.json();
      } catch (e) {
        console.error('Failed to load form:', e);
        this.form = this.createDefaultForm();
      }
    } else {
      this.form = this.createDefaultForm();
    }
    
    this.ensureFormStructure();
    this.selectedPageId = this.form.pages[0]?.id;
    this.updatePageTabs();
  }

  createDefaultForm() {
    return {
      id: this.formId || crypto.randomUUID(),
      title: 'Untitled Form',
      description: '',
      icon: '📝',
      logo: null,
      theme: 'default',
      settings: {
        showProgress: true,
        collectEmail: false,
        allowMultiple: false,
        confirmationMessage: 'Thank you for your submission!',
        redirectUrl: ''
      },
      pages: [{
        id: crypto.randomUUID(),
        title: 'Page 1',
        description: '',
        fields: []
      }],
      logic: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      published: false
    };
  }

  ensureFormStructure() {
    if (!this.form.pages) this.form.pages = [];
    if (!this.form.logic) this.form.logic = [];
    if (!this.form.settings) this.form.settings = {
      showProgress: true,
      collectEmail: false,
      allowMultiple: false,
      confirmationMessage: 'Thank you for your submission!',
      redirectUrl: ''
    };
    this.form.pages.forEach(page => {
      if (!page.fields) page.fields = [];
      page.fields.forEach(field => {
        if (!field.id) field.id = crypto.randomUUID();
        if (!field.type) field.type = 'text';
      });
    });
  }

  render() {
    this.renderPageTabs();
    this.renderFormPreview();
    this.updateFormTitleDisplay();
    this.updateFormStatus();
    this.syncPreviewToAllDevices();
  }

  renderPageTabs() {
    const container = document.getElementById('page-tabs');
    if (!container) return;
    
    container.innerHTML = this.form.pages.map((page, idx) => `
      <button class="page-tab ${page.id === this.selectedPageId ? 'active' : ''}" data-page-id="${page.id}" title="${this.escapeHtml(page.title)}">
        <span>${idx + 1}. ${this.escapeHtml(page.title)}</span>
        <span class="page-tab-close">×</span>
      </button>
    `).join('');
  }

  selectPage(pageId) {
    this.saveToHistory();
    this.selectedPageId = pageId;
    this.selectedFieldId = null;
    this.renderPageTabs();
    this.renderFormPreview();
    this.showPageProperties();
  }

  addPage() {
    this.saveToHistory();
    const newPage = {
      id: crypto.randomUUID(),
      title: `Page ${this.form.pages.length + 1}`,
      description: '',
      fields: []
    };
    this.form.pages.push(newPage);
    this.selectedPageId = newPage.id;
    this.selectedFieldId = null;
    this.render();
    this.showToast('Page added', 'success');
  }

  deletePage(pageId) {
    if (this.form.pages.length <= 1) {
      this.showToast('Cannot delete the only page', 'warning');
      return;
    }
    if (!confirm('Delete this page and all its fields?')) return;
    
    this.saveToHistory();
    const idx = this.form.pages.findIndex(p => p.id === pageId);
    this.form.pages.splice(idx, 1);
    
    if (this.selectedPageId === pageId) {
      this.selectedPageId = this.form.pages[Math.max(0, idx - 1)]?.id;
    }
    this.selectedFieldId = null;
    this.render();
    this.showToast('Page deleted', 'success');
  }

  updatePageProp(prop, value) {
    const page = this.form.pages.find(p => p.id === this.selectedPageId);
    if (page) {
      this.saveToHistory();
      page[prop] = value;
      this.renderPageTabs();
      this.renderFormPreview();
    }
  }

  showPageProperties() {
    this.hideAllPropertyPanels();
    document.getElementById('page-properties')?.classList.remove('hidden');
    document.getElementById('properties-empty')?.classList.add('hidden');
    
    const page = this.form.pages.find(p => p.id === this.selectedPageId);
    if (page) {
      document.getElementById('page-prop-title').value = page.title || '';
      document.getElementById('page-prop-desc').value = page.description || '';
    }
  }

  // Field Management
  addFieldFromPalette(fieldType, targetPageId = null, insertIndex = -1) {
    this.saveToHistory();
    
    const pageId = targetPageId || this.selectedPageId;
    const page = this.form.pages.find(p => p.id === pageId);
    if (!page) return;

    const field = this.createField(fieldType);
    
    if (insertIndex >= 0 && insertIndex < page.fields.length) {
      page.fields.splice(insertIndex, 0, field);
    } else {
      page.fields.push(field);
    }

    this.selectedFieldId = field.id;
    this.selectedPageId = pageId;
    this.render();
    this.showFieldProperties(field);
    this.showToast(`${this.getFieldLabel(fieldType)} added`, 'success');
  }

  createField(type) {
    const baseField = {
      id: crypto.randomUUID(),
      type,
      label: this.getFieldLabel(type),
      placeholder: '',
      helpText: '',
      required: false,
      hidden: false,
      validation: 'none',
      validationValue: '',
      errorMessage: '',
      defaultValue: ''
    };

    switch (type) {
      case 'textarea':
        return { ...baseField, type: 'textarea', label: 'Long Text', placeholder: 'Enter your answer...' };
      case 'email':
        return { ...baseField, type: 'email', label: 'Email', placeholder: 'name@example.com', validation: 'email' };
      case 'number':
        return { ...baseField, type: 'number', label: 'Number', placeholder: 'Enter a number', validation: 'number' };
      case 'phone':
        return { ...baseField, type: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000' };
      case 'url':
        return { ...baseField, type: 'url', label: 'Website', placeholder: 'https://example.com', validation: 'url' };
      case 'date':
        return { ...baseField, type: 'date', label: 'Date' };
      case 'time':
        return { ...baseField, type: 'time', label: 'Time' };
      case 'radio':
        return { ...baseField, type: 'radio', label: 'Single Choice', options: [
          { id: crypto.randomUUID(), label: 'Option 1', value: 'option_1' },
          { id: crypto.randomUUID(), label: 'Option 2', value: 'option_2' }
        ]};
      case 'checkbox':
        return { ...baseField, type: 'checkbox', label: 'Multiple Choice', options: [
          { id: crypto.randomUUID(), label: 'Option 1', value: 'option_1' },
          { id: crypto.randomUUID(), label: 'Option 2', value: 'option_2' }
        ], otherOption: false };
      case 'select':
        return { ...baseField, type: 'select', label: 'Dropdown', options: [
          { id: crypto.randomUUID(), label: 'Option 1', value: 'option_1' },
          { id: crypto.randomUUID(), label: 'Option 2', value: 'option_2' }
        ]};
      case 'yesno':
        return { ...baseField, type: 'yesno', label: 'Yes / No', options: [
          { id: crypto.randomUUID(), label: 'Yes', value: 'yes' },
          { id: crypto.randomUUID(), label: 'No', value: 'no' }
        ]};
      case 'likert':
        return { ...baseField, type: 'likert', label: 'Likert Scale', statements: [
          { id: crypto.randomUUID(), text: 'Statement 1' }
        ], scale: { min: 1, max: 5, labels: { 1: 'Strongly Disagree', 5: 'Strongly Agree' }}};
      case 'likert_matrix':
        return { ...baseField, type: 'likert_matrix', label: 'Likert Matrix', instruction: 'Please rate each statement:', columns: [
          { id: crypto.randomUUID(), label: 'Strongly Disagree' },
          { id: crypto.randomUUID(), label: 'Disagree' },
          { id: crypto.randomUUID(), label: 'Neutral' },
          { id: crypto.randomUUID(), label: 'Agree' },
          { id: crypto.randomUUID(), label: 'Strongly Agree' },
          { id: crypto.randomUUID(), label: 'N/A' }
        ], statements: [
          { id: crypto.randomUUID(), text: 'Statement 1' },
          { id: crypto.randomUUID(), text: 'Statement 2' }
        ]};
      case 'rating':
        return { ...baseField, type: 'rating', label: 'Star Rating', maxRating: 5 };
      case 'scale':
        return { ...baseField, type: 'scale', label: 'Scale (1-10)', minLabel: 'Not at all', maxLabel: 'Extremely' };
      case 'file':
        return { ...baseField, type: 'file', label: 'File Upload', accept: '', maxFiles: 1, maxSize: 10 };
      case 'signature':
        return { ...baseField, type: 'signature', label: 'Signature' };
      case 'section':
        return { ...baseField, type: 'section', label: 'Section Header', title: 'Section Title', description: 'Section description' };
      case 'page_break':
        return { ...baseField, type: 'page_break', label: 'Page Break' };
      case 'html':
        return { ...baseField, type: 'html', label: 'HTML Content', content: '<p>Enter your content here...</p>' };
      case 'divider':
        return { ...baseField, type: 'divider', label: 'Divider' };
      case 'consent':
        return { ...baseField, type: 'consent', label: 'Consent', title: 'Consent Agreement', consentText: 'I agree to the terms and conditions.', required: true };
      case 'name':
        return { ...baseField, type: 'name', label: 'Name', firstNameLabel: 'First Name', lastNameLabel: 'Last Name' };
      case 'address':
        return { ...baseField, type: 'address', label: 'Address', fields: ['street', 'city', 'state', 'zip', 'country'] };
      default:
        return { ...baseField, type: 'text', label: 'Short Text', placeholder: 'Enter your answer...' };
    }
  }

  getFieldLabel(type) {
    const labels = {
      text: 'Short Text',
      textarea: 'Long Text',
      email: 'Email',
      number: 'Number',
      phone: 'Phone',
      url: 'Website',
      date: 'Date',
      time: 'Time',
      radio: 'Single Choice',
      checkbox: 'Multiple Choice',
      select: 'Dropdown',
      yesno: 'Yes / No',
      likert: 'Likert Scale',
      likert_matrix: 'Likert Matrix',
      rating: 'Star Rating',
      scale: 'Scale (1-10)',
      file: 'File Upload',
      signature: 'Signature',
      section: 'Section Header',
      page_break: 'Page Break',
      html: 'HTML Content',
      divider: 'Divider',
      consent: 'Consent',
      name: 'Name',
      address: 'Address'
    };
    return labels[type] || type;
  }

  getFieldIcon(type) {
    const icons = {
      text: '📝', textarea: '📄', email: '📧', number: '🔢', phone: '📞', url: '🔗',
      date: '📅', time: '🕐', radio: '⭕', checkbox: '☑️', select: '📋', yesno: '✅',
      likert: '📊', likert_matrix: '📈', rating: '⭐', scale: '📏', file: '📎',
      signature: '✍️', section: '📌', page_break: '➡️', html: '🌐', divider: '➖',
      consent: '📜', name: '👤', address: '🏠'
    };
    return icons[type] || '📝';
  }

  // Drag & Drop
  onDragStart(e) {
    this.draggedFieldType = e.currentTarget.dataset.fieldType;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', this.draggedFieldType);
  }

  onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    this.draggedFieldType = null;
    document.getElementById('drop-zone-indicator')?.classList.add('hidden');
    document.querySelectorAll('.form-field.drop-target, .form-page.drop-target').forEach(el => el.classList.remove('drop-target'));
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    const dropZone = document.getElementById('drop-zone-indicator');
    const pages = document.getElementById('form-pages');
    
    // Find drop target
    const target = e.target.closest('.form-field, .form-page, #form-pages, #form-header-section, #canvas-empty');
    
    if (target === pages || target.id === 'form-pages' || target.id === 'form-header-section' || target.id === 'canvas-empty') {
      dropZone?.classList.remove('hidden');
      dropZone.style.top = '0';
      pages?.classList.add('drop-target');
    } else if (target?.classList.contains('form-field')) {
      const rect = target.getBoundingClientRect();
      dropZone?.classList.remove('hidden');
      dropZone.style.top = `${rect.top - pages.getBoundingClientRect().top}px`;
      target.classList.add('drop-target');
    } else if (target?.classList.contains('form-page')) {
      const rect = target.getBoundingClientRect();
      dropZone?.classList.remove('hidden');
      dropZone.style.top = `${rect.top - pages.getBoundingClientRect().top}px`;
      target.classList.add('drop-target');
    } else {
      dropZone?.classList.add('hidden');
      document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    }
  }

  onDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      document.getElementById('drop-zone-indicator')?.classList.add('hidden');
      document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    }
  }

  onDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone-indicator')?.classList.add('hidden');
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    
    if (!this.draggedFieldType) return;
    
    const target = e.target.closest('.form-field, .form-page, #form-pages, #form-header-section, #canvas-empty');
    const pages = document.getElementById('form-pages');
    
    if (target === pages || target.id === 'form-pages' || target.id === 'form-header-section' || target.id === 'canvas-empty') {
      // Add to end of selected page
      this.addFieldFromPalette(this.draggedFieldType);
    } else if (target?.classList.contains('form-field')) {
      const fieldId = target.dataset.fieldId;
      const page = this.form.pages.find(p => p.id === this.selectedPageId);
      const insertIndex = page.fields.findIndex(f => f.id === fieldId);
      this.addFieldFromPalette(this.draggedFieldType, this.selectedPageId, insertIndex);
    } else if (target?.classList.contains('form-page')) {
      const pageId = target.dataset.pageId;
      this.addFieldFromPalette(this.draggedFieldType, pageId, 0);
    }
    
    this.draggedFieldType = null;
  }

  // Field Selection & Properties
  selectField(fieldId, pageId = null) {
    this.selectedFieldId = fieldId;
    this.selectedPageId = pageId || this.selectedPageId;
    
    // Update visual selection
    document.querySelectorAll('.form-field').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.form-field[data-field-id="${fieldId}"]`)?.classList.add('selected');
    
    const field = this.findField(fieldId);
    if (field) this.showFieldProperties(field);
  }

  findField(fieldId) {
    for (const page of this.form.pages) {
      const field = page.fields.find(f => f.id === fieldId);
      if (field) return { field, page };
    }
    return null;
  }

  showFieldProperties(field) {
    this.hideAllPropertyPanels();
    document.getElementById('field-properties-common')?.classList.remove('hidden');
    document.getElementById('properties-empty')?.classList.add('hidden');
    
    document.getElementById('property-field-icon').textContent = this.getFieldIcon(field.type);
    document.getElementById('property-field-type').textContent = this.getFieldLabel(field.type);
    
    document.getElementById('prop-label').value = field.label || '';
    document.getElementById('prop-placeholder').value = field.placeholder || '';
    document.getElementById('prop-help').value = field.helpText || '';
    document.getElementById('prop-required').checked = field.required || false;
    document.getElementById('prop-hidden').checked = field.hidden || false;
    document.getElementById('prop-validation').value = field.validation || 'none';
    document.getElementById('prop-validation-value').value = field.validationValue || '';
    document.getElementById('prop-error-message').value = field.errorMessage || '';
    document.getElementById('prop-default-value').value = field.defaultValue || '';
    document.getElementById('prop-field-id').value = field.id;
    
    // Show/hide validation value field
    document.getElementById('prop-validation-value-group')?.classList.toggle('hidden', field.validation === 'none');
    
    // Options for choice fields
    const hasOptions = ['radio', 'checkbox', 'select', 'yesno'].includes(field.type);
    document.getElementById('prop-options-section')?.classList.toggle('hidden', !hasOptions);
    if (hasOptions) this.renderOptions(field);
    
    // Likert fields
    const isLikert = ['likert', 'likert_matrix'].includes(field.type);
    document.getElementById('prop-likert-section')?.classList.toggle('hidden', !isLikert);
    if (isLikert) this.renderLikertProperties(field);
    
    // Logic rules
    this.renderLogicRules(field);
  }

  hideAllPropertyPanels() {
    document.querySelectorAll('.field-properties').forEach(p => p.classList.add('hidden'));
  }

  renderOptions(field) {
    const container = document.getElementById('options-list');
    if (!container) return;
    
    const options = field.options || [];
    container.innerHTML = options.map((opt, idx) => `
      <div class="option-item" data-option-index="${idx}">
        <input type="text" class="form-input" value="${this.escapeHtml(opt.label)}" placeholder="Label" onchange="window.builderApp?.updateOption(${idx}, 'label', this.value)">
        <input type="text" class="form-input" value="${this.escapeHtml(opt.value)}" placeholder="Value" onchange="window.builderApp?.updateOption(${idx}, 'value', this.value)" style="max-width:120px;">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.builderApp?.removeOption(${idx})" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    `).join('');
    
    document.getElementById('prop-other-option').checked = field.otherOption || false;
  }

  addOption() {
    const field = this.findField(this.selectedFieldId)?.field;
    if (!field) return;
    
    this.saveToHistory();
    field.options = field.options || [];
    field.options.push({ id: crypto.randomUUID(), label: `Option ${field.options.length + 1}`, value: `option_${field.options.length + 1}` });
    this.renderOptions(field);
    this.renderFormPreview();
  }

  updateOption(index, prop, value) {
    const field = this.findField(this.selectedFieldId)?.field;
    if (field?.options?.[index]) {
      this.saveToHistory();
      field.options[index][prop] = value;
      this.renderFormPreview();
    }
  }

  removeOption(index) {
    const field = this.findField(this.selectedFieldId)?.field;
    if (!field?.options || field.options.length <= 1) {
      this.showToast('At least one option required', 'warning');
      return;
    }
    this.saveToHistory();
    field.options.splice(index, 1);
    this.renderOptions(field);
    this.renderFormPreview();
  }

  renderLikertProperties(field) {
    // Scale labels
    const labelsContainer = document.getElementById('likert-labels');
    if (labelsContainer && field.scale?.labels) {
      labelsContainer.innerHTML = Object.entries(field.scale.labels).map(([key, label]) => `
        <div class="likert-label-item">
          <input type="text" class="form-input" value="${this.escapeHtml(key)}" placeholder="Value" style="max-width:60px;" readonly>
          <input type="text" class="form-input" value="${this.escapeHtml(label)}" placeholder="Label" onchange="window.builderApp?.updateLikertLabel('${key}', this.value)">
        </div>
      `).join('');
    }
    
    // Statements
    const stmtContainer = document.getElementById('likert-statements');
    if (stmtContainer && field.statements) {
      stmtContainer.innerHTML = field.statements.map((stmt, idx) => `
        <div class="statement-item" data-stmt-index="${idx}">
          <input type="text" class="form-input" value="${this.escapeHtml(stmt.text)}" placeholder="Statement text" onchange="window.builderApp?.updateLikertStatement(${idx}, this.value)">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.builderApp?.removeLikertStatement(${idx})" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      `).join('');
    }
  }

  updateLikertLabel(key, label) {
    const field = this.findField(this.selectedFieldId)?.field;
    if (field?.scale?.labels && field.scale.labels[key] !== undefined) {
      this.saveToHistory();
      field.scale.labels[key] = label;
      this.renderFormPreview();
    }
  }

  addLikertStatement() {
    const field = this.findField(this.selectedFieldId)?.field;
    if (!field) return;
    
    this.saveToHistory();
    field.statements = field.statements || [];
    field.statements.push({ id: crypto.randomUUID(), text: `Statement ${field.statements.length + 1}` });
    this.renderLikertProperties(field);
    this.renderFormPreview();
  }

  updateLikertStatement(index, text) {
    const field = this.findField(this.selectedFieldId)?.field;
    if (field?.statements?.[index]) {
      this.saveToHistory();
      field.statements[index].text = text;
      this.renderFormPreview();
    }
  }

  removeLikertStatement(index) {
    const field = this.findField(this.selectedFieldId)?.field;
    if (!field?.statements || field.statements.length <= 1) {
      this.showToast('At least one statement required', 'warning');
      return;
    }
    this.saveToHistory();
    field.statements.splice(index, 1);
    this.renderLikertProperties(field);
    this.renderFormPreview();
  }

  renderLogicRules(field) {
    const container = document.getElementById('logic-rules');
    if (!container) return;
    
    const fieldLogic = this.form.logic.filter(l => l.fieldId === field.id);
    const allFields = this.form.pages.flatMap(p => p.fields).filter(f => f.id !== field.id);
    
    container.innerHTML = fieldLogic.map((rule, idx) => `
      <div class="logic-rule-item" data-rule-index="${idx}">
        <div class="logic-rule-header">
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);">IF</span>
          <select class="form-select" onchange="window.builderApp?.updateLogicRule(${idx}, 'sourceField', this.value)" style="min-width:180px;">
            <option value="">Select field</option>
            ${allFields.map(f => `<option value="${f.id}" ${rule.sourceField === f.id ? 'selected' : ''}>${this.escapeHtml(f.label || f.title || f.id)}</option>`).join('')}
          </select>
          <select class="form-select" onchange="window.builderApp?.updateLogicRule(${idx}, 'operator', this.value)" style="min-width:140px;">
            <option value="equals" ${rule.operator === 'equals' ? 'selected' : ''}>equals</option>
            <option value="not_equals" ${rule.operator === 'not_equals' ? 'selected' : ''}>does not equal</option>
            <option value="contains" ${rule.operator === 'contains' ? 'selected' : ''}>contains</option>
            <option value="not_contains" ${rule.operator === 'not_contains' ? 'selected' : ''}>does not contain</option>
            <option value="is_empty" ${rule.operator === 'is_empty' ? 'selected' : ''}>is empty</option>
            <option value="is_not_empty" ${rule.operator === 'is_not_empty' ? 'selected' : ''}>is not empty</option>
          </select>
          <input type="text" class="form-input" value="${this.escapeHtml(rule.value || '')}" placeholder="Value" onchange="window.builderApp?.updateLogicRule(${idx}, 'value', this.value)" style="flex:1;max-width:150px;" ${['is_empty', 'is_not_empty'].includes(rule.operator) ? 'disabled' : ''}>
        </div>
        <div class="logic-rule-action">
          <span style="font-size:var(--text-xs);color:var(--color-text-muted);">THEN</span>
          <select class="form-select" onchange="window.builderApp?.updateLogicRule(${idx}, 'action', this.value)">
            <option value="show" ${rule.action === 'show' ? 'selected' : ''}>Show this field</option>
            <option value="hide" ${rule.action === 'hide' ? 'selected' : ''}>Hide this field</option>
            <option value="require" ${rule.action === 'require' ? 'selected' : ''}>Make required</option>
            <option value="optional" ${rule.action === 'optional' ? 'selected' : ''}>Make optional</option>
          </select>
          <button class="btn btn-ghost btn-sm btn-icon danger" onclick="window.builderApp?.removeLogicRule(${idx})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/></svg></button>
        </div>
      </div>
    `).join('');
  }

  addLogicRule() {
    const field = this.findField(this.selectedFieldId)?.field;
    if (!field) return;
    
    this.saveToHistory();
    const newRule = {
      id: crypto.randomUUID(),
      fieldId: field.id,
      sourceField: '',
      operator: 'equals',
      value: '',
      action: 'show'
    };
    this.form.logic.push(newRule);
    this.renderLogicRules(field);
  }

  updateLogicRule(index, prop, value) {
    const rule = this.form.logic.find((r, i) => r.fieldId === this.selectedFieldId && this.form.logic.indexOf(r) === index);
    if (rule) {
      this.saveToHistory();
      rule[prop] = value;
    }
  }

  removeLogicRule(index) {
    this.saveToHistory();
    this.form.logic = this.form.logic.filter((r, i) => !(r.fieldId === this.selectedFieldId && this.form.logic.indexOf(r) === index));
    const field = this.findField(this.selectedFieldId)?.field;
    if (field) this.renderLogicRules(field);
  }

  updateFieldProp(prop, value) {
    const field = this.findField(this.selectedFieldId)?.field;
    if (field) {
      this.saveToHistory();
      field[prop] = value;
      this.renderFormPreview();
      this.syncPreviewToAllDevices();
    }
  }

  // Form Preview Rendering
  renderFormPreview() {
    const container = document.getElementById('form-pages');
    if (!container) return;

    // Hide empty state
    document.getElementById('canvas-empty')?.classList.add('hidden');
    
    // Show progress if multiple pages
    const showProgress = this.form.settings?.showProgress && this.form.pages.length > 1;
    document.getElementById('form-progress')?.classList.toggle('hidden', !showProgress);

    container.innerHTML = this.form.pages.map((page, pageIdx) => `
      <div class="form-page ${page.id === this.selectedPageId ? '' : 'hidden'}" data-page-id="${page.id}" data-page-index="${pageIdx}">
        ${page.title || page.description ? `
          <div class="page-header">
            ${page.title ? `<h2 class="page-title">${this.escapeHtml(page.title)}</h2>` : ''}
            ${page.description ? `<p class="page-desc">${this.escapeHtml(page.description)}</p>` : ''}
          </div>
        ` : ''}
        <div class="page-fields">
          ${page.fields.map(field => this.renderField(field, pageIdx)).join('')}
        </div>
      </div>
    `).join('');

    // Add click handlers for field selection
    container.querySelectorAll('.form-field').forEach(el => {
      el.addEventListener('click', (e) => {
        if (!e.target.closest('input, textarea, select, button, label')) {
          this.selectField(el.dataset.fieldId);
        }
      });
    });

    this.updateProgressBar();
    this.updateNavigationButtons();
  }

  renderField(field, pageIdx) {
    const isSelected = field.id === this.selectedFieldId;
    const selectedClass = isSelected ? 'selected' : '';
    
    let fieldHtml = '';
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'phone':
      case 'url':
        fieldHtml = this.renderInputField(field);
        break;
      case 'textarea':
        fieldHtml = this.renderTextareaField(field);
        break;
      case 'date':
      case 'time':
        fieldHtml = this.renderInputField(field);
        break;
      case 'radio':
      case 'checkbox':
      case 'yesno':
        fieldHtml = this.renderChoiceField(field);
        break;
      case 'select':
        fieldHtml = this.renderSelectField(field);
        break;
      case 'likert':
        fieldHtml = this.renderLikertField(field);
        break;
      case 'likert_matrix':
        fieldHtml = this.renderLikertMatrixField(field);
        break;
      case 'rating':
        fieldHtml = this.renderRatingField(field);
        break;
      case 'scale':
        fieldHtml = this.renderScaleField(field);
        break;
      case 'file':
        fieldHtml = this.renderFileField(field);
        break;
      case 'signature':
        fieldHtml = this.renderSignatureField(field);
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
        fieldHtml = this.renderConsentField(field);
        break;
      case 'name':
        fieldHtml = this.renderNameField(field);
        break;
      case 'address':
        fieldHtml = this.renderAddressField(field);
        break;
      default:
        fieldHtml = this.renderInputField(field);
    }

    return `
      <div class="form-field ${selectedClass}" data-field-id="${field.id}" data-field-type="${field.type}" draggable="true">
        ${fieldHtml}
        ${isSelected ? '<div class="field-selected-indicator" style="position:absolute;top:-8px;right:-8px;width:20px;height:20px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;">✓</div>' : ''}
      </div>
    `;
  }

  // Field renderers (same as before - abbreviated for brevity)
  renderInputField(field) {
    const typeMap = { email: 'email', number: 'number', phone: 'tel', url: 'url', date: 'date', time: 'time', text: 'text' };
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <input type="${typeMap[field.type] || 'text'}" class="form-input" placeholder="${this.escapeHtml(field.placeholder)}" disabled>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderTextareaField(field) {
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <textarea class="form-input" placeholder="${this.escapeHtml(field.placeholder)}" disabled></textarea>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderChoiceField(field) {
    const isRadio = field.type === 'radio' || field.type === 'yesno';
    const options = field.options || [];
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="choices-list">
        ${options.map((opt, idx) => `
          <label class="choice-item">
            <input type="${isRadio ? 'radio' : 'checkbox'}" name="${field.id}" value="${this.escapeHtml(opt.value)}" disabled>
            <span class="choice-label">${this.escapeHtml(opt.label)}</span>
          </label>
        `).join('')}
        ${field.otherOption ? `
          <div class="choice-other">
            <label class="choice-item">
              <input type="${isRadio ? 'radio' : 'checkbox'}" name="${field.id}" value="other" disabled>
              <span class="choice-label">Other</span>
            </label>
            <input type="text" class="form-input" placeholder="Please specify..." disabled>
          </div>
        ` : ''}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderSelectField(field) {
    const options = field.options || [];
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <select class="form-input" disabled>
        <option value="">Select an option</option>
        ${options.map(opt => `<option value="${this.escapeHtml(opt.value)}">${this.escapeHtml(opt.label)}</option>`).join('')}
      </select>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderLikertField(field) {
    const statements = field.statements || [{ text: field.label }];
    const scale = field.scale || { min: 1, max: 5, labels: { 1: 'Strongly Disagree', 5: 'Strongly Agree' }};
    const cols = Object.keys(scale.labels).length;
    
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="likert-scale" style="--likert-cols: ${cols};">
        <div class="likert-header">
          <div class="likert-header-label">Statement</div>
          ${Object.entries(scale.labels).map(([key, label]) => `<div class="likert-header-label">${this.escapeHtml(label)}</div>`).join('')}
        </div>
        ${statements.map((stmt, sIdx) => `
          <div class="likert-statement" style="--likert-cols: ${cols};">
            <div class="likert-statement-text">${this.escapeHtml(stmt.text)}</div>
            <div class="likert-options">
              ${Object.entries(scale.labels).map(([key, label]) => `
                <label class="likert-option">
                  <input type="radio" name="${field.id}_${sIdx}" value="${key}" disabled>
                  <span class="likert-option-label">${key}</span>
                  <span class="likert-option-text">${this.escapeHtml(label)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderLikertMatrixField(field) {
    const columns = field.columns || [];
    const statements = field.statements || [];
    
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
        ${statements.map((stmt, sIdx) => `
          <div class="likert-statement" style="--likert-cols: ${columns.length};">
            <div class="likert-statement-text">${this.escapeHtml(stmt.text)}</div>
            <div class="likert-options">
              ${columns.map((col, cIdx) => `
                <label class="likert-option">
                  <input type="radio" name="${field.id}_${sIdx}" value="${cIdx}" disabled>
                  <span class="likert-option-label">${cIdx + 1}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderRatingField(field) {
    const max = field.maxRating || 5;
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="rating-field">
        ${Array.from({ length: max }, (_, i) => `
          <label class="rating-star">
            <input type="radio" name="${field.id}" value="${i + 1}" disabled>
            ★
          </label>
        `).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderScaleField(field) {
    const min = 1, max = 10;
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="scale-field">
        ${Array.from({ length: max }, (_, i) => `
          <div class="scale-option">
            <input type="radio" name="${field.id}" value="${i + 1}" id="${field.id}_${i + 1}" disabled>
            <label class="scale-label" for="${field.id}_${i + 1}">
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

  renderFileField(field) {
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="file-upload">
        <div class="file-upload-icon">📎</div>
        <div class="file-upload-text">Drag & drop files here or click to browse</div>
        <div class="file-upload-hint">Max ${field.maxSize || 10}MB • ${field.accept ? field.accept : 'All file types'}</div>
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderSignatureField(field) {
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="signature-wrapper">
        <canvas class="signature-pad" disabled></canvas>
        <div class="signature-actions">
          <button type="button" class="btn btn-secondary btn-sm" disabled><span>🗑️</span> Clear</button>
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

  renderConsentField(field) {
    return `
      <div class="consent-field">
        <div class="consent-text">${this.escapeHtml(field.consentText)}</div>
        <div class="consent-options">
          <label class="choice-item">
            <input type="radio" name="${field.id}" value="agree" disabled>
            <span class="choice-label">I agree</span>
          </label>
          <label class="choice-item">
            <input type="radio" name="${field.id}" value="disagree" disabled>
            <span class="choice-label">I disagree</span>
          </label>
        </div>
      </div>
    `;
  }

  renderNameField(field) {
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="name-field">
        <div class="form-field">
          <label class="field-label">${this.escapeHtml(field.firstNameLabel || 'First Name')}${field.required ? '<span class="field-required">*</span>' : ''}</label>
          <input type="text" class="form-input" placeholder="First name" disabled>
        </div>
        <div class="form-field">
          <label class="field-label">${this.escapeHtml(field.lastNameLabel || 'Last Name')}${field.required ? '<span class="field-required">*</span>' : ''}</label>
          <input type="text" class="form-input" placeholder="Last name" disabled>
        </div>
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  renderAddressField(field) {
    const fields = field.fields || ['street', 'city', 'state', 'zip', 'country'];
    const labels = { street: 'Street Address', city: 'City', state: 'State/Province', zip: 'ZIP/Postal Code', country: 'Country' };
    
    return `
      <div class="field-label-wrapper">
        <label class="field-label">${this.escapeHtml(field.label)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
      </div>
      <div class="address-field">
        ${fields.map(f => `
          <div class="form-field">
            <label class="field-label">${this.escapeHtml(labels[f] || f)}${field.required ? '<span class="field-required">*</span>' : ''}</label>
            <input type="text" class="form-input" placeholder="${this.escapeHtml(labels[f] || f)}" disabled>
          </div>
        `).join('')}
      </div>
      ${field.helpText ? `<p class="field-help">${this.escapeHtml(field.helpText)}</p>` : ''}
    `;
  }

  syncPreviewToAllDevices() {
    const mainPreview = document.getElementById('form-preview');
    const tabletPreview = document.getElementById('form-preview-tablet');
    const mobilePreview = document.getElementById('form-preview-mobile');
    
    if (tabletPreview) tabletPreview.innerHTML = mainPreview.innerHTML;
    if (mobilePreview) mobilePreview.innerHTML = mainPreview.innerHTML;
  }

  updateProgressBar() {
    const showProgress = this.form.settings?.showProgress && this.form.pages.length > 1;
    if (!showProgress) return;
    
    const currentPage = this.form.pages.findIndex(p => p.id === this.selectedPageId) + 1;
    const totalPages = this.form.pages.length;
    const percent = Math.round((currentPage / totalPages) * 100);
    
    document.getElementById('progress-text').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('progress-mini-fill').style.width = `${percent}%`;
    document.getElementById('progress-mini-text').textContent = `${currentPage} of ${totalPages}`;
  }

  updateNavigationButtons() {
    const currentPageIdx = this.form.pages.findIndex(p => p.id === this.selectedPageId);
    const isFirst = currentPageIdx === 0;
    const isLast = currentPageIdx === this.form.pages.length - 1;
    
    document.getElementById('btn-prev-page').style.display = isFirst ? 'none' : 'inline-flex';
    document.getElementById('btn-next-page').style.display = isLast ? 'none' : 'inline-flex';
    document.getElementById('btn-submit').style.display = isLast ? 'inline-flex' : 'none';
  }

  updateFormTitleDisplay() {
    document.getElementById('form-title-input').value = this.form.title || 'Untitled Form';
    document.getElementById('form-header-title').textContent = this.form.title || 'Untitled Form';
    document.getElementById('form-header-desc').textContent = this.form.description || '';
    document.getElementById('form-header-icon').textContent = this.form.icon || '📝';
    
    // Update logo preview
    const logoPreview = document.getElementById('form-logo-preview');
    const logoRemove = document.getElementById('form-logo-remove');
    if (logoPreview) {
      if (this.form.logo) {
        logoPreview.innerHTML = `<img src="${this.form.logo}" style="width:100%;height:100%;object-fit:contain;">`;
        logoRemove.style.display = 'flex';
      } else {
        logoPreview.innerHTML = '<span style="font-size:1.5rem;">📝</span>';
        logoRemove.style.display = 'none';
      }
    }
  }

  updateFormTitle(title) {
    this.saveToHistory();
    this.form.title = title;
    this.updateFormTitleDisplay();
  }

  updateFormSetting(key, value) {
    this.saveToHistory();
    if (!this.form.settings) this.form.settings = {};
    this.form.settings[key] = value;
    this.renderFormPreview();
  }

  handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
      this.showToast('Logo too large. Max 500KB.', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      this.form.logo = event.target.result;
      this.updateFormTitleDisplay();
      this.uploadLogoToServer();
    };
    reader.readAsDataURL(file);
  }

  async uploadLogoToServer() {
    if (!this.form.logo || !this.formId) return;
    
    try {
      await fetch('/api/upload/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: this.form.logo, formId: this.formId })
      });
    } catch (e) {
      console.error('Failed to upload logo:', e);
    }
  }

  removeLogo() {
    this.form.logo = null;
    this.updateFormTitleDisplay();
    
    // Delete from server
    if (this.formId) {
      fetch(`/api/upload/logo/${this.formId}`, { method: 'DELETE' });
    }
  }

  // Form Settings Modal
  openSettings() {
    this.populateSettingsModal();
    document.getElementById('settings-modal')?.classList.add('open');
  }

  populateSettingsModal() {
    document.getElementById('set-title').value = this.form.title || '';
    document.getElementById('set-desc').value = this.form.description || '';
    document.getElementById('set-confirmation').value = this.form.settings?.confirmationMessage || '';
    document.getElementById('set-redirect').value = this.form.settings?.redirectUrl || '';
    document.getElementById('set-progress').checked = this.form.settings?.showProgress !== false;
    document.getElementById('set-email').checked = this.form.settings?.collectEmail || false;
    document.getElementById('set-multiple').checked = this.form.settings?.allowMultiple || false;
    document.getElementById('set-theme').value = this.form.theme || 'default';
    document.getElementById('set-primary-color').value = this.form.primaryColor || '#3b82f6';
    document.getElementById('set-primary-hex').value = this.form.primaryColor || '#3b82f6';
    document.getElementById('set-notify-email').value = this.form.notifyEmail || '';
    document.getElementById('set-notify-new').checked = this.form.notifyOnSubmit || false;
    document.getElementById('set-autoresponder').checked = this.form.autoResponder || false;
    document.getElementById('set-auto-subject').value = this.form.autoSubject || 'Thanks for your submission!';
    document.getElementById('set-auto-body').value = this.form.autoBody || 'Hi {{name}},\n\nThank you for submitting {{form_title}}.\n\nWe\'ll get back to you soon.\n\n— The Team';
  }

  switchSettingsTab(tab) {
    document.querySelectorAll('#settings-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.settingsTab === tab));
    document.querySelectorAll('#settings-modal .tab-panel').forEach(p => p.classList.toggle('active', p.id === `settings-${tab}`));
  }

  async saveFormSettings() {
    this.saveToHistory();
    this.form.title = document.getElementById('set-title').value;
    this.form.description = document.getElementById('set-desc').value;
    this.form.settings.confirmationMessage = document.getElementById('set-confirmation').value;
    this.form.settings.redirectUrl = document.getElementById('set-redirect').value;
    this.form.settings.showProgress = document.getElementById('set-progress').checked;
    this.form.settings.collectEmail = document.getElementById('set-email').checked;
    this.form.settings.allowMultiple = document.getElementById('set-multiple').checked;
    this.form.theme = document.getElementById('set-theme').value;
    this.form.primaryColor = document.getElementById('set-primary-color').value;
    this.form.notifyEmail = document.getElementById('set-notify-email').value;
    this.form.notifyOnSubmit = document.getElementById('set-notify-new').checked;
    this.form.autoResponder = document.getElementById('set-autoresponder').checked;
    this.form.autoSubject = document.getElementById('set-auto-subject').value;
    this.form.autoBody = document.getElementById('set-auto-body').value;
    
    this.updateFormTitleDisplay();
    await this.saveForm();
    this.closeModal('settings-modal');
    this.showToast('Settings saved', 'success');
  }

  // Preview
  openPreview() {
    const previewUrl = `/form/${this.formId}?preview=1&t=${Date.now()}`;
    document.getElementById('preview-iframe').src = previewUrl;
    document.getElementById('preview-open-new').href = previewUrl;
    document.getElementById('preview-modal')?.classList.add('open');
  }

  // History
  saveToHistory() {
    const state = JSON.parse(JSON.stringify(this.form));
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    if (this.history.length > this.maxHistory) this.history.shift();
    else this.historyIndex++;
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.form = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedFieldId = null;
      this.render();
      this.updateUndoRedoButtons();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.form = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedFieldId = null;
      this.render();
      this.updateUndoRedoButtons();
    }
  }

  updateUndoRedoButtons() {
    document.getElementById('btn-undo').disabled = this.historyIndex <= 0;
    document.getElementById('btn-redo').disabled = this.historyIndex >= this.history.length - 1;
  }

  // Save & Publish
  async saveForm() {
    const btn = document.getElementById('btn-save-draft');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Saving...';
    
    try {
      this.form.updatedAt = new Date().toISOString();
      const res = await fetch(`/api/forms/${this.form.id}/schema`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.form)
      });
      const data = await res.json();
      if (data.success) {
        this.form = data.form;
        this.formId = this.form.id;
        history.replaceState(null, '', `/builder/${this.formId}`);
        this.showToast('Form saved', 'success');
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (e) {
      console.error('Save failed:', e);
      this.showToast('Failed to save: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }

  async publishForm() {
    try {
      await this.saveForm();
      const res = await fetch(`/api/forms/${this.formId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.form.published = data.published;
        this.updateFormStatus();
        this.showToast(data.published ? 'Form published!' : 'Form unpublished', 'success');
      }
    } catch (e) {
      this.showToast('Failed to publish', 'error');
    }
  }

  startAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      if (this.formId && !this.form.published) {
        this.saveForm();
      }
    }, 60000); // Every minute
  }

  // Modal helpers
  openModal(id) {
    document.getElementById(id)?.classList.add('open');
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

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&': '&', '<': '<', '>': '>', '"': '"', "'": '''}[c]));
  }
}

// Initialize on DOM ready
let builderApp = null;

document.addEventListener('DOMContentLoaded', () => {
  builderApp = new FormBuilder();
  builderApp.init();
});

// Make globally accessible
window.builderApp = builderApp;

// Inline handler shims
window.updateOption = (index, prop, value) => builderApp?.updateOption(index, prop, value);
window.removeOption = (index) => builderApp?.removeOption(index);
window.updateLikertLabel = (key, label) => builderApp?.updateLikertLabel(key, label);
window.addLikertStatement = () => builderApp?.addLikertStatement();
window.updateLikertStatement = (index, text) => builderApp?.updateLikertStatement(index, text);
window.removeLikertStatement = (index) => builderApp?.removeLikertStatement(index);
window.updateLogicRule = (index, prop, value) => builderApp?.updateLogicRule(index, prop, value);
window.removeLogicRule = (index) => builderApp?.removeLogicRule(index);