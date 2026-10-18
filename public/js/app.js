// PhDFORM - AI Life Sciences (FormCrafts Card Engine)
let schema = null;
let flatItems = []; // Grouped cards: Welcome, Consent, Demographic questions, Likert Matrix blocks, Submit
let currentIndex = 0;
let answers = {};
let isSubmitting = false;
let consentDeclined = false;

// DOM Elements
const cardContainer = document.getElementById("card-container");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const progressFraction = document.getElementById("progress-fraction");
const themeToggle = document.getElementById("theme-toggle");
const btnToggleGlossary = document.getElementById("btn-toggle-glossary");
const glossaryPane = document.getElementById("glossary-pane");
const btnCloseGlossary = document.getElementById("btn-close-glossary");
const glossaryContent = document.getElementById("glossary-content");

document.addEventListener("DOMContentLoaded", async () => {
  setupTheme();
  await loadSurveySchema();
});

function setupTheme() {
  const saved = localStorage.getItem("formcrafts_theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  themeToggle.textContent = saved === "dark" ? "Light" : "Dark";
  themeToggle.addEventListener("click", () => {
    const curr = document.documentElement.getAttribute("data-theme") || "dark";
    const next = curr === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("formcrafts_theme", next);
    themeToggle.textContent = next === "dark" ? "Light" : "Dark";
  });

  // Glossary pane toggle
  btnToggleGlossary.addEventListener("click", () => {
    glossaryPane.classList.toggle("hidden");
  });

  btnCloseGlossary.addEventListener("click", () => {
    glossaryPane.classList.add("hidden");
  });
}

async function loadSurveySchema() {
  try {
    const res = await fetch("/api/schema");
    schema = await res.json();
    
    // Update UI with meta data from schema
    if (schema.meta) {
      // Update navbar app name
      const appNameEl = document.getElementById("app-display-name");
      if (appNameEl && schema.meta.appName) {
        appNameEl.textContent = schema.meta.appName;
      }
      // Update page title
      if (schema.meta.title) {
        document.title = schema.meta.title + " | Doctoral Survey (ESGCI, Paris)";
      }
    }
    
    flattenSurveyItems(schema);
    renderCurrentCard();
    updateProgress();
    if (schema.glossary) {
      renderGlossary(schema.glossary);
    }
    // Show/hide glossary button based on config
    const glossaryBtn = document.getElementById("btn-toggle-glossary");
    if (glossaryBtn && schema.meta && schema.meta.allowGlossary === false) {
      glossaryBtn.style.display = "none";
    }
    // Update navbar brand tag
    const brandTagEl = document.querySelector(".brand-tag span:last-child");
    if (brandTagEl && schema.meta && schema.meta.brandTag) {
      brandTagEl.textContent = schema.meta.brandTag;
    }
    // Update page title with custom suffix
    if (schema.meta && schema.meta.pageTitleSuffix) {
      document.title = (schema.meta.title || "Survey") + " " + schema.meta.pageTitleSuffix;
    } else if (schema.meta && schema.meta.title) {
      document.title = schema.meta.title + " | Doctoral Survey (ESGCI, Paris)";
    }
  } catch (err) {
    console.error("Failed to load schema", err);
    cardContainer.innerHTML = '<div class="card" style="text-align: center;"><h2 style="color: var(--danger);">Failed to load survey</h2><p style="margin-top: 1rem; color: var(--text-muted);">' + err.message + '</p><button class="btn-primary" style="margin-top: 1.5rem;" onclick="location.reload()">Retry</button></div>';
  }
}

function renderGlossary(terms) {
  if (!glossaryContent) return;
  glossaryContent.innerHTML = terms.map(term => '<div class="glossary-card"><div class="glossary-category">' + term.category + '</div><div class="glossary-term">' + term.term + '</div><div class="glossary-desc">' + term.definition + '</div></div>').join("");
}

function flattenSurveyItems(data) {
  flatItems = [];

  const welcomeSection = data.sections.find(s => s.id === "welcome");
  if (welcomeSection && welcomeSection.questions.length > 0) {
    const q = welcomeSection.questions[0];
    flatItems.push({ type: "welcome_screen", title: q.title, subtitle: q.subtitle, description: q.description });
  }

  const consentSection = data.sections.find(s => s.id === "informed_consent");
  if (consentSection) {
    const detailsQ = consentSection.questions.find(q => q.type === "consent_details");
    const confirmQ = consentSection.questions.find(q => q.type === "consent_confirmation");
    if (detailsQ && confirmQ) {
      flatItems.push({ type: "consent_details", title: detailsQ.title, description: detailsQ.description, confirmTitle: confirmQ.title, confirmDescription: confirmQ.description, entryId: confirmQ.entryId, options: confirmQ.options, required: confirmQ.required });
    }
  }

  const idSection = data.sections.find(s => s.id === "identification");
  if (idSection) {
    idSection.questions.forEach(q => {
      flatItems.push({ type: q.type, sectionTitle: idSection.title, title: q.title, description: q.description || "", entryId: q.entryId, placeholder: q.placeholder || "", required: q.required !== false, id: q.id });
    });
  }

  data.sections.forEach(sec => {
    if (["welcome", "informed_consent", "identification"].includes(sec.id)) return;
    sec.questions.forEach(q => {
      if (q.type === "likert_matrix") {
        flatItems.push({ type: "likert_matrix", sectionTitle: sec.title, title: q.title, description: q.description || "", instruction: q.instruction || "", statements: q.statements, columns: q.columns, id: q.id });
      } else {
        flatItems.push({ type: q.type, sectionTitle: sec.title, title: q.title, description: q.description || "", entryId: q.entryId, options: q.options || [], placeholder: q.placeholder || "", required: q.required !== false, id: q.id });
      }
    });
  });

  flatItems.push({ type: "submit_card", title: "Review & Confirm Submission", description: "Your responses will be securely synchronized directly with the doctoral research database at Google Forms & Google Sheets." });
}

function getTotalFieldCount() {
  let count = 0;
  flatItems.forEach(item => { if (item.entryId) count++; if (item.statements) count += item.statements.length; });
  return count;
}

function updateProgress() {
  if (flatItems.length === 0) return;
  const answeredCount = Object.keys(answers).length;
  const totalCount = getTotalFieldCount();
  const pct = totalCount > 0 ? Math.min(100, Math.round((answeredCount / totalCount) * 100)) : 0;
  progressFill.style.width = pct + "%";
  progressText.textContent = pct + "% Completed";
  progressFraction.textContent = answeredCount + " of " + totalCount + " statements answered";
}

function renderCurrentCard() {
  if (flatItems.length === 0) return;
  const item = flatItems[currentIndex];

  if (item.type === "welcome_screen") {
    cardContainer.innerHTML = '<div class="card"><div class="card-section-label">ESGCI PARIS - DOCTORAL RESEARCH</div><h1 class="card-title" style="font-size: 1.85rem; margin-bottom: 0.5rem;">' + item.title + '</h1><p class="card-desc" style="font-size: 1.05rem; line-height: 1.6; color: var(--text-muted);">' + item.subtitle + '</p><div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 2rem; white-space: pre-line; line-height: 1.7;">' + escapeHtml(item.description) + '</div><div class="card-footer" style="justify-content: flex-end;"><button class="btn-primary" onclick="nextCard()" style="font-size: 1.05rem; padding: 0.9rem 2.25rem;">Continue to Informed Consent -></button></div></div>';
    return;
  }

  if (item.type === "consent_details") {
    cardContainer.innerHTML = '<div class="card"><div class="card-section-label">INFORMED CONSENT</div><h1 class="card-title" style="font-size: 1.6rem; margin-bottom: 1rem;">' + item.title + '</h1><div class="consent-box" style="white-space: pre-line; max-height: 400px;">' + escapeHtml(item.description) + '</div><div class="consent-notice">' + escapeHtml(item.confirmDescription) + '</div><div class="card-footer" style="justify-content: flex-end;"><button class="btn-primary" onclick="nextCard()" style="font-size: 1.05rem; padding: 0.9rem 2.25rem;">I Understand, Proceed to Consent -></button></div></div>';
    return;
  }

  if (item.type === "consent_confirmation") {
    const currentVal = answers[item.entryId] || "";
    cardContainer.innerHTML = '<div class="card"><div class="card-section-label">INFORMED CONSENT CONFIRMATION</div><h1 class="card-title" style="font-size: 1.5rem; margin-bottom: 1rem;">' + item.title + '</h1><div class="consent-notice" style="white-space: pre-line; margin-bottom: 2rem;">' + escapeHtml(item.description) + '</div><div class="options-list" id="options-list-' + item.entryId + '">' + item.options.map((opt, oIdx) => { const letter = String.fromCharCode(65 + oIdx); const isSelected = currentVal === opt.value; return '<div class="option-item ' + (isSelected ? "selected" : "") + '" id="opt-' + item.entryId + '-' + oIdx + '" onclick="handleConsentClick(this, \'' + item.entryId + '\', \'' + escapeHtml(opt.value) + '\')"><span class="option-key">' + letter + '</span><span class="option-text">' + opt.label + '</span><span class="option-check" style="' + (isSelected ? "" : "display: none;") + '">[X]</span></div>'; }).join("") + '</div><div class="card-footer"><button class="btn-secondary" onclick="prevCard()">Back</button><div class="shortcut-hint"><span>Select an option to proceed</span></div><button class="btn-primary" onclick="nextCard()" id="btn-next-consent" disabled>Next</button></div></div>';
    if (currentVal) document.getElementById("btn-next-consent").disabled = false;
    return;
  }

  if (item.type === "welcome") {
    cardContainer.innerHTML = '<div class="card"><div class="card-section-label">ESGCI PARIS - DOCTORAL RESEARCH</div><h1 class="card-title" style="font-size: 1.85rem; margin-bottom: 0.75rem;">' + item.title + '</h1><p class="card-desc" style="font-size: 1.05rem; line-height: 1.6;">' + item.description + '</p><div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md); padding: 1.15rem 1.35rem; margin-bottom: 2rem;"><div style="display: flex; gap: 0.85rem; align-items: flex-start;"><span style="font-size: 1.5rem;">[SHIELD]</span><div><div style="font-weight: 600; font-size: 0.98rem; margin-bottom: 0.25rem;">Doctoral Ethics & Confidentiality</div><div style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">Participation takes ~7 minutes. All information is anonymized, held in strict confidence, and directly submitted to the researcher\'s verified Google Form.</div></div></div></div><div class="card-footer" style="justify-content: flex-end;"><button class="btn-primary" onclick="nextCard()" style="font-size: 1.05rem; padding: 0.9rem 2.25rem;">Start Questionnaire -></button></div></div>';
    return;
  }

  if (item.type === "submit_card") {
    const answeredCount = Object.keys(answers).length;
    const totalCount = getTotalFieldCount();
    const isComplete = answeredCount >= totalCount;
    cardContainer.innerHTML = '<div class="card" style="text-align: center;"><div style="font-size: 3rem; margin-bottom: 0.75rem;">[DOC]</div><h2 class="card-title">' + item.title + '</h2><p class="card-desc">' + item.description + '</p><div style="display: inline-flex; align-items: center; gap: 1.5rem; background: rgba(0,0,0,0.25); padding: 1.15rem 2rem; border-radius: var(--radius-md); margin-bottom: 2rem; border: 1px solid var(--border-color); text-align: left;"><div><div style="font-size: 0.8rem; color: var(--text-muted);">Completion Status</div><div style="font-size: 1.35rem; font-weight: 700; color: ' + (isComplete ? "var(--success)" : "var(--warning)") + ';">' + answeredCount + ' / ' + totalCount + ' items answered</div></div><div style="border-left: 1px solid var(--border-color); padding-left: 1.5rem;"><div style="font-size: 0.8rem; color: var(--text-muted);">Sync Target</div><div style="font-size: 0.95rem; font-weight: 600; color: #a5b4fc;">Google Form & Sheets (ESGCI)</div></div></div><div class="card-footer" style="justify-content: space-between;"><button class="btn-secondary" onclick="prevCard()">Back</button><button class="btn-primary" id="btn-submit-survey" onclick="submitSurvey()" style="background: linear-gradient(135deg, #10b981, #059669); font-size: 1.1rem; padding: 0.9rem 2.5rem;">Submit All Responses</button></div></div>';
    return;
  }

  if (item.type === "text") {
    const currentVal = answers[item.entryId] || "";
    cardContainer.innerHTML = '<div class="card"><div class="card-section-label">' + (item.sectionTitle || "QUESTION") + '</div><h2 class="card-title">' + item.title + '</h2>' + (item.description ? '<p class="card-desc">' + item.description + '</p>' : '') + '<input type="text" class="input-text" id="text-input-' + item.entryId + '" placeholder="' + (item.placeholder || 'Type your answer here...') + '" value="' + escapeHtml(currentVal) + '" oninput="handleTextInput(\'' + item.entryId + '\', this.value)" onkeydown="if(event.key === \'Enter\') nextCard()" autofocus /><div class="card-footer"><button class="btn-secondary" onclick="prevCard()"' + (currentIndex === 0 ? ' disabled' : '') + '>Back</button><div class="shortcut-hint"><span>Press</span> <kbd>Enter</kbd> <span>for next</span></div><button class="btn-primary" onclick="nextCard()">Next</button></div></div>';
    return;
  }

  if (item.type === "choice") {
    const currentVal = answers[item.entryId] || "";
    cardContainer.innerHTML = '<div class="card"><div class="card-section-label">' + (item.sectionTitle || "QUESTION") + '</div><h2 class="card-title">' + item.title + '</h2>' + (item.description ? '<p class="card-desc">' + item.description + '</p>' : '') + '<div class="options-list" id="options-list-' + item.entryId + '">' + item.options.map((opt, oIdx) => { const letter = String.fromCharCode(65 + oIdx); const isSelected = currentVal === opt; return '<div class="option-item ' + (isSelected ? "selected" : "") + '" id="opt-' + item.entryId + '-' + oIdx + '" onclick="handleChoiceClick(this, \'' + item.entryId + '\', \'' + escapeHtml(opt) + '\')"><span class="option-key">' + letter + '</span><span class="option-text">' + opt + '</span><span class="option-check" style="' + (isSelected ? "" : "display: none;") + '">[X]</span></div>'; }).join("") + '</div><div class="card-footer"><button class="btn-secondary" onclick="prevCard()"' + (currentIndex === 0 ? ' disabled' : '') + '>Back</button><div class="shortcut-hint"><span>Select an option to auto-proceed</span></div><button class="btn-primary" onclick="nextCard()">Next</button></div></div>';
    return;
  }

  if (item.type === "likert_matrix") {
    const totalStmts = item.statements.length;
    let answeredStmts = 0;
    item.statements.forEach(s => { if (answers[s.entryId]) answeredStmts++; });
    cardContainer.innerHTML = '<div class="card" style="padding: 2rem 1.75rem;"><div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;"><div class="card-section-label">' + (item.sectionTitle || "SECTION") + ' - LIKERT SCALE</div><div style="font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.06); padding: 0.25rem 0.65rem; border-radius: var(--radius-full);" id="matrix-counter-' + item.id + '">' + answeredStmts + ' of ' + totalStmts + ' rated</div></div><h2 class="card-title" style="margin-bottom: 0.4rem;">' + item.title + '</h2>' + (item.instruction ? '<p class="card-desc" style="margin-bottom: 0.75rem; font-style: italic;">' + item.instruction + '</p>' : '') + (item.description ? '<p class="card-desc" style="margin-bottom: 1.5rem;">' + item.description + '</p>' : '') + '<div class="likert-desktop-header"><div class="likert-col-stmt">Statement</div>' + schema.likertOptions.map(opt => '<div class="likert-col-head" title="' + opt.label + '"><div class="head-score" style="color: ' + opt.color + ';">' + (opt.score > 0 ? opt.score : "-") + '</div><div class="head-label">' + opt.label + '</div></div>').join("") + '</div><div class="likert-block-rows">' + item.statements.map((stmt, sIdx) => { const currentStmtVal = answers[stmt.entryId] || ""; return '<div class="likert-block-row ' + (currentStmtVal ? "row-answered" : "") + '" id="row-' + stmt.entryId + '"><div class="likert-stmt-header"><span class="stmt-badge">' + (sIdx + 1) + '</span><span class="stmt-content">' + stmt.text + '</span></div><div class="likert-row-pills">' + schema.likertOptions.map((opt, oIdx) => { const isSelected = currentStmtVal === opt.value; return '<button type="button" class="likert-matrix-pill ' + (isSelected ? "active" : "") + '" style="--pill-color: ' + opt.color + ';" onclick="handleLikertPillClick(this, \'' + stmt.entryId + '\', \'' + escapeHtml(opt.value) + '\', \'' + item.id + '\')" title="' + opt.label + '"><span class="pill-badge">' + (opt.score > 0 ? opt.score : "-") + '</span><span class="pill-text">' + opt.label + '</span></button>'; }).join("") + '</div></div>'; }).join("") + '</div><div class="card-footer"><button class="btn-secondary" onclick="prevCard()">Back</button><div class="shortcut-hint"><span>Rate all statements above to proceed</span></div><button class="btn-primary" id="btn-next-matrix" onclick="nextCard()">Next Section</button></div></div>';
    return;
  }
}

function handleChoiceClick(element, entryId, value) {
  answers[entryId] = value; updateProgress();
  const container = element.parentElement;
  if (container) { container.querySelectorAll(".option-item").forEach(el => { el.classList.remove("selected", "pulse-select"); const check = el.querySelector(".option-check"); if (check) check.style.display = "none"; }); }
  element.classList.add("selected", "pulse-select");
  const check = element.querySelector(".option-check");
  if (check) check.style.display = "inline";
  setTimeout(() => { nextCard(); }, 280);
}

function handleConsentClick(element, entryId, value) {
  answers[entryId] = value; updateProgress();
  const container = element.parentElement;
  if (container) { container.querySelectorAll(".option-item").forEach(el => { el.classList.remove("selected", "pulse-select"); const check = el.querySelector(".option-check"); if (check) check.style.display = "none"; }); }
  element.classList.add("selected", "pulse-select");
  const check = element.querySelector(".option-check");
  if (check) check.style.display = "inline";
  const nextBtn = document.getElementById("btn-next-consent");
  if (nextBtn) nextBtn.disabled = false;
  if (value === "No") { consentDeclined = true; setTimeout(() => { showConsentDeclinedScreen(); }, 500); }
  else { setTimeout(() => { nextCard(); }, 280); }
}

function showConsentDeclinedScreen() {
  cardContainer.innerHTML = '<div class="card" style="text-align: center; padding: 3rem 2rem;"><div style="width: 72px; height: 72px; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: var(--danger); font-size: 2.25rem;">[X]</div><h1 class="card-title" style="color: var(--danger); margin-bottom: 0.5rem;">Consent Not Provided</h1><p class="card-desc" style="max-width: 580px; margin: 0 auto 2rem;">You have chosen not to participate in this study. Your decision has been recorded. Thank you for your time and consideration.</p><div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; max-width: 480px; margin: 0 auto 2.5rem; text-align: left;"><div style="font-size: 0.85rem; color: var(--text-muted);">Your response (declining consent) has been recorded for research ethics compliance. No further questions will be presented.</div></div><div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;"><button class="btn-primary" onclick="location.reload()" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main);">Restart Survey</button><button class="btn-primary" onclick="window.close()" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main);">Close Window</button></div></div>';
  submitConsentDecline();
}

async function submitConsentDecline() {
  try { await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, metadata: { source: "formcrafts_cards_ui", userAgent: navigator.userAgent } }) }); }
  catch (err) { console.error("Failed to record consent decline", err); }
}

