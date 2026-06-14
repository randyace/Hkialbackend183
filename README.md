# HKIAL — Project Hub

> **Cross-project coordinator for the HKIA VIP Lounge membership system.**
> This folder is a **documentation + skills hub** — it points to the 3 subproject-specific locations and consolidates only the cross-project facts. Per-subproject details live in the subproject files.

## Quick orientation

| If you want to... | Read first |
|---|---|
| **Read the canonical spec (invariants, contracts, dev order, anti-rott)** | **[`spec.md`](./spec.md) v2.0.0** ⭐ |
| Understand the project shape | [`AGENTS.md`](./AGENTS.md) §1 (project map) |
| Find the right AGENTS.md for your task | [`AGENTS.md`](./AGENTS.md) §2 (per-task routing) |
| Set up a fresh clone | [`skills/hkial-setup-onboarding/`](./skills/hkial-setup-onboarding/SKILL.md) |
| Add a new page or field (Container/View) | [`skills/hkial-container-view-pattern/`](./skills/hkial-container-view-pattern/SKILL.md) |
| Run the 4-phase pre-commit gate | [`skills/hkial-pre-commit-gate/`](./skills/hkial-pre-commit-gate/SKILL.md) |
| Figure out which frontend the user is on | [`skills/hkial-frontend-disambiguation/`](./skills/hkial-frontend-disambiguation/SKILL.md) |
| Deploy to Azure | [`skills/hkial-azure-deploy/`](./skills/hkial-azure-deploy/SKILL.md) |
| Write a session handoff doc | [`skills/hkial-handoff-discipline/`](./skills/hkial-handoff-discipline/SKILL.md) |
| Look up a specific round / deep dive | [`references/pointer-index.md`](./references/pointer-index.md) |

## Folder structure

```
HKIAL/
├── AGENTS.md                      # Thin umbrella, ~250 lines, cross-project only
├── README.md                      # This file (quick orientation)
├── .hermes/                       # Project-local Hermes state
│   ├── MEMORY.md                  # HKIAL-specific facts
│   └── config.yaml                # Skill auto-load config
├── skills/                        # 6 project-local skills (SDLC: Setup → Handoff)
│   ├── README.md                  # Skills index
│   ├── hkial-setup-onboarding/
│   ├── hkial-container-view-pattern/
│   ├── hkial-pre-commit-gate/
│   ├── hkial-frontend-disambiguation/
│   ├── hkial-azure-deploy/
│   └── hkial-handoff-discipline/
└── references/                    # Cross-project deep-dive pointer index
    └── pointer-index.md
```

## The 3 subprojects (read each subproject's AGENTS.md for detail)

| Subproject | Path | Frontend / Backend | Port | Branch |
|---|---|---|---|---|
| Customer SPA | `~/Desktop/Projects/frontend_react/frontend/` | Customer-facing | 3000 | `dev` |
| Admin SPA | `~/Desktop/Projects/backend/hkial-react/` | Staff-facing | 5173 | `dev` |
| Laravel API | `~/Desktop/Projects/backend/hkial-api/` | Backend | 8000 | `dev` |

`backend/` is a **monorepo** with `.git/` at the parent (contains `hkial-api/` + `hkial-react/` as subdirs).
`frontend_react/` is a **separate sibling repo** with its own `.git/`.

## Common env (quick reference — full table in AGENTS.md §7)

| Env | Value |
|---|---|
| Customer Azure | `viplonlinebookingfrontenddev-cpbabsb5fnb4hhgq.eastasia-01.azurewebsites.net` |
| Admin Azure | `viplonlinebookingbackenddev-djdnd5bycmccbacq.eastasia-01.azurewebsites.net` |
| API Azure | `viplonlinebookingapidev-cfcwbeewgqamb3fc.eastasia-01.azurewebsites.net/api` |
| Azure dev DB | `aawemflexmysqltest.mysql.database.azure.com:3306` / `vipl_booking_system_testing` |
| Sky Azure cred | `sky@acestudio.hk / y&447aWd7dvWbEMw` (OTP 888888) |
| Admin dev cred | `admin@hkial.com / password123` |
| Member local seeder | `sky@acestudio.hk / 12345678` + OTP 888888 |
| ACR | `viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io` |

## The 3 cross-project invariants (the short list)

1. **figma-ui submodule policy** — minimal figma-ui edits are allowed (smallest possible diff, no structural rewrites / new files / new deps), but don't break the figma Make import path AND never `git add` / `commit` / `push` inside the submodule. Sky handles the sync. See `AGENTS.md` §3 INV-X1.
2. **Auth is dual** — staff uses `auth:sanctum` + `localStorage.auth_token`; member uses `auth.api` + `localStorage.hkial_auth_token`. Don't mix.
3. **One fix per commit** — surgical change rule, every changed line traces to the user's request.

Full invariants in [`AGENTS.md`](./AGENTS.md) §3 (INV-X1 through INV-X10).

## Related: global Hermes skills

12 HKIAL-specific Hermes skills live in `~/.hermes/skills/software-development/hkial*/` and are auto-loaded by the `.hermes/config.yaml` here. The most-used are:
- `hkial-frontend-bug-debug-checklist` — 12 bug classes + 4 defensive patterns
- `hkial-customer-frontend-figma-codebase-sync` (v1.24.0) — figma-ui sync playbook
- `hkial-e2e-login-auth` — 3 auth strategies (API-then-inject, UI-form-fill, storageState)
- `hkial-debugging-stuck-loop` — recovery protocol when you've been on a bug 5+ turns
- `contract-test-first-workflow` — 12 cross-layer anti-patterns + audit-then-spec-test
