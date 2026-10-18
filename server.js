import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Data directories
const dataDir = path.join(__dirname, "data");
const formsDir = path.join(dataDir, "forms");
const responsesDir = path.join(dataDir, "responses");
const importsDir = path.join(dataDir, "imports");

[dataDir, formsDir, responsesDir, importsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Config file
const configFile = path.join(dataDir, "config.json");
const defaultConfig = {
  appName: "FormCrafts",
  theme: "dark",
  adminPin: "admin123",
  brandTag: "Professional Form Builder",
  pageTitleSuffix: "| FormCrafts",
  allowGlossary: true,
  defaultFormSettings: {
    showProgress: true,
    collectEmail: false,
    allowMultiple: false,
    confirmationMessage: "Thank you for your submission!",
    redirectUrl: "",
    theme: "default"
  }
};

function loadConfig() {
  try {
    if (fs.existsSync(configFile)) {
      return { ...defaultConfig, ...JSON.parse(fs.readFileSync(configFile, "utf-8")) };
    }
    return defaultConfig;
  } catch (e) {
    return defaultConfig;
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2), "utf-8");
  return cfg;
}

// Glossary
const glossaryFile = path.join(dataDir, "glossary.json");
const defaultGlossary = [
  { id: "1", term: "Digital Waste", category: "Lean Optimization", definition: "Includes all data, computing resources, and storage infrastructure used in AI/ML workflows that do not provide direct value to model training, validation, deployment, or business outcomes." },
  { id: "2", term: "Lean Optimization (LO)", category: "Operational Efficiency", definition: "Systematic mapping of data and workflow processes prior to AI/ML integration to actively detect bottlenecks and eliminate digital waste." },
  { id: "3", term: "FATE Principles", category: "Ethical Governance", definition: "Fairness, Accountability, Transparency, Explainability - core principles for ethical AI governance." }
];

function loadGlossary() {
  try {
    if (fs.existsSync(glossaryFile)) return JSON.parse(fs.readFileSync(glossaryFile, "utf-8"));
    return [...defaultGlossary];
  } catch (e) { return [...defaultGlossary]; }
}

function saveGlossary(terms) {
  fs.writeFileSync(glossaryFile, JSON.stringify(terms, null, 2), "utf-8");
  return terms;
}

// Form file helpers
function getFormFile(formId) { return path.join(formsDir, `${formId}.json`); }
function getResponsesFile(formId) { return path.join(responsesDir, `${formId}.json`); }

function loadForm(formId) {
  try {
    const file = getFormFile(formId);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
    return null;
  } catch (e) { return null; }
}

function saveForm(form) {
  form.updatedAt = new Date().toISOString();
  form.version = (form.version || 0) + 1;
  fs.writeFileSync(getFormFile(form.id), JSON.stringify(form, null, 2), "utf-8");
  return form;
}

function listForms() {
  try {
    const files = fs.readdirSync(formsDir).filter(f => f.endsWith(".json"));
    return files.map(f => {
      const form = JSON.parse(fs.readFileSync(path.join(formsDir, f), "utf-8"));
      return { id: form.id, title: form.title, description: form.description, createdAt: form.createdAt, updatedAt: form.updatedAt, published: form.published, responseCount: getResponseCount(form.id) };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (e) { return []; }
}

function getResponseCount(formId) {
  try {
    const file = getResponsesFile(formId);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8")).length;
    return 0;
  } catch (e) { return 0; }
}

function loadResponses(formId) {
  try {
    const file = getResponsesFile(formId);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
    return [];
  } catch (e) { return []; }
}

function saveResponse(formId, response) {
  const responses = loadResponses(formId);
  responses.push(response);
  fs.writeFileSync(getResponsesFile(formId), JSON.stringify(responses, null, 2), "utf-8");
  return response;
}

// Admin Auth Middleware
function requireAdminAuth(req, res, next) {
  const cfg = loadConfig();
  const providedPin = req.query.pin || req.headers["x-admin-pin"] || req.body?.pin;

  if (req.path === "/admin" || req.path === "/admin/" || req.path === "/builder" || req.path === "/builder/") {
    const pin = req.query.pin;
    if (!pin || pin !== cfg.adminPin) {
      return res.send(adminPinPage());
    }
  }

  const publicApiPaths = [
    "/api/forms", "/api/forms/", 
    "/api/forms/:id/submit",
    "/api/forms/:id/schema",
    "/api/share/", "/api/import/",
    "/api/schema", "/api/submit",
    "/api/config", "/api/glossary",
    "/api/whatsapp/", "/api/linkedin/", "/api/gmail/",
    "/api/forms/:id/share/", "/api/forms/:id/embed"
  ];

  const isPublicApi = publicApiPaths.some(p => {
    if (p.includes(":")) {
      const regex = new RegExp("^" + p.replace(/:id/g, "[^/]+") + "$");
      return regex.test(req.path);
    }
    return req.path.startsWith(p);
  });

  if (req.path.startsWith("/api/") && !isPublicApi) {
    const pin = req.headers["x-admin-pin"] || req.query.pin || req.body?.pin;
    if (!pin || pin !== cfg.adminPin) {
      return res.status(401).json({ error: "Unauthorized: Admin PIN required" });
    }
  }

  next();
}

function adminPinPage() {
  return `
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Access Required</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.container{background:rgba(30,41,59,0.9);padding:3rem;border-radius:16px;border:1px solid rgba(255,255,255,0.1);max-width:400px;width:90%;text-align:center}h1{color:#6366f1;margin-bottom:1rem}input{width:100%;padding:1rem;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:#f8fafc;border-radius:8px;font-size:1rem;margin-bottom:1rem;box-sizing:border-box}button{width:100%;padding:1rem;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer}button:hover{opacity:0.9}.error{color:#ef4444;margin-top:1rem;display:none}</style></head>
<body><div class="container"><h1>🔐 Admin Access Required</h1><p>Enter your admin PIN to access the control panel.</p><form id="pinForm"><input type="password" id="pinInput" placeholder="Enter Admin PIN" autocomplete="off" required/><button type="submit">Access Admin Panel</button></form><div class="error" id="errorMsg">Invalid PIN. Please try again.</div></div><script>document.getElementById('pinForm').addEventListener('submit',(e)=>{e.preventDefault();const pin=document.getElementById('pinInput').value;window.location.href=req.path+'?pin='+encodeURIComponent(pin);});</script></body></html>`;
}

// Default form template
function createDefaultForm() {
  return {
    id: uuidv4(),
    title: "New Form",
    description: "Enter your form description",
    settings: { ...loadConfig().defaultFormSettings },
    pages: [{
      id: uuidv4(),
      title: "Page 1",
      description: "",
      fields: []
    }],
    logic: [],
    theme: { colors: {}, fonts: {}, spacing: {} },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    published: false
  };
}

// ============ API ROUTES ============

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", version: "2.0.0" }));

// Config
app.get("/api/config", (req, res) => res.json(loadConfig()));
app.post("/api/config", (req, res) => {
  const cfg = loadConfig();
  const updated = { ...cfg, ...req.body };
  saveConfig(updated);
  res.json({ success: true, config: updated });
});

// Glossary
app.get("/api/glossary", (req, res) => res.json({ glossary: loadGlossary() }));
app.post("/api/glossary", (req, res) => {
  const { action, term, index } = req.body;
  const glossary = loadGlossary();
  if (action === "upsert" && term) {
    if (term.id) {
      const idx = glossary.findIndex(t => t.id === term.id);
      if (idx >= 0) glossary[idx] = { ...glossary[idx], ...term };
      else glossary.push({ ...term, id: term.id || Date.now().toString() });
    } else {
      glossary.push({ id: Date.now().toString(), ...term });
    }
    saveGlossary(glossary);
    return res.json({ success: true, glossary });
  }
  if (action === "delete" && !isNaN(index)) {
    saveGlossary(glossary.filter((_, i) => i !== index));
    return res.json({ success: true, glossary: loadGlossary() });
  }
  res.status(400).json({ error: "Invalid action" });
});

// Forms CRUD
app.get("/api/forms", (req, res) => res.json({ forms: listForms() }));

app.post("/api/forms", (req, res) => {
  const form = createDefaultForm();
  if (req.body.title) form.title = req.body.title;
  if (req.body.description) form.description = req.body.description;
  saveForm(form);
  res.json({ success: true, form });
});

app.get("/api/forms/:id", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  res.json(form);
});

app.put("/api/forms/:id", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  const updated = { ...form, ...req.body, id: form.id, createdAt: form.createdAt };
  saveForm(updated);
  res.json({ success: true, form: updated });
});

app.delete("/api/forms/:id", (req, res) => {
  const file = getFormFile(req.params.id);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  const respFile = getResponsesFile(req.params.id);
  if (fs.existsSync(respFile)) fs.unlinkSync(respFile);
  res.json({ success: true });
});

app.post("/api/forms/:id/duplicate", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  const newForm = { ...form, id: uuidv4(), title: form.title + " (Copy)", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, published: false };
  saveForm(newForm);
  res.json({ success: true, form: newForm });
});

app.post("/api/forms/:id/publish", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  form.published = !form.published;
  saveForm(form);
  res.json({ success: true, published: form.published });
});

// Form Schema (for builder)
app.get("/api/forms/:id/schema", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  res.json(form);
});

app.put("/api/forms/:id/schema", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  const updated = { ...form, ...req.body, id: form.id, createdAt: form.createdAt };
  saveForm(updated);
  res.json({ success: true, form: updated });
});

// Submit Response
app.post("/api/forms/:id/submit", async (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  if (!form.published) return res.status(403).json({ error: "Form is not published" });

  const { answers, metadata } = req.body;
  if (!answers || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: "No answers provided" });
  }

  const responseId = "resp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  const timestamp = new Date().toISOString();

  const record = {
    id: responseId,
    formId: form.id,
    timestamp,
    answers,
    metadata: {
      source: metadata?.source || "web",
      userAgent: metadata?.userAgent || req.headers["user-agent"],
      referrer: metadata?.referrer || req.headers["referer"],
      ip: req.ip,
      utm: metadata?.utm || {}
    },
    completionTime: metadata?.completionTime || null
  };

  saveResponse(form.id, record);

  // TODO: Forward to Google Forms if configured
  // TODO: Send webhook notifications
  // TODO: Send email notifications

  res.json({ success: true, responseId, timestamp, message: "Response submitted successfully!" });
});

// Responses
app.get("/api/forms/:id/responses", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  const responses = loadResponses(req.params.id);
  res.json({ total: responses.length, responses });
});

app.get("/api/forms/:id/responses/:rid", (req, res) => {
  const responses = loadResponses(req.params.id);
  const response = responses.find(r => r.id === req.params.rid);
  if (!response) return res.status(404).json({ error: "Response not found" });
  res.json(response);
});

