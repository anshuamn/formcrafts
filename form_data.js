import fs from "fs";

export const FORM_META = {
  title: "AI/ML Integration and Governance in the Life Sciences Sector",
  subtitle: "This survey is part of doctoral research for ESGCI, Paris. Responses are confidential and anonymized.",
  invitationText: `Dear Participant,
You are invited to participate in a doctoral research study titled "Integration of AI/ML-Based Technologies within the Life Sciences Sector: A Lean Credibility Framework for Ethical Adoption and Use of AI/ML Technologies." This study aims to evaluate the institutional readiness, strategic challenges, regulatory dimensions, and categorization of digital waste in operational AI/ML data pipelines.`,

  consentDetails: `Participation Details:

Eligibility: You are being invited because of your professional role, expertise, or interaction within the Lifesciences & Healthcare ecosystem.
Time Commitment: This survey will take approximately 8 to 10 minutes to complete.
Voluntary Participation: Your participation is completely voluntary. You may withdraw or stop answering at any time without any negative consequences or penalty.
Privacy & Confidentiality:

Anonymity: All responses are completely anonymous. No personally identifiable information (PII) such as your name, email address, or specific organization name will be collected or stored in our database.
Data Security: The collected data will be securely stored on encrypted drives and will be accessed exclusively by the primary researcher for academic and statistical analysis.
Data Usage: The findings of this study will be published strictly in aggregate form within a doctoral dissertation, academic journals, and conference presentations.
Contact Information:
If you have any questions, concerns, or requests regarding this research, please feel free to contact the primary researcher at anshuaman7943@gmail.com or the supervising department at ESGCI, Paris.`,

  consentConfirmation: `Informed Consent Confirmation:
Please read the statement below and indicate your choice.

By selecting "I consent to participate," you acknowledge that you are at least 18 years of age, have read and understood the information above, and voluntarily agree to participate in this study.`,

  institution: "ESGCI, Paris",
  contactEmail: "anshuaman7943@gmail.com",
  formId: "1FAIpQLSeGwlc4mfUdprKYeytCRcFksRob7KdkX3UEdkm6J5ChW_NtwA",
  googleSubmitUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeGwlc4mfUdprKYeytCRcFksRob7KdkX3UEdkm6J5ChW_NtwA/formResponse",
  googleViewUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeGwlc4mfUdprKYeytCRcFksRob7KdkX3UEdkm6J5ChW_NtwA/viewform"
};

export const LIKERT_OPTIONS = [
  { label: "Strongly Disagree", value: "Strongly Disagree", score: 1, color: "#ef4444" },
  { label: "Disagree", value: "Disagree", score: 2, color: "#f97316" },
  { label: "Neutral", value: "Neutral", score: 3, color: "#eab308" },
  { label: "Agree", value: "Agree", score: 4, color: "#10b981" },
  { label: "Strongly Agree", value: "Strongly Agree", score: 5, color: "#059669" },
  { label: "Not Applicable / Do not know", value: "Not Applicable / Do not know", score: 0, color: "#64748b" }
];

// Exact question text, exact descriptions, and exact options directly matching Google Form
export const SURVEY_SECTIONS = [
  {
    id: "welcome",
    title: "Welcome",
    questions: [
      {
        id: "welcome_screen",
        type: "welcome_screen",
        title: "AI/ML Integration and Governance in the Life Sciences Sector",
        subtitle: "This survey is part of doctoral research for ESGCI, Paris. Responses are confidential and anonymized.",
        description: `Dear Participant,
You are invited to participate in a doctoral research study titled "Integration of AI/ML-Based Technologies within the Life Sciences Sector: A Lean Credibility Framework for Ethical Adoption and Use of AI/ML Technologies." This study aims to evaluate the institutional readiness, strategic challenges, regulatory dimensions, and categorization of digital waste in operational AI/ML data pipelines.`
      }
    ]
  },
  {
    id: "informed_consent",
    title: "Informed Consent",
    questions: [
      {
        id: "consent_details",
        type: "consent_details",
        title: "Informed Consent Details",
        description: `Participation Details:

Eligibility: You are being invited because of your professional role, expertise, or interaction within the Lifesciences & Healthcare ecosystem.
Time Commitment: This survey will take approximately 8 to 10 minutes to complete.
Voluntary Participation: Your participation is completely voluntary. You may withdraw or stop answering at any time without any negative consequences or penalty.
Privacy & Confidentiality:

Anonymity: All responses are completely anonymous. No personally identifiable information (PII) such as your name, email address, or specific organization name will be collected or stored in our database.
Data Security: The collected data will be securely stored on encrypted drives and will be accessed exclusively by the primary researcher for academic and statistical analysis.
Data Usage: The findings of this study will be published strictly in aggregate form within a doctoral dissertation, academic journals, and conference presentations.
Contact Information:
If you have any questions, concerns, or requests regarding this research, please feel free to contact the primary researcher at anshuaman7943@gmail.com or the supervising department at ESGCI, Paris.`
      },
      {
        id: "consent_confirmation",
        type: "consent_confirmation",
        title: "Informed Consent Confirmation",
        description: `By selecting "I consent to participate," you acknowledge that you are at least 18 years of age, have read and understood the information above, and voluntarily agree to participate in this study.`,
        entryId: "entry.1725388081",
        options: [
          { label: "I consent to participate", value: "Yes" },
          { label: "No, I do not consent", value: "No" }
        ],
        required: true
      }
    ]
  },
  {
    id: "identification",
    title: "Identification",
    questions: [
      {
        id: "name",
        entryId: "entry.1181035952",
        type: "text",
        title: "Your Name",
        description: "",
        placeholder: "Enter your name",
        required: true
      }
    ]
  },
  {
    id: "demography",
    title: "Demography and Respondent Profile",
    description: "This section captures functional role, organization type, size, and baseline AI maturity",
    questions: [
      {
        id: "age_group",
        entryId: "entry.2143444154",
        type: "choice",
        title: "Which age group do you belong to?",
        description: "",
        options: [
          "18-25",
          "26-40",
          "41-60",
          "60 and above"
        ],
        required: true
      },
      {
        id: "org_size",
        entryId: "entry.1671827446",
        type: "choice",
        title: "What is the approximate employee size of your organization?",
        description: "",
        options: [
          "Fewer than 250",
          "250 – 1,000",
          "1,001 – 5,000",
          "More than 5,000"
        ],
        required: true
      },
      {
        id: "pharma_domain",
        entryId: "entry.1532007467",
        type: "choice",
        title: "Which of the following best describes the primary pharma domain you support?",
        description: "Select the most accurate option",
        options: [
          "Research & Development (Discovery / Preclinical)",
          "Clinical Operations / Clinical Data Management",
          "Regulatory Affairs / Compliance / Quality Assurance",
          "Real World Evidence / Real World Data"
        ],
        required: true
      },
      {
        id: "ai_involvement",
        entryId: "entry.1072067879",
        type: "choice",
        title: "Which of the following best describes your current or recent involvement with AI/ML technologies in pharmaceutical R&D or clinical development?",
        description: "Select the most accurate option",
        options: [
          "Direct implementation or technical development of AI/ML models",
          "Strategic advisory, consulting, or project management for AI/ML initiatives",
          "Regulatory, compliance, or quality assurance oversight of AI/ML workflows",
          "Clinical data management involving AI/ML pipelines"
        ],
        required: true
      },
      {
        id: "experience_level",
        entryId: "entry.917859454",
        type: "choice",
        title: "Your Experience Level with AI/ML Projects",
        description: "",
        options: [
          "Less than 2 years",
          "2 – 3 years",
          "More than 3 years"
        ],
        required: true
      }
    ]
  },
  {
    id: "governance_readiness",
    title: "AI/ML Governance, Readiness, and Process Efficiency",
    description: "Applicable to a broad technological implementation ranging from custom-developed predictive models and cloud-hosted infrastructure provided by hyperscalars, to enterprise applications utilizing Large Language Models (LLMs) with customized wrappers, orchestration layers, or domain-specific configurations.",
    questions: [
      {
        id: "lean_optimization",
        type: "likert_matrix",
        title: "Lean Optimization (LO)",
        instruction: "Please indicate your level of agreement with the following statements regarding process efficiency and \"Digital waste\" in your AI/ML data pipelines.",
        description: "Digital waste includes all data, computing resources and/or storage infrastructure used in AI/ML workflows which do not provide value to the model training, validation, deployment and/or business goals of the project. Examples include duplicate data extractions; redundant feature engineering; unused storage; stale model checkpoints and/or abandoned run logs.",
        columns: LIKERT_OPTIONS.map(o => o.value),
        statements: [
          {
            entryId: "entry.1873010389",
            text: "Our organization systematically maps data and workflow processes prior to AI/ML integration."
          },
          {
            entryId: "entry.942139955",
            text: "Our organization actively identifies and eliminates digital waste within AI/ML pipelines."
          },
          {
            entryId: "entry.1536426948",
            text: "AI/ML tools are deployed to resolve workflow bottlenecks rather than strictly automating existing inefficiencies."
          },
          {
            entryId: "entry.1092855355",
            text: "Removing Digital waste from the pipeline have quantifiably reduced turnaround times for clinical data processing."
          }
        ]
      },
      {
        id: "regulatory_alignment",
        type: "likert_matrix",
        title: "Regulatory Alignment (RA)",
        instruction: "Please indicate your level of agreement regarding how regulatory requirements (e.g., FDA credibility guidance, GxP) are integrated into your AI projects.",
        description: "Refers to the integration of compliance checkpoints, validation protocols, and governance standards (e.g., FDA software credibility guidance, GxP, 21 CFR Part 11) across all AI and machine learning (ML) project lifecycles.",
        columns: LIKERT_OPTIONS.map(o => o.value),
        statements: [
          {
            entryId: "entry.1484603434",
            text: "Regulatory compliance checkpoints are embedded into the initial design phases of AI/ML project lifecycles."
          },
          {
            entryId: "entry.1934426613",
            text: "GxP and 21 CFR Part 11 requirements are integrated throughout the continuous AI/ML development cycle."
          },
          {
            entryId: "entry.1816757769",
            text: "The intended use and operational context of algorithmic tools are explicitly defined prior to clinical workflow integration."
          },
          {
            entryId: "entry.1947311133",
            text: "Comprehensive audit trails are maintained for all AI/ML models utilized in regulatory submissions."
          },
          {
            entryId: "entry.41981573",
            text: "Regulatory requirements for AI/ML tools are primarily addressed post-deployment."
          }
        ]
      },
      {
        id: "ethical_governance",
        type: "likert_matrix",
        title: "Ethical Governance (FATE)",
        instruction: "Please state your level of agreement regarding how your organization operationalizes the FATE principles (Fairness, Accountability, Transparency, Explainability).",
        description: "This encompasses ensuring equitable model performance, clear human accountability, and transparent documentation.",
        columns: LIKERT_OPTIONS.map(o => o.value),
        statements: [
          {
            entryId: "entry.1111563036",
            text: "AI/ML models are audited for bias to ensure equitable performance across diverse demographic groups."
          },
          {
            entryId: "entry.912616925",
            text: "Human accountability is explicitly defined for all AI/ML-assisted decisions and recommendations."
          },
          {
            entryId: "entry.83820095",
            text: "Standardized documentation (e.g., model cards) is routinely generated to define model capabilities and limitations"
          },
          {
            entryId: "entry.1572254393",
            text: "Accountability remain ambiguous when AI/ML systems produce erroneous or biased outputs."
          },
          {
            entryId: "entry.2043095201",
            text: "Explainability tools (e.g., SHAP, LIME) are actively utilized to facilitate the review and comprehension of AI predictions."
          }
        ]
      },
      {
        id: "organizational_readiness",
        type: "likert_matrix",
        title: "Organizational Readiness Assessment (ORA)",
        instruction: "Please state your level of agreement regarding your organization's preparedness (culture and infrastructure) for AI/ML projects",
        description: "Evaluates organizational preparedness, spanning leadership, culture, workforce skills, and IT infrastructure, to successfully adopt and scale AI/ML initiatives.",
        columns: LIKERT_OPTIONS.map(o => o.value),
        statements: [
          {
            entryId: "entry.1079788216",
            text: "Structured change-management strategies are utilized to support role adaptation during AI/ML integration."
          },
          {
            entryId: "entry.1118670232",
            text: "Executive leadership provides adequate strategic guidance for AI/ML initiatives."
          },
          {
            entryId: "entry.1571036750",
            text: "Our organization possesses the required IT infrastructure , i.e, computing, networking, and storage to effectively run AI models at scale."
          },
          {
            entryId: "entry.1809793476",
            text: "Non-technical employees (e.g., clinicians, QA staff) has the competency to evaluate AI/ML model outputs."
          },
          {
            entryId: "entry.1867331453",
            text: "Employees lack the requisite training to critically challenge AI/ML model outputs."
          },
          {
            entryId: "entry.1906272213",
            text: "Data management practices ensure high data quality throughout AI/ML workflows."
          },
          {
            entryId: "entry.1717468730",
            text: "Data security protocols are enforced across all AI/ML workflows."
          },
          {
            entryId: "entry.62616853",
            text: "Leadership allocates the required resources for successful deployment of AI/ML projects."
          }
        ]
      }
    ]
  },
  {
    id: "maturity_feasibility_risks",
    title: "AI/ML Maturity, Adoption Feasibility, and Financial Risks",
    description: "This section assesses structural readiness through your organization's current AI maturity stage, perceived adoption feasibility across life sciences value streams, and financial controls or ROI outcomes.",
    questions: [
      {
        id: "maturity_level",
        entryId: "entry.1542765700",
        type: "choice",
        title: "How would you characterize your organization's current baseline AI/ML maturity level?",
        description: "",
        options: [
          "Exploratory (Investigating use cases, no active pilots)",
          "Pilot Phase (Running isolated proofs-of-concept)",
          "Partially Scaled (Al models deployed in specific, siloed workflows)",
          "Fully Integrated (Al is embedded continuously across multiple enterprise value streams)",
          "Not Applicable / Do not know"
        ],
        required: true
      },
      {
        id: "perceived_feasibility",
        type: "likert_matrix",
        title: "Perceived AI Adoption Feasibility (PAAF)",
        instruction: "Based on your organization's current governance architecture, please evaluate the practical feasibility of deploying AI technologies into production.",
        description: "",
        columns: LIKERT_OPTIONS.map(o => o.value),
        statements: [
          {
            entryId: "entry.794949006",
            text: "A structured AI governance architecture directly enhances the practical feasibility of deploying AI/ML systems within our organization."
          },
          {
            entryId: "entry.1666269803",
            text: "Integrating Lean waste-elimination methods with FDA credibility guidelines would significantly improve the daily operational utility of our AI/ML tools."
          },
          {
            entryId: "entry.1812020616",
            text: "Comprehensive AI governance frameworks facilitate smoother cross-functional deployment of AI systems across R&D, Clinical Operations, Regulatory Affairs, and QA."
          },
          {
            entryId: "entry.852230803",
            text: "The administrative burden of implementing structured AI/ML governance outweighs its potential strategic benefits for our organization."
          },
          {
            entryId: "entry.172843418",
            text: "Standardized ethical review processes make AI/ML governance frameworks easier to navigate and adopt."
          },
          {
            entryId: "entry.225758134",
            text: "It is highly realistic and achievable for our organization to fully operationalize a governed, compliant AI/ML pipeline within the next 1 to 3 years."
          }
        ]
      },
      {
        id: "financial_risks",
        type: "likert_matrix",
        title: "Financial Risks (FR)",
        instruction: "Based on your organization's current AI/ML adoption practices, what do you think about the financial risk and control measures are being practiced.",
        description: "",
        columns: LIKERT_OPTIONS.map(o => o.value),
        statements: [
          {
            entryId: "entry.844264810",
            text: "High uncertainty regarding the exact Return on Investment (ROI) of AI/ML governance delays our organizational decision-making process."
          },
          {
            entryId: "entry.1164544336",
            text: "Securing budget approval for continuous AI/ML validation and governance oversight remains a significant organizational barrier."
          },
          {
            entryId: "entry.1040565198",
            text: "Our organization readily allocates sufficient financial resources for proactive AI/ML governance and capability building."
          },
          {
            entryId: "entry.1345365453",
            text: "The perceived high implementation costs of continuous AI/ML monitoring systems restrict broader deployment across our value streams."
          }
        ]
      },
      {
        id: "roi_category",
        entryId: "entry.144452311",
        type: "choice",
        title: "Which category best reflects the deployed AI system's actual Return on Investment (ROI) compared to initial projections?",
        description: "",
        options: [
          "Failed to meet projections",
          "Met projections",
          "Exceeded projections by up to 15%",
          "Exceeded projections by more than 15%",
          "Too early to determine / ROI not yet formally measured",
          "Not Applicable / Do not know"
        ],
        required: true
      }
    ]
  },
  {
    id: "closing",
    title: "Closing",
    description: "Thank you for participating in this survey. Your insights are extremely valuable.",
    questions: [
      {
        id: "email",
        entryId: "entry.1165371101",
        type: "text",
        title: "Your email address (Optional)",
        description: "",
        placeholder: "name@example.com",
        required: false
      }
    ]
  }
];

