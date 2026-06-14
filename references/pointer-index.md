# HKIAL Cross-Project Deep-Dive Pointer Index

> **Purpose**: Index to the most useful round-specific references across the 3 subprojects. When a session touches a known recurring pattern (pricing, figma-ui sync, mapper mismatch, stuck loop), start here to find the canonical reference.
>
> **Single-source-of-truth rule**: This index POINTS to references; the references themselves are the truth. If you discover a new gotcha, update the reference in its canonical location (per HKIAL/AGENTS.md §9 "Update rule"), then add a 1-line pointer here.

## How this index is organized

```
references/
├── pointer-index.md          ← THIS FILE
├── container-view/           (future: deep dives on the Container/View pattern)
├── pricing/                  (future: pricing arithmetic rounds 6.2.30+)
├── figma-ui-sync/            (future: cross-session submodule coordination)
└── deploy/                   (future: deploy handoff examples)
```

For now, all pointers are in this file. Subdirectories to be added as the reference corpus grows.

---

## 1. The 3 subproject AGENTS.md files (the primary sources)

| Doc | Path | Lines | What it covers |
|---|---|---|---|
| **⭐ HKIAL canonical spec** | `~/Desktop/Projects/HKIAL/spec.md` | ~700 | **Cross-project spec v2.0.0** — INV-X1..X10 + INV-1..13, 12 bug classes, 12 anti-patterns, API contract, dual-auth, booking + pricing, figma-ui policy, 3-layer test strategy, pre-commit + handoff, **live open bugs §14**, **API-first dev order §15**, **anti-rott protocol §16**. **READ THIS FIRST.** |
| HKIAL umbrella (this folder) | `~/Desktop/Projects/HKIAL/AGENTS.md` | ~270 | 3-repo map, INV-X1..X10 summary, common commands, deploy overview, env creds, docs index |
| Customer umbrella | `~/Desktop/Projects/frontend_react/AGENTS.md` | 212 | Container/View split, file-split trap table, figma-ui policy, bug class quick-ref, working style, debugging recovery |
| Customer project-specific | `~/Desktop/Projects/frontend_react/frontend/AGENTS.md` | 270 | Container rules, Figma UI rules, API calls, build/test commands, Docker deploy |
| Backend umbrella (CLAUDE-style) | `~/Desktop/Projects/backend/AGENTS.md` | 68 | Think before code, simplicity first, surgical changes, goal-driven |
| Backend primary agent | `~/Desktop/Projects/backend/.opencode/agent/hermes.md` | 292 | 3-repo architecture, Randy boundary, 10 design invariants INV-1..INV-13, container/view, contract-test-first methodology, common pitfalls |
| Customer DEVELOPMENT_GUIDE | `~/Desktop/Projects/frontend_react/frontend/DEVELOPMENT_GUIDE.md` | 23k bytes | Long-form Container/View guide + NewBooking flow + field name mapping (camelCase → snake_case) |
| Customer PROJECT_SUMMARY | `~/Desktop/Projects/frontend_react/frontend/PROJECT_SUMMARY.md` | 73k bytes | Full system architecture (the most complete overview) |
| Customer BOOKING_VIEW_INVENTORY | `~/Desktop/Projects/frontend_react/frontend/BOOKING_VIEW_INVENTORY.md` | 38k bytes | Per-booking-view ground-truth inventory |
| Customer FIGMA_UI_BOUNDARY | `~/Desktop/Projects/frontend_react/frontend/FIGMA_UI_BOUNDARY.md` | 7.6k bytes | figma-ui isolation boundary + sync workflow + known limitations |
| API endpoint reference | `~/Desktop/Projects/backend/hkial-api/api_endpoints.md` | 9.9k bytes | All `/api/...` routes |
| API how-to-add-booking | `~/Desktop/Projects/backend/hkial-api/ADD_BOOKING_GUIDE.md` | 4.6k bytes | How to add a new booking flow |
| API outstanding problems | `~/Desktop/Projects/backend/hkial-api/PROBLEM.md` | 3.8k bytes | Outstanding backend problems |

---

## 2. The handoff doc index (chronological TL;DR)

Each subproject has its own `docs/handoff/` with the most recent first.

### Customer handoffs (`frontend_react/frontend/docs/handoff/`)
| Date | Doc | Round / TL;DR |
|---|---|---|
| 2026-06-11 | `2026-06-11-customer-edit-booking-coverage-phase-2-3.md` | (next session pickup) |
| 2026-06-11 | `2026-06-11-customer-edit-booking-coverage-phase-0-1.md` | Customer EditBooking coverage Phase 0+1 shipped |
| 2026-06-08 | `2026-06-08-customer-newbooking-3-bugs.md` | Required-field `*` markers; Transit 2-leg; NFG on Final Review + Success |

