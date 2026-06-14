---
name: hkial-azure-deploy
description: Full 3-app coordinated deploy of HKIAL to Azure — build customer (frontend_react), admin (backend/hkial-react), and API (backend/hkial-api) as linux/amd64 docker images on Mac M4, push to ACR `viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io`, and document the restart step for Sky (agent does NOT push to Azure). Covers the correct Dockerfile paths, buildx flags, tag/push pattern, and the deploy order that minimises customer-visible downtime. Use when the user says "deploy", "push to Azure", "build and ship", "production", "release".
tags: []
version: 1.0.0
author: Hermes Agent
license: MIT
last-verified: 2026-06-13
applies-to-rounds: 6.0+
metadata:
  hermes:
    tags: [HKIAL, deploy, Azure, ACR, docker, buildx, linux-amd64, Mac-M4, cross-compile, customer-admin-api, 3-apps, handoff]
---

# HKIAL Azure Deploy (3-App Coordinated)

> **When to use**: User says "deploy", "push to Azure", "build and ship", "release", or commits have piled up and need to land. Agent's role: build, write handoff doc, hand off. **Sky does the actual push + Azure restart.** Cross-references: HKIAL/AGENTS.md §5 (deploy overview), `frontend_react/USEFUL_CMD.txt` (the canonical commands).
>
> **Critical rule**: Agent NEVER pushes to ACR or restarts Azure Container Instances. The agent commits + writes handoff doc + tells Sky. Sky runs the push + restart.

## 1. The 30-second pre-deploy audit (run BEFORE building)

```bash
# 1. Verify the monorepo is clean (or know what you're about to commit)
cd ~/Desktop/Projects/backend && git status --short
cd ~/Desktop/Projects/frontend_react && git status --short

# 2. Verify figma-ui submodule state (INV-X1: agent patches working tree, no commits inside)
cd ~/Desktop/Projects/backend/hkial-react/src/components/figma-ui && git status --short
cd ../../../../../
cd ~/Desktop/Projects/frontend_react/frontend/src/components/figma-ui && git status --short
# If anything shows M/MM/AM, surface in the handoff doc as the agent's working-tree patch.
# Per INV-X1 (updated 2026-06-14): patches are OK, but NEVER git add/commit/push inside the submodule,
# and NEVER bump the parent repo's submodule pointer.

# 3. Verify Azure ACR is reachable
az acr login --name viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io
# Expected: "Login Succeeded"

# 4. Verify the 3 apps are currently up
curl -sI "https://viplonlinebookingfrontenddev-cpbabsb5fnb4hhgq.eastasia-01.azurewebsites.net/" | head -1
curl -sI "https://viplonlinebookingbackenddev-djdnd5bycmccbacq.eastasia-01.azurewebsites.net/" | head -1
curl -sI "https://viplonlinebookingapidev-cfcwbeewgqamb3fc.eastasia-01.azurewebsites.net/api/bookable-items" | head -1
# All expected: HTTP/1.1 200 OK
```

## 2. The 3 apps + 3 ACR image names

| App | Subproject | Dockerfile | Image name | ACR repo |
|---|---|---|---|---|
| Customer SPA | `frontend_react/frontend/` | `frontend_react/frontend/Dockerfile` | `hkial-frontend:latest` | `viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-frontend:latest` |
| Admin SPA | `backend/hkial-react/` | `backend/hkial-react/Dockerfile` | `hkial-react:latest` | `viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-react:latest` |
| Laravel API | `backend/hkial-api/` | `backend/hkial-api/Dockerfile` | `hkial-api:latest` | `viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-api:latest` |

**All 3 must be built for `linux/amd64`** (Azure is x86_64; Mac M4 is arm64 — cross-compile required).

## 3. The deploy order (minimises customer-visible downtime)

| Order | App | Why this order |
|---|---|---|
| 1 | **Customer** (frontend_react) | Customer-facing. Build first so the static bundle is ready. |
| 2 | **Admin** (backend/hkial-react) | Admin-facing. Build second. |
| 3 | **API** (backend/hkial-api) last | If API breaks, both frontends break. Build last so the new API code is fresh when the frontends try to call it. |

Sky usually pushes + restarts in this order. Agent's job is to build all 3 and hand off.

## 4. The canonical build + push commands

### Customer frontend

```bash
cd ~/Desktop/Projects/frontend_react

# 1. Build the Vite bundle (this is what the Docker image serves)
npm --prefix frontend run build

# 2. Build the docker image for linux/amd64
docker buildx build --platform linux/amd64 -t hkial-frontend:latest -f frontend/Dockerfile .

# 3. Tag for Azure ACR
docker tag hkial-frontend:latest viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-frontend:latest

# 4. Push (USER RUNS THIS, NOT AGENT)
# docker push viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-frontend:latest
```

### Admin frontend

```bash
cd ~/Desktop/Projects/backend

docker buildx build --platform linux/amd64 -t hkial-react:latest -f hkial-react/Dockerfile .
docker tag hkial-react:latest viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-react:latest
# docker push viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-react:latest   # USER
```

### API

```bash
cd ~/Desktop/Projects/backend

docker buildx build --platform linux/amd64 -t hkial-api:latest -f hkial-api/Dockerfile .
docker tag hkial-api:latest viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-api:latest
# docker push viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-api:latest   # USER
```