app.get("/api/forms/:id/responses/export", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  const responses = loadResponses(req.params.id);
  if (responses.length === 0) return res.status(404).send("No responses yet.");

  // Build field map
  const fieldMap = {};
  form.pages.forEach(page => {
    page.fields.forEach(f => { if (f.id) fieldMap[f.id] = f.label || f.title || f.id; });
  });

  const headers = ["Response ID", "Timestamp", "Source", "IP", ...Object.values(fieldMap)];
  const rows = [headers.map(h => `"${h}"`).join(",")];

  responses.forEach(r => {
    const row = [r.id, r.timestamp, r.metadata?.source || "", r.metadata?.ip || ""];
    Object.keys(fieldMap).forEach(fid => {
      const val = r.answers?.[fid] || "";
      row.push(`"${String(val).replace(/"/g, '""')}"`);
    });
    rows.push(row.join(","));
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv"`);
  res.send(rows.join("\n"));
});

app.delete("/api/forms/:id/responses/:rid", (req, res) => {
  const responses = loadResponses(req.params.id);
  const filtered = responses.filter(r => r.id !== req.params.rid);
  fs.writeFileSync(getResponsesFile(req.params.id), JSON.stringify(filtered, null, 2), "utf-8");
  res.json({ success: true });
});

// Admin Stats
app.get("/api/admin/stats", (req, res) => {
  const forms = listForms();
  let totalResponses = 0;
  forms.forEach(f => totalResponses += f.responseCount);
  res.json({ totalForms: forms.length, totalResponses, publishedForms: forms.filter(f => f.published).length, forms });
});

// ============ IMPORT ROUTES ============

// Google Forms Import
app.post("/api/import/google", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Google Form URL required" });

  try {
    // Extract form ID from URL
    const formIdMatch = url.match(/\/forms\/d\/e\/([^\/]+)/);
    if (!formIdMatch) return res.status(400).json({ error: "Invalid Google Form URL" });
    const formId = formIdMatch[1];

    const formUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;
    const response = await fetch(formUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await response.text();

    const fbMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(.+?);/s);
    if (!fbMatch) return res.status(400).json({ error: "Could not parse form data. Form may be private." });

    let formData;
    try { formData = JSON.parse(fbMatch[1]); } catch (e) { return res.status(400).json({ error: "Failed to parse form JSON" }); }

    const schema = parseGoogleFormData(formData);
    
    // Cache for preview
    const cacheFile = path.join(importsDir, `google_${formId}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify({ formId, url, schema, importedAt: new Date().toISOString() }, null, 2));

    res.json({ success: true, schema, cacheKey: `google_${formId}` });
  } catch (e) {
    console.error("Google import error:", e);
    res.status(500).json({ error: "Failed to import: " + e.message });
  }
});

// Microsoft Forms Import
app.post("/api/import/microsoft", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Microsoft Forms URL required" });

  try {
    // Microsoft Forms share URLs: https://forms.office.com/Pages/ResponsePage.aspx?id=...
    // or short: https://forms.office.com/r/...
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await response.text();
    
    // Microsoft Forms embeds data in various ways
    // Try to find the form data in the page
    const schema = parseMicrosoftFormData(html, url);
    
    const cacheKey = `microsoft_${Date.now()}`;
    const cacheFile = path.join(importsDir, `${cacheKey}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify({ url, schema, importedAt: new Date().toISOString() }, null, 2));

    res.json({ success: true, schema, cacheKey });
  } catch (e) {
    console.error("Microsoft import error:", e);
    res.status(500).json({ error: "Failed to import: " + e.message });
  }
});

app.post("/api/import/apply", (req, res) => {
  const { cacheKey, formId, title, description } = req.body;
  const cacheFile = path.join(importsDir, `${cacheKey}.json`);
  
  if (!fs.existsSync(cacheFile)) {
    return res.status(400).json({ error: "Import cache not found" });
  }

  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    const schema = cache.schema;

    let form;
    if (formId) {
      form = loadForm(formId);
      if (!form) return res.status(404).json({ error: "Form not found" });
    } else {
      form = createDefaultForm();
    }

    if (title) form.title = title;
    if (description) form.description = description;

    // Convert imported schema to FormCraft format
    form.pages = schema.pages || [{
      id: uuidv4(),
      title: "Imported Form",
      description: "",
      fields: schema.fields || []
    }];

    saveForm(form);
    fs.unlinkSync(cacheFile); // Clean up cache

    res.json({ success: true, formId: form.id, message: "Form imported successfully!" });
  } catch (e) {
    res.status(500).json({ error: "Failed to apply import: " + e.message });
  }
});

