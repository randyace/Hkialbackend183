# AGENTS.md — HKIAL Project Umbrella

> **Scope**: Cross-project coordinator for the HKIAL system. Points to the 3 subproject-specific AGENTS.md files and consolidates only the cross-project facts (architecture, shared invariants, monorepo coordination, deploy). Per-subproject details live in the subproject files — read those first for actual coding work.
>
> **Auto-load**: This file is auto-loaded by any opencode session that opens `~/Desktop/Projects/HKIAL/` as workspace. Subproject-specific AGENTS.md are auto-loaded by sessions opened at the subproject level.

---

## 1. Project Map (1 monorepo + 1 sibling + 2 submodules + 1 hub)

```
~/Desktop/Projects/
├── backend/                          ← MONOREPO (single .git/ at root)
│   ├── hkial-api/                    Laravel 13 API (PHP 8.3, MySQL Azure dev DB)
│   │   ├── app/Http/Controllers/Api/ 22 controllers
│   │   ├── tests/Feature/            47 PHPUnit feature tests
│   │   ├── tests/smoke_test_runner.py 7s no-browser smoke test
│   │   └── api_endpoints.md
│   ├── hkial-react/                  Admin SPA (React 19 + Vite, port 5173)
│   │   ├── src/components/*.tsx      Smart containers
│   │   ├── src/components/figma-ui/  Submodule → randyace/Hkialbackend183
│   │   ├── tests/e2e/                79 Playwright e2e specs
│   │   └── docs/handoff/             + docs/pending-changes/ (2026-06-11)
│   ├── docs/                         backend's own process/architecture/invariants
│   ├── AGENTS.md                     Generic CLAUDE-style behavioral guidelines
│   ├── .opencode/agent/hermes.md     Primary opencode agent (10 design invariants)
│   └── opencode.json                 `hkial-react/.../figma-ui/**: deny` permission
│
├── frontend_react/                   ← SIBLING REPO (separate .git/)
│   └── frontend/                     Customer SPA (React 19 + Vite, port 3000)
│       ├── src/containers/           Smart containers (real API)
│       ├── src/components/figma-ui/  Submodule → randyace/Hkialfrontend183
│       ├── src/components/*.tsx      Wrapper pages (no container; AuthPage, EditBooking)
│       ├── src/services/api.ts       1045 lines, fetch-based, 2-envelope unwrap
│       ├── AGENTS.md                 212-line umbrella (10 sections)
│       ├── DEVELOPMENT_GUIDE.md      23k long-form guide
│       ├── FIGMA_UI_BOUNDARY.md      figma-ui isolation rules
│       ├── BOOKING_VIEW_INVENTORY.md Phase-1 inventory
│       ├── PROJECT_SUMMARY.md        73k system overview
│       └── docs/handoff/             Customer-side handoff docs
│
└── HKIAL/                            ← THIS FOLDER (cross-project hub)
    ├── AGENTS.md                     ← You are here
    ├── README.md                     Quick orientation
    ├── skills/                       6 project-local skills (Setup→Handoff)
    ├── .hermes/                      Project-local Hermes state (MEMORY, config)
    └── references/                   Cross-project deep dives (pointer index)
```

**Critical facts** (verifiable with the 30-second monorepo check):
- `hkial-api/` and `hkial-react/` are subdirs of ONE monorepo at `backend/` with ONE `.git/` at the parent. Not separate repos. Cross-product commits normal — one commit on `dev` can touch `hkial-api/app/...` and `hkial-react/src/...` simultaneously.
- Two figma-ui submodules point to DIFFERENT upstream repos: `Hkialfrontend183` (customer) vs `Hkialbackend183` (admin). Both authored by Randy, both pulled from his GitHub.
- All work on `dev` branch across all repos.

**30-second monorepo audit** (run BEFORE any `cd` / `git add`):
```bash
ls -la /Users/sky/Desktop/Projects/backend/.git 2>&1 | head -3      # should show drwxr-xr-x
ls -la /Users/sky/Desktop/Projects/backend/hkial-api/.git 2>&1      # "No such file"
ls -la /Users/sky/Desktop/Projects/backend/hkial-react/.git 2>&1    # "No such file"
```

---

## 2. Where to read first (per-task routing)

| Task type | First file to open |
|---|---|
| Customer frontend (`frontend_react/`) | `frontend_react/AGENTS.md` → `frontend_react/frontend/AGENTS.md` |
| Customer NewBooking / EditBooking flow | `frontend_react/frontend/DEVELOPMENT_GUIDE.md` + `BOOKING_VIEW_INVENTORY.md` |
| Admin frontend (`backend/hkial-react/`) | `backend/.opencode/agent/hermes.md` → `backend/AGENTS.md` |
| Admin CreateBooking / EditBooking | `backend/hkial-react/docs/handoff/` (most recent) + `pending-changes/` (in-flight) |
| Laravel API (`backend/hkial-api/`) | `backend/AGENTS.md` + `backend/hkial-api/api_endpoints.md` |
| Cross-project (deploy, monorepo, both frontends) | **THIS FILE** |
| Bug → unknown class | `HKIAL/skills/hkial-frontend-disambiguation/` + `~/.hermes/skills/hkial-frontend-bug-debug-checklist/` |
| HKIAL-specific Hermes skills | `HKIAL/skills/` (6 project-local) + `~/.hermes/skills/software-development/hkial*/` (12 global) |

---

## 3. Cross-Project Invariants (apply EVERYWHERE)

These are non-negotiable across all 3 subprojects. Per-subproject AGENTS.md may add more.

**INV-X1 — figma-ui submodule policy** (Sky, updated 2026-06-14). Applies to BOTH `backend/hkial-react/src/components/figma-ui/` and `frontend_react/frontend/src/components/figma-ui/`.
- ✅ **Minimal figma-ui edits are allowed**. The agent may patch the figma-ui working tree directly. Keep changes surgical: prefer the smallest possible diff (label map, prop default, local state derivation, prop type widening). Avoid structural rewrites, new files, new dependencies.
- ❌ **Don't break the figma Make import**. The figma code base (`Hkialfrontend242copy-main` / `Hkialbackend183`) that Sky copies the figma-ui files into must keep working. Don't add imports / dependencies that figma Make's export can't supply. Don't use figma-ui-specific cross-tree aliases in a way that breaks copy-paste.
- ❌ **Don't touch the submodule git**. Never `git add` / `commit` / `push` INSIDE the submodule. Never bump the parent repo's submodule pointer (`git add src/components/figma-ui`). Sky handles the entire sync.
- ✅ Deliver `cd src/components/figma-ui && git diff` of the change for Sky.
- **Default decision rule**: prefer to fix in the parent wrapper when the wrapper can absorb the change (avoids touching figma-ui at all). Patch figma-ui only when (a) the surface is in figma-ui and the wrapper has no equivalent, OR (b) fixing in the wrapper would leak figma-internals into the parent.

**INV-X2 — NEVER `migrate:fresh --seed` against the shared dev DB** (`aawemflexmysqltest.mysql.database.azure.com`). Pre-flight `cat hkial-api/.env | grep DB_HOST` before any `migrate:` command. Use `migrate:fresh` (no seed) or `migrate:rollback --step=N` if cleanup is needed.

**INV-X3 — Auth is dual** (two SEPARATE systems, do not mix):
- **Staff (admin)**: `auth:sanctum` + RBAC permissions. Login: `POST /api/auth/login` (admin@hkial.com / password123). Token in `localStorage.auth_token`.
- **Member (customer)**: custom `auth.api` middleware (bearer token → SHA256 → personal_access_tokens). Login: `POST /api/auth/member/login` → returns `{ requires_otp: true }` (no `user` field) → `POST /api/auth/member/verify-otp` → returns `{ user, token }`. Token in `localStorage.hkial_auth_token`. OTP bypass `888888`.
- Calling `/api/auth/login` for member login = 401. Calling `/api/auth/member/login` for staff login = wrong endpoint. See `~/.hermes/skills/hkial-e2e-login-auth` for canonical patterns.

**INV-X4 — Token read on EVERY API call** (no module-level cache). `Sanctum::actingAs` does NOT work for member auth in tests; use `personal_access_tokens` insert pattern.

**INV-X5 — Response unwrap difference**:
- Admin (axios): `response.data` IS the API envelope → `response.data.data` is the resource (1 unwrap).
- Customer (fetch): wrapper returns `{ data: envelope }` → `res.data.data` is the resource (2 unwrap; `res.data` is the envelope, `res.data.data` is the resource). For Laravel local 2-level vs Azure 1-level variance, use `response.data.data ?? response.data`.

**INV-X6 — One fix per commit**. When audit surfaces multiple candidate root causes, commit first fix, re-test, then commit the next. Keeps `git bisect` viable and the diff reviewable. Surgical change rule: every changed line traces to the user's request.

**INV-X7 — Sky is terse Cantonese. Workflow cadence: 1-2 tool calls per turn, NO bulk recon across multiple tools** (terminal + search_files + read_file in one turn is the anti-pattern that gets BLOCKED). "I am so tired" / "production ready" / "skip X" / "N min left" / "let's continue" / "are you stuck" = STOP-AND-SWITCH (see `~/.hermes/skills/hkial-debugging-stuck-loop`). Empty multi-choice timeout = defer-with-marker (write handoff doc, don't auto-build). Terse multi-choice ("1c", "option B", "2a") = user has decided, execute, no re-confirm.

**INV-X8 — "X 唔喺 total" debugging starts at the FRONTEND PAYLOAD, not the backend**. Capture the actual POST body (`page.on('request', ...)` in Playwright or `request.body` in PHPUnit) and compare against backend contract. If shapes differ, fix the serializer (Path A), don't grow backend tolerance (Path B).

**INV-X9 — For UI bugs, a real browser render is mandatory** (Playwright with `page.on('pageerror')` + `page.on('console')` listeners). An API POST→DB→GET round-trip is a **contract test**, not e2e. The React component may crash on first render (null-deref, `as unknown as Record` cast with null source) and the page goes blank while the API is 100% correct — only a real browser DOM check catches this.

**INV-X10 — 7-layer pre-flight for any new field**:
```
[ ] 1. Form onSubmit: includes the field
[ ] 2. Container destructure: includes the field
[ ] 3. Container spread to api.ts: includes the field
[ ] 4. api.ts create/update: writes the field
[ ] 5. Backend validator: accepts the field
[ ] 6. Backend controller store/update: persists the field
[ ] 7. NORMALIZER layer (if list page has one) — return type includes the field
[ ] 7b. FIGMA-UI UI owner (class #10) — if JSX is in figma-ui, patch figma-ui only
```

---

## 4. Common Dev Commands (cross-project)

```bash
# Backend (from hkial-api/)
php artisan test                            # PHPUnit (SQLite :memory:)
python3 tests/smoke_test_runner.py          # 7s smoke test, no browser (API + DB + Frontend HTTP)
composer test                               # alias for php artisan test

# Admin (from hkial-react/)
npm run dev                                 # Vite on :5173
npx vitest run                              # Unit tests
npx playwright test                         # E2E tests
npx playwright test --project=chromium-azure  # against deployed bundle
npx tsc --noEmit                            # Type check
npm run lint                                # ESLint

# Customer (from frontend_react/frontend/)
npm run dev                                 # Vite on :3000
npm run dev:all                             # Vite + json-server mock on :3002
npm run build                               # Vite production build
npx tsc --noEmit                            # Type check
npm test                                    # Vitest

# Monorepo coordination (from backend/)
git status                                  # Single status shows BOTH hkial-api/ + hkial-react/
git log --oneline -10                       # Interleaved backend+frontend commits on same dev branch
git diff-tree --no-commit-id --name-only -r <SHA>  # Verify a SHA's actual files before reset/revert
```

---

## 5. Deploy to Azure (3 apps coordinated)

Customer + Admin + API each have their own Azure App Service / Container Instance. Full recipe in `HKIAL/skills/hkial-azure-deploy/SKILL.md`. The short version:

```bash
# 1. Build + push customer frontend
cd ~/Desktop/Projects/frontend_react
npm --prefix frontend run build
docker buildx build --platform linux/amd64 -t hkial-frontend:latest -f frontend/Dockerfile .
docker tag hkial-frontend:latest viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-frontend:latest
docker push viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-frontend:latest

# 2. Build + push admin
cd ~/Desktop/Projects/backend
docker buildx build --platform linux/amd64 -t hkial-react:latest -f hkial-react/Dockerfile .
docker tag hkial-react:latest viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-react:latest
docker push ...

# 3. Build + push API
cd ~/Desktop/Projects/backend
docker buildx build --platform linux/amd64 -t hkial-api:latest -f hkial-api/Dockerfile .
docker tag hkial-api:latest viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-api:latest
docker push ...

# 4. Restart Azure Container Instances / App Services (USER DOES THIS, not agent)
```

**Sky does the actual push + Azure restart. Agent commits + writes handoff doc.**

---

## 6. Project-local Skills (auto-load via `HKIAL/.hermes/config.yaml`)

| Stage | Skill | What it covers |
|---|---|---|
| Setup | `hkial-setup-onboarding` | Clone + submodule init + .env + local dev (3000/5173/8000) + port mismatch fix |
| Develop | `hkial-container-view-pattern` | Container/View canonical pattern (customer + admin) + MOCK_* + inverse sub-pattern |
| Test | `hkial-pre-commit-gate` | 4-phase pre-commit gate (lint, sample, full, runtime) per subproject |
| Debug | `hkial-frontend-disambiguation` | 30-sec recipe: which frontend is the user reporting on? Bundle-grep discriminator |
| Deploy | `hkial-azure-deploy` | 3-app Azure docker buildx + push + restart + port mapping |
| Handoff | `hkial-handoff-discipline` | `docs/handoff/<date>-<task>.md` template + 3 subproject locations |

**Plus 12 existing global Hermes skills** (load from `~/.hermes/skills/software-development/hkial*/`):
- `hkial` (umbrella, v1.9.0) — auto-loads the 3 below
- `hkial-customer-frontend-figma-codebase-sync` (v1.24.0) — figma-ui sync playbook
- `hkial-frontend-bug-debug-checklist` — 12 bug classes + 4 defensive patterns + 7-layer pre-flight
- `hkial-e2e-login-auth` — 3 auth strategies (API-then-inject, UI-form-fill, storageState)
- `hkial-frontend-e2e-selector-pattern` — Playwright selectors for figma-ui
- `hkial-debugging-stuck-loop` — recovery protocol
- `hkial-label-rename-audit-cookbook` (v1.2.0) — 3 label classes (strict-compare, mapper-default, UI-relabel)
- `hkial-booking-view-contract-pilot` — booking view contract pilot
- `contract-test-first-workflow` — 12 cross-layer anti-patterns
- `test-design-matrix` — pre-test case design
- `simplify-code` — 3-agent parallel review
- `subagent-parallel-stream-isolation` — multi-session working-tree isolation

---

## 7. Common Env / Credentials

| Env | Value |
|---|---|
| Customer local | `http://localhost:3000` (Vite dev) |
| Admin local | `http://localhost:5173` (Vite dev) |
| API local | `http://localhost:8000` (per `hkial-api/.env` `APP_URL`) |
| Customer dev Azure | `https://viplonlinebookingfrontenddev-cpbabsb5fnb4hhgq.eastasia-01.azurewebsites.net` |
| Admin dev Azure | `https://viplonlinebookingbackenddev-djdnd5bycmccbacq.eastasia-01.azurewebsites.net` |
| API dev Azure | `https://viplonlinebookingapidev-cfcwbeewgqamb3fc.eastasia-01.azurewebsites.net/api` |
| Azure dev DB | `aawemflexmysqltest.mysql.database.azure.com:3306` / `vipl_booking_system_testing` |
| Azure dev DB cred | `vipl_booking_admin / y&447aWd7dvWbEMw` (per `.env`) |
| Sky Azure dev cred | `sky@acestudio.hk / y&447aWd7dvWbEMw` (OTP 888888) |
| Admin dev cred | `admin@hkial.com / password123` |
| Member (local seeder) | `sky@acestudio.hk / 12345678` + OTP 888888 |
| ACR | `viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io` |

**Port-mismatch warning**: Customer `frontend/.env.example` defaults `VITE_API_BASE_URL=http://localhost:3001/api`, but `backend/hkial-api/.env` runs API on `8000`. If running customer against local API, override to `http://localhost:8000/api`.

---

## 8. When in doubt, ask first

- **2+ plausible interpretations with very different scope** → write a `docs/pending-changes/<date>-<topic>-plan.md` doc with 2-3 design options + recommended pick, surface "pick A/B/C", do NOT commit code (the "feature-gap defer" pattern).
- **Backend rule conflicts with a pinned unit test (K-class design intent)** → surface rule conflict with 4-question structure, do NOT silently break the test.
- **Cross-product commit on same `dev` branch** → confirm monorepo discovery first, don't flag SHA collisions as "commits in wrong repo" before `git diff-tree --no-commit-id --name-only -r <SHA>`.
- **Empty multi-choice timeout** → defer-with-marker (5-min handoff doc), don't auto-build.
- **"fix it as your best"** → broader decision authority on the Qs just asked, but trust is in judgment given a CLEAR AUDIT, not in skipping the audit. SELF-CRITIQUE first — enumerate 3-5 trade-offs / known-shortcut / silent-regression risks.

---

## 9. Detailed docs to read on demand

| Doc | What it covers |
|---|---|
| **[`spec.md`](./spec.md)** ⭐ | **Cross-project canonical spec v2.0.0** — system overview, INV-X1..X10, INV-1..13, 12 bug classes, 12 anti-patterns, API contract, dual-auth spec, booking + pricing domain, figma-ui policy, test strategy, pre-commit gate, handoff discipline, **live open bugs scoreboard (§14)**, **API-first dev order (§15)**, **anti-rott protocol (§16)**. **READ THIS FIRST.** |
| `frontend_react/AGENTS.md` | Customer frontend umbrella (10 sections: project map, container/view, file-split trap, figma-ui policy, bug class quick-ref, working style, debugging recovery, commands, docs index, ask-first) |
| `frontend_react/frontend/AGENTS.md` | Customer project-specific (Container/View, API, Docker deploy) |
| `frontend_react/frontend/DEVELOPMENT_GUIDE.md` | Long-form Container/View guide + NewBooking flow + field name mapping (camelCase → snake_case) |
| `frontend_react/frontend/FIGMA_UI_BOUNDARY.md` | figma-ui isolation boundary + sync workflow + known limitations |
| `frontend_react/frontend/BOOKING_VIEW_INVENTORY.md` | Per-booking-view ground-truth inventory |
| `frontend_react/frontend/PROJECT_SUMMARY.md` | Full system architecture (73k, the most complete overview) |
| `backend/AGENTS.md` | Generic CLAUDE-style behavioral guidelines (think before code, simplicity, surgical, goal-driven) |
| `backend/.opencode/agent/hermes.md` | Primary opencode agent (3-repo map, 10 design invariants INV-1..INV-13, container/view, contract-test-first, common pitfalls) |
| `backend/hkial-api/api_endpoints.md` | All `/api/...` routes (auth, accounts, bookings, bookable-items, promo-codes, suites, applications, travel-agencies...) |
| `backend/hkial-api/ADD_BOOKING_GUIDE.md` | How to add a new booking flow (PDF supplement) |
| `backend/hkial-api/PROBLEM.md` | Outstanding backend problems |
| `backend/hkial-react/docs/handoff/` | Admin-side handoff docs (chronological TL;DR) |
| `backend/hkial-react/docs/pending-changes/` | Pending design Q&A + multi-phase plans (defer-with-marker target) |
| `HKIAL/skills/hkial-*/SKILL.md` | Project-local skills (6 SDLC skills) |
| `HKIAL/references/pointer-index.md` | Cross-project deep-dive pointer index |
| `~/.hermes/skills/software-development/hkial/SKILL.md` | HKIAL umbrella skill (v1.9.0) |
| `~/.hermes/skills/software-development/hkial-*/SKILL.md` | 11 other HKIAL-specific skills |
| `~/.hermes/memories/MEMORY.md` | Hermes global memory (HKIAL context, user style, sandbox pitfalls) |
