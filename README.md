# Nakshaktram — Vedic Astrology & Vastu Consultation Platform

*A calm, authoritative, Apple-grade consultation platform for Vedic Astrologer & Vastu Consultant Amit Soni.*

---

## 🌟 Overview & Product Principles

Nakshaktram is built to deliver a consultation booking experience that feels like scheduling a session with a world-class specialist — **"Apple.com meets a trusted family astrologer"**.

- **Apple-Grade Light Mode Aesthetics:** Strictly light mode utilizing Apple's warm off-white palette (`#FBFBFD`, `#F5F5F7`, `#FFFFFF`), hairline dividers (`#E5E5EA`), frosted glass headers (`backdrop-filter: blur(20px)`), subtle constellation SVG textures, and restrained gold accents.
- **Zero Friction Booking:** 6-week rolling calendar, automatic browser timezone detection (`Intl.DateTimeFormat`) converted to IST working windows (9 AM–5 PM & 8 PM–12 AM), and discussion note tracking.
- **5-Minute Free Trial Call:** Server-verified 1-time eligibility per mobile phone number, live countdown timer, 1-minute audio/visual warning banner, and automatic cutoff modal with upgrade options.
- **WhatsApp-Style In-App Chat:** Real-time messaging via WebSockets, delivery/read receipts, media attachment sharing, and an Admin Unified Inbox with Customer 360 sidebar.
- **Manual UPI Payments Queue:** Dynamic UPI QR generation, bank transfer details (NEFT/IMPS), 12-digit UTR verification queue, and automated appointment status confirmation.
- **Complete Admin Command Center (`/admin`):** Full CMS for Vedic blog posts, Customer CRM with family birth profiles, working hours and blackout dates management, broadcast composer, and conversion funnel analytics.

---

## 🏗️ Monorepo Architecture

```
nakshaktram/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated build and test check on every git push
├── client/                        # Frontend (Vite + React + TypeScript + PWA)
│   ├── public/
│   │   ├── manifest.webmanifest   # PWA Manifest (Apple Touch, light theme)
│   │   ├── sw.js                  # Service Worker (offline fallback & caching)
│   │   └── _redirects             # Cloudflare Pages SPA client-side routing
│   └── src/
│       ├── styles/design-system.css # Apple tokens, SF Pro/Inter typography, 8pt grid
│       ├── components/            # Header, Footer, Modals, Booking, Trial Timer, Chat
│       ├── context/               # AuthContext, NotificationContext
│       └── pages/                 # Home, Blog, About, Pricing, Contact, App, Admin
├── server/                        # Backend API (Node.js + Express + WebSockets + SQLite)
│   ├── src/
│   │   ├── db/database.ts         # SQLite schema, WAL mode, initial platform seed
│   │   ├── controllers/           # Auth, Appointments, Chat, Blog, Payments, Admin
│   │   └── server.ts              # Express API & Socket.io real-time chat gateway
│   ├── render.yaml                # Render Blueprint deployment specification
│   └── tsconfig.json
├── package.json                   # Root monorepo execution scripts
└── README.md                      # Deployment and developer guide
```

---

## 🚀 Quick Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd Kundli
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Start both Backend and Frontend concurrently**:
   ```bash
   npm run dev
   ```
   - **Frontend (Client)**: `http://localhost:5173`
   - **Backend API**: `http://localhost:5001/api`
   - **Health Check**: `http://localhost:5001/health`

---

## ☁️ 100% Free Production Hosting Setup

This architecture is optimized to run completely free using **Cloudflare Pages** for the frontend and **Render** for the backend, connected directly to your GitHub repository for continuous deployment.

### 1. Frontend on Cloudflare Pages (Free Forever)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit of Nakshaktram platform"
   git remote add origin https://github.com/<your-username>/nakshaktram.git
   git push -u origin main
   ```
2. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select your `nakshaktram` GitHub repository.
4. Configure the build settings:
   - **Project Name:** `nakshaktram`
   - **Framework preset:** `Vite`
   - **Root directory:** `client`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. In **Environment variables (Advanced)**, add:
   - `VITE_API_URL`: `https://<your-render-backend-url>.onrender.com/api`
6. Click **Save and Deploy**. Cloudflare will automatically build, deploy, and assign a fast global edge URL (e.g. `https://nakshaktram.pages.dev`). Any future `git push` to `main` will automatically trigger a new deployment.

### 2. Backend on Render (Free Tier Web Service)

1. Log in to [Render](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your `nakshaktram` GitHub repository.
3. Configure the service:
   - **Name:** `nakshaktram-api`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
4. Add the following Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: `<any-random-secure-string>`
   - `CLIENT_URL`: `*` (or your Cloudflare Pages domain)
5. Click **Create Web Service**. Render will build the TypeScript project, initialize SQLite with seed data, and start the WebSockets API. Future git pushes will auto-deploy.

---

## 🔑 Demo & Testing Credentials

| Role | Email | Password | Phone |
|---|---|---|---|
| **Astrologer (Admin Amit Soni)** | `admin@nakshaktram.com` | `Nakshaktram@2026` | `+91 98765 43210` |
| **Client / Seeker (Priya Sharma)** | `priya.sharma@example.com` | `Customer@123` | `+91 98111 22233` |

*Quick test convenience:* You can also click the **"Demo Customer"** or **"Demo Astrologer"** buttons inside the Sign-In modal to authenticate instantly with one tap.

---

## 📋 Features Checklist (Product Specification v1)

- [x] **Section 1 & 2:** Calm authority design, Apple off-white palette (`#FBFBFD`, `#F5F5F7`), Inter/SF Pro typography, frosted-glass header, subtle constellation texture.
- [x] **Section 3 & 4:** Public sitemap (`/`, `/blog`, `/about`, `/pricing`, `/contact`, `/legal/*`), Trust Bar, Services cards, Testimonials, FAQ accordion.
- [x] **Section 5:** Blog CMS with taxonomy (Vedic, Home Vastu, Business Vastu, Kundli, Transits, Gemstones, Numerology), reading time, and sticky CTA.
- [x] **Section 6:** Narrative About Page for Amit Soni with Vedic philosophy, statistics, and specializations.
- [x] **Section 7:** Authentication with SMS OTP simulation, rate limiting, and progressive birth chart profiling for family members.
- [x] **Section 8:** Booking engine with 6-week rolling calendar, automatic browser timezone conversion to IST, and atomic status tracking.
- [x] **Section 10:** In-App WhatsApp-style chat with sent/delivered/read receipts, attachment support, and Admin Customer 360 sidebar.
- [x] **Section 11:** 5-minute Free Trial Call with live countdown timer, 1-minute warning alert, and server-enforced cutoff modal.
- [x] **Section 12:** Full Astrologer Admin Portal (`/admin`) with dashboard counters, slot manager, payment queue, CRM, CMS, and settings.
- [x] **Section 13:** Decoy-effect pricing table highlighting Premium ⭐ Most Popular tier with per-minute value row.
- [x] **Section 14:** Manual UPI QR payments & 12-digit UTR verification queue.
- [x] **Section 17:** Privacy Policy, Terms of Service, Refund Policy, and statutory astrology disclaimers.
- [x] **PWA:** Web App Manifest, Service Worker offline caching, and responsive design.

---

*Nakshaktram — Built for Astrologer Amit Soni.*