// ============ SHARING ROUTES ============

function getFormUrl(req, formId) {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/form/${formId}`;
}

app.get("/api/forms/:id/share/whatsapp", async (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const formUrl = getFormUrl(req, req.params.id);
  const message = `📋 ${form.title}\n\n${form.description || "Please fill out this form."}\n\n🔗 ${formUrl}\n\nSent via FormCrafts`;
  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/?text=${encoded}`;

  res.json({ shareUrl: waUrl, messageText: message, formUrl, qrCode: await QRCode.toDataURL(waUrl) });
});

app.get("/api/forms/:id/share/linkedin", async (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const formUrl = getFormUrl(req, req.params.id);
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(formUrl)}`;
  const title = encodeURIComponent(form.title);
  const summary = encodeURIComponent(form.description || "Check out this form!");

  res.json({ shareUrl, formUrl, title, summary, qrCode: await QRCode.toDataURL(formUrl) });
});

app.get("/api/forms/:id/share/gmail", async (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const formUrl = getFormUrl(req, req.params.id);
  const subject = encodeURIComponent(`Form: ${form.title}`);
  const body = encodeURIComponent(`${form.description || ""}\n\nPlease fill out this form:\n${formUrl}\n\n---\nSent via FormCrafts`);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;

  res.json({ shareUrl: gmailUrl, formUrl, subject: form.title, body: `${form.description || ""}\n\nPlease fill out this form:\n${formUrl}`, qrCode: await QRCode.toDataURL(formUrl) });
});

app.get("/api/forms/:id/share/qr", async (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const formUrl = getFormUrl(req, req.params.id);
  const qrCode = await QRCode.toDataURL(formUrl, { width: 300, margin: 2 });
  res.json({ formUrl, qrCode });
});

app.get("/api/forms/:id/embed", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const protocol = req.protocol;
  const host = req.get("host");
  const formUrl = `${protocol}://${host}/form/${form.id}`;

  const embedCodes = {
    iframe: `<iframe src="${formUrl}" width="100%" height="600" frameborder="0" style="border:1px solid #e0e0e0;border-radius:8px;">Loading…</iframe>`,
    popup: `<a href="${formUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Open Form</a>`,
    fullPage: `<a href="${formUrl}" target="_blank" rel="noopener">${formUrl}</a>`,
    javascript: `<!-- FormCrafts Embed -->\n<script>\n  (function() {\n    var iframe = document.createElement('iframe');\n    iframe.src = '${formUrl}';\n    iframe.style.width = '100%';\n    iframe.style.height = '600px';\n    iframe.style.border = '1px solid #e0e0e0';\n    iframe.style.borderRadius = '8px';\n    document.currentScript.parentNode.insertBefore(iframe, document.currentScript);\n  })();\n<\/script>`
  };

  res.json({ formUrl, embedCodes });
});

// ============ RESPONDENT VIEW ROUTES ============

// Serve respondent form
app.get("/form/:id", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).send(formNotFoundPage());
  if (!form.published) return res.status(403).send(formNotPublishedPage());
  res.sendFile(path.join(__dirname, "public", "form.html"));
});

// Form schema for respondent view
app.get("/api/forms/:id/respondent", (req, res) => {
  const form = loadForm(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  if (!form.published) return res.status(403).json({ error: "Form is not published" });

  const cfg = loadConfig();
  res.json({
    ...form,
    meta: {
      appName: cfg.appName,
      brandTag: cfg.brandTag,
      pageTitleSuffix: cfg.pageTitleSuffix,
      allowGlossary: cfg.allowGlossary
    }
  });
});

// ============ HTML PAGES ============

function formNotFoundPage() {
  return `<!DOCTYPE html><html><head><title>Form Not Found</title><style>body{font-family:system-ui;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{background:rgba(30,41,59,0.9);padding:3rem;border-radius:16px;border:1px solid rgba(255,255,255,0.1);text-align:center}h1{color:#ef4444}a{color:#6366f1}</style></head><body><div class="card"><h1>📋 Form Not Found</h1><p>The requested form does not exist or has been removed.</p><a href="/admin">← Back to Admin</a></div></body></html>`;
}

function formNotPublishedPage() {
  return `<!DOCTYPE html><html><head><title>Form Not Available</title><style>body{font-family:system-ui;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{background:rgba(30,41,59,0.9);padding:3rem;border-radius:16px;border:1px solid rgba(255,255,255,0.1);text-align:center}h1{color:#f59e0b}a{color:#6366f1}</style></head><body><div class="card"><h1>🔒 Form Not Published</h1><p>This form is not yet published. Please contact the form owner.</p><a href="/admin">← Back to Admin</a></div></body></html>`;
}

// ============ STATIC ROUTES ============

app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/builder", (req, res) => res.sendFile(path.join(__dirname, "public", "builder.html")));
app.get("/builder/:id", (req, res) => res.sendFile(path.join(__dirname, "public", "builder.html")));
app.get("/", (req, res) => res.redirect("/admin"));

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`FormCrafts v2.0 running at:`);
  console.log(`Admin Dashboard:  http://localhost:${PORT}/admin`);
  console.log(`Form Builder:     http://localhost:${PORT}/builder`);
  console.log(`Respondent Form:  http://localhost:${PORT}/form/:id`);
  console.log(`=================================================`);
});

// ============ IMPORT PARSERS ============

function parseGoogleFormData(data) {
  try {
    const items = data[1]?.[2] || [];
    const title = data[1]?.[1]?.[0] || "Imported Form";
    const description = data[1]?.[1]?.[1] || "";

    const fields = [];
    let currentPage = { id: uuidv4(), title: "Page 1", description: "", fields: [] };
    const pages = [currentPage];

    items.forEach((item, idx) => {
      if (!item || !item[3]) return;
      
      const questionType = item[3];
      const questionTitle = item[1] || `Question ${idx + 1}`;
      const questionDesc = item[2] || "";
      const isRequired = item[4] === 1;
      const entryId = item[4]?.[0] ? `entry.${item[4][0]}` : `field_${uuidv4()}`;

      let field = {
        id: uuidv4(),
        type: "text",
        label: questionTitle,
        placeholder: "",
        required: isRequired,
        helpText: questionDesc,
        entryId: entryId
      };

      if (questionType === 0) {
        // Text input
        field.type = "text";
        field.placeholder = "Type your answer here...";
      } else if (questionType === 1) {
        // Multiple choice (radio)
        field.type = "radio";
        field.options = (item[4] || []).map((opt, i) => ({ id: uuidv4(), label: opt[0], value: opt[0] }));
      } else if (questionType === 2) {
        // Dropdown
        field.type = "select";
        field.options = (item[4] || []).map((opt, i) => ({ id: uuidv4(), label: opt[0], value: opt[0] }));
      } else if (questionType === 3) {
        // Checkboxes
        field.type = "checkbox";
        field.options = (item[4] || []).map((opt, i) => ({ id: uuidv4(), label: opt[0], value: opt[0] }));
      } else if (questionType === 4) {
        // Linear scale -> Likert
        field.type = "likert";
        field.statements = [{ id: uuidv4(), text: questionTitle, entryId }];
        field.scale = { min: 1, max: 5, labels: { 1: "Strongly Disagree", 5: "Strongly Agree" } };
      } else if (questionType === 5) {
        // Grid -> Likert Matrix
        field.type = "likert_matrix";
        field.instruction = questionDesc;
        field.columns = ["1", "2", "3", "4", "5", "N/A"];
        field.statements = [{ id: uuidv4(), text: questionTitle, entryId }];
      } else if (questionType === 9) {
        // Date
        field.type = "date";
      } else if (questionType === 10) {
        // Time
        field.type = "time";
      } else {
        field.type = "text";
      }

      currentPage.fields.push(field);
    });

    if (currentPage.fields.length === 0 && pages.length > 1) pages.pop();

    return { title, description, pages, fields: pages.flatMap(p => p.fields) };
  } catch (e) {
    console.error("Parse error:", e);
    return { title: "Imported Form", description: "", pages: [{ id: uuidv4(), title: "Page 1", description: "", fields: [] }] };
  }
}

