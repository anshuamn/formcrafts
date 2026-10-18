# FormCraft - JotForm-like Form Builder
## Project Plan & Architecture

### Tech Stack
- **Backend**: Node.js/Express (ES Modules)
- **Frontend**: Vanilla JS (ES Modules) + CSS Custom Properties
- **Storage**: JSON files (responses, forms, schemas)
- **Integrations**: Google Forms, Microsoft Forms, WhatsApp, LinkedIn, Gmail

---

## Phase 1: Core Infrastructure & Data Models

### 1.1 Data Models
```
Form Schema (JSON):
{
  id: "form_uuid",
  title: "Survey Title",
  description: "Description",
  settings: {
    theme: "light|dark|auto",
    showProgress: true,
    collectEmail: false,
    allowMultiple: false,
    confirmationMessage: "Thank you!",
    redirectUrl: ""
  },
  pages: [
    {
      id: "page_uuid",
      title: "Page 1",
      description: "",
      fields: [Field[]]
    }
  ],
  logic: [ConditionalLogic[]],
  theme: { colors, fonts, spacing },
  createdAt: "ISO",
  updatedAt: "ISO",
  version: 1
}

Field Types:
- text, textarea, email, number, phone, url
- select, radio, checkbox, dropdown
- likert_matrix, rating, scale
- date, time, datetime
- file, signature
- section, page_break, html
- consent, name, address

Conditional Logic:
{
  id: "logic_uuid",
  fieldId: "target_field",
  action: "show|hide|require|skip",
  conditions: [
    { fieldId: "source_field", operator: "equals|contains|gt|lt", value: "..." }
  ]
}
```

### 1.2 File Structure
```
formcrafts/
├── server.js                 # Main Express server
├── package.json
├── data/
│   ├── forms/                # Individual form JSON files
│   ├── responses/            # Response files per form
│   ├── config.json           # Global config
│   └── glossary.json         # Glossary terms
├── public/
│   ├── index.html            # Respondent view
│   ├── admin.html            # Admin dashboard
│   ├── builder.html          # Form builder (NEW)
│   ├── css/
│   │   ├── style.css         # Main styles
│   │   ├── builder.css       # Builder styles (NEW)
│   │   ├── admin.css         # Admin styles
│   │   └── themes.css        # Theme variables
│   ├── js/
│   │   ├── app.js            # Respondent app
│   │   ├── admin.js          # Admin dashboard
│   │   ├── builder.js        # Form builder (NEW)
│   │   ├── field-types.js    # Field renderers (NEW)
│   │   ├── drag-drop.js      # Drag & drop (NEW)
│   │   ├── share.js          # Sharing integrations (NEW)
│   │   └── utils.js          # Shared utilities
│   └── assets/
│       └── icons/
└── imports/                  # Import parsers
    ├── google-forms.js
    ├── microsoft-forms.js
    └── index.js
```

---

## Phase 2: Form Builder (Visual Drag-Drop)

### 2.1 Builder UI Components
- **Left Sidebar**: Field palette (categories: Basic, Choice, Advanced, Layout)
- **Center Canvas**: Live form preview with drop zones
- **Right Sidebar**: Field properties, validation, logic, styling
- **Top Bar**: Form settings, preview, save, publish, share

### 2.2 Field Types to Support
1. **Basic**: Short Text, Long Text, Email, Number, Phone, URL, Date, Time
2. **Choice**: Single Choice, Multiple Choice, Dropdown, Yes/No
3. **Advanced**: Likert Matrix, Rating (stars), Scale, File Upload, Signature
4. **Layout**: Section Header, Page Break, HTML/Markdown, Divider
5. **Special**: Consent, Name (first/last), Address, Payment (future)

### 2.3 Drag & Drop Implementation
- Native HTML5 Drag & Drop API
- Drop zones between fields, at page level
- Visual feedback during drag
- Touch support for mobile

### 2.4 Field Property Panel
- Label, placeholder, help text
- Required toggle
- Validation (regex, min/max, custom)
- Default values
- Conditional logic builder
- Styling options (width, alignment)

