# TechTangle — Product Requirements Document

## Source
Built from the user's uploaded report `TechTangle_Project_Report_Complete.docx` — a gamified web app for learning computer science vocabulary via anagram puzzles.

## Original Problem Statement
"build web app using this file this detail" — referencing the TechTangle project report.

## Tech Stack (as built)
- **Backend**: FastAPI (Python 3.11) + Motor (async MongoDB)
- **Frontend**: React 19 + React Router 7 + Tailwind CSS + lucide-react icons
- **Database**: MongoDB
- **Auth**: Custom JWT (PyJWT) + bcrypt password hashing, token in `Authorization: Bearer` header (stored client-side in `localStorage.tt_token`)

> Note: The report specified Node.js/MySQL/Redis. Container constraints (no MySQL/Redis, supervisor locked to FastAPI) required adapting to FastAPI+MongoDB while preserving every functional and architectural concept.

## User Personas
1. **Student / Learner** — registers, plays anagram puzzles, climbs tiers, earns badges, tracks profile stats.
2. **Instructor / Administrator** — seeded automatically; manages puzzle content (CRUD), monitors platform analytics.

## Core Functional Requirements (from report)
- **FR-01 AUTH**: Email/password account management with profile score tally ✅
- **FR-02 SOLO**: Render anagrams, validate input, enforce level unlocking ✅
- **FR-03 SYNC**: Real-time multiplayer — *deferred (P1)*
- **FR-04 LDGR**: Score & points ledger ✅ (basic — no peer-to-peer betting yet)
- **FR-05 ADMN**: Instructor dashboard with puzzle CRUD + analytics ✅

## What's Implemented (Jan 2026)
### Backend (`/app/backend/server.py`)
- JWT auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Levels: `/api/levels` — returns 4 tiers with unlock status + progress
- Puzzles (student): `/api/puzzles/next?level=...`, `/api/puzzles/submit`
- Leaderboard: `/api/leaderboard` (sorted by points, admins excluded)
- Profile: `/api/profile` (stats + global rank)
- Admin: `/api/admin/puzzles` (GET/POST/PUT/DELETE), `/api/admin/stats`
- Startup seeds: 1 admin user + 44 CS puzzles across 4 tiers
- Server-authoritative scoring (per the report's design principle)
- No double-credit for re-solving the same puzzle
- Badges awarded: First Solve, 5x Streak, Hot Streak, Tier Conquerors
- Unlock rule: 5 correct solves in a tier unlocks the next

### Frontend (`/app/frontend/src/`)
- Landing page with hero, sample puzzle preview, CTAs
- Login & Register (JWT-based)
- Student Dashboard: 4 tier cards w/ progress, leaderboard preview, stat tiles
- Puzzle Arena: tactile anagram tiles (Neo-Brutalist shadow), slot tiles, definition reveal on wrong answer, shake/pop animations, tier switcher
- Leaderboard: top 50 with rank, points, tier badges
- Profile: stats, accuracy, global rank, badges, tier progress bars
- Admin Dashboard: platform stats (users, puzzles, attempts, success rate, by-tier, by-category)
- Admin Puzzles: list + filter by tier + modal create/edit + delete

### Design
- Modern edu-tech aesthetic per `/app/design_guidelines.json`
- Fonts: Outfit (headings) / IBM Plex Sans (body) / JetBrains Mono (code & tiles)
- Tier color system: blue / violet / amber / red
- All interactive elements have `data-testid` per design guidelines

## Testing Status (iteration_1)
- **Backend**: 20/20 pytest cases pass — covered auth, levels, puzzles, leaderboard, profile, admin CRUD, RBAC.
- **Frontend**: 100% E2E flows verified — landing, register, dashboard, puzzle arena, tier switch, admin login, admin puzzle creation, leaderboard, profile.
- **Issues**: None critical or minor.

## Prioritized Backlog (P1 — next iteration)
- WebSocket-based real-time multiplayer duels (FR-03 SYNC from report)
- Point-betting/staking module for duels (FR-04 LDGR — peer-to-peer)
- Hint system (reveal 1 letter for X points)
- Daily challenge puzzle
- Bulk CSV puzzle import on admin panel
- Per-difficulty time pressure mode

## P2 — Future scope (from report)
- LMS integration via LTI v1.3
- SSO (Google Workspace / SAML 2.0)
- Adaptive difficulty (LLM-powered hint generation)
- Cross-domain puzzle banks (medical, legal vocabulary)
- Containerization + multi-region deployment

## File Map
```
/app/backend/
├── server.py          # all FastAPI routes, JWT, seeding
├── seed_data.py       # 44 CS puzzle list
├── .env               # MONGO_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
└── requirements.txt

/app/frontend/src/
├── App.js
├── index.css          # design system, anagram-tile styles
├── lib/api.js         # axios instance + Bearer interceptor
├── context/AuthContext.jsx
├── components/{NavBar.jsx, RouteGuards.jsx}
└── pages/{Landing, Login, Register, Dashboard, PuzzleArena, Leaderboard, Profile, AdminDashboard, AdminPuzzles}.jsx

/app/memory/
├── PRD.md
└── test_credentials.md

/app/design_guidelines.json
/app/backend/tests/backend_test.py    # regression suite (20 tests)
```

## Next Tasks (when user returns)
1. Review the live app & confirm what to build next from the P1 backlog.
2. If multiplayer is desired, add a small in-memory matchmaking + WebSocket layer (works without Redis for small scale).