// Terminology Dictionary for the non-interactive side pane
export const GLOSSARY_TERMS = [
  {
    term: "Digital Waste",
    category: "Lean Optimization",
    definition: "Includes all data, computing resources, and storage infrastructure used in AI/ML workflows that do not provide direct value to model training, validation, deployment, or business outcomes. Examples include duplicate data extractions, redundant feature engineering, idle compute, and abandoned run logs."
  },
  {
    term: "Lean Optimization (LO)",
    category: "Operational Efficiency",
    definition: "Systematic mapping of data and workflow processes prior to AI/ML integration to actively detect bottlenecks and eliminate digital waste, thereby reducing clinical processing cycle times."
  },
  {
    term: "Regulatory Alignment (RA)",
    category: "Compliance & Standards",
    definition: "Embedding compliance checkpoints, validation protocols, and governance standards (e.g., FDA software credibility guidance, GxP, and 21 CFR Part 11) proactively into the continuous AI/ML lifecycle."
  },
  {
    term: "FDA Credibility Guidance",
    category: "Regulatory Standards",
    definition: "Regulatory frameworks from health authorities evaluating computational modeling and algorithmic credibility in clinical contexts, requiring defined intended use, verification & validation (V&V), and risk assessment."
  },
  {
    term: "GxP and 21 CFR Part 11",
    category: "Quality Assurance",
    definition: "Good Practice quality guidelines across laboratory, clinical, and manufacturing environments, alongside FDA regulations governing electronic records, electronic signatures, and tamper-evident audit trails."
  },
  {
    term: "FATE Principles",
    category: "Ethical Governance",
    definition: "• Fairness (F): Auditing models for bias across demographic and clinical groups.\n• Accountability (A): Defining explicit human accountability for AI-assisted recommendations.\n• Transparency (T): Producing standardized documentation such as Model Cards.\n• Explainability (E): Applying interpretability methods (e.g., SHAP, LIME) to facilitate clinical review."
  },
  {
    term: "Model Cards",
    category: "Transparency",
    definition: "Standardized benchmark documentation routinely generated to summarize an algorithmic model's architecture, intended clinical operational context, limitations, and performance boundaries."
  },
  {
    term: "SHAP and LIME",
    category: "Explainability",
    definition: "Explainable AI (XAI) toolkits used to calculate feature attribution scores, allowing clinicians, data scientists, and reviewers to comprehend why an AI model generated a specific prediction."
  },
  {
    term: "Organizational Readiness Assessment (ORA)",
    category: "Readiness & Culture",
    definition: "Evaluation of preparedness across leadership guidance, workforce competency, training programs, IT infrastructure (compute/networking/storage), and data security protocols."
  },
  {
    term: "AI/ML Maturity Levels",
    category: "Adoption Stages",
    definition: "• Exploratory: Investigating use cases, no active pilots.\n• Pilot Phase: Running isolated proof-of-concept projects.\n• Partially Scaled: Models deployed in specific, siloed workflows.\n• Fully Integrated: AI is embedded continuously across multiple enterprise value streams."
  },
  {
    term: "Perceived AI Adoption Feasibility (PAAF)",
    category: "Strategy & Adoption",
    definition: "Assessment of how practically and realistically an organization can transition governed AI/ML systems into operational life sciences production within 1 to 3 years."
  },
  {
    term: "Financial Risks (FR)",
    category: "Risk & Economics",
    definition: "Financial considerations including uncertainty over Return on Investment (ROI), securing budget for continuous validation, and perceived implementation costs of continuous monitoring."
  }
];