### Admin handoffs (`backend/hkial-react/docs/handoff/`)
| Date | Doc | Round / TL;DR |
|---|---|---|
| 2026-06-11 | `2026-06-11-customer-profile-real-data.md` | 4 figma-ui + 2 parent-repo files now use real data instead of mock (BookingCustomerProfile dialog) |
| 2026-06-11 | `2026-06-11-edit-booking-3-bug-fix.md` | 3 bugs in EditBooking fixed (leg2 fields, NFG section, time field) |
| 2026-06-11 | `2026-06-11-edit-booking-coverage-phase-0-1.md` | Phase 0 + 1 of edit-booking coverage plan shipped |
| 2026-06-11 | `2026-06-11-booking-detail-ld-vip-allow-zero.md` | LD VIP=0 rule now intent-gated (no false-positive on no-LD case) |
| 2026-06-11 | `2026-06-11-remove-edit-button-booking-list.md` | Edit button removed from admin BookingManagement list |

### Admin pending-changes (`backend/hkial-react/docs/pending-changes/`)
| Date | Doc | Topic |
|---|---|---|
| 2026-06-11 | `2026-06-11-edit-booking-coverage-plan.md` | Form-coverage gap analysis (50 fields × 2 edit surfaces) — 4 design Qs to answer |
| 2026-06-10 | `2026-06-10-6.2.33-infant-nfg-zero-charge.md` | NFG infant = 0 charge (K-class) |
| 2026-06-10 | `2026-06-10-ps-cap-infant-rule-conflict.md` | PS Note 5 cap + infant counting rule conflict (K2 vs K4) |
| 2026-06-10 | `2026-06-10-price-preview-trigger-by-quantity.md` | Live price preview re-fires on qty inputs (not just selection) |
| 2026-06-10 | `2026-06-10-age-dropdown-normalize.md` | Age dropdown normalize |
| 2026-06-10 | `2026-06-10-quickfill-bookingno-cleanup.md` | Quick Fill removal + server-fetched bookingNo |

---

## 3. Global Hermes skills (12 HKIAL-specific, in `~/.hermes/skills/`)

