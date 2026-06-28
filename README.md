<!-- FILE: precci/README.md -->

# PRECCI — Personal AI Appearance Intelligence System

**The world's first Personal AI Appearance Intelligence System and the world's first fully voice-driven autonomous AI beauty and lifestyle booking company.**

Founded by **Precious Mills** (Brand Owner & Co-Founder) and **Gordon Mills** (Technical Chairman & Co-Founder) · Headquartered in Navrongo, Ghana.

---

## What PRECCI Is

PRECCI is not a beauty brand. Not a product store. Not a chatbot. It is a full AI-powered platform with two divisions:

**PRECCI Core** — 28 AI agents see clients through their device camera in real time, analyse their skin, hair, body type and facial structure, and give instant personalised recommendations for every aspect of their appearance. Belle renders photo-realistic visual simulations on the client's actual face and body.

**PRECCI Connect** — A fully AI-powered beauty and lifestyle service marketplace. Providers register once. Brook finds nearby providers, books appointments by voice, and notifies providers instantly. The complete end-to-end system — from AI analysis to real-world appointment — does not exist anywhere in the world.

**PRECCI is for every human being on Earth — every gender, age, skin tone, hair type and background.**

---

## Prerequisites

Install these exact versions before starting:

- **Node.js v20 LTS** — https://nodejs.org (download LTS version)
- **Git** — https://git-scm.com
- **VS Code** — https://code.visualstudio.com

Verify installations in VS Code terminal:
```bash
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
git --version     # Should show git version 2.x.x
```

---

## Project Structure

```
precci/
├── backend/          Node.js + Express API (deploy to Render)
├── frontend/         Next.js 14 PWA (deploy to Vercel)
├── database/         Supabase SQL migrations and seeds
├── workflows/        n8n automation workflow JSON files
├── .env.example      All environment variables (copy to .env)
└── README.md
```

---

## Setup Instructions — VS Code

### Step 1: Open the Project
1. Unzip the downloaded `precci.zip`
2. Open VS Code
3. File → Open Folder → select the `precci` folder
4. You will see the full project structure in the Explorer panel

### Step 2: Set Up Environment Variables
1. In VS Code Explorer, find `.env.example` in the root
2. Right-click → Copy
3. Right-click in the root → Paste
4. Rename the copy to `.env`
5. Open `.env` and fill in your real values for each variable
6. **Never commit `.env` to GitHub**

### Step 3: Install Backend Dependencies
Open a new terminal in VS Code (Terminal → New Terminal):
```bash
cd backend
npm install
```

### Step 4: Install Frontend Dependencies
Open a second terminal tab (click the + icon in the terminal panel):
```bash
cd frontend
npm install
```

---

## npm Commands — Exact Order

### Backend (Terminal 1)
```bash
cd backend
npm install          # Install all dependencies
npm run dev          # Start backend in development mode (port 3001)
npm start            # Start backend in production mode
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install          # Install all dependencies
npm run dev          # Start frontend in development mode (port 3000)
npm run build        # Build for production
npm start            # Start production server
```

### Database Migrations (run in order)
Connect to your Supabase project and run these SQL files in order:
1. `database/migrations/001_initial_schema.sql`
2. `database/migrations/002_rls_policies.sql`
3. `database/migrations/003_indexes.sql`
4. `database/migrations/004_pgvector.sql`
5. `database/migrations/005_functions_triggers.sql`
6. `database/seeds/001_agents_seed.sql`

---

## VS Code Terminal Instructions Per Service

Use VS Code split terminals. Terminal → New Terminal for each:

| Terminal | Purpose | Command |
|----------|---------|---------|
| Terminal 1 | Backend API | `cd backend && npm run dev` |
| Terminal 2 | Frontend PWA | `cd frontend && npm run dev` |
| Terminal 3 | Git operations | Used for commits and pushes |

---

## Git Workflow — After Every Phase

```bash
git add .
git commit -m "Phase 1 complete — Foundation"
git push origin main
```

Do this after every phase is complete and verified.

### First-time GitHub setup:
```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/precci.git
git branch -M main
git add .
git commit -m "Initial commit — PRECCI project scaffold"
git push -u origin main
```

---

## Verification Steps

### Backend running correctly:
Open browser: `http://localhost:3001/health`
Should return: `{"status":"ok","service":"PRECCI Backend","timestamp":"..."}`

### Frontend running correctly:
Open browser: `http://localhost:3000`
Should show: PRECCI PWA welcome screen — Grace voice activates immediately

### Supabase connected:
Check backend terminal — should show: `Supabase connection established`

### JARVIS listening:
Open: `http://localhost:3000/dashboard`
Speak to your screen — Vivienne should respond within 2 seconds

---

## Troubleshooting

