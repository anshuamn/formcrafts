import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { FORM_META, LIKERT_OPTIONS, SURVEY_SECTIONS, GLOSSARY_TERMS } from "./form_data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Ensure data folder and files exist
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const responsesFile = path.join(dataDir, "responses.json");
if (!fs.existsSync(responsesFile)) {
  fs.writeFileSync(responsesFile, JSON.stringify([], null, 2), "utf-8");
}
const configFile = path.join(dataDir, "config.json");
if (!fs.existsSync(configFile)) {
  fs.writeFileSync(configFile, JSON.stringify({
    appName: "PhDForm • AI Life Sciences",
    theme: "dark",
    allowGlossary: true,
    adminPin: "admin123",
    googleFormUrl: FORM_META.googleViewUrl,
    googleFormEmbedUrl: `${FORM_META.googleViewUrl}?embedded=true`
  }, null, 2), "utf-8");
}

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(configFile, "utf-8"));
  } catch (e) {
    return { appName: "PhDForm • AI Life Sciences" };
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2), "utf-8");
  return cfg;
}

function loadResponses() {
  try {
    return JSON.parse(fs.readFileSync(responsesFile, "utf-8"));
  } catch (e) {
    return [];
  }
}

function saveResponse(entry) {
  const all = loadResponses();
  all.push(entry);
  fs.writeFileSync(responsesFile, JSON.stringify(all, null, 2), "utf-8");
  return entry;
}

// Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
  const cfg = loadConfig();
  const providedPin = req.query.pin || req.headers["x-admin-pin"] || req.body?.pin;
  
  // For admin.html page access, check session or pin
  if (req.path === "/admin" || req.path === "/admin/") {
    const pin = req.query.pin;
    if (!pin || pin !== cfg.adminPin) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Admin Access Required</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .container { background: rgba(30, 41, 59, 0.9); padding: 3rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); max-width: 400px; width: 90%; text-align: center; }
            h1 { color: #6366f1; margin-bottom: 1rem; }
            input { width: 100%; padding: 1rem; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: #f8fafc; border-radius: 8px; font-size: 1rem; margin-bottom: 1rem; box-sizing: border-box; }
            button { width: 100%; padding: 1rem; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
            button:hover { opacity: 0.9; }
            .error { color: #ef4444; margin-top: 1rem; display: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Admin Access Required</h1>
            <p>Enter your admin PIN to access the control panel.</p>
            <form id="pinForm">
              <input type="password" id="pinInput" placeholder="Enter Admin PIN" autocomplete="off" required />
              <button type="submit">Access Admin Panel</button>
            </form>
            <div class="error" id="errorMsg">Invalid PIN. Please try again.</div>
          </div>
          <script>
            document.getElementById('pinForm').addEventListener('submit', (e) => {
              e.preventDefault();
              const pin = document.getElementById('pinInput').value;
              window.location.href = '/admin?pin=' + encodeURIComponent(pin);
            });
          </script>
        </body>
        </html>
      `);
    }
  }
  
  // For API routes, check pin in header or query
  // Public endpoints that don't require admin PIN
  const publicApiPaths = ["/api/schema", "/api/submit"];
  if (req.path.startsWith("/api/") && !publicApiPaths.includes(req.path)) {
    const pin = req.headers["x-admin-pin"] || req.query.pin || req.body?.pin;
    if (!pin || pin !== cfg.adminPin) {
      return res.status(401).json({ error: "Unauthorized: Admin PIN required" });
    }
  }
  
  next();
}

app.use(requireAdminAuth);

// 1. Get Survey Schema & Glossary
app.get("/api/schema", (req, res) => {
  const cfg = loadConfig();
  res.json({
    meta: {
      ...FORM_META,
      appName: cfg.appName || "PhDForm • AI Life Sciences",
      allowGlossary: cfg.allowGlossary !== false,
      brandTag: cfg.brandTag || "ESGCI Paris Doctoral Study • Live Google Sync",
      pageTitleSuffix: cfg.pageTitleSuffix || "| Doctoral Survey (ESGCI, Paris)"
    },
    likertOptions: LIKERT_OPTIONS,
    sections: SURVEY_SECTIONS,
    glossary: loadGlossary()
  });
});

// 2. Admin Config API
app.get("/api/config", (req, res) => {
  res.json(loadConfig());
});

app.post("/api/config", (req, res) => {
  const { appName, theme, allowGlossary, adminPin, brandTag, pageTitleSuffix } = req.body;
  const current = loadConfig();
  const updated = {
    ...current,
    appName: appName !== undefined ? appName : current.appName,
    theme: theme !== undefined ? theme : current.theme,
    allowGlossary: allowGlossary !== undefined ? allowGlossary : current.allowGlossary,
    adminPin: adminPin !== undefined ? adminPin : current.adminPin,
    brandTag: brandTag !== undefined ? brandTag : current.brandTag,
    pageTitleSuffix: pageTitleSuffix !== undefined ? pageTitleSuffix : current.pageTitleSuffix
  };
  saveConfig(updated);
  res.json({ success: true, config: updated });
});

// 3. Submit Response (Syncs with Google Forms + Local Storage)
app.post("/api/submit", async (req, res) => {
  const { answers, metadata } = req.body;
  if (!answers || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: "No answers provided" });
  }

  const responseId = "resp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  const timestamp = new Date().toISOString();

  // Forward to Google Forms endpoint
  let googleSyncSuccess = false;
  let googleStatus = null;
  try {
    const formData = new URLSearchParams();
    for (const [key, val] of Object.entries(answers)) {
      if (val !== undefined && val !== null && val !== "") {
        formData.append(key, val);
      }
    }
    // Google Forms submission parameters
    formData.append("fvv", "1");
    formData.append("draftResponse", "[]");
    formData.append("pageHistory", "0,1,2,3,4");

    const googleResp = await fetch(FORM_META.googleSubmitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    googleStatus = googleResp.status;
    if (googleResp.ok || googleResp.status === 200 || googleResp.status === 302) {
      googleSyncSuccess = true;
    }
  } catch (err) {
    console.error("Error submitting to Google Forms:", err.message);
    googleStatus = err.message;
  }

  const isConsentNo = answers["entry.1725388081"] === "No";

  // Save local record for unified management
  const record = {
    id: responseId,
    timestamp,
    respondentName: answers["entry.1181035952"] || "Anonymous",
    consented: !isConsentNo,
    email: answers["entry.1165371101"] || null,
    source: metadata?.source || "web_respondent",
    answers,
    googleSync: {
      synced: googleSyncSuccess,
      status: googleStatus,
      targetForm: FORM_META.formId
    }
  };

  saveResponse(record);

  res.json({
    success: true,
    responseId,
    timestamp,
    consented: !isConsentNo,
    googleSynced: googleSyncSuccess,
    message: isConsentNo
      ? "Your decision not to participate has been recorded. Thank you for your time."
      : (googleSyncSuccess
        ? "Response successfully submitted and synced to Google Form & Sheet!"
        : "Response saved locally (Google Forms sync attempted).")
  });
});

// 4. Admin Only: Get Responses List
app.get("/api/responses", (req, res) => {
  const responses = loadResponses();
  res.json({
    total: responses.length,
    responses
  });
});

// 5. Admin Only: Export Responses as CSV
app.get("/api/responses/csv", (req, res) => {
  const responses = loadResponses();
  if (responses.length === 0) {
    return res.status(404).send("No responses yet.");
  }

  const allFieldKeys = new Set();
  SURVEY_SECTIONS.forEach(sec => {
    sec.questions.forEach(q => {
      if (q.entryId) allFieldKeys.add(q.entryId);
      if (q.statements) {
        q.statements.forEach(s => allFieldKeys.add(s.entryId));
      }
    });
  });

  const headerList = ["Response ID", "Timestamp", "Respondent Name", "Consented", "Email", "Source", "Google Synced", ...Array.from(allFieldKeys)];
  const rows = [headerList.map(h => `"${h}"`).join(",")];

  responses.forEach(r => {
    const row = [
      r.id,
      r.timestamp,
      r.respondentName || "",
      r.consented ? "Yes" : "No",
      r.email || "",
      r.source || "",
      r.googleSync?.synced ? "Yes" : "No",
      ...Array.from(allFieldKeys).map(k => {
        const val = r.answers?.[k] || "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
    ];
    rows.push(row.join(","));
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=\"phd_survey_responses.csv\"");
  res.send(rows.join("\n"));
});

// 6. Admin Only: WhatsApp Share Links Generator
app.get("/api/whatsapp/invite", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol || "http";
  const surveyUrl = `${protocol}://${host}/`;

  const inviteMessage = `Dear Colleague,

You are cordially invited to participate in a doctoral research survey for ESGCI, Paris:
"AI/ML Integration and Governance in the Life Sciences Sector"

• Takes ~8-10 minutes
• Mobile-optimized Likert scales with Academic Glossary
• Complete confidentiality & anonymity guaranteed

Survey Link: ${surveyUrl}

Thank you for contributing your expertise to advancing life sciences AI governance!`;

  const encoded = encodeURIComponent(inviteMessage);
  const waUrl = `https://wa.me/?text=${encoded}`;

  res.json({
    shareUrl: waUrl,
    messageText: inviteMessage,
    surveyUrl
  });
});

// 8. Glossary CRUD
const glossaryFile = path.join(dataDir, "glossary.json");
if (!fs.existsSync(glossaryFile)) {
  fs.writeFileSync(glossaryFile, JSON.stringify(GLOSSARY_TERMS, null, 2), "utf-8");
}

function loadGlossary() {
  try {
    return JSON.parse(fs.readFileSync(glossaryFile, "utf-8"));
  } catch (e) {
    return [...GLOSSARY_TERMS];
  }
}

function saveGlossary(terms) {
  fs.writeFileSync(glossaryFile, JSON.stringify(terms, null, 2), "utf-8");
  return terms;
}

// Get Glossary
app.get("/api/glossary", (req, res) => {
  res.json({ glossary: loadGlossary() });
});

// Glossary CRUD (upsert/delete)
app.post("/api/glossary", (req, res) => {
  const { action, term, index } = req.body;
  const glossary = loadGlossary();
  
  if (action === "upsert" && term) {
    if (term.id && !isNaN(term.id)) {
      // Update existing
      const idx = glossary.findIndex(t => t.id === term.id);
      if (idx >= 0) {
        glossary[idx] = { ...glossary[idx], ...term };
      } else {
        // New term with specific ID
        const newTerm = { id: term.id, term: term.term, category: term.category, definition: term.definition };
        glossary.push(newTerm);
      }
    } else {
      // New term
      const newTerm = { 
        id: Date.now(), 
        term: term.term, 
        category: term.category, 
        definition: term.definition 
      };
      glossary.push(newTerm);
    }
    saveGlossary(glossary);
    return res.json({ success: true, glossary });
  }
  
  if (action === "delete" && !isNaN(index)) {
    const filtered = glossary.filter((_, i) => i !== index);
    saveGlossary(filtered);
    return res.json({ success: true, glossary: filtered });
  }
  
  res.status(400).json({ error: "Invalid action" });
});

// 9. Google Form Import - Fetch Schema
app.post("/api/import/google-form", async (req, res) => {
  const { formId } = req.body;
  if (!formId) {
    return res.status(400).json({ error: "Form ID required" });
  }

  try {
    // Fetch the Google Form HTML
    const formUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;
    const response = await fetch(formUrl);
    const html = await response.text();

    // Parse the form data from the HTML
    // Google Forms embeds data in FB_PUBLIC_LOAD_DATA_ variable
    const fbMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(.+?);/s);
    if (!fbMatch) {
      return res.status(400).json({ error: "Could not parse form data. Form may be private or structure changed." });
    }

    let formData;
    try {
      formData = JSON.parse(fbMatch[1]);
    } catch (e) {
      return res.status(400).json({ error: "Failed to parse form JSON data" });
    }

    // Extract form structure
    // formData[1][1] contains the form title/description
    // formData[1][2] contains the items/questions
    const schema = parseGoogleFormData(formData);
    
    // Cache the schema for apply step
    const importCacheFile = path.join(dataDir, "import_cache.json");
    fs.writeFileSync(importCacheFile, JSON.stringify({ formId, schema }, null, 2), "utf-8");

    res.json({ success: true, schema });
  } catch (e) {
    console.error("Import error:", e);
    res.status(500).json({ error: "Failed to import form: " + e.message });
  }
});

// Helper to parse Google Form data structure
function parseGoogleFormData(data) {
  try {
    const items = data[1]?.[2] || [];
    const title = data[1]?.[1]?.[0] || "Imported Survey";
    const description = data[1]?.[1]?.[1] || "";

    const sections = [];
    let currentSection = { id: "imported_main", title: "Main", questions: [] };
    
    items.forEach((item, idx) => {
      if (!item || !item[3]) return;
      
      const questionType = item[3];
      const questionTitle = item[1] || `Question ${idx + 1}`;
      const questionDesc = item[2] || "";
      const isRequired = item[4] === 1;
      const entryId = `entry.${item[4]?.[0] || Date.now() + idx}`;

      let question = {
        id: `q_${idx}`,
        entryId,
        title: questionTitle,
        description: questionDesc,
        required: isRequired
      };

      // Type 0: Text, 1: Multiple choice, 2: Dropdown, 3: Checkboxes, 4: Linear scale, 5: Grid, etc.
      if (questionType === 0) {
        // Text input
        question.type = "text";
        question.placeholder = "Type your answer here...";
      } else if (questionType === 1 || questionType === 2) {
        // Multiple choice / Dropdown
        question.type = "choice";
        const options = item[4]?.map(opt => opt[0]) || [];
        question.options = options;
      } else if (questionType === 3) {
        // Checkboxes - treat as multiple choice for simplicity
        question.type = "choice";
        const options = item[4]?.map(opt => opt[0]) || [];
        question.options = options;
      } else if (questionType === 4) {
        // Linear scale - map to likert
        question.type = "likert_matrix";
        question.instruction = "Please rate:";
        question.columns = ["1", "2", "3", "4", "5", "Not Applicable"];
        question.statements = [{ entryId, text: questionTitle }];
      } else {
        // Default to text
        question.type = "text";
        question.placeholder = "Type your answer here...";
      }

      currentSection.questions.push(question);
    });

    if (currentSection.questions.length > 0) {
      sections.push(currentSection);
    }

    return {
      title,
      subtitle: "This survey is part of doctoral research. Responses are confidential and anonymized.",
      invitationText: `Dear Participant,\nYou are invited to participate in this research study. This study aims to gather insights on the topic.`,
      consentDetails: `Participation Details:\n\nEligibility: You are being invited because of your professional role.\nTime Commitment: This survey will take approximately 8 to 10 minutes to complete.\nVoluntary Participation: Your participation is completely voluntary. You may withdraw at any time.\nPrivacy & Confidentiality:\nAnonymity: All responses are anonymous.\nData Security: Data will be securely stored.\nData Usage: Findings will be published in aggregate form.\nContact: Contact the researcher for questions.`,
      consentConfirmation: `By selecting "I consent to participate," you acknowledge that you are at least 18 years of age, have read and understood the information above, and voluntarily agree to participate in this study.`,
      sections
    };
  } catch (e) {
    console.error("Parse error:", e);
    return {
      title: "Imported Survey",
      subtitle: "This survey is part of doctoral research. Responses are confidential and anonymized.",
      invitationText: "Dear Participant...",
      consentDetails: "Participation Details...",
      consentConfirmation: "Informed Consent Confirmation...",
      sections: []
    };
  }
}

// 10. Apply Imported Schema
app.post("/api/import/apply", (req, res) => {
  const { title, subtitle, invitationText, consentDetails, consentConfirmation } = req.body;
  
  const importCacheFile = path.join(dataDir, "import_cache.json");
  if (!fs.existsSync(importCacheFile)) {
    return res.status(400).json({ error: "No imported schema found. Please fetch a form first." });
  }

  try {
    const cache = JSON.parse(fs.readFileSync(importCacheFile, "utf-8"));
    const schema = cache.schema;
    
    // Update with user-provided metadata
    if (title) schema.title = title;
    if (subtitle) schema.subtitle = subtitle;
    if (invitationText) schema.invitationText = invitationText;
    if (consentDetails) schema.consentDetails = consentDetails;
    if (consentConfirmation) schema.consentConfirmation = consentConfirmation;

    // Save to form_data.js equivalent - we'll use a dynamic schema file
    const dynamicSchemaFile = path.join(dataDir, "dynamic_schema.json");
    fs.writeFileSync(dynamicSchemaFile, JSON.stringify(schema, null, 2), "utf-8");

    // Also update config to use dynamic schema
    const cfg = loadConfig();
    cfg.useDynamicSchema = true;
    cfg.dynamicSchemaPath = dynamicSchemaFile;
    saveConfig(cfg);

    res.json({ success: true, message: "Schema applied. Restart server to load new form." });
  } catch (e) {
    res.status(500).json({ error: "Failed to apply schema: " + e.message });
  }
});

// 11. Dynamic Schema API (for schema endpoint to use imported form)
app.get("/api/schema", (req, res) => {
  const cfg = loadConfig();
  
  // Check if dynamic schema should be used
  if (cfg.useDynamicSchema && cfg.dynamicSchemaPath && fs.existsSync(cfg.dynamicSchemaPath)) {
    try {
      const dynamicSchema = JSON.parse(fs.readFileSync(cfg.dynamicSchemaPath, "utf-8"));
      return res.json({
        meta: {
          ...FORM_META,
          ...dynamicSchema,
          appName: cfg.appName || "PhDForm • AI Life Sciences",
          allowGlossary: cfg.allowGlossary !== false,
          brandTag: cfg.brandTag || "ESGCI Paris Doctoral Study • Live Google Sync",
          pageTitleSuffix: cfg.pageTitleSuffix || "| Doctoral Survey (ESGCI, Paris)"
        },
        likertOptions: LIKERT_OPTIONS,
        sections: dynamicSchema.sections || SURVEY_SECTIONS,
        glossary: loadGlossary()
      });
    } catch (e) {
      console.error("Failed to load dynamic schema:", e);
    }
  }
  
  // Fallback to default schema
  res.json({
    meta: {
      ...FORM_META,
      appName: cfg.appName || "PhDForm • AI Life Sciences",
      allowGlossary: cfg.allowGlossary !== false,
      brandTag: cfg.brandTag || "ESGCI Paris Doctoral Study • Live Google Sync",
      pageTitleSuffix: cfg.pageTitleSuffix || "| Doctoral Survey (ESGCI, Paris)"
    },
    likertOptions: LIKERT_OPTIONS,
    sections: SURVEY_SECTIONS,
    glossary: loadGlossary()
  });
});

// Admin Route
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`PhD Survey & Admin Platform running at:`);
  console.log(`Respondent View: http://localhost:${PORT}/`);
  console.log(`Admin Panel:     http://localhost:${PORT}/admin`);
  console.log(`=================================================`);
});