| Skill | Version | One-liner |
|---|---|---|
| `hkial` (umbrella) | 1.9.0 | Auto-loads the 3 below. Single source of truth on monorepo discovery, auth, figma-ui sync |
| `hkial-customer-frontend-figma-codebase-sync` | 1.24.0 | figma-ui sync playbook (class #9 routing, #9b exception, #10 inverse sub-pattern, multi-session shared tree) |
| `hkial-frontend-bug-debug-checklist` | (no version) | 12 bug classes + 4 defensive patterns + 7-layer pre-flight + admin/customer disambiguation |
| `hkial-e2e-login-auth` | 1.0.0 | 3 auth strategies (API-then-inject, UI-form-fill, storageState) + OTP 888888 + 3-min diagnostic |
| `hkial-frontend-e2e-selector-pattern` | (no version) | Playwright selectors for figma-ui (buttons not radios, Radix combobox, type=date/time/number) |
| `hkial-debugging-stuck-loop` | (no version) | Recovery protocol when 5+ turns into a bug + user steering signal interpretation |
| `hkial-label-rename-audit-cookbook` | 1.2.0 | 3 label classes (strict-compare trap, mapper-default enum-mismatch, UI-label-relabel) + 4-grep audit |
| `hkial-booking-view-contract-pilot` | (no version) | Booking view contract pilot runbook |
| `contract-test-first-workflow` | 0.6.0 | 12 cross-layer anti-patterns (phantom-field, off-by-some, preview-path-lags, etc.) + audit-then-spec-test |
| `test-design-matrix` | 0.2.0 | Pre-test case design (Entity × Verb × Field × Bucket) + 5-Q product spec Q&A |
| `simplify-code` | 1.0.0 | Parallel 3-agent code cleanup (reuse / quality / efficiency) |
| `subagent-parallel-stream-isolation` | (no version) | Multi-session working-tree isolation for git-worktree-isolated sessions |

Plus 2 top-level HKIAL skills (in `~/.hermes/skills/` directly):
| Skill | Path | One-liner |
|---|---|---|
| `hkial-frontend-bug-debug-checklist/` | `~/.hermes/skills/hkial-frontend-bug-debug-checklist/` | Same as the `software-development/` one (12 bug classes, 46k bytes) |
| `hkial-smoke-test/` | `~/.hermes/skills/hkial-smoke-test/` | The 7-second no-browser smoke test runner (script only, no skill body) |

---

## 4. Project-local skills in `HKIAL/skills/` (cross-project, 6 skills)

See `HKIAL/skills/README.md` for the index. Quick reference:

| Stage | Skill |
|---|---|
| Setup | `hkial-setup-onboarding` |
| Develop | `hkial-container-view-pattern` |
| Test | `hkial-pre-commit-gate` |
| Debug | `hkial-frontend-disambiguation` |
| Deploy | `hkial-azure-deploy` |
| Handoff | `hkial-handoff-discipline` |

---

## 5. The 10 cross-project invariants (the short list — full in HKIAL/AGENTS.md §3)

| ID | Invariant | Reference |
|---|---|---|
| INV-X1 | figma-ui submodule policy (minimal edits allowed; don't break figma Make; never `git add` inside) | `HKIAL/AGENTS.md` §3 + `hkial-customer-frontend-figma-codebase-sync` v1.24.0 §"The default rule" |
| INV-X2 | NEVER `migrate:fresh --seed` against dev DB | `HKIAL/AGENTS.md` §3 + `hkial` umbrella |
| INV-X3 | Auth is dual (staff Sanctum vs member custom) | `HKIAL/AGENTS.md` §3 + `hkial-e2e-login-auth` |
| INV-X4 | Token read on EVERY API call (no module-level cache) | `HKIAL/AGENTS.md` §3 |
| INV-X5 | Response unwrap difference (admin 1-unwrap vs customer 2-unwrap) | `HKIAL/AGENTS.md` §3 + `backend/.opencode/agent/hermes.md` §"Admin vs Customer" |
| INV-X6 | One fix per commit | `HKIAL/AGENTS.md` §3 |
| INV-X7 | Sky is terse Cantonese. 1-2 tool calls per turn. | `HKIAL/AGENTS.md` §3 + `hkial-debugging-stuck-loop` |
| INV-X8 | "X 唔喺 total" debugging starts at FRONTEND PAYLOAD | `HKIAL/AGENTS.md` §3 + `hkial` umbrella |
| INV-X9 | UI bug = real browser render (Playwright + pageerror) | `HKIAL/AGENTS.md` §3 + `hkial-frontend-bug-debug-checklist` |
| INV-X10 | 7-layer pre-flight for any new field | `HKIAL/AGENTS.md` §3 + `hkial-container-view-pattern` §6 |

## 6. The 13 backend-specific design invariants (from `backend/.opencode/agent/hermes.md`)

| ID | Invariant | Reference |
|---|---|---|
| INV-1 | List→detail uses a SINGLE fetch path (no `location.state.booking` snapshot) | `backend/.opencode/agent/hermes.md` §"10 Design Invariants" |
| INV-2 | Two-source data normalization is a smell | same |
| INV-3 | Destination-like fields read from BOTH candidate sources | same |
| INV-4 | "X 唔喺 total" debugging starts at FRONTEND PAYLOAD | same (= INV-X8) |
| INV-5 | "Data in JSON" is temporary — promote to top-level column | same |
| INV-6 | A business concept cannot have 2 active price paths in the same flow | same |
| INV-7 | "Only X" / "X is enough" from a tired user = name what to KEEP, not DELETE | same |
| INV-8 | NEVER ship a runtime-bug fix without runtime evidence (pageerror) | same |
| INV-9 | Parallel `useState` in figma-ui + parent wrapper is a state-sync bug | same |
| INV-10 | Spec assertions inside `if (visible?)` with `.catch(() => false)` SILENTLY SKIP | same |
| INV-12 | Fix must reproduce actual data flow end-to-end before commit | same |
| INV-13 | Pre-commit gate: run 1 Vitest + 1 PHPUnit sample | same |

## 7. The 12 frontend bug classes (from `hkial-frontend-bug-debug-checklist`)

| # | Class | Trigger |
|---|---|---|
| 1 | Static-display field-missing | "field X is missing" |
| 2 | Form state (useState capture) | "after submit, field is empty" |
| 3 | Dynamic state (stale closure / dep array) | "I click X, UI doesn't update" |
| 4 | Data binding (route boundary) | "works on direct URL but not from list" |
| 5 | Perception (visual feedback gap) | "no visual feedback" |
| 6 | Mock data (hardcoded fakes) | "is X real or mock?" |
| 7 | Deployment bundle out of sync | "it was working fine before" |
| 8 | Route/forward layer downsize | "dashboard shows mock data" + useMemo |
| 9 | figma-ui submodule one-way (route to wrapper) | "figma-ui 嗰邊唔好 commit" |
| 9b | figma-ui NEEDS editing (authorized exception) | "you can modify figma-ui if really needed" |
| 10 | Inverse sub-pattern: figma-ui owns UI, wrapper has 0 JSX | "Membership Tier should be locked to account" |
| 10b | Class #10 + the field affects live Price Breakdown | "the value saves but the total doesn't change live" |
| 11 | Over-engineered confirm step | "the approve button needs 2 clicks" |
| 12 | Enum-mismatch mapper silently mislabels unmapped values | "payment mode is wrong for booking N" |

Full discriminators in `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md`.

## 8. The 12 contract-test-first anti-patterns (from `contract-test-first-workflow` v0.6.0)

| # | Anti-pattern | Reference |
|---|---|---|
| 1 | phantom-field | `references/jsx-false-and-dead-code-and-pricing-pipeline-audit-2026-06-08.md` Part 3a |
| 2 | the-lie (Math.max(1, length) + max(1, count) + min:1) | same Part 3b |
| 3 | missing-mapper-field | `references/round-6.2.13-6.2.18-off-by-some-amount-and-4-new-anti-patterns-2026-06-08.md` |
| 4 | 'off by some amount' framing | same |
| 5 | audit-script self-correction | same |
| 6 | missing-source-label | same |
| 7 | TDZ silent-fire on useMemo adding a new arg | `references/round-6.2.20-3-new-anti-patterns-and-mock-to-db-2026-06-09.md` |
| 8 | relative fetch() URL resolves to wrong origin | same |
| 9 | hard-coded lookupXxx with WRONG values | same |
| 10 | service-pre-applies-multiplier-but-call-site-folds-after | `references/round-6.2.28-staff-discount-line-item-and-reverse-reapply-2026-06-09.md` |
| 11 | preview-path-lags-apply-path | `references/round-2026-06-10-preview-path-catching-up-apply-path-2026-06-10.md` |
| 12 | shared-formula-cascade-across-buckets | `references/round-2026-06-10-pricing-arithmetic-3-patch-cascade-2026-06-10.md` |

Full playbook in `~/.hermes/skills/contract-test-first-workflow/SKILL.md`.

## 9. The 5-Q&A rule (calculation wrong + no number)

When the user says "X is wrong" or "calculation is off" WITHOUT a reproducible number, surface 5 Q&A items BEFORE writing any code. The 5 Qs framework (from `test-design-matrix/SKILL.md`):

1. **Q0 (interpretation scope)**: 2+ plausible interpretations? If yes, name them.
2. **Q1 (scope)**: What's in scope? (e.g. "per-kind vs totals-only" for multi-kind pricing)
3. **Q2 (source of truth)**: Which field is canonical? (e.g. "flyingGuests vs per-kind sum")
4. **Q3 (edge case)**: What about boundaries? (e.g. "0 guests, max guests, infants")
5. **Q4 (parity)**: Frontend chip and backend total should match. How?

If user responds terse ("1c, 2b, 3a") = decided, execute (INV-X7).

---

## 10. Cross-references summary (the "where to start" decision tree)

```
User wants to do X
├── X = "set up HKIAL" → HKIAL/skills/hkial-setup-onboarding/
├── X = "add a new field to a page" → HKIAL/AGENTS.md §3 INV-X10 (7-layer pre-flight) + hkial-container-view-pattern
├── X = "fix a frontend bug" → hkial-frontend-disambiguation (which frontend?) → hkial-frontend-bug-debug-checklist (which class?)
├── X = "fix a backend bug" → contract-test-first-workflow (12 anti-patterns) + backend/.opencode/agent/hermes.md §10 invariants
├── X = "write a Playwright E2E" → hkial-e2e-login-auth (auth) + hkial-frontend-e2e-selector-pattern (selectors)
├── X = "deploy to Azure" → hkial-azure-deploy
├── X = "write session handoff" → hkial-handoff-discipline
├── X = "find a specific round's reference" → this file §2 (handoff index) + §5/§6 (invariants)
├── X = "I keep getting stuck on this bug" → hkial-debugging-stuck-loop
├── X = "Sky is impatient, ship it" → INV-X7 (time-budget tier)
└── X = "I'm in 2+ sessions on the same figma-ui working tree" → hkial-customer-frontend-figma-codebase-sync v1.13+ (multi-session protocol)
```