function handleLikertPillClick(element, entryId, value, matrixId) {
  answers[entryId] = value; updateProgress();
  const row = element.closest(".likert-block-row");
  if (row) { row.classList.add("row-answered"); row.querySelectorAll(".likert-matrix-pill").forEach(p => p.classList.remove("active")); }
  element.classList.add("active", "pulse-select");
  const currentItem = flatItems[currentIndex];
  if (currentItem && currentItem.statements) {
    let answered = 0;
    currentItem.statements.forEach(s => { if (answers[s.entryId]) answered++; });
    const counter = document.getElementById("matrix-counter-" + matrixId);
    if (counter) { counter.textContent = answered + " of " + currentItem.statements.length + " rated"; if (answered === currentItem.statements.length) { counter.style.background = "rgba(16, 185, 129, 0.2)"; counter.style.color = "#10b981"; } }
  }
}

function handleTextInput(entryId, value) { answers[entryId] = value; updateProgress(); }

function nextCard() { if (consentDeclined) return; if (currentIndex < flatItems.length - 1) { currentIndex++; renderCurrentCard(); window.scrollTo({ top: 0, behavior: "smooth" }); } }
function prevCard() { if (currentIndex > 0) { currentIndex--; renderCurrentCard(); window.scrollTo({ top: 0, behavior: "smooth" }); } }

