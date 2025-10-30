# CVOptima — Frontend (Next.js UI Layer)

A modern, privacy-secure and frictionless user interface built to help candidates align their CV with job descriptions using AI-powered analysis.

---

## Table of Contents
1. Overview
2. The Problem It Solves
3. Why This UI Matters (Product Positioning)
4. Tech Stack & Architecture
5. Authentication & Session Flow
6. File Handling & API Integration
7. Deployment Model
8. Local Development
9. Environment Variables
10. Future Improvements

---

## 1. Overview

This repository contains the **Next.js frontend** for CVOptima.  
It acts as the presentation and interaction layer of the platform: upload CVs, paste job descriptions, trigger AI analysis, view results, and manage user journeys.

Rather than being “a pretty UI”, it provides:
- **Guided workflow**, not just forms
- **Cognitive offloading** for the user
- **Clarity of outcome** (before → after positioning)
- **Secure auth-first design**

---

## 2. The Problem It Solves

Most candidates have the skills to succeed — but **their CV does not *signal* those skills in the right context**.

Recruiters do not read CVs line-by-line.
They pattern-match:
- *Role relevance*
- *Strategic signals*
- *Business impact*
- *Fit-to-need*

The frontend exists to make AI-driven **relevance mapping** accessible with *zero friction*:

Upload → Context → Alignment → Result

---

## 3. Why This UI Matters (Product Positioning)

CVOptima is not a template tool and not a chatbot wrapper.

| Category | Match |
|---------|--------|
| CV beautifier | ❌ |
| Generic LLM text generator | ❌ |
| Strategic match / relevance engine | ✅ |
| Recruiter-lens assistant | ✅ |

Frontend responsibility:  
make the AI pipeline *usable, trustworthy, and immediately valuable*.

---

## 4. Tech Stack & Architecture

| Layer | Tech |
|------|------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Toolkit | shadcn/ui |
| Icons | lucide-react |
| Theme | next-themes (dark/light) |
| State | React hooks |
| Auth | @supabase/ssr (Supabase Auth) |
| Transport | native fetch() |
| Deployment | Vercel |

### Architectural Fit

| Concern | Frontend approach |
|---------|--------------------|
| Secure routing | SSR middleware-based auth gates |
| UX correctness | Layout-level session awareness |
| Minimal client bloat | No heavy auth libs on client |
| Predictable integration | 1:1 mapping to FastAPI endpoints |

---

## 5. Authentication & Session Flow

✅ Supabase Auth  
✅ Stateless session tokens  
✅ SSR middleware for protected pages  
✅ Client only receives session *presence*, not raw secrets

Flow:

User logs in → SSR restores session → secure dashboard access → API calls include JWT automatically

---

## 6. File Handling & API Integration

- PDF/DOCX upload handled client-side with fetch
- CV stored in Supabase Storage through backend
- On success → UUID CV reference returned
- User selects or pastes Job Description
- Analysis started via `/api/v1/analysis/start`
- Polling retrieves status and final structured AI output

This separation of responsibility ensures:
| Task | Owner |
|------|--------|
| Parsing / AI / DB | Backend |
| UX / input orchestration | Frontend |

---

## 7. Deployment Model

| Where | How |
|-------|-----|
| Vercel | Production + preview |
| API origin | `https://api.cvoptima.com` |
| Reverse proxy | Nginx → FastAPI (server) |
| Frontend routing | Direct via Next.js |

---

## 8. Local Development

```bash
# 1. Clone
git clone https://github.com/AriceNn/cvoptima-ai-frontend
cd cvoptima-ai-frontend

# 2. Install deps
npm install

# 3. Set env vars (see .env.example)
cp .env.example .env.local

# 4. Run
npm run dev


⸻

9. Environment Variables

Variable	Purpose
NEXT_PUBLIC_SUPABASE_URL	Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY	Public key for auth
NEXT_PUBLIC_API_URL	Backend FastAPI endpoint


⸻

10. Future Improvements

Area	Upgrade Path
CI/CD	Vercel environments + lint/test gates
UX	Inline analysis previews
Role-based UX	Interview-tailored view modes
Internationalization	EN/TR dual UI
Analytics	Dropoff & funnel tracking


⸻

Final Notes

This frontend is intentionally lightweight and composable — acting as a gateway to the strategic AI layer rather than an over-engineered interface.

It focuses on:
	•	Clarity
	•	Trust
	•	Very low friction
	•	Recruiter-perspective guidance

It is engineered to feel high-touch without complexity, leveraging Next.js SSR to create a secure but seamless user journey.