function parseMicrosoftFormData(html, url) {
  try {
    // Microsoft Forms data is typically in a script tag or meta
    // Try multiple patterns
    let formData = null;
    
    // Pattern 1: window.__INITIAL_STATE__
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s);
    if (stateMatch) {
      try { formData = JSON.parse(stateMatch[1]); } catch (e) {}
    }

    // Pattern 2: data-form attribute
    if (!formData) {
      const dataMatch = html.match(/data-form\s*=\s*"([^"]+)"/);
      if (dataMatch) {
        try { formData = JSON.parse(decodeURIComponent(dataMatch[1])); } catch (e) {}
      }
    }

    // Pattern 3: Look for JSON in script tags
    if (!formData) {
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        for (const script of scriptMatches) {
          const jsonMatch = script.match(/\{[\s\S]*"questions"[\s\S]*?\}/);
          if (jsonMatch) {
            try { formData = JSON.parse(jsonMatch[0]); break; } catch (e) {}
          }
        }
      }
    }

    // Fallback: create basic structure
    if (!formData) {
      return { title: "Microsoft Form Import", description: "Imported from Microsoft Forms", pages: [{ id: uuidv4(), title: "Page 1", description: "", fields: [] }] };
    }

    // Parse Microsoft Forms structure
    // This is a simplified parser - MS Forms structure varies
    const questions = formData.questions || formData.sections?.[0]?.questions || [];
    const title = formData.title || formData.name || "Imported Microsoft Form";
    const description = formData.description || "";

    const fields = [];
    questions.forEach((q, idx) => {
      const field = { id: uuidv4(), type: "text", label: q.text || q.title || `Question ${idx + 1}`, required: q.required || false, helpText: q.description || "" };
      
      switch (q.type) {
        case "Text": case "LongText": field.type = q.type === "LongText" ? "textarea" : "text"; break;
        case "Choice": field.type = "radio"; field.options = (q.choices || []).map(c => ({ id: uuidv4(), label: c, value: c })); break;
        case "MultiChoice": field.type = "checkbox"; field.options = (q.choices || []).map(c => ({ id: uuidv4(), label: c, value: c })); break;
        case "Dropdown": field.type = "select"; field.options = (q.choices || []).map(c => ({ id: uuidv4(), label: c, value: c })); break;
        case "Rating": field.type = "rating"; field.maxRating = q.maxRating || 5; break;
        case "Date": field.type = "date"; break;
        case "Ranking": field.type = "ranking"; field.options = (q.choices || []).map(c => ({ id: uuidv4(), label: c, value: c })); break;
        case "Likert": field.type = "likert_matrix"; field.statements = (q.rows || []).map(r => ({ id: uuidv4(), text: r })); field.columns = (q.columns || []).map(c => ({ id: uuidv4(), label: c })); break;
        case "NetPromoterScore": field.type = "nps"; break;
        default: field.type = "text";
      }
      fields.push(field);
    });

    return { title, description, pages: [{ id: uuidv4(), title: "Page 1", description: "", fields }] };
  } catch (e) {
    console.error("MS Forms parse error:", e);
    return { title: "Microsoft Form Import", description: "Imported from Microsoft Forms", pages: [{ id: uuidv4(), title: "Page 1", description: "", fields: [] }] };
  }
}