**`npm install` fails:**
- Ensure Node.js v20 LTS is installed: `node --version`
- Delete `node_modules/` and `package-lock.json`, then run `npm install` again

**Backend not starting:**
- Check `.env` file exists and has real values filled in
- Check port 3001 is not in use: `lsof -i :3001`

**Frontend not starting:**
- Check port 3000 is not in use: `lsof -i :3000`
- Run `npm run build` first to check for TypeScript errors

**Supabase connection failing:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check Supabase project is not paused (free tier pauses after inactivity)

**JARVIS not responding:**
- Verify `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in `.env`
- Check browser has microphone permission granted
- Check browser console for errors

**Vapi voice not activating:**
- Verify `VAPI_API_KEY` and all `VAPI_ASSISTANT_ID_*` values in `.env`
- Ensure HTTPS is used in production (Vapi requires HTTPS)

---

## Render Deployment (Backend)

1. Create account at https://render.com
2. New → Web Service → Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
   - **Instance Type:** Starter ($7/month) to start
4. Add all environment variables from `.env` in Render dashboard
5. Deploy → copy the Render URL (e.g. `https://precci-backend.onrender.com`)
6. Set `API_URL` in your Vercel environment to this Render URL

---

## Vercel Deployment (Frontend)

1. Create account at https://vercel.com
2. New Project → Import your GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
4. Add environment variables (only public vars — no secret keys in frontend)
5. Deploy → Vercel gives you `https://precci.vercel.app`
6. Add custom domain: `precci.com` in Vercel dashboard

---

## PWA Installation Guide

### iOS (iPhone/iPad):
1. Open Safari and go to `https://precci.com`
2. Tap the Share button (square with arrow)
3. Scroll down → tap **Add to Home Screen**
4. Tap **Add** — PRECCI icon appears on your home screen
5. Open from home screen — Grace greets you by voice immediately

### Android:
1. Open Chrome and go to `https://precci.com`
2. Tap the three-dot menu
3. Tap **Add to Home Screen** or **Install App**
4. Tap **Install** — PRECCI icon appears on your home screen
5. Open from home screen — Grace greets you by voice immediately

---

## Camera Permissions Setup

PRECCI requires camera access for all analysis agents. The PWA requests permission automatically when a specialist agent needs to see the client.

- **iOS:** Settings → Safari → Camera → Allow for precci.com
- **Android:** Chrome will prompt automatically — tap Allow
- **Desktop:** Browser will show a permission popup — click Allow

Camera frames are processed server-side only. No frames are stored permanently without explicit consent recorded in the database.

---

## Vapi Client Setup Guide

1. Create account at https://vapi.ai
2. Create an Assistant for Grace (always-on client greeting)
3. Copy the Assistant ID → set as `VAPI_ASSISTANT_ID_GRACE` in `.env`
4. Repeat for each specialist agent
5. Set `VAPI_API_KEY` in `.env`
6. Set webhook URL in Vapi dashboard: `https://your-render-url/api/webhooks/vapi`
7. Copy webhook secret → set as `VAPI_WEBHOOK_SECRET` in `.env`

---

## Paystack Mobile Money Configuration Guide

1. Create account at https://paystack.com
2. Complete business verification
3. Go to Settings → API Keys & Webhooks
4. Copy Secret Key → set as `PAYSTACK_SECRET_KEY` in `.env`
5. Set webhook URL: `https://your-render-url/api/webhooks/paystack`
6. Copy webhook secret → set as `PAYSTACK_WEBHOOK_SECRET` in `.env`
7. For Mobile Money auto-debit: enable the Direct Debit product in your Paystack dashboard
8. Supported networks: MTN Mobile Money, Vodafone Cash, AirtelTigo Money, M-Pesa

---

## Google Maps API Setup Guide

1. Go to https://console.cloud.google.com
2. Create a new project called "PRECCI"
3. Go to APIs & Services → Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API
4. Go to Credentials → Create Credentials → API Key
5. Restrict the key to your domains (precci.com, *.onrender.com)
6. Copy key → set as `GOOGLE_MAPS_API_KEY` in `.env`

---

## Build Phases

| Phase | Weeks | What Gets Built |
|-------|-------|----------------|
| Phase 1 | 1–3 | Foundation — Schema, backend, JARVIS, Vapi, Grace, Vivienne, PWA |
| Phase 2 | 4–5 | Camera AI — Claude Vision, OpenCV, Luna, Sage, Belle, all camera agents |
| Phase 3 | 6–7 | Full Agent Team — all 28 agents, payments, Brook, PRECCI Connect |
| Phase 4 | 8–9 | Dashboards & Launch — Precious dashboard, provider dashboard, beta, launch |

---

*PRECCI — The world's first Personal AI Appearance Intelligence System. For every human being on Earth.*