---

## Phase 3: Import System

### 3.1 Google Forms Import
- Parse viewform URL
- Extract FB_PUBLIC_LOAD_DATA_
- Map Google Form types to FormCraft fields
- Preserve entry IDs for sync

### 3.2 Microsoft Forms Import
- Parse share URL
- Extract form structure
- Map MS Forms types to FormCraft fields
- Handle sections and branching

### 3.3 Import Preview & Edit
- Preview imported structure
- Edit field properties before applying
- Merge with existing form or create new

---

## Phase 4: Respondent View (Professional UX)

### 4.1 Features
- Multi-page progress with breadcrumb
- Auto-save draft (localStorage)
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 AA)
- Keyboard navigation
- Real-time validation
- Conditional field display
- File upload with drag-drop
- Signature pad
- Thank you page with social sharing

### 4.2 Themes
- Professional presets (JotForm-like)
- Custom CSS variables
- Dark/Light/Auto modes
- Brand colors, fonts, spacing

---

## Phase 5: Admin Dashboard

### 5.1 Tabs
1. **Forms Manager** - List, create, duplicate, delete, archive
2. **Form Builder** - Link to visual builder
3. **Responses** - Table view, filters, search, export CSV/JSON
4. **Analytics** - Completion rates, drop-off, field analytics
5. **Integrations** - Google Forms sync, Webhooks, Email notifications
6. **Sharing** - WhatsApp, LinkedIn, Gmail, QR Code, Embed
7. **Settings** - Branding, theme, notifications, team

### 5.2 Embedded Source Forms
- Iframe embed for Google/Microsoft Forms
- Side-by-side comparison
- Sync status indicators

---

## Phase 6: Sharing Integrations

### 6.1 WhatsApp
- wa.me link with pre-filled message
- Custom message templates
- QR code generation
- Click tracking

### 6.2 LinkedIn
- Share URL with custom title/description
- Post preview

### 6.3 Gmail
- mailto: link with subject/body
- Pre-filled recipient option

### 6.4 Additional
- QR Code generation
- Embed code (iframe, popup, full page)
- Direct link with UTM parameters
- Social preview cards (Open Graph)

---

## Phase 7: Response Management

### 7.1 Features
- Real-time response table
- Filter by date, status, completion
- Search across fields
- Individual response view
- Bulk actions (delete, export, tag)
- CSV/Excel/JSON export
- Google Sheets sync (optional)

### 7.2 Response Storage
- Per-form response files
- Metadata: IP, user agent, referrer, UTM
- Partial submissions tracking
- Consent tracking

---

## API Endpoints

### Forms
- GET    /api/forms              # List all forms
- POST   /api/forms              # Create form
- GET    /api/forms/:id          # Get form schema
- PUT    /api/forms/:id          # Update form
- DELETE /api/forms/:id          # Delete form
- POST   /api/forms/:id/duplicate # Duplicate form
- POST   /api/forms/:id/publish   # Toggle published

### Form Builder
- GET    /api/forms/:id/schema   # Get builder schema
- PUT    /api/forms/:id/schema   # Save builder schema

### Responses
- POST   /api/forms/:id/submit   # Submit response
- GET    /api/forms/:id/responses # List responses
- GET    /api/forms/:id/responses/:rid # Get single response
- GET    /api/forms/:id/responses/export # Export CSV
- DELETE /api/forms/:id/responses/:rid # Delete response

### Import
- POST   /api/import/google      # Import Google Form
- POST   /api/import/microsoft   # Import Microsoft Form
- POST   /api/import/preview     # Preview import

### Sharing
- GET    /api/forms/:id/share/whatsapp  # WhatsApp link
- GET    /api/forms/:id/share/linkedin  # LinkedIn link
- GET    /api/forms/:id/share/gmail     # Gmail link
- GET    /api/forms/:id/share/qr        # QR code
- GET    /api/forms/:id/embed           # Embed codes

### Admin
- GET    /api/admin/stats        # Dashboard stats
- POST   /api/admin/config       # Update config
- GET    /api/admin/glossary     # Glossary CRUD