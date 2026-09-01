# WasteWatch - Smart Community Waste Reporting & Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5+-lightgrey.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![Vite](https://img.shields.io/badge/Vite-8+-purple.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4+-38B2AC.svg)](https://tailwindcss.com/)

**WasteWatch** is a responsive full-stack municipal waste reporting, tracking, and environmental management web platform. It empowers citizens to geo-tag illegal waste dumpings, enables municipal supervisors to verify and dispatch cleanup teams, provides sanitation workers with a structured 6-stage lifecycle workflow, and features interactive Leaflet maps and Recharts operations analytics.

---

## 🚀 Key Features

### 1. 🏠 Landing & Home Page
- Engaging Hero banner with **"Report Waste Now"** and **"View Waste Map"** call-to-actions.
- Live real-time statistics counters (Total Complaints, Cleaned Sites, In-Progress Operations, Active Citizens).
- Recent complaints showcase feed with dynamic status badges.
- Visual 4-Step **"How WasteWatch Works"** guide.
- About section and interactive Contact Form.

### 2. 👤 User Account & Role-Based Access Control
- Three distinct authorization tiers:
  - **Citizen (`user`)**: Submit complaints, upvote, comment, share, view personal complaint history.
  - **Municipal Supervisor (`admin`)**: Full moderation, analytics, user role assignment, category control.
  - **Cleanup Staff (`cleanup_staff`)**: Update lifecycle stages, upload post-cleanup proof photos, record official notes.
- **1-Click Demo Logins** on the Login page and navigation bar for instant testing of all roles.
- Profile hub with avatar customization, bio, phone, password security, and submitted complaint history.

### 3. 📸 Waste Reporting System
- Photo evidence upload with drag-and-drop dropzone and multi-photo preview.
- **LocationPickerMap** with OpenStreetMap / Leaflet integration, draggable pinpoint marker, and **"Use My GPS Location"** one-click detection with reverse geocoding.
- Category classification (*Household, Plastic, Construction, Industrial, Drain/Sewer, Roadside, Water Pollution, Other*).
- Severity / priority ratings (*Low, Medium, High, Critical*).

### 4. 🗺️ Interactive Waste Map
- Full Leaflet OpenStreetMap view with custom SVG markers color-coded by lifecycle stage:
  - 🔴 **Reported** $\to$ 🔵 **Verified** $\to$ 🟣 **Assigned** $\to$ 🟡 **In Progress** $\to$ 🟢 **Cleaned** $\to$ ⚫ **Closed**.
- Interactive popups with thumbnail previews, address, category, and direct links.
- Multi-criteria filter toolbar (Category, Status, Severity, Keyword/District search).
- Split map/drawer view and full-screen view.

### 5. 📋 Report Details & 🔄 6-Stage Cleanup Workflow
- **Interactive Before & After Image Comparison Slider** with smooth horizontal drag.
- **6-Stage Lifecycle Progression Stepper**.
- Mini location map with exact coordinates and district tags.
- Official logs & audit trail documenting every status transition, supervisor notes, and timestamps.

### 6. 👍 Civic Engagement & 🔔 Notifications
- Upvote system with real-time counters.
- Discussion comments thread with user avatars and role badges.
- Share modal (WhatsApp, Twitter/X, Copy Direct Link, Web Share API).
- Flag modal for reporting fake or duplicate submissions.
- Real-time notification center and dropdown.

### 7. 🛠️ Municipal Admin Portal & 📊 Analytics
- **Recharts Analytics**:
  - Monthly complaints reported vs cleaned trend area chart.
  - Reports by waste category donut pie chart.
  - District distribution bar chart.
  - Problematic hotspots priority leaderboard.
- **Operations Console**:
  - Reports table with status transition modal, staff assignment selector, and delete.
  - User management table with role switchers (`user`, `cleanup_staff`, `admin`) and account suspension toggle.
  - Moderation queue for reviewing flagged complaints.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Leaflet / React-Leaflet, Recharts, Axios.
- **Backend**: Node.js, Express.js, JWT, bcryptjs, Multer.
- **Database**: MySQL (`mysql2/promise` with auto-migration and fallback local persistent engine).

---

## 📦 Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/FaiyazTiham/WasteWatch.git
cd WasteWatch
```

### 2. Install dependencies
```bash
# Install root backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Configure environment variables (Optional)
Copy `.env.example` to `.env` or edit `.env`:
```env
PORT=5000
JWT_SECRET=wastewatch_jwt_secret_key_2026_super_secure

# Optional MySQL connection (app automatically runs with high-performance local store if MySQL is offline)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=wastewatch_db
DB_PORT=3306
```

### 4. Run the application
In two separate terminals:

**Terminal 1: Start Backend Server**
```bash
node server/index.js
```
*Backend runs on `http://localhost:5000`*

**Terminal 2: Start Frontend Client**
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 👤 Demo Login Credentials

You can use the **1-Click Demo Buttons** on the Login page or log in manually:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Citizen (User)** | `citizen@wastewatch.org` | `password123` |
| **Supervisor (Admin)** | `admin@wastewatch.org` | `admin123` |
| **Sanitation Worker (Staff)** | `staff@wastewatch.org` | `staff123` |

---

## 📄 License
This project is licensed under the ISC License.
