# 🌱 EcoConnect — Small Action. Big Change.

**EcoConnect** is a full-stack civic and environmental action platform that connects **Citizens**, **NGO Partners**, and **Government Authorities** to report, verify, map, and resolve local environmental issues transparently.

> *"Spot an environmental problem? Turn that concern into action."*

---

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Core Roles & Workflows](#-core-roles--workflows)
- [Tech Stack & Tools](#-tech-stack--tools)
- [Development Phases & Features](#-development-phases--features)
- [Project Structure](#-project-structure)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
- [API Endpoints Overview](#-api-endpoints-overview)
- [License](#-license)

---

## 🌍 About the Project

Environmental problems—such as illegal waste dumping, water pollution, deforestation, and damaged public green spaces—often go unresolved due to disconnected reporting channels and lack of accountability. 

**EcoConnect** bridges this gap with a unified workflow:
1. **Citizens** spot an issue, attach photographic evidence, pin its exact GPS coordinates on an interactive map, and track live status updates.
2. **NGO Partners** inspect incoming reports, verify authenticity, claim issues for on-ground cleanup, and log progress updates.
3. **Government Officials** monitor city-wide environmental metrics, dispatch municipal departments, and oversee final resolution.

---

## 👥 Core Roles & Workflows

| Role | Portal | Key Capabilities |
| :--- | :--- | :--- |
| **Citizen** | `Dashboard.jsx` | Submit geo-tagged reports with up to 4 photos, search/filter personal reports, view real-time status timelines, receive activity notifications, and explore the community issue map. |
| **NGO Partner** | `NgoDashboard.jsx` | View all citizen submissions, verify authentic reports, claim tasks for field action, update status (`Under Review` → `In Progress` → `Resolved`), and add field notes. |
| **Government Official** | `GovDashboard.jsx` | View city-wide KPIs & category distribution analytics, assign municipal departments (Waste, Water, Pollution Control, Forestry), verify reports, and issue official directives. |

---

## 🛠️ Tech Stack & Tools

### **Frontend**
* **Framework & Build Tool:** React 18 (`react@18.3.1`), Vite
* **Languages:** JavaScript (ES6+), JSX, HTML5, CSS3 (Custom Dark Forest Glassmorphism UI)
* **Interactive Maps:** Leaflet (`leaflet`), React-Leaflet (`react-leaflet@4.2.1`), OpenStreetMap Tiles
* **Icons:** Lucide React (`lucide-react`)
* **Browser APIs:** HTML5 Geolocation API, `FormData` API, `localStorage` & `sessionStorage`

### **Backend & Database**
* **Runtime & Framework:** Node.js, Express.js
* **Language:** JavaScript (CommonJS)
* **Database & ODM:** MongoDB, Mongoose
* **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`), Passwordless Email OTP (`nodemailer` / Gmail SMTP), `express-rate-limit`
* **File Uploads:** Multer (`multer`) for multi-image multipart form handling and local static file serving

---

## 🚀 Development Phases & Features

EcoConnect was engineered across **5 structured development phases**:

### **Phase 1: Evidence Photo Upload & Report Gallery**
* **Tools Used:** `Multer`, `FormData`, Express Static Middleware, React State & Object URLs.
* **What Was Built:** Citizens can attach up to **4 evidence photos** (`JPG`, `PNG`, `WEBP`, max 5 MB each) when submitting a report, preview/remove thumbnails before upload, and inspect full-resolution evidence galleries inside the report details modal.

### **Phase 2: Interactive Environmental Map**
* **Tools Used:** `Leaflet`, `React-Leaflet v4.2.1`, OpenStreetMap, Browser Geolocation API.
* **What Was Built:** 
  * **Explore Map Tab:** Displays geo-tagged environmental reports across the community using custom color-coded status markers (`Submitted`, `Under Review`, `In Progress`, `Resolved`).
  * **Click-to-Pin Coordinate Picker:** Embedded interactive map inside the submission form allowing citizens to click any spot to auto-fill latitude and longitude.

### **Phase 3: Role-Based Access Control (RBAC) & NGO Dashboard**
* **Tools Used:** JWT Role Claims (`citizen`, `ngo`, `government`), Express `requireRole` Middleware, `NgoDashboard.jsx`.
* **What Was Built:** Role selection during OTP authentication, protected backend routes, and a dedicated **NGO Partner Portal** where NGOs verify citizen reports, accept issues for field action, and post progress updates.

### **Phase 4: Government Civic Oversight & Department Dispatch**
* **Tools Used:** `GovDashboard.jsx`, Mongoose Schema Extensions (`assignedDepartment`, `statusNotes`).
* **What Was Built:** A dedicated **Civic Authority Portal** featuring live municipal metrics, visual environmental category breakdown bars, geospatial hotspot tracking, and a dispatch workflow to assign reports to specific municipal departments.

### **Phase 5: Live Metrics, Action Timeline, Notifications & Profile**
* **Tools Used:** MongoDB Aggregation Pipelines (`$group`, `$sort`), `Dashboard.jsx`, `Dashboard.css`.
* **What Was Built:**
  * **Live Overview Stats:** Dynamic counters pulled directly from MongoDB.
  * **Action & Progress Timeline:** Chronological audit trail (`statusNotes`) inside report modals showing every NGO and Government update.
  * **Activity Notification Bell:** Real-time alerts whenever an organization updates a citizen's report.
  * **Community Impact & Profile:** Platform-wide impact analytics and editable user display names.

---

## 📂 Project Structure

```text
EcoConnect/
├── EcoConnect-Backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT verification & requireRole RBAC guard
│   │   ├── models/
│   │   │   ├── User.js             # User schema (citizen, ngo, government)
│   │   │   └── Report.js           # Environmental report, geolocation, images & statusNotes
│   │   ├── routes/
│   │   │   ├── auth.routes.js      # OTP request/verify & profile update endpoints
│   │   │   └── report.routes.js    # CRUD, Multer uploads, map, NGO/Gov actions & impact stats
│   │   └── utils/                  # OTP store & email delivery helpers
│   ├── uploads/                    # Uploaded report evidence images
│   ├── server.js                   # Express server entry point
│   └── .env                        # Environment variables
│
└── EcoConnect-Frontend/
    ├── src/
    │   ├── components/
    │   │   └── EcoMap.jsx          # Reusable Leaflet map (viewer & coordinate picker modes)
    │   ├── App.jsx                 # Landing page, OTP Auth Modal & role-based router
    │   ├── Dashboard.jsx           # Citizen workspace (Overview, Report Form, My Reports, Map, Impact, Profile)
    │   ├── NgoDashboard.jsx        # NGO Partner portal (Verification, Task Claiming, Progress Updates)
    │   ├── GovDashboard.jsx        # Government official portal (Department Dispatch & City Analytics)
    │   └── Dashboard.css           # Dark forest glassmorphism styling
    └── package.json
```

---

## ⚙️ Getting Started (Local Setup)

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or MongoDB Atlas URI)
* **Gmail App Password** (for sending email OTPs)

### 2. Backend Setup
```bash
cd EcoConnect-Backend
npm install
```

Create a `.env` file in `EcoConnect-Backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ecoconnect
JWT_SECRET=your_super_secret_jwt_key_here
OTP_LENGTH=6
OTP_TTL_MINUTES=5
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd EcoConnect-Frontend
npm install
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🔌 API Endpoints Overview

### **Authentication (`/api/auth`)**
* `POST /api/auth/request-otp` — Send a 6-digit verification code to the user's email.
* `POST /api/auth/verify-otp` — Verify OTP, register/assign role (`citizen`, `ngo`, `government`), and return a JWT.
* `PATCH /api/auth/profile` — Update the authenticated user's display name.

### **Environmental Reports (`/api/reports`)**
* `POST /api/reports` — Create a new report with optional coordinates and up to 4 images (`multipart/form-data`).
* `GET /api/reports/my` — Retrieve all reports submitted by the logged-in citizen.
* `GET /api/reports/map` — Retrieve geo-tagged reports for map visualization.
* `GET /api/reports/impact` — Retrieve platform-wide environmental impact statistics.
* `GET /api/reports/all` — *(NGO & Government)* Retrieve all platform reports with reporter and assignee details.
* `PATCH /api/reports/:id/ngo-action` — *(NGO)* Verify a report, claim it for action, or update its progress status.
* `PATCH /api/reports/:id/gov-action` — *(Government)* Assign a municipal department and update official resolution status.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).