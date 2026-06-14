---
name: hkial-pre-commit-gate
description: 4-phase pre-commit gate for HKIAL — stash-then-rerun to confirm pre-existing failures, lint + type check, sample test for setup-infra bugs, full test suite (PHPUnit + Vitest + Playwright + tsc --noEmit), and runtime end-to-end reproduction. Use before EVERY commit to HKIAL to prevent the "I thought I fixed this" / "the test passed but the user sees a bug" class. Trigger: "pre-commit", "before I commit", "all tests pass", "verify", "any regressions".
tags: []
version: 1.0.0
author: Hermes Agent
license: MIT
last-verified: 2026-06-13
applies-to-rounds: 6.0+
metadata:
  hermes:
    tags: [HKIAL, pre-commit, gate, test, phpunit, vitest, playwright, tsc, lint, stash, runtime, e2e]
---

# HKIAL Pre-Commit Gate

> **When to use**: BEFORE every commit to any HKIAL subproject (`backend/hkial-api/`, `backend/hkial-react/`, or `frontend_react/`). Prevents the "all tests pass, shipped a regression" anti-pattern that has burned multiple sessions. Cross-references: HKIAL/AGENTS.md §4 (commands), `~/.hermes/skills/contract-test-first-workflow/` (the methodology), `backend/.opencode/agent/hermes.md` §"Pre-Commit Gate".

## 1. The 4-phase gate (run in order)

### Phase 1 — Stash-then-rerun (proves YOUR fixes are green, not pre-existing)

```bash
# Backend (hkial-api)
cd backend/hkial-api
git stash
php artisan test 2>&1 | tail -20
# Note the pre-existing fail count (e.g. "FAIL: 1 pre-existing" — ContractManagementContractTest)
git stash pop
# Re-run after stash pop to confirm YOUR changes don't add new failures
php artisan test 2>&1 | tail -20
# Compare: pre-existing = X, with-changes = X (no new failures)
```

This is the canonical "is this fail mine or pre-existing?" check. **Do not skip this** — if a test fails after your stash pop, you need to know whether you caused it.

### Phase 2 — Lint + type check (per subproject)

```bash
# Backend (PHP)
cd backend/hkial-api
php -l app/Http/Controllers/Api/<ChangedController>.php
./vendor/bin/pint --test   # Laravel Pint (style)

# Admin (TS + ESLint)
cd backend/hkial-react
npx tsc --noEmit            # Type check
npm run lint                # ESLint (1 eslint.config.js)

# Customer (TS, no eslint by default)
cd frontend_react/frontend
npx tsc --noEmit
# (No lint command configured per frontend/AGENTS.md §"Build/Lint/Test Commands")
```

Pre-existing `tsc --noEmit` errors are OK (frontend has 76 known); new errors from your changes are NOT.

### Phase 3 — Sample test (catch setup-infra bugs before full suite)

```bash
# Backend — run ONE test class first
cd backend/hkial-api
php artisan test --filter <TestClassYouTouched>
# Expected: green. If red, fix before running the full suite.

# Admin — run ONE spec file first
cd backend/hkial-react
npx vitest run <YourTestFile>.test.ts
npx playwright test <YourE2ESpec>.spec.ts --grep "<one case>"

# Customer — same pattern
cd frontend_react/frontend
npm test -- <YourTestFile>.test.ts
```

This catches the "test runner itself is broken" or "import path is wrong" class of bugs that would otherwise consume 5 minutes of full-suite time to surface.

### Phase 4 — Full test suite + runtime end-to-end reproduction

```bash
# Backend
cd backend/hkial-api
php artisan test
# Expected: ~585/585 pass, ~1-2 pre-existing fails (note in handoff doc)

# Admin
cd backend/hkial-react
npx vitest run
npx playwright test

# Customer
cd frontend_react/frontend
npm test
```

**Runtime end-to-end reproduction** (mandatory for runtime-bug fixes per INV-12):
```bash
# Use Playwright with page.on('pageerror') + page.on('console') listeners
# See ~/.hermes/skills/hkial-e2e-login-auth for auth setup
# See ~/.hermes/skills/hkial-frontend-bug-debug-checklist for pageerror recipe
```

## 2. Pre-existing failure notes (HKIAL-specific)

The HKIAL test suites have a few KNOWN pre-existing failures. **Do not chase these as part of your fix** — note them in the handoff doc:

| Subproject | Pre-existing failure | Status | Why it's not yours |
|---|---|---|---|
| `hkial-api` | `ContractManagementContractTest` (1 case) | 2026-06-11: 1 case fails | Unrelated to recent work, tracked separately |
| `hkial-api` | `BookingFlowMatrixTest` (5 cases in 6.2.31) | Cascade from L294 change | Deferred per `hkial-customer-frontend-figma-codebase-sync` v1.19.0 |
| `hkial-react` | `tsc --noEmit` (76 known errors) | 2026-06-11: 76 errors | Pre-existing, do not add to count |
| `frontend_react/frontend` | `tsc --noEmit` (some pre-existing errors) | 2026-06-11 | Pre-existing, do not add to count |

