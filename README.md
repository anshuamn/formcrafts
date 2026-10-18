# FormCraft.io (Jotform Alternative)

A conversational AI-assisted survey platform recreating the Jotform experience, purpose-built for revamping Google Form or Microsoft Form displays. Providing you more controls and flexibility to design your surveys, with advanced features like conversational AI assistance, mobile-first design, WhatsApp, Gmail or LinkedIn sharing, and many more.

---

## 🌟 Core Features

### 1. 🤖 Conversational AI Form Assistant (Jotform AI style)
- **Context-Aware Assistance**: 
- **Conversational Form Completion**: 
- **Dockable Floating Drawer**: Access assistance at any point without losing your survey progress.

### 2. 📱 Mobile-First Likert Scale Matrix
- **Zero Horizontal Scrolling**: Replaces clumsy desktop matrix tables with responsive, touch-friendly vertical pill cards on mobile and tablet devices.
- **Color Grading**: Smooth gradient from *Strongly Disagree* (Crimson) through *Neutral* (Amber) to *Strongly Agree* (Emerald), with a dedicated *Not Applicable* state.
- **Keyboard Shortcuts**: Rapid response entry on desktop using number keys `1`–`6` and `Enter ↵`.

### 3. 🔗 Seamless Direct Google Forms Integration (Single Place for All Data)
- **Live Sync**: Submissions automatically forward to the official Google Form endpoint:
  `https://docs.google.com/forms/d/e/1FAIpQLSeGwlc4mfUdprKYeytCRcFksRob7KdkX3UEdkm6J5ChW_NtwA/formResponse`
- **Zero Double-Entry**: All responses land directly in your linked Google Sheet alongside any existing Google Form entries.
- **Local Backup & Audit Trail**: Responses are also backed up locally in `data/responses.json` and exportable to CSV.

### 4. 💬 WhatsApp Sharing & Conversational Assistant
- **1-Click Share**: Generates a pre-composed academic invitation link (`https://wa.me/?text=...`) ready to send to respondents over WhatsApp.
- **No Paid Business Account Required**: Works immediately via click-to-chat links and browser-friendly mobile views.
- **In-App Simulator**: Preview and test the WhatsApp chat flow right from the dashboard.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Installation & Launch
```bash
# Navigate to the project directory
cd d:\jotforms

# Install dependencies
npm install

# Start the application
npm start
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 📁 Project Structure

```
d:\jotforms\
├── data\
│   └── responses.json      # Local audit trail & submitted responses
├── public\
│   ├── css\
│   │   └── style.css       # Jotform-inspired card & mobile Likert styling
│   ├── js\
│   │   └── app.js          # Card navigation, AI agent, and submission logic
│   └── index.html          # Single-page web application
├── form_data.js            # Extracted schema and Google Form entry ID mappings
├── package.json
└── server.js               # Express server, Google Form sync, AI chat API
```

---

## 🛡️ Doctoral Study Information
- **Institution**: ESGCI, Paris
- **Study**: Integration and Governance of AI/ML Technologies in the Life Sciences Sector
- **Ethics**: Strict anonymization & confidentiality
