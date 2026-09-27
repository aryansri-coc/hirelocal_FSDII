# HireLocal 🛠️📞

**Hyperlocal Skilled & Wage Worker Marketplace** with **Multilingual AI CallBot**  
*Full Stack Real Application • Production-Grade RBAC • Indian Market Ready*

---

## 🌟 Overview & Core USP
In many Tier 3 and Tier 4 cities, finding reliable local workers (electricians, AC mechanics, plumbers, carpenters, painters) still depends heavily on personal contacts. Customers face uncertainty around availability and quality, while many skilled workers depend on word-of-mouth and lack access to smartphone apps.

**HireLocal** provides a unified marketplace:
1. **Smartphone Workers** manage jobs and profiles directly on the web app.
2. **Non-Smartphone Workers** register and accept day-based bookings through an **automated multilingual AI CallBot** using standard phone calls with voice and DTMF keypad input.
3. Both channels operate on the exact **same unified backend database and status lifecycle**.

---

## 🔑 Real Authentication & Multi-Role Architecture

The system has been converted from a persona simulator into a **real, fully authenticated marketplace application**:

1. **Authentication (JWT / Bearer Session)**:
   - Real mobile signup & login using 10-digit Indian phone numbers with OTP verification (`123456` default for demo).
   - Sessions persist in `localStorage` and survive browser refresh and re-login.
   - Resource-level ownership security enforced on the backend (customers can only modify their own bookings; workers can only accept/reject their assigned jobs).

2. **Role-Based Experience**:
   - **Public Landing Page**: Public hero banner, service categories preview, and distinct CTAs: `[ FIND A WORKER ]`, `[ WORK AS A WORKER ]`, `[ LOGIN ]`, and `[ SIGN UP ]`.
   - **Customer Portal**: Personalized dashboard, service shortcuts, real database bookings list, day-based booking engine, and rating submissions.
   - **Worker Portal**: Incoming job requests with real Accept/Decline actions, active job tracking, and availability/rate settings.
   - **7-Step Worker Onboarding**: Comprehensive onboarding flow covering basic information, professional trade, availability, communication channel (`Smartphone App` vs `Normal Phone / AI CallBot`), languages, and daily rates.
   - **Admin Control Center**: Real-time computed marketplace health metrics, user management, worker verification (`PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`), job audit, CallBot logs, and an immutable audit trail.
   - **In-App Notifications**: Real-time persistent notifications for job requests, acceptances, rejections, and completion alerts.

3. **Isolated Demo Mode (`DEMO_MODE`)**:
   - `DEMO_MODE=false` by default: Zero persona switcher visible in production; 100% real authentication.
   - Click the 🛠️ icon in the header to toggle `DEMO_MODE=true` during evaluator walkthroughs to switch between seeded personas in 1 click.

---

## 📁 Repository Structure
```
hirelocal/
├── apps/
│   ├── api/                     # Node.js + Express REST API
│   │   ├── src/
│   │   │   ├── config/env.js    # Configuration & matching weights
│   │   │   ├── controllers/     # Auth, Worker, Job, Rating, CallBot, Admin, Notification
│   │   │   ├── middleware/      # Auth & RBAC error handling
│   │   │   ├── routes/          # Express route definitions
│   │   │   └── server.js        # API server (Port 5000)
│   └── web/                     # React + Vite Web App (Port 5173)
│       ├── src/
│       │   ├── api/client.js    # Authenticated API client
│       │   ├── components/      # UI components, modals, and drawers
│       │   ├── context/         # AuthContext & session management
│       │   ├── index.css        # Glassmorphic Dark UI design system
│       │   └── App.jsx          # Role-based root application
├── packages/
│   ├── shared/                  # Status vocabulary, time slots, constants
│   ├── validation/              # Indian phone and input validators
│   ├── services/                # Matching engine & reliability calculator
│   └── callbot/                 # State machine & multilingual dialogue engine
├── database/
│   ├── schema/schema.sql        # Relational SQL DDL
│   ├── seed/seedData.json       # Synthetic seed data for Tier 2/3/4 Indian cities
│   └── db.js                    # Persistent database store with audit logs
├── docs/                        # Architecture & API specifications
├── .env.example                 # Environment template
└── package.json                 # Monorepo orchestration scripts
```

## 🐘 Database Setup (PostgreSQL 18)

HireLocal uses a **PostgreSQL 18** database with full ACID compliance and relational integrity.

### Environment Configuration (.env)
```env
DB_CLIENT=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hirelocal
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=hirelocal
```

### Initialize and Seed Database
Run the automated schema runner and seed script:
```bash
npm run db:init
```
This automatically:
- Creates the `hirelocal` database if not present.
- Executes `database/schema/schema.sql` (creating `users`, `service_categories`, `workers`, `jobs`, `ratings`, `call_logs`, `notifications`, `audit_logs`).
- Populates seed users, workers, service categories, and verified reliability scores.

---

## 🚀 Running the Application

### Option A: Run Full Stack Simultaneously (Recommended)
```bash
npm run dev
```
Starts both the Backend API (`http://localhost:5000`) and Vite Frontend (`http://localhost:5173`) concurrently.

### Option B: Run Services Individually

1. **Backend REST API (Port 5000)**
   ```bash
   npm run dev:api
   ```
   Health Check: `http://localhost:5000/api/health`

2. **Frontend Web Application (Port 5173)**
   ```bash
   npm run dev:web
   ```
   Open in Browser: `http://localhost:5173`

---

## 🧪 Testing the End-to-End Workflow

### Test 1: Real Customer Signup & Booking
1. Open `http://localhost:5173`.
2. Click **"Sign Up"** and enter a new name (e.g. *Aakash Gupta*), phone `9876599991`, and OTP `123456`.
3. Browse available workers or run **"⚡ Match & Rank"**.
4. Click **"Book Day"** to request a service for a specific date and time slot.
5. Go to **"My Bookings"** and verify the job persists on refresh.

### Test 2: Real Worker Onboarding & Acceptance
1. Click **"Sign Out"**, then click **"Work as a Worker"** on the landing page.
2. Complete the 7-step onboarding form (select trade, daily rate, availability, and communication channel).
3. In the Worker Portal, review the incoming booking request and click **"✓ Accept Job"**.
4. Verify the database updates to `ACCEPTED` and the customer receives an in-app notification.

### Test 3: Non-Smartphone Worker & AI CallBot Voice
1. Book a non-smartphone worker (e.g., *Suresh Carpenter* or a newly registered CallBot worker).
2. Go to the **AI CallBot** section and click **"Dial Outbound Call"**.
3. Hear the Hindi voice playback and press **"1"** on the DTMF keypad (or say *"हाँ"*).
4. The exact same job transitions to `ACCEPTED` in the database!

### Test 4: Admin Oversight & Audit Trail
1. Log in as an administrator (or toggle demo mode to switch to *Admin Officer*).
2. Inspect the **Users**, **Workers**, **Jobs**, **CallBot Center**, and **Audit Logs** tabs to review live metrics and logs.