**Rule**: your commit should not INCREASE the pre-existing fail count. If you can't fix a pre-existing fail in the same round, defer it (write a `docs/pending-changes/` doc + commit only the source changes).

## 3. Per-subproject command cheatsheet

| Subproject | Phase 1 (stash) | Phase 2 (lint) | Phase 3 (sample) | Phase 4 (full) |
|---|---|---|---|---|
| `backend/hkial-api` | `git stash && php artisan test && git stash pop` | `php -l <file> && ./vendor/bin/pint --test` | `php artisan test --filter <Test>` | `php artisan test` |
| `backend/hkial-react` | `git stash && npx vitest run && git stash pop` | `npx tsc --noEmit && npm run lint` | `npx vitest run <test>.test.ts` | `npx vitest run && npx playwright test` |
| `frontend_react/frontend` | `git stash && npm test && git stash pop` | `npx tsc --noEmit` | `npm test -- <test>.test.ts` | `npm test` |

## 4. When Phase 4 fails — the triage flow

```
Phase 4 fails
├── 1. Is the failure count EXACTLY the pre-existing count? → SAFE TO COMMIT
├── 2. Is the failure count +1 or more than pre-existing? → STOP
│   ├── Read the failure. Is it in a file you changed?
│   │   ├── Yes → fix it
│   │   └── No → grep for the test's scope. Is it testing your code path?
│   │       ├── Yes → fix it
│   │       └── No → likely pre-existing-but-undiscovered, defer
│   └── Re-run Phase 3 on the specific file first
```

**Anti-pattern**: "the test failed but I'll fix it in the next commit" — this is the 6.2.7/6.2.8 lesson. One fix per commit (INV-X6).

## 5. The "false green" trap (the test passed but the user sees a bug)

Common causes:
1. **Test asserts against a typo'd mock**, not the real shape (see `contract-test-first-workflow/if-guard-false-green.md`).
2. **Test runs the contract path but the bug is in the JSX path** (e.g. `it('returns the right data')` passes, but the page is blank on first render due to a null-deref).
3. **Test uses the WRONG auth strategy** (e.g. tests member endpoint with staff token — passes 200 because the controller doesn't auth-check correctly).
4. **Test mocks the data, not the network** (e.g. `vi.mock('../api', () => ({ bookings: { list: () => mockData } }))` — passes because the mock returns mock data, but the REAL API returns something else).

**Defense**: for any UI fix, run a Playwright spec with `page.on('pageerror')` + `page.on('console')` listeners. An API POST→DB→GET is a contract test, not e2e (INV-X9).

## 6. The figma-ui submodule dirty-state check (do this BEFORE Phase 1)

If the user just opened a session and the parent repo says `modified: <figma-ui-path> (modified content)`, the submodule may have working-tree WIP from another session:

```bash
cd backend/hkial-react/src/components/figma-ui
git status --short
# If anything shows M/MM/AM, surface in handoff doc BEFORE running tests
# (your 1-line test fixture patch should not be merged with someone else's 47-line WIP)
```

Full protocol: see `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` defensive pattern #5.

## 7. The "should I commit?" checklist (print this in your head)

```
[ ] Stash-then-rerun: pre-existing fail count = N, with-changes = N
[ ] Lint: 0 new errors
[ ] Type check: 0 new errors
[ ] Sample test: green
[ ] Full test suite: green (count matches pre-existing)
[ ] Runtime e2e (if applicable): captured screenshot or test ID
[ ] Handoff doc written (if material change)
[ ] Submodule dirty state noted (if applicable)
[ ] Did NOT `git add` inside figma-ui (INV-X1)
[ ] Did NOT `migrate:fresh --seed` (INV-X2)
[ ] One fix per commit (INV-X6)
```

If any `[ ]` is unchecked, STOP. Don't commit.

## 8. Related skills / cross-references

- `HKIAL/AGENTS.md` §3 (INV-X2 migrate:fresh, INV-X6 one-fix-per-commit) + §4 (commands)
- `HKIAL/skills/hkial-setup-onboarding/` — make sure the local stack works first
- `HKIAL/skills/hkial-handoff-discipline/` — write the handoff doc as part of the commit
- `backend/.opencode/agent/hermes.md` §"Pre-Commit Gate (MANDATORY before any commit)"
- `backend/hkial-api/tests/smoke_test_runner.py` — the 7-second no-browser smoke test (use in Phase 1 or as a quick sanity check)
- `~/.hermes/skills/contract-test-first-workflow/SKILL.md` — the methodology (this skill is the operational layer on top)
- `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` — for UI bug fixes, see also the runtime e2e recipe
