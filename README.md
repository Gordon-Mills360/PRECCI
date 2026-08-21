<!-- FILE: precci/README.md -->
# CUTEME LTD — AI Appearance Intelligence System

> The world's first Personal AI Appearance Intelligence System.
> 28 AI agents. Zero human employees. Fully autonomous. Voice-driven.
> Founded by Precious Mills & Gordon Mills — Navrongo, Ghana.

---

## WHAT THIS IS

CUTEME LTD is a fully autonomous AI-powered beauty, fashion and lifestyle platform.
Camera AI sees clients in real time. 28 specialist AI agents analyse skin, hair,
makeup, style, fragrance, body care and grooming — then show exactly how clients
will look before they commit. 12 revenue streams. All executed by AI.

**PRECCI Core** — AI appearance intelligence for clients.
**PRECCI Connect** — Beauty and lifestyle service booking marketplace.

---

## TECH STACK

| Layer | Tool | Purpose |
|---|---|---|
| AI Brain | Claude API (Anthropic) | All 28 agents |
| Camera Vision | Claude Vision + OpenCV | Real-time analysis |
| Virtual Try-On | Replicate (SDXL/ControlNet) | Belle simulations |
| Voice | Vapi + ElevenLabs | All client and provider voice |
| JARVIS | OpenAI Whisper | Precious's voice input |
| Database | Supabase + pgvector | All data and agent memory |
| Backend | Node.js + Express | Port 4000 on Render |
| Frontend | Next.js 14 PWA | Port 3000 on Vercel |
| Automation | n8n (self-hosted) | All 8 workflows |
| Africa Payments | Paystack | Mobile Money + cards |
| Global Payments | Stripe | All non-African payments |
| Email | Resend | All transactional email |
| SMS | Twilio | Verification and alerts |
| Maps | Google Maps API | Provider proximity |
| Weather | OpenWeatherMap | Sage environmental data |
| Social | Meta + TikTok + Pinterest APIs | Nina publishing |
| Influencers | Modash | Nina influencer search |
| Ads | Meta Ads + Google Ads | Finn campaigns |
| Academy | Teachable | Piper Beauty Academy |
| Community | Circle.so | Aurora Inner Circle |
| Monitoring | Sentry + Uptime Robot | 24/7 health |

---

## PREREQUISITES

Install these before anything else:

- **Node.js v20 LTS** — https://nodejs.org (download LTS version)
- **Git** — https://git-scm.com
- **VS Code** — https://code.visualstudio.com

Verify installation:
```bash
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
git --version     # Should show 2.x.x
```

---

## INITIAL SETUP

### 1. Clone the repository

Open VS Code. Open the integrated terminal (Ctrl+` on Windows).

```bash
git clone https://github.com/Gordon-Mills360/PRECCI.git
cd PRECCI/precci
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` in VS Code and fill in every value. See the `.env.example` file
for descriptions of each variable. Never commit the `.env` file.

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Set up Supabase database

In the Supabase dashboard, open the SQL editor and run these migration files
in order: