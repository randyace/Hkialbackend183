---
name: hkial-setup-onboarding
description: First-time setup for the HKIAL project — clone the monorepo + sibling repo, init both figma-ui submodules, configure .env for all 3 subprojects, start the 3 dev servers (API on :8000, admin on :5173, customer on :3000), and fix the customer-API port mismatch. Use when user says "set up HKIAL", "clone HKIAL", "init submodules", "why is the customer frontend 404", or any first-time onboarding question.
tags: []
version: 1.0.0
author: Hermes Agent
license: MIT
last-verified: 2026-06-13
applies-to-rounds: 6.0+
metadata:
  hermes:
    tags: [HKIAL, setup, onboarding, monorepo, submodule, .env, dev-server, port-mismatch, Laravel, Vite]
---

# HKIAL Setup & Onboarding

> **When to use**: First time cloning HKIAL, after a fresh `git pull` that broke submodules, when the customer frontend returns 404 / 500 against local API, when a new contributor asks "how do I start?". Read `HKIAL/AGENTS.md` first for the project map.

## 1. The 30-second monorepo audit (run BEFORE anything else)

```bash
# Verify the monorepo shape — these are the EXPECTED outputs
ls -la /Users/sky/Desktop/Projects/backend/.git 2>&1 | head -3      # drwxr-xr-x  (parent has .git)
ls -la /Users/sky/Desktop/Projects/backend/hkial-api/.git 2>&1      # "No such file or directory"
ls -la /Users/sky/Desktop/Projects/backend/hkial-react/.git 2>&1    # "No such file or directory"

# Verify the two sibling repos
ls -la /Users/sky/Desktop/Projects/frontend_react/.git 2>&1         # has its own .git
ls -la /Users/sky/Desktop/Projects/HKIAL/.git 2>&1                 # empty (this folder is a doc hub)
```

If any of the above is wrong, STOP and surface to user.

## 2. Clone + submodule init (the canonical recipe)

```bash
# 1. Backend monorepo (contains hkial-api/ + hkial-react/ as subdirs)
cd ~/Desktop/Projects
git clone <repo-url> backend
cd backend
git submodule update --init --recursive
#   This pulls hkial-react/src/components/figma-ui → randyace/Hkialbackend183

# 2. Customer frontend sibling repo
cd ~/Desktop/Projects
git clone <repo-url> frontend_react
cd frontend_react
git submodule update --init --recursive
#   This pulls frontend/src/components/figma-ui → randyace/Hkialfrontend183

# 3. Verify both submodules are at expected SHAs
cd backend/hkial-react/src/components/figma-ui && git log --oneline -3
cd ../../../../frontend_react/frontend/src/components/figma-ui && git log --oneline -3
#   Both should match a known-good SHA in handoff docs / pointer index
```

## 3. .env setup (3 subprojects, 3 different files)

| Subproject | .env location | Source of truth | Critical vars |
|---|---|---|---|
| API (Laravel) | `backend/hkial-api/.env` | `backend/hkial-api/.env.example` | `DB_*` (Azure dev creds), `APP_URL`, `FRONTEND_URL` |
| Admin (Vite) | `backend/hkial-react/.env` | (copy from `.env.example` if missing) | `VITE_API_BASE_URL=http://localhost:8000/api` |
| Customer (Vite) | `frontend_react/frontend/.env` | `frontend_react/frontend/.env.example` | `VITE_API_BASE_URL` ⚠ see §5 |

```bash
# API .env (if missing, copy example)
cd backend/hkial-api
[ -f .env ] || cp .env.example .env
php artisan key:generate
# DB_* vars default to the shared Azure dev DB — see HKIAL/AGENTS.md §7 for creds
```

## 4. Start the 3 dev servers

Use 3 separate terminals (or `concurrently` / `tmux`):

```bash
# Terminal 1 — Laravel API on :8000
cd backend/hkial-api
php artisan serve --port=8000
# Expected: "Server running on [http://127.0.0.1:8000]"

# Terminal 2 — Admin SPA on :5173
cd backend/hkial-react
npm install   # only on first run
npm run dev
# Expected: "Local: http://localhost:5173/"

# Terminal 3 — Customer SPA on :3000
cd frontend_react/frontend
npm install   # only on first run
npm run dev
# Expected: "Local: http://localhost:3000/"
```

## 5. The customer ↔ API port mismatch (most common onboarding failure)

**Symptom**: Customer frontend (`http://localhost:3000`) loads, but every API call returns **404** or **CORS error**.

**Root cause**:
- `frontend_react/frontend/.env.example` defaults `VITE_API_BASE_URL=http://localhost:3001/api`
- But `backend/hkial-api/.env` runs Laravel on `:8000` (per `APP_URL`)

**Fix** (run before starting the customer dev server):
```bash
cd frontend_react/frontend
# Either edit .env directly:
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
# Or override at npm run time:
VITE_API_BASE_URL=http://localhost:8000/api npm run dev
```

After this, verify the customer frontend can reach the API:
```bash
curl -sX POST "http://localhost:8000/api/auth/member/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sky@acestudio.hk","password":"12345678"}' | head -200
# Expected: JSON with `requires_otp: true` (no `user` field)
```

## 6. Verify the 3 end-to-end smoke checks

```bash
# 1. API health (no auth)
curl -s "http://localhost:8000/api/bookable-items" | jq '.data | length'
# Expected: integer (number of bookable items in DB)

# 2. Admin frontend loads
curl -sI "http://localhost:5173/" | head -1
# Expected: "HTTP/1.1 200 OK"

# 3. Customer frontend loads
curl -sI "http://localhost:3000/" | head -1
# Expected: "HTTP/1.1 200 OK"

# 4. (Optional) Run the 7-second no-browser smoke test
cd backend/hkial-api && python3 tests/smoke_test_runner.py
# Expected: "26 passed | 0 failed | 0 warnings | ~7s"
```

## 7. Common onboarding pitfalls (verify FIRST when something breaks)

| Symptom | First check | Fix |
|---|---|---|
| Customer returns 404 on every API call | `cat frontend_react/frontend/.env` | Set `VITE_API_BASE_URL=http://localhost:8000/api` (see §5) |
| Admin returns 404 on `/api/auth/login` | `cat backend/hkial-react/.env` | Set `VITE_API_BASE_URL=http://localhost:8000/api` |
| `git status` shows `modified: hkial-react/src/components/figma-ui (modified content)` | Someone patched figma-ui without committing | `cd backend/hkial-react/src/components/figma-ui && git status` to see the working-tree state, then follow INV-X1 (no commit from opencode) |
| `php artisan migrate` says "no such database" | `cat backend/hkial-api/.env | grep DB_` | Verify `DB_HOST=aawemflexmysqltest.mysql.database.azure.com` and you're on VPN / have network access |
| Customer login returns 401 | Try with Azure dev creds, not local seeder | `sky@acestudio.hk / y&447aWd7dvWbEMw` (not `12345678`) — see HKIAL/AGENTS.md §7 |
| `npm run dev` says "port 3000 already in use" | `lsof -i :3000` | Kill the stale process, or pick another port (`npm run dev -- --port 3001`) |
| Backend `migrate:fresh` accidentally wipes the dev DB | STOP IMMEDIATELY | The shared dev DB has other developers' data. Use `migrate:rollback --step=N` instead (INV-X2) |

## 8. When you discover a figma-ui submodule is "modified" (working-tree WIP)

This is the most common state after a multi-session workflow. Per INV-X1 (updated 2026-06-14), minimal figma-ui edits are allowed (working-tree only). Do NOT `git add` / `commit` / `push` inside the submodule, and do NOT bump the parent repo's submodule pointer.

```bash
# From monorepo root, the parent git status is INCOMPLETE for submodules
cd backend && git status --short hkial-react/src/components/figma-ui/src/app/components/<Name>.tsx
# 0 lines = looks clean. LIES.

# cd INTO the submodule to see the real state
cd hkial-react/src/components/figma-ui
git status --short src/app/components/<Name>.tsx
# If this shows M/MM/AM, there are uncommitted working-tree hunks.

# Read the existing pending changes BEFORE patching
git diff src/app/components/<Name>.tsx | head -50
# If they're yours → continue.
# If they're Randy's regen / another session's WIP → STOP and surface to user.
```

Full protocol: see `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` defensive pattern #5.

## 9. When `git pull` breaks submodules

After `git pull` on the parent repo, the submodule pointer may have moved. The working tree may now be in a detached HEAD at the OLD SHA:

```bash
cd backend/hkial-react/src/components/figma-ui
git status
# HEAD detached at <OLD-SHA>
git fetch origin
git checkout main   # or whatever branch figma-ui tracks
git pull
cd ../../../../ && git add hkial-react/src/components/figma-ui
```

If `git pull` conflicts with your local working-tree WIP, the conflict resolution is to commit your WIP to a feature branch in the submodule FIRST (per INV-X1, you can't from opencode, so user handles).

## 10. Related skills / cross-references

- `HKIAL/AGENTS.md` §1 (project map) + §7 (env/creds) — read first
- `HKIAL/skills/hkial-azure-deploy/` — production deploy (vs the local setup in this skill)
- `HKIAL/skills/hkial-pre-commit-gate/` — the next step after you have a working local stack
- `~/.hermes/skills/hkial-e2e-login-auth/SKILL.md` — for verifying login works (admin + member)
- `backend/hkial-api/tests/smoke_test_runner.py` — the 7-second no-browser smoke test
- `frontend_react/USEFUL_CMD.txt` — Azure buildx + push (deploy, not local)