document.addEventListener("keydown", (e) => { if (document.activeElement && document.activeElement.tagName === "INPUT" && e.key !== "Enter") return; if (e.key === "Enter") { e.preventDefault(); nextCard(); } else if (e.key === "ArrowRight") { nextCard(); } else if (e.key === "ArrowLeft") { prevCard(); } });

async function submitSurvey() {
  if (isSubmitting) return;
  isSubmitting = true;
  const btn = document.getElementById("btn-submit-survey");
  if (btn) { btn.disabled = true; btn.innerHTML = '<span style="display:inline-block; animation: spinSlow 1s linear infinite;">[...]</span> Submitting to Google Form...'; }
  try {
    const res = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, metadata: { source: "formcrafts_cards_ui", userAgent: navigator.userAgent } }) });
    const data = await res.json();
    if (data.success) { renderSuccessScreen(data); } else { alert("Submission error: " + (data.error || "Unknown issue")); if (btn) { btn.disabled = false; btn.innerHTML = "Retry Submission"; } }
  } catch (err) { console.error("Submission failed", err); alert("Network error submitting response. Please check your connection."); if (btn) { btn.disabled = false; btn.innerHTML = "Retry Submission"; } } finally { isSubmitting = false; }
}

function renderSuccessScreen(result) {
  cardContainer.innerHTML = '<div class="card" style="text-align: center; padding: 3rem 2rem;"><div style="width: 72px; height: 72px; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: var(--success); font-size: 2.25rem;">[OK]</div><h1 class="card-title" style="color: var(--success); margin-bottom: 0.5rem;">Survey Submitted Successfully!</h1><p class="card-desc" style="max-width: 580px; margin: 0 auto 2rem;">Thank you for contributing your expertise to this ESGCI Paris doctoral study on AI/ML Integration and Governance in the Life Sciences Sector.</p><div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; max-width: 480px; margin: 0 auto 2.5rem; text-align: left;"><div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;"><span style="color: var(--text-muted);">Sync Status:</span><span class="sync-badge ' + (result.googleSynced ? "yes" : "no") + '">' + (result.googleSynced ? "[OK] Synced with Google Form & Sheet" : "Saved Locally") + '</span></div><div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;"><span style="color: var(--text-muted);">Response ID:</span><code style="color: #a5b4fc;">' + result.responseId + '</code></div><div style="display: flex; justify-content: space-between; font-size: 0.85rem;"><span style="color: var(--text-muted);">Timestamp:</span><span>' + new Date(result.timestamp).toLocaleTimeString() + '</span></div></div><div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;"><button class="btn-primary" onclick="location.reload()" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main);">Submit Another Response</button></div></div>';
}

function escapeHtml(str) { return String(str).replace(/"/g, '"').replace(/'/g, "'"); }