## 5. The handoff doc (agent writes this; Sky reads it)

Write to `HKIAL/handoff/<date>-deploy.md` (or subproject's `docs/handoff/`):

```markdown
# Deploy handoff — <date>

## What's in this build
- [ ] Customer: <1-line summary of changes>
- [ ] Admin: <1-line summary>
- [ ] API: <1-line summary>

## Pre-deploy checks
- [ ] Monorepo clean: `git status --short` (frontend_react + backend)
- [ ] figma-ui submodule: working-tree WIP (if any) is documented in the handoff doc (per INV-X1, agent does NOT commit / push inside; Sky syncs)
- [ ] Local 7s smoke test: green
- [ ] All 3 apps responding: 200 OK

## Build commands run
```bash
# Customer
docker buildx build --platform linux/amd64 -t hkial-frontend:latest -f frontend/Dockerfile .

# Admin
docker buildx build --platform linux/amd64 -t hkial-react:latest -f hkial-react/Dockerfile .

# API
docker buildx build --platform linux/amd64 -t hkial-api:latest -f hkial-api/Dockerfile .
```

## Push commands (USER RUNS)
```bash
docker push viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-frontend:latest
docker push viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-react:latest
docker push viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io/hkial-api:latest
```

## Restart steps (USER RUNS)
- Customer: Container Instance `hkial-frontend` → restart
- Admin: Container Instance `hkial-react` → restart
- API: Container Instance `hkial-api` → restart (do this LAST to avoid CORS/404 between the pushes)

## Verification after deploy
```bash
# Bundle-grep the new index hash
URL="https://viplonlinebookingfrontenddev-cpbabsb5fnb4hhgq.eastasia-01.azurewebsites.net"
INDEX=$(curl -sL "$URL" | grep -oE 'index-[A-Za-z0-9_-]+\.js')
curl -sL "$URL/assets/$INDEX" -o /tmp/bundle.js
grep -c "YOUR_FIX_MARKER" /tmp/bundle.js   # expected: 1+
```

## Rollback
If the deploy breaks, Azure Container Instances retains the previous image. Restart with the previous SHA or push the previous git SHA's build.
```

## 6. Common deploy failures + first checks

| Failure | First check | Fix |
|---|---|---|
| `docker buildx build` fails with "exec format error" | Forgot `--platform linux/amd64` flag | Re-run with the flag |
| `docker buildx build` slow (>5min) | BuildKit cache cold | First build is slow; subsequent builds use cache. Pre-warm with a small `docker pull` to populate the base image cache. |
| `docker push` rejected with "unauthorized" | ACR token expired | `az acr login --name viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io` |
| Customer bundle has stale code after restart | Browser cache | Hard refresh (Cmd+Shift+R) or check the bundle hash matches the new build |
| API returns 500 after deploy | DB migration needed | Run `php artisan migrate` (NOT `migrate:fresh --seed`, see INV-X2) |
| Both frontends return CORS errors after API deploy | API not restarted yet | Restart API container last; wait 30s; re-curl |
| `index.html` references an old bundle hash | Stale build artifact | Check `npm run build` actually wrote the new files before docker build |
| `index-*.js` returns 404 | Image pushed but container not restarted | Restart the container instance (Sky does this) |

## 7. The 3 things the agent does NOT do (per INV-X7 + Sky's inviolable workflow)

1. **Does NOT `docker push` to ACR.** Sky does this.
2. **Does NOT restart Azure Container Instances / App Services.** Sky does this.
3. **Does NOT `migrate:fresh --seed` on the shared dev DB.** INV-X2.

The agent's deliverable is: built images (3 of them) + handoff doc. That's it.

## 8. When the user says "just push it" or "ship it" (time-pressure mode)

Per INV-X7, "we have to fix this by this morning, please help" = time-pressure mode. In this mode:
- Skip the pre-deploy audit's verbose checks (still run the curl 200 OK)
- Still write the handoff doc (1-paragraph is fine)
- Still don't push to ACR yourself
- If Sky says "you push" — that's an explicit override; do it

## 9. When the deploy is "just one frontend" (the common case)

If the change is only in the customer frontend (e.g. a pure UI fix):
- Build only customer
- Skip admin + API
- Handoff doc is 1 section, not 3

If the change is only in the API:
- Build only API
- Restart API last (so the frontends don't CORS-error during the push)
- Handoff doc is 1 section, mention "no frontend changes"

If the change touches BOTH a frontend and the API:
- Build all 3 (the API code may need to match the frontend's expectations)
- Restart in the order: customer → admin → API
- Handoff doc is 3 sections

## 10. Related skills / cross-references

- `HKIAL/AGENTS.md` §5 (deploy overview) + §7 (Azure env)
- `HKIAL/skills/hkial-handoff-discipline/` — the handoff doc template
- `HKIAL/skills/hkial-pre-commit-gate/` — run before building
- `frontend_react/USEFUL_CMD.txt` — the canonical commands
- `frontend_react/frontend/Dockerfile` + `backend/hkial-react/Dockerfile` + `backend/hkial-api/Dockerfile` — the actual Dockerfiles
- `backend/hkial-api/tests/smoke_test_runner.py` — 7s smoke test (use before deploying API changes)
- `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` §class #6 (bundle-grep for deploy verification)
