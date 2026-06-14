# HKIAL Cross-Project Handoff Index

> **What this is**: chronological TL;DR index of every cross-project session-ending record. Cross-project = touches 2+ subprojects (customer + admin + API, or 3-app deploy, or monorepo commit on both `hkial-api/` + `hkial-react/`).
>
> **Read this when**: you need to know "what was the cross-project state at end of Y date?" before starting new work, or when a deploy handoff is needed (3-app coordinated).
>
> **Location**: this folder is `HKIAL/handoff/` (per `HKIAL/spec.md` §13.2 — subproject handoffs live in their own `docs/handoff/`).

## TL;DR table (chronological, newest first)

| Date | Title | TL;DR | Full doc |
|---|---|---|---|
| 2026-06-13 | **Spec consolidation (round 7.0-prep)** | Consolidated 3-subproject HKIAL into single cross-project canonical spec at `HKIAL/spec.md` v2.0.0 (1324 lines, 17 sections). Old `backend/spec.md` (admin-only, March 2026) is now LEGACY. Created `HKIAL/.hermes/scripts/spec-audit.sh` (186 lines, executable) — quarterly anti-rott tool. New §15 (API-first dev order: SPEC→SCHEMA→CONTRACT→IMPL→FRONTEND→E2E) + §16 (anti-rott protocol: 5 rules + 4 consistency + audit script). Added `last-verified: 2026-06-13` to 6 project-local skills. 5 legacy docs got "spec has moved" redirect banners. 3 docs got spec.md as primary link. **No code changes** — Q5 ship as-is. | [`2026-06-13-spec-consolidation.md`](2026-06-13-spec-consolidation.md) |

## Cross-reference: how this folder relates to other handoff indexes

| Subproject | Index | What it covers |
|---|---|---|
| Customer | `frontend_react/frontend/docs/handoff/README.md` | Customer-specific work (NewBooking, EditBooking, /mybooking, /auth, /dashboard) |
| Admin | `backend/hkial-react/docs/handoff/README.md` | Admin-specific work (CreateBooking, EditBooking, BookingDetail, BookingReview, PriceManagement, Accounts) |
| API | `backend/hkial-api/docs/handoff/` (when created) | API-specific work (controllers, services, migrations) |
| **Cross-project** (this folder) | `HKIAL/handoff/README.md` | **2+ subprojects touched, or 3-app deploy, or monorepo commit on both hkial-api/ + hkial-react/** |

**Rule**: pick the location that matches the PRIMARY work, even if the change touches 2 subprojects. Cross-reference the other subproject in the "Files touched" section of the handoff.

## What's still missing

- The `backend/hkial-api/docs/handoff/` folder doesn't exist yet. The API has no dedicated handoffs — the round-specific work shows up in customer or admin handoffs (since API changes are usually in service of one of the frontends). When a round touches ONLY the API (no frontend), create the folder + first API handoff.
- The first 3-app Azure deploy handoff will likely land here. See `HKIAL/skills/hkial-azure-deploy/` for the template.

## When to write a cross-project handoff (vs a subproject one)

Use this folder when the change touches ≥2 of {customer frontend, admin frontend, API}, OR a 3-app deploy, OR a monorepo commit that affects both `hkial-api/` and `hkial-react/` in a single `dev` branch commit. Otherwise use the subproject's own `docs/handoff/`.
