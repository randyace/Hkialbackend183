---
name: hkial-container-view-pattern
description: Canonical Container/View split for HKIAL customer + admin frontends. Smart container = real API + state + transform; dumb view = pure JSX + MOCK_* fallback + props-driven. Covers the inverse sub-pattern (figma-ui owns UI, wrapper has 0 JSX) for HKIAL admin forms, the wrapper-routing technique for the customer frontend's file-split trap, and the 4-cell figma-ui/wrapper ownership matrix. Use when designing a new page, when adding a field to an existing page, or when the user reports "the patch has no visual effect".
tags: []
version: 1.0.0
author: Hermes Agent
license: MIT
last-verified: 2026-06-13
applies-to-rounds: 6.0+
metadata:
  hermes:
    tags: [HKIAL, container, view, figma-ui, MOCK_*, props, inverse-sub-pattern, wrapper-routing, file-split-trap]
---

# HKIAL Container / View Pattern

> **When to use**: Designing a new page (start here), adding a new field to an existing page (apply the 7-layer pre-flight from HKIAL/AGENTS.md §3 INV-X10), or debugging a fix that "doesn't show in production" (this is the file-split trap class #9 / inverse sub-pattern class #10).
>
> **Cross-references**: `HKIAL/AGENTS.md` INV-X10 (7-layer pre-flight), `~/.hermes/skills/hkial-customer-frontend-figma-codebase-sync/SKILL.md` (v1.24.0, the deep playbook), `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` (class #9 / #10 / #9b).

## 1. The canonical split (applies to BOTH frontends)

| Layer | Customer location | Admin location | Role | Mock? | API? |
|---|---|---|---|---|---|
| **Smart Container** | `frontend_react/frontend/src/containers/<Page>Container.tsx` | `backend/hkial-react/src/components/<Page>.tsx` (wrapper) | `useState` + `useEffect` + real `api.*` calls + transform + pass to view | ❌ NEVER | ✅ yes |
| **Figma View** | `frontend_react/frontend/src/components/figma-ui/src/app/components/<Page>.tsx` | `backend/hkial-react/src/components/figma-ui/src/app/components/<Page>.tsx` | Pure JSX + Tailwind, `propX ?? MOCK_X` fallback | ✅ always | ❌ never |
| **Wrapper (special, no container)** | `frontend_react/frontend/src/components/<Page>.tsx` (e.g. `EditBooking.tsx`, `AuthPage.tsx`) | (rare on admin; usually has a container) | Real-data page that imports from `services/api` directly | ❌ | ✅ yes |

**Container rules** (both frontends):
- Holds ALL `useState` / `useEffect` / `useCallback` / `useMemo` for the page
- Makes API calls via service layers (`api.bookings.*`, `authApi.me()`, etc.)
- Transforms snake_case API → camelCase view (and vice versa)
- Surfaces errors via toast (sonner) or `saveMessage`
- **NEVER has hardcoded mock data** — use the API

**Figma View rules** (both frontends):
- Pure UI only — no API calls, no business logic hooks
- Has `MOCK_*` constants with `??` fallbacks for Figma standalone preview
- Props interface MUST be `export interface XxxProps`
- `const displayData = propData ?? MOCK_DATA` — real data from container overrides mock
- Use vite alias `@/` for cross-tree imports (NOT relative `../` — vite treats the submodule as a separate root)

## 2. The file-split trap (customer frontend, the #1 cause of "fix doesn't show in production")

The wrapper and figma-ui directories **share component names** but only ONE is rendered in production. Always grep the import graph before patching.

**Pre-ship verification** (30 seconds):
```bash
# 1. Which file does the route import?
grep -nE "from.*components.*<Name>" frontend_react/frontend/src/routes/index.tsx
# 2. Is the figma-ui twin wired anywhere?
grep -rn "figma-ui.*<Name>" frontend_react/frontend/src/
# 3. Confirm with the per-URL table in frontend_react/AGENTS.md §3
```

| URL path | Live production source | figma-ui twin (DEAD unless noted) |
|---|---|---|
| `/mybooking/details/:id` | `frontend_react/frontend/src/components/EditBooking.tsx` (WRAPPER, has "SOURCE OF TRUTH" header) | figma-ui `EditBooking.tsx` (DEAD) |
| `/auth`, `/login` | `frontend_react/frontend/src/components/AuthPage.tsx` (WRAPPER) | figma-ui `AuthPage.tsx` (DEAD) |
| `/dashboard` | `frontend_react/frontend/src/containers/DashboardContainer.tsx` → figma-ui `MemberDashboard` | — |
| `/mybooking` | `frontend_react/frontend/src/containers/BookingsContainer.tsx` → figma-ui `Bookings` | — |
| `/newbooking` | `frontend_react/frontend/src/containers/NewBookingContainer.tsx` → figma-ui `NewBooking` | — |
| `/settings`, `/services`, `/visit-history`, `/voucher-batches`, `/admin/group-admin`, `/membership-packages`, `/my-membership` | corresponding `*Container.tsx` → figma-ui view | — |

**If you patched the figma-ui file when the production path imports the wrapper (or vice versa), the fix is unreachable.** This was the round 6.2.7/6.2.8 lesson — 3 consecutive turns of fixes shipped to the dead file before the user spotted it.

## 3. The 4-cell figma-ui/wrapper ownership matrix (admin frontend)

Run BEFORE writing any admin patch that touches a figma-ui field. The 3-grep audit:

```bash
# 1. Where is the field's JSX?
grep -rnE "<field label>|<field name>" \
  backend/hkial-react/src/components/<Name>.tsx \
  backend/hkial-react/src/components/figma-ui/src/app/components/<Name>.tsx

# 2. Where is the field's state?
grep -nE "useState.*<field name>|set<FieldName>" \
  backend/hkial-react/src/components/<Name>.tsx \
  backend/hkial-react/src/components/figma-ui/src/app/components/<Name>.tsx

# 3. Where is the field's emit?
grep -nE "<field name>:" \
  backend/hkial-react/src/components/figma-ui/src/app/components/<Name>.tsx
```

| Grep #1 returns hits in... | Field's UI owner | Patches go to... |
|---|---|---|
| wrapper only | wrapper | wrapper |
| **figma-ui only** | **figma-ui** | **figma-ui (working tree only, per INV-X1)** |
| both | shared (rare, usually means the wrapper also renders something, like a banner) | both, carefully synced |
| 0 in both | no UI exists yet | design first, then create |

| JSX | State | Emit | Pattern | Bug class |
|---|---|---|---|---|
| wrapper | wrapper | wrapper | Standard | n/a |
| **figma-ui** | **figma-ui** | **figma-ui** | **Inverse (class #10) — patch figma-ui only** | **#10** |
| figma-ui | wrapper | wrapper | Mixed — figma-ui is dumb, wrapper owns state | usually #9 fix-up |
| wrapper | figma-ui | figma-ui | Confused | audit + likely rewrite |

## 4. The inverse sub-pattern (class #10) fix shape (5 hunks, all in figma-ui, 0 in wrapper)

1. Add `useState<T>(initial)` for the new field in figma-ui's state block.
2. (If the field depends on a prop) Add a `useEffect([prop])` that syncs prop → state.
3. Wire the input/select `onChange` to the new state.
4. Add `<field>: state === initial ? undefined : state` to the formData literal in figma-ui's `handleSubmit`.
5. (Optional) Add `<field>?: T` to the figma-ui's `BookingFormData` interface.

**The submodule-git policy** (per INV-X1, updated 2026-06-14):
- ✅ Minimal figma-ui edits are allowed (smallest possible diff).
- ❌ Don't break the figma Make import path (no new imports / deps figma Make can't supply).
- ❌ Don't `git add` / `commit` / `push` inside the submodule.
- ❌ Don't bump the parent repo's submodule pointer.
- Deliverable: a clean diff via `cd figma-ui && git diff` for Sky to sync.

## 5. Class #9b — figma-ui NEEDS editing (no longer an exception; default per INV-X1)

Since the 2026-06-14 INV-X1 update, class #9b is **no longer the authorized exception** — it's the default behaviour when the wrapper can't absorb the fix. The previous "3-place fix with parent pointer bump" is retired. The new shape is:

**When class #9b applies** (decide before writing any patch):
1. The figma-ui file has the bug/missing-feature AND
2. The wrapper has no JSX surface to receive the fix (e.g. a price math change in a deeply-nested render path that the wrapper doesn't replicate)

If (1) is true but (2) is false → still stay with class #9 (route to wrapper). The "default = wrapper" rule still applies.

**The fix shape (1 place, working tree only, handoff doc)**:
1. **figma-ui submodule working tree** (NO commit, NO pointer bump): make the minimal patch directly. Use `@/` alias for cross-tree imports, keep pre-existing exports, hook degrades gracefully to fallback. Sky syncs to his Figma Make code base + the figma-ui's own repo.
2. **Handoff doc**: deliver `cd figma-ui && git diff` of the change in the handoff's "Deploy reminder for Sky" section so Sky can sync.

## 6. The 7-layer pre-flight for any new field (INV-X10)

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

If any layer is missing, that's where the bug is. Iterate layer by layer; the 7th layer (7b figma-ui owner) is the most commonly missed.

## 7. Container/View contract tests (the methodology)

For every new page, write:
1. **Type test** (TypeScript): the `XxxProps` interface + `XxxFormData` interface compile
2. **Container test** (Vitest): container passes `propX` from API → view receives `propX` (mock the API, render the view, assert the prop)
3. **View test** (Vitest + React Testing Library): view renders correctly with props; view renders correctly with `MOCK_*` fallback when props are undefined
4. **E2E test** (Playwright): full flow from API → container → view → DOM

For the figma-ui side, prefer end-to-end tests (Playwright with real bundle) over unit tests (Randy's regen will rewrite the file).

## 8. Common Container/View mistakes (the "silent wrong" class)

1. **Forgetting to destructure the new field in the container** — form has it, container drops it, API never sees it. (This was round 6.2.8's leg2 fields bug on the customer side.)
2. **Hardcoding the wrong `MOCK_*` value** — view shows "John Doe" in production because the prop is `undefined` and the fallback is wrong.
3. **Container state set via `useEffect` that depends on a prop** — infinite re-render loop. Use a `useRef` or `useMemo`.
4. **Container's `useEffect` doesn't have the dep in the dep list** — closure captures stale value.
5. **Wrapper has JSX, figma-ui also has JSX, both render the same field** — guaranteed state-divergence bug. Pick one.
6. **Figma-ui's `MOCK_*` references an env var or build-time constant** — Randy's Figma preview breaks. Use a literal.
7. **fwd: state in figma-ui, state in wrapper for the same field** — class #9c, "parallel state" (INV-9). Pick one source of truth.
8. **`onSubmit` payload uses a different field name than the API expects** — fix the serializer, don't grow backend tolerance (INV-X8).

## 9. Related skills / cross-references

- `HKIAL/AGENTS.md` §3 INV-X1 (figma-ui one-way) + INV-X8 (frontend payload) + INV-X10 (7-layer pre-flight)
- `~/.hermes/skills/hkial-customer-frontend-figma-codebase-sync/SKILL.md` (v1.24.0) — the full sync playbook
- `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` — class #9 (file-split trap) + #10 (inverse sub-pattern) + #9b (authorized exception)
- `frontend_react/frontend/DEVELOPMENT_GUIDE.md` — long-form Container/View guide + NewBooking flow + field name mapping
- `frontend_react/frontend/FIGMA_UI_BOUNDARY.md` — figma-ui isolation boundary
- `backend/.opencode/agent/hermes.md` §"Container/View Architecture" + §"10 Design Invariants"
