# 🖥️ Smart Anomaly Detection — Frontend Web Application
### *Autonomous Cyber Threat Intelligence & SOC Operator Interface*

[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![JavaScript](https://img.shields.io/badge/Language-ES6%2B%20%7C%20JSX-f7df1e?logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![CSS](https://img.shields.io/badge/Styling-Custom%20Design%20System-1572b6?logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)

The **Smart Anomaly Detection Frontend** is a cyber threat monitoring and incident response web client. Built with **React 19** and **Vite**, it delivers real-time telemetry, machine learning forensic breakdowns, automated quarantine controls, and audit reporting for security analysts and SOC operators.

---

## 📑 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Complete Page & Feature Guide](#-complete-page--feature-guide)
   - [1. Security Operations Dashboard](#1-security-operations-dashboard)
   - [2. Incident Response & Alerts Center](#2-incident-response--alerts-center)
   - [3. Log Ingestion & Preset Attack Streamer](#3-log-ingestion--preset-attack-streamer)
   - [4. Neural ML Forensics & Model Inspector](#4-neural-ml-forensics--model-inspector)
   - [5. Compliance Reports & Audit Exporter](#5-compliance-reports--audit-exporter)
   - [6. Persistent Analyst Profile & Policy Enclave](#6-persistent-analyst-profile--policy-enclave)
   - [7. Authentication & Zero-Trust Sessions](#7-authentication--zero-trust-sessions)
3. [Design System & Visual Aesthetics](#-design-system--visual-aesthetics)
4. [Component Hierarchy](#-component-hierarchy)
5. [State Management & API Communication](#-state-management--api-communication)
6. [Routing Structure](#-routing-structure)
7. [Getting Started & Local Development](#-getting-started--local-development)
8. [Configuration & Environment Variables](#-configuration--environment-variables)
9. [Build & Production Deployment](#-build--production-deployment)

---

## 🏗️ Architectural Overview

The frontend operates as a Single-Page Application (SPA) communicating with the Express backend via RESTful APIs authenticated with JSON Web Tokens (JWT).

```text
[ Browser / Operator ]
        │
        ▼
[ React 19 Client (Vite Dev / Nginx Production Bundle) ]
        │
        ├── Context Layer (AuthContext, Session Storage, Offline Fallbacks)
        ├── Design System (Deep Forest Green, Mint & Coral Accents, Glassmorphic Tokens)
        ├── Interceptor Engine (Axios Bearer Injection, Auto 401 Expiration Handling)
        │
        ▼
[ Backend API (http://localhost:5000/api) ]
        │
        ├── Telemetry & Aggregations ──► MongoDB
        └── Inference Delegations    ──► Python Flask ML Engine (Isolation Forest)
```

---

## 🚀 Complete Page & Feature Guide

### 1. Security Operations Dashboard
**Route:** `/dashboard`  
**File:** [src/pages/Dashboard.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/pages/Dashboard.jsx)

The operational cockpit providing real-time awareness across network enclaves:
- **Top Metrics Row**:
  - *Log Ingestion Velocity*: Real-time rate (logs/s), total byte volume in storage, and dynamic 5-bar sparklines.
  - *Threat Detection Index*: Live severity score computed dynamically from critical, high, and medium incidents.
  - *Neutralized Anomalies*: Total neutralized attacks, mitigation percentage rate, and historical defense trend.
- **Middle Analytics Row**:
  - *Semi-Circular Threat Gauge*: Fluid SVG arc (`pathLength="100"` with CSS `strokeDashoffset`), color-shifting from soothing mint (`#00d68f`) to urgent coral/red (`#f97316`) during high-threat surges.
  - *Attack Vector Taxonomy*: Aggregation of distributed brute-force, SQLi, and DDoS vectors mapped to MITRE ATT&CK taxonomy.
  - *Interactive Regional Threat Map*: Geographic ingress vector distribution with pulsing radar hotspots and country-specific scan rates.
- **Bottom Row**:
  - *Security Risk Index Pill*: Impact coefficient measuring anomalies against enclave baselines.
  - *Neural Inference Latency Pill*: Pipeline response time (e.g., `12ms`).
  - *Autonomous Neural Defense Enclave Banner*: Interactive toggle switch sending `PATCH /api/dashboard/toggle-defense` to pause or enable autonomous network quarantine.
- **Live Incident & Telemetry Stream**:
  - Live activity table showing incident titles, severity badges, anomaly confidence scores, status, and timestamps directly linked to full investigation views.
- **Simulate Anomaly Spike**:
  - Fires a synthetic critical DDoS ingress burst into MongoDB to verify real-time alert dispatch and UI re-calibration.

---

### 2. Incident Response & Alerts Center
**Route:** `/alerts`  
**File:** [src/pages/Alerts.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/pages/Alerts.jsx)

A full-lifecycle security incident triage and containment module:
- **Comprehensive Lifecycle States**: Transition alerts between `NEW` ➔ `INVESTIGATING` ➔ `RESOLVED`.
- **Severity Tagging**: Visual badges for `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.
- **Search & Multi-Filter**: Real-time keyword search across incident titles, descriptions, and attack types with severity and status dropdown filters.
- **Forensic Detail Inspection**:
  - View raw indicators (Source IP, Target Host, Packet Velocity, MITRE ATT&CK IDs).
  - Inspect linked log files.
- **Remediation Actions**:
  - Mark individual or filtered alerts as `RESOLVED`.
  - Permanent purge from MongoDB ledger.
  - Inject synthetic urgent incidents for live testing.

---

### 3. Log Ingestion & Preset Attack Streamer
**Route:** `/logs`  
**File:** [src/pages/LogUpload.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/pages/LogUpload.jsx)

Streamlines uploading, parsing, and feeding raw telemetry logs into the platform:
- **File Upload Support**: Drag-and-drop or select `.log`, `.txt`, and `.csv` files up to 50MB.
- **1-Click Synthetic Attack Presets**:
  - *SSH Credential Stuffing / Brute Force* (42 failed root logins within 12s)
  - *WAF SQL Injection & Union Extraction* (OWASP Top 10 payload)
  - *Volumetric Distributed SYN-Flood Attack* (14,800 pkt/s spike)
  - *Stealth Base32 DNS Data Exfiltration* (C2 beaconing entropy)
  - *Normal Baseline Web Traffic* (Clean HTTP 200/304 requests)
- **Ingested Logs Ledger**:
  - Real-time status badges (`Uploaded`, `Processing`, `Analyzed`, `Anomaly Detected`).
  - One-click trigger to dispatch the log to the ML Inference engine.
  - Delete and purge options with cascading alert clean-up.

---

### 4. Neural ML Forensics & Model Inspector
**Route:** `/ml-analysis`  
**File:** [src/pages/MLAnalysis.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/pages/MLAnalysis.jsx)

Deep-dive forensic breakdown of model predictions:
- **Isolation Forest Evaluation**:
  - Anomaly Score metric (decision function threshold).
  - Automated Natural Language Forensic Summary.
  - Classification Verdict (*Normal Behavior* vs. *Malicious Anomaly Detected*).
- **24-Feature Importance Breakdown**:
  - Interactive radar / bar distribution analyzing failed authentication rates, unusual port scans, null-byte payloads, shell commands, and regex matches.
- **Raw Forensic Log Viewer**:
  - Integrated terminal-style viewer with highlighted syntax for suspicious entries.

---

### 5. Compliance Reports & Audit Exporter
**Route:** `/reports`  
**File:** [src/pages/Reports.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/pages/Reports.jsx)

Auditing and compliance data extraction:
- **Telemetry Aggregation**:
  - Total logs processed vs. anomaly ratio.
  - Resolution efficiency and mean time to remediate (MTTR).
  - Severity distribution breakdowns (Critical, High, Medium, Low).
- **Instant Data Export**:
  - **Export to JSON**: Full structured telemetry and incident records.
  - **Export to CSV**: Formatted spreadsheet for compliance, SOC handovers, and executive reviews.

---

### 6. Persistent Analyst Profile & Policy Enclave
**Route:** `/profile`  
**File:** [src/pages/Profile.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/pages/Profile.jsx)

Fully dynamic operator identity management with dual-layer persistence (MongoDB + LocalStorage):
- **Hero Identity Card**: Real-time display that reacts live as you type your name, role, department, clearance, and analyst ID.
- **Editable Credentials**:
  - Full Name, Operational Email, Primary Role, Emergency Contact.
  - Department / SOC Enclave, Operational Timezone.
  - Analyst Identifier (e.g. `#soc-1974`).
  - Security Clearance Level (e.g. `LEVEL 4 — RESTRICTED CORE VPC`).
- **Operational Policy Toggles**:
  - *Critical P1 Inbound Attack Surge Alerts* (SMS/Push/PagerDuty).
  - *Autonomous Host Quarantine* (Auto-isolate pods).
  - *Neural Model Drift Alarms* (Alert on confidence drops).
  - *Weekly Compliance Digest* (Automated PDF generation).
- **API Key & Hardware Tokens**: Live SOC telemetry token display with copy and rotation actions.
- **Audit Trail**: Tabular history of recent operator actions.

---

### 7. Authentication & Zero-Trust Sessions
**Routes:** `/login`, `/register`  
**Files:** [src/pages/Login.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/pages/Login.jsx), [src/pages/Register.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/pages/Register.jsx)

- **Authentication**: JWT Bearer token generation and storage in browser storage.
- **Demo Operator Mode**: One-click **"Instant Demo Operator Access"** button bypassing manual typing for instant evaluator testing.
- **Form Validation**: Real-time password criteria and email verification.

---

## 🎨 Design System & Visual Aesthetics

Defined in [src/design-system/tokens.css](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/design-system/tokens.css) and [src/index.css](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/index.css):

| Token | Value | Semantic Purpose |
| :--- | :--- | :--- |
| `--gd-forest-primary` | `#0c3631` | Deep SOC forest background, primary headers |
| `--gd-forest-dark` | `#082824` | Elevated cards, dark banners, hero modules |
| `--gd-mint` | `#00d68f` | Safe status, normal operation, active indicators |
| `--gd-mint-light` | `#e6f9f2` | Badge backgrounds, accent highlights |
| `--gd-coral` | `#f97316` | High/Critical threat warnings, active alert rings |
| `--gd-canvas-bg` | `#f4f8f6` | Clean, high-contrast canvas background |
| `--gd-card-bg` | `#ffffff` | Crisp elevated cards with smooth shadows |

### Visual Effects & Micro-Animations
- **Bouncy Pop Cards**: Cards react with a subtle scale pop (`pop-bouncy`) on click.
- **Pulsing Radar Rings**: Key threat hotspots pulse with SVG CSS animations (`green-dash-ping-ring`).
- **Glassmorphic Badges**: `backdrop-filter: blur(8px)` overlays for status indicators.
- **Toast Notifications**: Slide-in animated notifications with automated 4-second timeout dismissal.

---

## 🌲 Component Hierarchy

```text
App.jsx (Router, Protected Routes)
└── AuthProvider (Global AuthContext)
    └── AppLayout (Navbar, Status Beacon, Operator Identity)
        ├── Dashboard
        │   ├── TopMetricsRow (Sparklines, Velocity, Counts)
        │   ├── MiddleRow (Gauge, Vectors, Threat Map)
        │   ├── BottomRow (Pills, Autonomous Shield Toggle)
        │   ├── LiveIncidentStream (MongoDB Activity Feed)
        │   └── DetailInspectionModal
        ├── Alerts
        │   ├── FilterBar (Severity, Status, Search)
        │   ├── AlertCardsList
        │   └── ForensicDetailConsole
        ├── LogUpload
        │   ├── DropZoneUploader
        │   ├── PresetAttackLibrary
        │   └── LogHistoryTable
        ├── MLAnalysis
        │   ├── ScoreCard & Summary
        │   ├── FeatureImportanceRadar
        │   └── ForensicLogSnippet
        ├── Reports
        │   ├── StatsOverview
        │   └── ExportActions (JSON / CSV)
        └── Profile
            ├── HeroIdentityBanner
            ├── CredentialsForm (Real-time Editable)
            ├── ClearanceMatrix
            ├── TokensAndKeysCard
            └── PolicyTogglesCard
```

---

## 🔄 State Management & API Communication

API communication is centralized in [src/services/api.js](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/services/api.js):

```javascript
// Automatically attaches JWT bearer tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically purges expired sessions and redirects to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🚦 Routing Structure

Configured in [src/App.jsx](file:///c:/Users/E%20%20%20ZONE/Desktop/smart%20anomaly%20detetion/frontend/src/App.jsx):

| Path | Component | Protected | Purpose |
| :--- | :--- | :--- | :--- |
| `/login` | `Login` | No | Operator authentication |
| `/register` | `Register` | No | New user onboarding |
| `/` | Redirect | Yes | Redirects authenticated users to `/dashboard` |
| `/dashboard` | `Dashboard` | Yes | Real-time SOC operations console |
| `/alerts` | `Alerts` | Yes | Incident triage & containment |
| `/logs` | `LogUpload` | Yes | Raw log ingestion & synthetic attack streamer |
| `/ml-analysis` | `MLAnalysis`| Yes | Isolation forest model forensics |
| `/reports` | `Reports` | Yes | Compliance audits & export tools |
| `/profile` | `Profile` | Yes | Operator identity & enclave security policies |

---

## 💻 Getting Started & Local Development

### Prerequisites
- Node.js v18+ (v20+ recommended)
- npm or yarn

### Installation
```powershell
# Navigate to the frontend directory
cd frontend

# Install all npm dependencies
npm install
```

### Starting the Development Server
```powershell
npm run dev
```
The server will start at **`http://localhost:5173`** with Hot Module Replacement (HMR) enabled.

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in `frontend/` (optional, defaults to local backend):

```env
# URL pointing to the Express backend API
VITE_API_URL=http://localhost:5000/api
```

---

## 📦 Build & Production Deployment

To create an optimized, minified production bundle:

```powershell
npm run build
```

The output will be placed in the `frontend/dist/` directory:
- `dist/index.html` — Entrypoint HTML
- `dist/assets/*.js` — Minified React application bundle
- `dist/assets/*.css` — Compiled stylesheet bundle

### Preview Production Build Locally
```powershell
npm run preview
```
Starts a lightweight local HTTP server to preview the built application before deployment.
