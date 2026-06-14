# HKIAL — Project Specification (spec.md)

> **Version**: 2.0.0 (2026-06-13, cross-project rewrite)
> **Supersedes**: `backend/spec.md` v1.0.0 (2026-03-27, admin-only) — kept as legacy UI reference; this file is canonical for **all 3 subprojects**
> **Scope**: Customer frontend + Admin frontend + Laravel API + cross-project (deploy, monorepo, contracts)
> **Audience**: Hermes agent sessions + Sky + any new contributor
> **Status**: Active. Last full review 2026-06-13. Section §14 ("Open Bugs / Pending Rot") is the LIVE state.

---

## 0. Meta — how to use this file

### 0.1 What this file IS

- The **canonical contract** between Customer (`frontend_react/frontend`), Admin (`backend/hkial-react`), and API (`backend/hkial-api`)
- The single source of truth for **invariants** (rules that cannot be broken), **architecture** (Container/View, figma-ui sync), **API contract** (auth, response envelope, key endpoints), **test strategy** (3-layer contract-first), and **pre-commit + handoff discipline**
- A **versioned, delta-based** spec: each round (6.2.N+) writes deltas, not rewrites. The changelog is in handoff docs, not in this file.

### 0.2 What this file is NOT

- **Not** a tutorial (see `frontend_react/frontend/DEVELOPMENT_GUIDE.md` + `HKIAL/skills/hkial-container-view-pattern/`)
- **Not** a session log (see `*/docs/handoff/README.md` per subproject)
- **Not** a backlog (see `backend/hkial-react/docs/pending-changes/`)
- **Not** a copy of every round's diff (see handoff docs)

### 0.3 Update rule (anti-rott protocol)

| Trigger | Action |
|---|---|
| Round 6.2.N ships a new field / endpoint / invariant | Add to §6 (API) / §7 (Auth) / §8 (Booking) / §9 (Pricing) + link from handoff doc's "Files touched" section. Do NOT rewrite prose. |
| Round 6.2.N retires a field / endpoint / rule | Mark with `~~strikethrough~~` + footnote `[retired YYYY-MM-DD round 6.2.N]`. Do NOT delete (history). |
| Round 6.2.N adds a new invariant (INV-N) | Add to §3 (or §2 for cross-project) at the end. Update INV count in §0.4. |
| Round 6.2.N closes a bug from §14 | Move row from "OPEN" to "FIXED" subsection. Do NOT delete. |
| Round 6.2.N changes a workflow rule (§15, §16) | Edit the section in place. Add 1-line changelog at section tail. |
| Quarterly (every 90 days) | Run **spec-audit.sh** (§16.3) to detect handoff/pending-changes that contradict this spec. |

**Forbidden**: deleting a section, renaming an INV/Class/Anti-pattern, or moving content without leaving a redirect footnote. The handoff README chronology is the audit trail.

### 0.4 Table of contents

```
0. Meta
1. System overview (3 subprojects + ports + branches)
2. The 10 cross-project invariants (INV-X1..X10)
3. The 13 backend design invariants (INV-1..INV-13)
4. The 12 frontend bug classes (#1..#12)
5. The 12 contract-test-first anti-patterns (PIT-1..PIT-12)
6. API contract (envelope, auth, key endpoints)
7. Auth: dual-system spec
8. Booking domain (canonical data model + state machine)
9. Pricing domain (K-class conflict protocol)
10. Figma-UI submodule policy + sync workflow
11. Test strategy (3-layer contract-first)
12. Pre-commit gate (4 phases)
13. Handoff discipline
14. Open bugs + pending rot (LIVE STATE)
15. HKIAL-API dev order redesign (NEW)
16. Dev workflow redesign — anti-rott protocol (NEW)
17. Cross-references + how to extend
```

---

## 1. System overview

### 1.1 The 3 subprojects

| Subproject | Path | Stack | Port (local) | Port (Azure dev) | Role | Branch |
|---|---|---|---|---|---|---|
| **Customer SPA** | `~/Desktop/Projects/frontend_react/frontend/` | React 19 + Vite 6 + TS + Tailwind 4 + Radix | 3000 | 443 (see §1.2) | Member-facing | `dev` |
| **Admin SPA** | `~/Desktop/Projects/backend/hkial-react/` | React 19 + Vite 6 + TS + Radix | 5173 | 443 (see §1.2) | Staff-facing | `dev` |
| **Laravel API** | `~/Desktop/Projects/backend/hkial-api/` | Laravel 11/13 + PHP 8.2+ + MySQL 8 (Azure) | 8000 | 443 (see §1.2) | Backend | `dev` |

**Monorepo topology** (verifiable with the 30-second monorepo check):
- `backend/` is ONE monorepo with `.git/` at the parent. `hkial-api/` and `hkial-react/` are subdirs.
- `frontend_react/` is a SEPARATE sibling repo with its own `.git/`.
- Cross-product commits normal: 1 commit on `dev` can touch `hkial-api/app/...` + `hkial-react/src/...` simultaneously.

### 1.2 Azure URLs + ACR (canonical)

| Service | URL |
|---|---|
| Customer dev | `https://viplonlinebookingfrontenddev-cpbabsb5fnb4hhgq.eastasia-01.azurewebsites.net` |
| Admin dev | `https://viplonlinebookingbackenddev-djdnd5bycmccbacq.eastasia-01.azurewebsites.net` |
| API dev | `https://viplonlinebookingapidev-cfcwbeewgqamb3fc.eastasia-01.azurewebsites.net/api` |
| ACR | `viplonlinebookingdev-bfdqcyakfmbneady.azurecr.io` |
| DB | `aawemflexmysqltest.mysql.database.azure.com:3306` / `vipl_booking_system_dev` |

**Mnemonic** (per `hkial-frontend-disambiguation` §2 Error 5): "backend" in the admin hostname is a Sky-era naming accident — admin is a frontend, not a backend. The pattern is `<role>dev-<suffix>.azurewebsites.net` where `role` ∈ {`api`, `backend`, `frontend`}.

### 1.3 Credentials (dev)

| Account | Email / password | Notes |
|---|---|---|
| Staff (admin local seeder) | `admin@hkial.com` / `password123` | Sanctum token in `localStorage.auth_token` |
| Member (local seeder) | `sky@acestudio.hk` / `12345678` + OTP `888888` | Custom auth.api token in `localStorage.hkial_auth_token` |
| Sky (Azure dev) | `sky@acestudio.hk` / `y&447aWd7dvWbEMw` + OTP `888888` | DB cred: `vipl_booking_admin / y&447aWd7dvWbEMw` |

### 1.4 figma-ui submodules (TWO submodules, DIFFERENT upstreams)

| Submodule | Path | Upstream | Owner |
|---|---|---|---|
| Customer figma-ui | `frontend_react/frontend/src/components/figma-ui/` | `randyace/Hkialfrontend183` | Randy (Figma export) |
| Admin figma-ui | `backend/hkial-react/src/components/figma-ui/` | `randyace/Hkialbackend183` | Randy (Figma export) |

**Critical (INV-X1, updated 2026-06-14)**: minimal figma-ui edits are allowed (smallest possible diff; no structural rewrites, new files, or new dependencies). Sky handles submodule + parent-pointer sync manually — agent NEVER `git add` / `commit` / `push` inside, NEVER bumps the parent repo's submodule pointer, NEVER breaks the figma Make import path. Agent delivers `cd figma-ui && git diff` for Sky to sync.

---

## 2. The 10 cross-project invariants (INV-X1..X10)

**INV-X1 — figma-ui submodule policy** (Sky, updated 2026-06-14). For BOTH customer and admin submodules:
- ✅ **Minimal figma-ui edits are allowed**. The agent may patch the figma-ui working tree directly. Keep changes surgical: prefer the smallest possible diff (label map, prop default, local state derivation, prop type widening). Avoid structural rewrites, new files, new dependencies.
- ❌ **Don't break the figma Make import**. The figma code base (`Hkialfrontend242copy-main` / `Hkialbackend183`) that Sky copies the figma-ui files into must keep working. Don't add imports / dependencies that figma Make's export can't supply. Don't use figma-ui-specific cross-tree aliases in a way that breaks copy-paste.
- ❌ **Don't touch the submodule git**. Never `git add` / `commit` / `push` INSIDE the submodule. Never bump the parent repo's submodule pointer (`git add src/components/figma-ui`). Sky handles the entire sync.
- ✅ Deliver `cd src/components/figma-ui && git diff` of the change for Sky.
- **Default decision rule**: prefer to fix in the parent wrapper when the wrapper can absorb the change (avoids touching figma-ui at all). Patch figma-ui only when (a) the surface is in figma-ui and the wrapper has no equivalent, OR (b) fixing in the wrapper would leak figma-internals into the parent.

**INV-X2 — NEVER `migrate:fresh --seed` against the shared dev DB** (`aawemflexmysqltest.mysql.database.azure.com`). Pre-flight `cat hkial-api/.env | grep DB_HOST` before any `migrate:` command. Use `migrate:fresh` (no seed) or `migrate:rollback --step=N` if cleanup is needed.

**INV-X3 — Auth is dual** (two SEPARATE systems, do not mix). See §7 for full spec.

**INV-X4 — Token read on EVERY API call** (no module-level cache). `Sanctum::actingAs` does NOT work for member auth in tests; use `personal_access_tokens` insert pattern.

**INV-X5 — Response unwrap difference**:
- Admin (axios, 1-unwrap): `response.data` IS the API envelope → `response.data.data` is the resource.
- Customer (fetch, 2-unwrap): wrapper returns `{ data: envelope }` → `res.data.data` is the resource. For Laravel local 2-level vs Azure 1-level variance, use `response.data.data ?? response.data`.

**INV-X6 — One fix per commit**. When audit surfaces multiple candidate root causes, commit first fix, re-test, then commit the next. Keeps `git bisect` viable and the diff reviewable. Surgical change rule: every changed line traces to the user's request.

**INV-X7 — Sky is terse Cantonese. Workflow cadence: 1-2 tool calls per turn, NO bulk recon across multiple tools**. "I am so tired" / "production ready" / "skip X" / "N min left" / "let's continue" / "are you stuck" = STOP-AND-SWITCH (see `hkial-debugging-stuck-loop`). Empty multi-choice timeout = defer-with-marker (write handoff doc, don't auto-build). Terse multi-choice ("1c", "option B", "2a") = user has decided, execute, no re-confirm.

**INV-X8 — "X 唔喺 total" debugging starts at the FRONTEND PAYLOAD, not the backend**. Capture the actual POST body (`page.on('request', ...)` in Playwright or `request.body` in PHPUnit) and compare against backend contract. If shapes differ, fix the serializer (Path A), don't grow backend tolerance (Path B).

**INV-X9 — For UI bugs, a real browser render is mandatory** (Playwright with `page.on('pageerror')` + `page.on('console')` listeners). An API POST→DB→GET round-trip is a **contract test**, not e2e. Only a real browser DOM check catches null-deref and `as unknown as Record` cast crashes.

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

## 3. The 13 backend design invariants (INV-1..INV-13)

**INV-1**: List→detail uses a SINGLE fetch path. No `location.state.booking` snapshot. Pass only the `id`, let destination fetch on mount. If a component takes both `booking` (snapshot) and `bookingId` (fresh-id), eliminate the snapshot.

**INV-2**: Two-source data normalization is a smell. Single source of truth. If two places normalize the same data shape, unify them.

**INV-3**: Destination-like fields must read from BOTH candidate sources and merge. Never assume the user used only one input.

**INV-4** (= INV-X8): "X 唔喺 total" debugging starts at the FRONTEND PAYLOAD.

**INV-5**: "Data in JSON" is temporary state. When a field needs SQL querying, promote to a top-level column. Write BOTH: top-level (canonical) + `advanced_details` (mirror for backward compat). 4-step pattern: migration → write logic → model `$fillable` → round-trip test.

**INV-6**: A business concept cannot have two active price paths in the same flow. Pick ONE canonical path, guard the other with a suppression check.

**INV-7**: "Only X" / "X is enough" from a tired user = they're naming what to KEEP, not what to DELETE. When in doubt, `clarify()` before the diff lands.

**INV-8**: NEVER ship a runtime-bug fix without runtime evidence. 4-step recipe: (1) Add Playwright `page.on('pageerror', ...)` listener, (2) Run repro, (3) READ the captured error first, (4) Form fix from the error class, NOT your prior hypothesis. Plausibility is not evidence. A `ReferenceError` on a typo needs a 1-line fix, not a `useMemo` refactor.

**INV-9**: Parallel `useState` in figma-ui sub-module + parent wrapper is a state-sync bug. 3-step detection: (1) grep `useState` in figma-ui view, (2) grep same name in parent wrapper, (3) if both have it and parent passes via props but child uses its own, it's parallel state. 3 fixes: drop live-preview read (A), lift state to wrapper (B), callback mirror (C).

**INV-10**: Spec assertions inside `if (visible?)` guards with `.catch(() => false)` SILENTLY SKIP. Never put assertions in optional guards. Use `expect(...).toBeVisible()` — fail hard with useful message.

**INV-11** (round 6.2.6.1): `Transition` (dead enum) → `Transit` (canonical). 5 files touched in 6.2.6.1 to rename. **Retired**: 2026-06-08, round 6.2.6.1. Do NOT re-introduce.

**INV-12** (round 6.2.20, post-6.1): Fix must reproduce actual data flow end-to-end before commit. Code-level audit alone is insufficient. Sub-rule: if fix targets layer X but data isn't reaching X, fix the blocking layer first. **Anti-pattern** (the round 6.2.8 limo bug): "the API returns 200, the form should work" — the API was correct but the form's `bookableItemPrices` prop was not in scope (destructure missing) → `ReferenceError` at parse time. Always capture the runtime error first.

**INV-13** (round 6.2.20, post-6.1): Pre-commit gate: run at least 1 Vitest + 1 PHPUnit sample exercising the changed code path. Plus full stash-then-rerun (see §12).

---

## 4. The 12 frontend bug classes

(See `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` for full discriminators.)

| # | Class | User says | First audit target |
|---|---|---|---|
| 1 | Static-display field-missing | "field X is missing" | 7-layer pre-flight (§2 INV-X10) |
| 2 | Form state (useState capture) | "after submit, field is empty" | per-render reconciliation in wrapper |
| 3 | Dynamic state (stale closure / dep array) | "I click X, UI doesn't update" | `useEffect` dep array + closure + stepper wiring |
| 4 | Data binding (route boundary) | "works on direct URL but not from list" | normalizer return type; forward missing fields + fallback to `location.state.booking` |
| 5 | Perception (visual feedback gap) | "no visual feedback" | hover/loading/contrast |
| 6 | Mock data (hardcoded fakes) | "is X real or mock?" | grep leaf for literal, verify with DB |
| 7 | Deployment bundle out of sync | "still broken after refresh" | bundle-grep FIRST — index hash vs working tree |
| 8 | Route/forward layer downsize | "dashboard shows mock data" + useMemo | App.tsx literal + narrow helper type + container local type |
| 9 | figma-ui default = route to wrapper | "figma-ui 嗰邊唔好 commit" | route to wrapper; see §10 (per INV-X1, 2026-06-14) |
| 9b | figma-ui NEEDS editing (now the default per INV-X1) | "patch figma-ui if you must" | see §10.4 (1-place working-tree patch + handoff doc) |
| 10 | Inverse sub-pattern (figma-ui owns UI, wrapper has 0 JSX) | "Membership Tier should be locked to account" | see §10.3 (3-grep audit + 5-hunk shape) |
| 10b | Class #10 + the field affects live Price Breakdown | "the value saves but the total doesn't change live" | `onAddonStateChange` → `liveAddonState` → `usePricePreview` 3-grep audit |
| 11 | Over-engineered confirm step | "the approve button needs 2 clicks" | audit stepper; remove redundant confirm |
| 12 | Enum-mismatch mapper silently mislabels unmapped backend values | "label is wrong for booking N" | mapper `default` branch — silently mislabels unmapped backend values |

---

## 5. The 12 contract-test-first anti-patterns (PIT-1..PIT-12)

(See `~/.hermes/skills/contract-test-first-workflow/SKILL.md` v0.6.0 for the canonical list with case studies.)

| # | Anti-pattern | Symptom | Fix |
|---|---|---|---|
| 1 | phantom-field | Field exists in DB + validator + mapper + form, but payload never sent | Add to `handleSubmit` payload (Path A), not backend tolerance (Path B) |
| 2 | the-lie (`Math.max(1, length) + max(1, count) + min:1`) | Math silently coerces 0 to 1 | Drop the `max(1, ...)`; use 0 |
| 3 | missing-mapper-field | Mapper drops a field that view reads | Add field to mapper return type |
| 4 | off-by-some-amount | "Total is $5,000 off" | Trace the formula; check per-kind vs total; check `applyGuestCountFieldsToData` denormalisation |
| 5 | audit-script self-correction | Audit script quietly normalises the input | Rewrite audit to use raw input; verify against the actual code path |
| 6 | missing-source-label | Mapper doesn't surface the field's source | Add `membershipTier` / `companyName` etc. to mapper return |
| 7 | TDZ silent-fire on useMemo adding a new arg | `bookableItemPrices` `ReferenceError` (round 6.2.19) | Add prop to destructure (NOT optional chain) |
| 8 | relative fetch() URL resolves to wrong origin | `fetch('./api/...')` returns index.html | Use absolute URL or import `getApiBaseUrl()` |
| 9 | hard-coded `lookupXxx` with WRONG values | `limoPrice = 1500` while DB has 800 | Drop hard-coded constants; fetch from `bookableItemsCache` |
| 10 | service-pre-applies-multiplier-but-call-site-folds-after | Double discount | Pick one path; suppress the other (INV-6) |
| 11 | preview-path-lags-apply-path | `previewPrice` returns old total; `apply` returns new | Mirror apply path in preview path; 4-step audit |
| 12 | shared-formula-cascade-across-buckets | Changing PS bucket breaks LD bucket | Extract formula to single source (INV-2) |

---

## 6. API contract (master reference)

### 6.1 Response envelope (canonical, applies to ALL endpoints)

```json
// Success (200, 201, 204)
{
  "success": true,
  "data": { /* resource OR { data: <resource>, meta: { pagination } } */ },
  "message": "Optional success message"
}

// Validation error (422)
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": { "field_name": ["Validation error message"] }
}

// Auth error (401, 403)
{
  "success": false,
  "message": "Unauthenticated." /* or "Account is inactive..." */
}

// Server error (500)
{
  "success": false,
  "message": "Server Error"
}
```

**Pagination envelope** (when listing):
```json
{
  "success": true,
  "data": { /* resource array */ },
  "meta": { "current_page": 1, "per_page": 10, "total": 247, "last_page": 25 }
}
```

### 6.2 Endpoint inventory (29 Route:: declarations, ~80 endpoint lines)

Full reference: `backend/hkial-api/api_endpoints.md`. Top 10 prefixes by route count:

| Prefix | Count | Notes |
|---|---|---|
| `/auth/*` | 13 | 2 systems: staff (Sanctum) + member (custom auth.api) — see §7 |
| `/bookings/*` (admin) | 8 | `index`, `show`, `showByBookingNo`, `store`, `update`, `updateStatus`, `destroy`, `pricePreview`, `nextBookingNo`, `schedules/all`, `schedules/suite`, `schedules/table`, `settings GET/PUT` |
| `/applications/*` | 6 | `index`, `show`, `store`, `verifyEmail`, `approve`, `reject` |
| `/travel-agencies/*` | 13 | CRUD + nested `/contracts`, `/members` |
| `/promo-codes/*` | 7 | CRUD + `/validate` |
| `/pos/*` | 6 | `orders/*`, `kitchen` |
| `/suites/*` | 4 | `index`, `show`, `updateStatus`, `floor-plan` (public) |
| `/prices/*` | 6 | CRUD + `/combo-discount GET/PUT` |
| `/member/bookings/*` (customer) | 6 | Mirror of `/bookings/*` for member auth (auth.api) |
| `/purchases/*` | 5 | CRUD + `/send-invoice` |

**Middleware groups** (the 4 patterns to know):
- `auth:sanctum` + `permission:<X>` — staff with RBAC
- `auth:sanctum` alone — staff, any role
- `auth.api` — member-only (custom SHA256 lookup, see §7.4)
- `auth.api.or:sanctum` — dual-auth (e.g. `GET /bookings` index, `POST /promo-codes/validate`)
- `throttle:auth` / `throttle:auth-register` / `throttle:forgot-password` — rate limits

### 6.3 Key resources (no `JsonResource` subclasses — controllers return raw Eloquent)

Per audit (2026-06-12): `app/Http/Resources/` does NOT exist. Controllers return raw Eloquent models inside `data: ...`. Shape is dictated by `Booking::$casts` (see §8.2).

**Why no Resources class**: legacy tech-debt from the 2026-03 build. This is a candidate for a future refactor — if/when the resource shape needs to diverge from the Eloquent model (e.g. for v1 API vs internal), introduce `app/Http/Resources/`. Until then, the Eloquent model IS the API contract.

### 6.4 Delta protocol (the "spec doesn't rot" rule)

**Rule**: when an endpoint changes (new field, renamed field, new enum value, changed response shape), the change MUST be reflected in this spec within the same commit that lands the backend change. No "I'll update the spec later" — the spec is the contract.

**Format**: 1 line in §6.2 (or §6.3, §7, §8) with `+added YYYY-MM-DD round 6.2.N` or `~modified YYYY-MM-DD round 6.2.N` or `~retired YYYY-MM-DD round 6.2.N`. Example: `+added 2026-06-12 round 6.2.39: has_wheelchair, has_security, has_private_sales boolean columns on bookings`.

**Anti-pattern (current rot)**: `BookingController::update` validator has `has_wheelchair` since 6.2.35, but `$fillable` dropped it silently (BUG #3) — and the spec didn't catch it. Fix going forward: any validator change requires `$fillable` + `$casts` + migration (if new column) verification in the same diff.

---

## 7. Auth — dual-system spec (the full rules)

### 7.1 Two SEPARATE systems, do not mix

| | Staff (admin) | Member (customer) |
|---|---|---|
| Middleware | `auth:sanctum` + `permission:<X>` | `auth.api` (custom SHA256 lookup) |
| Token store | `localStorage.auth_token` | `localStorage.hkial_auth_token` |
| Token format | `id\|plaintext` (Laravel Sanctum) | `id\|plaintext` (Sanctum format, custom lookup) |
| DB storage | `personal_access_tokens.token = SHA256(token-after-pipe)` | same (shared table, different `tokenable_type` = `App\Models\Account`) |
| Login endpoint | `POST /api/auth/login` | `POST /api/auth/member/login` (then `verify-otp`) |
| Login response | `{user, token}` | step 1: `{requires_otp: true, email}`; step 2: `{user, token}` |
| Roles | `Administrator` / `Supervisor` / `Staff` / `Viewer` (RBAC via `permissions` table) | `Diamond` / `Platinum` / `Gold` / `Sapphire` (membership tier) |
| Rate limit | `throttle:auth` | `throttle:auth` (shared) |

### 7.2 Staff login (`POST /api/auth/login`)

- **Request**: `{ email, password }` (both required)
- **On bad creds (422)**: `{success: false, errors: {email: ["The provided credentials are incorrect."]}}`
- **On inactive user (403)**: `{success: false, message: "Account is inactive..."}`
- **On success (200)**: `{success: true, data: {user: {id, name, email, role, status, department, permissions}, token: <plaintext>}, message: "Login successful"}`
- **Auth log** written for both success and failure (`AuthLog` via `LogUserAction` middleware)

### 7.3 Member login (2-step, OTP-gated)

**Step 1** `POST /api/auth/member/login`:
- **Request**: `{ email, password }`
- **On bad creds (401)**: `{success: false, message: "Invalid email or password"}`
- **On unverified email (403)**: `{success: false, message: "Please verify your email first...", requires_email_verification: true}`
- **On success (200)**: `{success: true, data: {requires_otp: true, email, message: "OTP sent to your email."}}` — **NO `user` field, NO `token`**
- OTP: 6-digit, zero-padded, stored as `Hash::make($otp)`, expiry `now()->addMinutes(5)`

**Step 2** `POST /api/auth/member/verify-otp`:
- **Request**: `{ email, otp }` (both required, otp `size:6`)
- **WILDCARD BYPASS**: `888888` always works (any environment)
- Wrapped in `DB::transaction` with `lockForUpdate()` on the account row (OTP race prevention)
- OTP check: `Hash::check($request->otp, $account->otp_code)` + `otp_expires_at` not past
- **On success (200)**: clears OTP, creates token via `$account->createToken('member-token')`, returns `{success: true, data: {user: {...full Account fields...}, token: <plaintext>, token_type: "Bearer"}}`

### 7.4 Member auth middleware (`auth.api`)

File: `app/Http/Middleware/AuthenticateApi.php` (70 lines). Algorithm:
1. `$token = $request->bearerToken()`; if null → 401 `{success: false, message: "Unauthenticated."}`
2. Sanctum format is `id|token`. If `str_contains($token, '|')`, take `substr($token, strpos($token, '|') + 1)`
3. `$hashedToken = hash('sha256', $tokenPart)`
4. `\DB::table('personal_access_tokens')->where('token', $hashedToken)->first()`; if null → 401
5. `$account = Account::find($accessToken->tokenable_id)`; if null → 401
6. `$request->setUserResolver(fn() => $account)` — `$request->user()` returns the `Account` model
7. Return `$next($request)`

**No Sanctum guard, no token expiry check** (relies on `personal_access_tokens` row existence only).

**Test pattern**: `Sanctum::actingAs` does NOT work for member auth. Use direct `personal_access_tokens` insert:
```php
$token = $account->createToken('test')->plainTextToken;
$response = $this->withHeader('Authorization', "Bearer $token")->...
```

### 7.5 `auth.api.or:sanctum` (the dual-auth combo)

File: `app/Http/Middleware/AuthenticateApiOrSanctum.php` (43 lines). Tries `auth:sanctum` first, falls back to the SHA256 path. Used for shared endpoints like `GET /api/bookings` (admin lists all, customer lists own) and `POST /api/promo-codes/validate`.

### 7.6 RBAC permission gate (staff only)

`EnsurePermission` middleware checks `permission:<X>` where `X` is one of:
- `bookings.view` / `.create` / `.update` / `.approve` / `.delete` / `.schedules.view` / `.settings.view` / `.settings.update`
- `accounts.view` / `.create` / `.update` / `.delete`
- `system_users.view` / `.create` / `.update` / `.delete`
- `audit_logs.view`
- (...and 20+ more, see `database/seeders/PermissionSeeder.php`)

**Test anti-pattern**: use `'Staff'` role + explicit permission array, NOT `'Administrator'` (Administrator bypasses gates, so the test passes even if the gate is wrong).

---

## 8. Booking domain — canonical data model + state machine

### 8.1 Entity-relationship (the canonical shape)

```
Account (1) ─── (N) Booking
                    │
                    ├── (N) booking_items (addons) ─── (1) bookable_item
                    ├── (N) suite_assignments (CIP vs Lobby) ─── (1) suite
                    ├── (1) promo_code (optional)
                    └── advanced_details (JSON blob — see §8.3)
```

### 8.2 `Booking` model — canonical columns

Top-level columns (canonical source of truth per INV-5):
```
id, booking_no, guest_name, guest_email, guest_phone,
account_id, suite_id (legacy, null for multi-resource),
flight_type (Arrival|Departure|Transit),
flight_no, flight_time, flight_origin, flight_destination,
date_time,
number_of_guests, non_flying_guests,
is_ad_hoc, has_limousine, has_shopping,
payment_mode (Upfront|OnCredit), booking_type (Online|EmailCall),
status, payment_status, rejection_reason, approved_at, approved_by,
amount, original_amount, discount_amount, total_price, price_breakdown (JSON),
created_at, updated_at
```

**Per-kind guest counts** (round 6.2.31+):
```
premiere_suites, premiere_vip_passengers, premiere_non_flying_guests,
lounge_vip_passengers, lounge_non_flying_guests
```

**Multi-resource** (round 6.2.0+):
```
assigned_suite_ids[]  (nullable, exists:suites)
assigned_lounge_ids[] (nullable, exists:suites)
```

**Service booleans** (round 6.2.35+ — see BUG #3 in §14):
```
has_wheelchair, has_security, has_private_sales
```

### 8.3 `advanced_details` JSON blob (the "everything else" bucket)

The `advanced_details` JSON column holds:
- `flight.legs[]` (Transit 2-leg, 6h gap rule per `TransitLegsRule`)
- `addons.items[]` (limo, wheelchair, security, lounge-extension; per-item `meta` JSON for destinations/passengers)
- `passengers[]` (per-pax: title, firstName, lastName, travelDocNo, membershipNo)
- `nonFlyingGuests[]` (per-NFG: title, firstName, lastName, ageGroup, foodAllergies)
- `contact` (contactPerson: name, email, phone)
- `flightClass` (enum: Economy / Business / First)
- Per-kind segmented guests (`suite_passengers[]`, `lounge_suite_passengers[]`, `suite_nonFlyingGuests[]`, `lounge_nonFlyingGuests[]`)

**Rule (INV-5)**: anything in `advanced_details` that needs SQL querying MUST be promoted to a top-level column. Always write BOTH (top-level + JSON mirror) for backward compat.

### 8.4 Status state machine (canonical)

```
PendingForReview ──→ PendingForApproval ──→ Approved ──→ Confirmed
       │                    │                  │           │
       │                    │                  │           ├──→ Cancelled (terminal)
       └──→ Rejected (terminal)               │           └──→ NoShow (terminal)
       └──→ Cancelled (terminal)              │
                            └──→ PendingForReview (send-back)
                                             └──→ Rejected / Cancelled / NoShow
```

**Rules**:
- `Reject` and "send back to PendingForReview" require non-empty `rejection_reason`
- On `Approved`: sets `approved_at = now()` and `approved_by = <user_id>`
- `Rejected` / `Cancelled` / `NoShow` are terminal

**Locked transitions** (current `BookingController::update` validator) — see §14 BUG #3 for the silent-drop bug. **Locked transitions** (current `MemberBookingController::update` validator) — see §14 M4 for the missing-field bug.

### 8.5 Booking number format

```
{PREFIX}-{DATE}-{SEQUENCE}
Example: A-20241025-000001
```
- Prefix: `A` (Arrival), `D` (Departure), `T` (Transit)
- Date: `YYYYMMDD`
- Sequence: 6-digit sequential per day

**Endpoint**: `GET /api/bookings/next-no?flight_type=Arrival` (staff preview) / `GET /api/member/bookings/next-no?flight_type=Arrival` (member preview). Returns `{booking_no, flight_type, preview_only: true}`. The form should fetch on mount, NOT use `Math.random()` (per pending `2026-06-10-quickfill-bookingno-cleanup.md`).

---

## 9. Pricing domain — K-class conflict protocol

### 9.1 The 4 pricing services (canonical)

```
PricingContext (read-only)            ← pure compute, no side effects
    ↓
PricingService::compute()             ← single-kind compute
PricingService::computeMultiKind()    ← multi-kind (PS + LD) sum-of-sub-contexts
    ↓
PricingPreviewService::preview()      ← POST /api/bookings/price-preview (no DB write)
PricingApplyService::apply()          ← called from controller, writes booking.amount/total_price
AddonsSyncService::sync()             ← folds addons.items[] into booking_items
```

**Apply path** (the one that writes to DB): `BookingController::store/update` → `Apply` → `applyGuestCountFieldsToData` (denormalise per-kind) → `AddonsSyncService::sync` → `applyPricing` → `PricingApplyService::apply` → `Booking::amount/total_price/price_breakdown` written.

**Preview path** (the one the form polls): `POST /bookings/price-preview` (admin) or `POST /member/bookings/price-preview` (member) → `PricingPreviewService::preview` → returns `{amount, total, breakdown}`. **MUST mirror the apply path** (PIT-11).

### 9.2 K-class conflict protocol (the "which rule wins" arbitration)

When a pinned test (the "K" tests in `BookingFlowMatrixTest`) encodes a business rule that conflicts with a user request:
1. **Surface the conflict with a 4-question structure** (per HKIAL/AGENTS.md §8):
   - Q1: What does the test encode? (the rule)
   - Q2: What does the user want? (the override)
   - Q3: What's the impact? (revenue / customer trust / audit)
   - Q4: Can both be right? (reconcile or pick one)
2. **Do NOT silently break the pinned test** (the "rule conflict" line in HKIAL/AGENTS.md §8)
3. Write a `docs/pending-changes/<date>-<topic>.md` doc with the 4 Qs + recommended pick
4. **Wait for Sky's call** (per INV-X7, terse reply = decision, execute)
5. If Sky says "your choice are wise, please go" → recommend the safer pick (the one that doesn't break the test), state the trade-off, then apply

**Active K-class conflicts** (2026-06-13):
- **K4 vs Rule B**: PS Note 5 cap + infant counting rule. K4 says "infants count toward cap"; Rule B says "they don't". 1-line backend hunk + 1-line frontend chip hunk UNCOMMITTED in favor of Rule B. **Awaiting Q1** (pending `2026-06-10-ps-cap-infant-rule-conflict.md`).
- **K7 (Q8 fallback)**: per-kind denormalisation to 0 (not null) causes `perKindReliable` check to fail → fallback fires → wrong NFG pricing. Tracked in pending `2026-06-10-6.2.33-infant-nfg-zero-charge.md`.

### 9.3 The 5 pricing matrices (the test grid)

The `BookingFlowMatrixTest` covers ~218 cases. The 5 dimensions are:
1. **Product kind** (PS / LD / multi-kind)
2. **Pax count** (1 / 2 / 3+)
3. **NFG count** (0 / 1 / 2 / 3+; per-kind vs total)
4. **Addon combination** (limo / wheelchair / security / lounge-extension / none)
5. **Booking status** (Pending → Approved → Confirmed)

For multi-kind, EACH sub-context is computed independently and summed (but the NFG split bug in BUG #1 sends the SAME `nonFlyingGuests` total to BOTH sub-contexts, double-billing — see §14).

### 9.4 Pricing invariants (the "what CAN'T change without a 5-Q&A" list)

- **NFG is FREE if age < 2** (per pending 6.2.33 source fix, NOT yet pinned)
- **Note 5 cap**: Premiere Suite is capped at 5 guests total (PS-specific) — see K4 conflict
- **Limo is single-bill**: 1 limo = 1 price (INV-6, single source)
- **Wheelchair is FREE** (HK$0)
- **Lounge Extension**: HK$1500/hour, 1-6 hours
- **Security Escort**: HK$1200 flat
- **Transit surcharge**: TBD (open Q)

Any change to these requires a 5-Q&A per `test-design-matrix` (Q0-Q4 in HKIAL/references/pointer-index.md §9).

---

## 10. Figma-UI submodule policy + sync workflow

### 10.1 The default rule (INV-X1, updated 2026-06-14)

The figma-ui submodule is owned by Randy. The agent may make **minimal working-tree patches**; Sky handles the sync. Default behaviour:
- ✅ Minimal figma-ui edits are allowed (smallest possible diff; no structural rewrites, new files, or new dependencies)
- ❌ No `git add` / `commit` / `push` inside the submodule
- ❌ No submodule pointer bump in parent repo
- ❌ No `git commit` or `git push` in parent repo for submodule changes
- ❌ Don't break the figma Make import path (no new imports / deps figma Make can't supply)
- ✅ Patch the working tree, deliver `cd figma-ui && git diff` for Sky
- ✅ Use `@/` alias for figma-ui cross-tree imports, NOT relative `../` (vite treats the submodule as a separate root)
- **Default decision rule**: prefer to fix in the parent wrapper when the wrapper can absorb the change; patch figma-ui only when (a) the surface is in figma-ui and the wrapper has no equivalent, OR (b) fixing in the wrapper would leak figma-internals into the parent.

### 10.2 The 30-second pre-patch check (do this BEFORE any patch)

```bash
# 1. Is the submodule working tree dirty (from Randy's regen or another session's WIP)?
cd <repo>/src/components/figma-ui
git status --short
# If M/MM/AM: surface the existing hunks in your deliverable, don't silently merge
# your 1-line patch into someone else's 47-line diff.

# 2. Confirm the file you intend to patch is the one that ships
grep -nE "from.*components.*<Name>" <repo>/src/routes/index.tsx
grep -rn "figma-ui.*<Name>" <repo>/src/
# (Customer) If wrapper imports the form, the wrapper is the source of truth, not figma-ui
# (Admin) If figma-ui's BookingDetail is the inline source, figma-ui IS the source of truth
```

### 10.3 The 3-grep audit (admin inverse sub-pattern, class #10)

Run BEFORE any admin patch that touches a figma-ui field:

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

**Decision matrix** (from `hkial-container-view-pattern` §3):

| Grep #1 returns hits in... | Field's UI owner | Patches go to... |
|---|---|---|
| wrapper only | wrapper | wrapper |
| **figma-ui only** | **figma-ui** | **figma-ui (working tree only, per INV-X1)** |
| both | shared (rare) | both, carefully synced |
| 0 in both | no UI exists yet | design first, then create |

| JSX | State | Emit | Pattern | Bug class |
|---|---|---|---|---|
| wrapper | wrapper | wrapper | Standard | n/a |
| **figma-ui** | **figma-ui** | **figma-ui** | **Inverse (class #10) — patch figma-ui only** | **#10** |
| figma-ui | wrapper | wrapper | Mixed — figma-ui is dumb, wrapper owns state | usually #9 fix-up |
| wrapper | figma-ui | figma-ui | Confused | audit + likely rewrite |

### 10.4 Class #9b — figma-ui NEEDS editing (no longer an exception; default per INV-X1)

**Retired 2026-06-14**: the previous "3-place fix with parent pointer bump" is no longer needed. INV-X1 now allows minimal figma-ui patches by default. The "Sky explicitly OK'd" gate is removed.

Only when (1) figma-ui has the surface AND (2) wrapper has no surface to receive the fix:

1. **figma-ui submodule working tree** (NO commit, NO pointer bump): make the minimal patch directly. Use `@/` alias, keep pre-existing exports, hook degrades gracefully to fallback. Sky syncs to Figma Make code base + figma-ui's own repo + bumps parent pointer in their own workflow.
2. **Handoff doc**: deliver `cd figma-ui && git diff` of the change in the handoff's "Deploy reminder for Sky" section so Sky can sync.

### 10.5 Multi-session shared working tree

If 2+ sessions touch the same figma-ui file, run the hunk-collision protocol (see `~/.hermes/skills/hkial-customer-frontend-figma-codebase-sync/SKILL.md` v1.24+). Pre-session check: `cd figma-ui && git diff <file>` to see pre-existing WIP.

### 10.6 Sync handoff for Sky (the deploy checklist)

When a figma-ui patch lands, the handoff doc MUST include:
```markdown
## Deploy reminder for Sky
- [ ] figma-ui submodule has uncommitted working-tree changes in:
    - <file 1>: <1-line description>
    - <file 2>: <1-line description>
- [ ] Manual sync protocol:
    cd figma-ui && git add . && git commit -m "round 6.2.N: <topic>"
    cd ../.. && git add src/components/figma-ui && git commit -m "bump figma-ui pointer"
    # Then push both
- [ ] After push, rebuild + redeploy <customer|admin> docker image
```

---

## 11. Test strategy — 3-layer contract-first

### 11.1 The 3 test types (the "shift left" principle)

| Layer | Tool | What it tests | Run command |
|---|---|---|---|
| **L1 — Backend round-trip** | PHPUnit (SQLite `:memory:`) | POST → DB → GET (resource mutation, datetime, decimal, RBAC, member auth) | `php artisan test` |
| **L2 — Frontend contract** | Vitest (mocked fetch) | API service function returns the shape consumers expect; wire shape includes new fields; mapper preserves fields | `npx vitest run` |
| **L3 — Spec E2E** | Playwright (real browser, real backend) | Full flow: login → form fill → submit → assert DOM (NOT just API) | `npx playwright test` |
| **L4 — Runtime check** | Playwright `page.on('pageerror')` | For UI bugs, mandatory (INV-9) | see `hkial-frontend-bug-debug-checklist` |

**Rule**: contract tests mirror the REAL producer, not the spec doc. The 2026-06-05 addons bug: contract test sent `addons.items[]`, real frontend sent `addons.selectedKeys[]` — tests green, bug live (PIT-1 phantom-field inverted).

### 11.2 Test fixture rules (the 3 categories)

| Category | Rule | Example |
|---|---|---|
| Test fixture | Mirror what the service ACTUALLY returns | `authService.test.ts` mocks `fetch` to return the real `ApiResponse<AuthResponse>` shape |
| Contract test fixture | Mirror the real backend response — cite file:line | `bookingService.test.ts` cites `BookingController.php:152` for the show response shape |
| Production fallback mock | Architectural (MOCK_*). Test container prop forwarding instead | `EditBooking.test.tsx` tests that the container passes `liveAddonState` to the view, not that the view reads MOCK_* |

### 11.3 Test commands per subproject

| Subproject | L1 (unit/API) | L2 (frontend unit) | L3 (E2E) | Typecheck |
|---|---|---|---|---|
| `backend/hkial-api/` | `php artisan test` (46 feature tests) | n/a | n/a | `php -l <file>` + `./vendor/bin/pint --test` |
| `backend/hkial-react/` | n/a | `npx vitest run` (~224 tests) | `npx playwright test` (79 specs) | `npx tsc --noEmit` |
| `frontend_react/frontend/` | n/a | `npx vitest run` (~221 tests) | `npx playwright test` | `npx tsc --noEmit` |

### 11.4 Test baselines (pre-existing fails, do NOT add to count)

| Subproject | Pre-existing | Source |
|---|---|---|
| `hkial-api` | `ContractManagementContractTest::test_update_contract_rejects_credit_used_greater_than_credit_limit_M2` (1) | Round 6.2.31+ cascade, unrelated to recent work |
| `hkial-api` | `BookingFlowMatrixTest` (5 cases, K4 + K7) | Round 6.2.31 cascade, deferred to follow-up |
| `hkial-api` | 3 new BUG-PINNED in `BookingDeepAuditTest` (6.2.39 audit) | INTENDED to fail until §14 BUG #1/#2/#3 fixed |
| `hkial-react` | `tsc --noEmit` ~76 known errors | Pre-existing, do not add to count |
| `frontend_react/frontend` | `tsc --noEmit` ~379 pre-existing errors | Pre-existing (mostly in `__tests__/`, `figma-ui/.../Analytics.tsx`) |

**Rule**: your commit should NOT increase the pre-existing fail count. If you can't fix a pre-existing fail in the same round, defer it (write a `docs/pending-changes/` doc + commit only the source changes).

---

## 12. Pre-commit gate (4 phases, MANDATORY)

See `HKIAL/skills/hkial-pre-commit-gate/SKILL.md` for the full recipe. Summary:

| Phase | What | Why |
|---|---|---|
| **Phase 1** | Stash-then-rerun: `git stash && php artisan test && git stash pop` | Confirms YOUR fixes are green, not pre-existing |
| **Phase 2** | Lint + type check (Pint / tsc / eslint) | Catches style + type errors before test |
| **Phase 3** | Sample test (1 test class first) | Catches setup-infra bugs (broken test runner, wrong import path) |
| **Phase 4** | Full test suite (PHPUnit + Vitest + Playwright + tsc) + runtime e2e if UI fix | The final gate |

**The "should I commit" checklist** (in your head):
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

---

## 13. Handoff discipline

### 13.1 The 6-section template

```markdown
# <Task name> — <date>

## TL;DR
<1-2 sentences. What changed, what was the trigger, what's the new state. Round number if applicable.>

## What shipped
- <commit SHA 1>: <1-line description>
- <commit SHA 2>: <1-line description>
- Test counts: PHPUnit <N>/<N>, Vitest <N>/<N>, Playwright <N>/<N>

## Files touched
- `<path/to/file1>`: <1-line description of change>
- `<path/to/file2>`: <1-line description>
- `<new file path>`: <new>

## Pre-existing fails noted
- `<TestFile>`: <N> cases pre-existing fail (not yours, deferred to <ticket>)

## Deploy reminder for Sky
- [ ] <Image 1> needs to be rebuilt + pushed
- [ ] <Image 2> needs to be rebuilt + pushed
- [ ] figma-ui submodule has working-tree changes (manual sync per INV-X1 — agent does NOT commit / push inside)

## Follow-ups
- <Task X> deferred (reason)
- <Task Y> blocked on <user Q1, Q2>
```

### 13.2 Per-subproject location map

| Primary work | Location |
|---|---|
| Customer NewBooking, EditBooking, /mybooking, /auth, /dashboard | `frontend_react/frontend/docs/handoff/<date>-<task>.md` |
| Admin CreateBooking, EditBooking, BookingDetail, BookingReview, PriceManagement, Accounts | `backend/hkial-react/docs/handoff/<date>-<task>.md` |
| Pending design Q&A / multi-phase plans (NOT yet shipped) | `backend/hkial-react/docs/pending-changes/<date>-<topic>-plan.md` |
| API (Laravel) — controller, service, migration | `backend/hkial-api/docs/handoff/<date>-<task>.md` (when dir is created) |
| Cross-project (3-app deploy, monorepo commit, both frontends) | `HKIAL/handoff/<date>-<task>.md` (when this folder is created) |

**Each subproject has a `docs/handoff/README.md` index** (chronological TL;DR). When you write a new handoff, add 1 row to the index.

### 13.3 Round numbering

HKIAL uses `6.0`, `6.1.1`, `6.2.7`, etc. for chronological progression. Major version bump = architecture change (e.g. 6.0 = multi-resource, 7.0 = API versioning). When in doubt, check the previous handoff's TL;DR for the current round number and bump it.

### 13.4 When to write a handoff

| Session type | Write handoff? |
|---|---|
| Multi-file bug fix (e.g. "X 唔喺 total" with 5-layer audit) | **Yes** |
| New feature (>2 files, >1 frontend surface) | **Yes** |
| Round-N pricing arithmetic (Q8, K-class conflict) | **Yes** |
| figma-ui minimal patch (INV-X1) | **Yes** |
| Deploy (3-app coordinated) | **Yes** |
| Trivial 1-line typo fix | No (commit message enough) |
| Documentation update (AGENTS.md, README) | No |
| Skill authoring (new Hermes skill) | Optional |

When in doubt, write one. A 1-paragraph handoff is better than none.

---

## 14. Open bugs + pending rot (LIVE STATE)

> This is the live "what's still broken" report. Update on every round. **No deletions** — moved to FIXED subsection with `[fixed YYYY-MM-DD round 6.2.N]`.

### 14.1 OPEN — Critical (revenue / data integrity)

| ID | Bug | File | Impact | Owner | Status |
|---|---|---|---|---|---|
| **B1** | Multi-kind NFG over-bills by ~$5k/booking | `app/Services/Pricing/PricingApplyService.php:188-204` | Revenue: over-bills customer on PS+LD+NFG combo | TBD round | 4 failing tests pin it (`BookingFlowMatrixTest:909/1040`, `PricePreviewContractTest:432/471`, `BookingDeepAuditTest::test_multi_kind_ps_ld_2_nfg_prices_correctly`). Fix: split `nonFlyingGuests` per-kind in `computeMultiKind()`. 2-4 hours. |
| **B2** | Customer edit does NOT re-price | `app/Http/Controllers/Api/MemberBookingController.php:369-373` | Customer-facing: stale price after edit | TBD round | 1 failing test pins it (`BookingDeepAuditTest::test_member_edit_does_not_reprice`). Fix: 1-line — add `(new PricingApplyService())->apply($booking, $request)`. 15 min. |
| **B3** | 3 boolean columns silently dropped | `app/Models/Booking.php:11-60` ($fillable) + missing migration | Data integrity: form looks like it saves but DB stays null | TBD round | 1 failing test pins it (`BookingDeepAuditTest::test_admin_update_has_wheelchair_silently_dropped`). Fix: migration + $fillable + $casts. 1 hour. |

### 14.2 OPEN — Medium (incomplete coverage / spec drift)

| ID | Issue | Where | Round 6.2.35+ status |
|---|---|---|---|
| M1 | Admin asymmetric `flight_origin/destination` max:255 (store) vs max:10 (update) | `BookingController.php:244-245` vs `366-367` | Pinning test exists; fix 5 min (make both `max:10`) |
| M2 | `lounge` / `terminal` columns GHOST FILLABLE — no migration adds them | `Booking.php:41-42` + missing migration | SQLite test gap; only dev MySQL has them. Add migration. |
| M3 | `flight_time` DUPLICATE in `$fillable` (cosmetic) | `Booking.php:20, 43` | 1 min fix |
| M4 | Member update validator missing `has_limousine` + `has_shopping` (asymmetric vs admin) | `MemberBookingController.php:261-311` | 5 min fix |
| M5 | Member update validator still accepts deprecated `lounge` / `terminal` | `MemberBookingController.php:277-278` | 5 min fix |
| M6 | `payment_status` column has no enum cast | `Booking.php:$casts` | Cosmetic |
| M7 | Admin `BookingEdit.tsx` missing 30+ fields vs `CreateBooking.tsx` | `figma-ui/.../BookingEditView.tsx` | Phase 2-4 of coverage plan, ~1.5 weeks |
| M8 | Admin `BookingEditDialog.tsx` is read-only despite "Edit" button | `figma-ui/.../BookingEditDialog.tsx:524` | UX wart — relabel or rewrite |
| M9 | `CreateBooking.tsx:263` `bookingMemo` is passed as prop but figma-ui never uses it | `src/components/CreateBooking.tsx:263` | UX wart (merged into `notes` on submit) |
| M10 | ~~`BookingsContainer.normalizeBooking` not exported until 6.2.36~~ | n/a | **[fixed 2026-06-11 round 6.2.36]** |
| M11 | Hardcoded 22-key addon list drifts from real catalog (3 places) | figma-ui `CreateBooking.tsx`, `BookingEditView.tsx`, `BookingEditDialog.tsx` | Extract shared `addons.ts`. 4-6 hours. Test pin exists. |

### 14.3 OPEN — Low (tech debt)

| ID | Issue | Where | Status |
|---|---|---|---|
| L1 | `flightType` is account-bound, not staff-editable (admin Edit A) | `figma-ui/.../BookingEditView.tsx:222-223` | Phase 2 of coverage plan |
| L2 | `mapFlightType` mapper doesn't account for `flight.legs[]` | admin mapper | Cosmetic |
| L3 | `paymentMode` hardcoded in admin Edit A (becomes `Upfront` on save) | admin Edit A | Data corruption |
| L4 | 6 account fields dropped silently in BookingDetail (`companyName`, `membershipTier`, `accountDiscountPct`, `promoCode`, `accountRemark`, `bookingChannel`) | `figma-ui/.../BookingDetail.tsx:388-393` | Mapper fix |
| L5 | `hasResources` short-circuit in BookingDetail wrong for "Pending pricing" | `figma-ui/.../BookingDetail.tsx:153-168` | Works by accident after 6.2.38 fix, but logic confusing |
| L6 | `EditBooking.tsx:1480-1495` leg 2 state clearing on flightType change | customer EditBooking | Deferred (UX wart) |
| L7 | `figma-ui/.../EditBooking.tsx` is DEAD CODE | figma-ui customer | Delete or mark deprecated |
| L8 | `frontend_react/frontend/src/components/NewBooking.tsx` (215KB) is DEAD CODE | customer | Delete |

### 14.4 PENDING — Design Q&A (5-Q awaiting Sky's call)

| ID | Topic | Pending doc | Qs | Status |
|---|---|---|---|---|
| Q-A | NFG infant = 0 charge (K-class) | `2026-06-10-6.2.33-infant-nfg-zero-charge.md` | 5 (Q1 source, Q2 denorm, Q3 test) | Source fix SHIPPED to `PricingService.php:222`; 5 feature test failures DEFERRED |
| Q-B | Age dropdown normalize (Adults 12+ / Children 2-11 / Infants <2) | `2026-06-10-age-dropdown-normalize.md` | 5 (Q1 schema, Q2 mapper, Q3 sync, Q4 seeder, Q5 fixture) | 5 Qs TIMED OUT, defer-with-marker |
| Q-C | Price preview trigger by quantity (not assignment) | `2026-06-10-price-preview-trigger-by-quantity.md` | 1 (Q1 numLoungeDeluxe default) | Awaiting Q1 |
| Q-D | PS Note 5 cap + infant rule (K4 vs Rule B) | `2026-06-10-ps-cap-infant-rule-conflict.md` | 1 (Q1 which rule wins) | **CRITICAL**: 1-line backend + 1-line frontend hunk UNCOMMITTED |
| Q-E | Quick Fill removal + server-fetched bookingNo | `2026-06-10-quickfill-bookingno-cleanup.md` | 2 (Q1 which layer, Q2 fallback) | Awaiting Q1, Q2 |
| Q-F | Edit Booking coverage (4 design Qs) | `2026-06-11-edit-booking-coverage-plan.md` | 4 (Q1 which surface, Q2 validator, Q3 source of truth, Q4 account_id reassignment) | A/A/A/A picked, Phase 0+1 shipped (rounds 6.2.35-36); Phase 2-4 deferred |

### 14.5 ROT — Old plans / skills / docs that need refresh

(Anti-rott detection — see §16.3 for the audit script.)

| ID | Item | Last updated | Rot level | Action |
|---|---|---|---|---|
| R1 | `backend/spec.md` (admin-only, March 2026) | 2026-03-27 | **HIGH** | Superseded by THIS file (HKIAL/spec.md v2.0.0). Move to legacy, add redirect notice. |
| R2 | `frontend_react/frontend/DEVELOPMENT_GUIDE.md` (23k, pre-spec) | 2026-05-05 | MED | Add a 5-line banner linking to HKIAL/spec.md v2.0.0; keep as long-form tutorial |
| R3 | `frontend_react/frontend/PROJECT_SUMMARY.md` (73k, system overview) | 2026-05 | MED | Same — add banner |
| R4 | `frontend_react/frontend/BOOKING_VIEW_INVENTORY.md` (38k) | 2026-05 | MED | Same — add banner |
| R5 | `frontend_react/frontend/PROMO_CODE_INVENTORY.md` | 2026-05 | LOW | Add banner |
| R6 | `backend/.opencode/agent/hermes.md` (292 lines) | 2026-06-12 | LOW | Add 1-line footer: "for spec, see HKIAL/spec.md" |
| R7 | `HKIAL/.hermes/MEMORY.md` | unknown | LOW | Audit at next session |
| R8 | `HKIAL/references/pointer-index.md` (214 lines) | 2026-06-12 | LOW | Index slightly stale (counts: customer=4, admin=9, pending=6, index says 3/5/5). Run handoff count + update. |
| R9 | Old `2026-04-27-handoff.md` (baseline, pre-pilot) | 2026-04-27 | LOW | Keep as historical reference |
| R10 | `hkial-booking-view-contract-pilot` skill (no version) | unknown | LOW | Add version + last-used date |
| R11 | `hkial-smoke-test/` skill (script only) | 2026-05 | LOW | Add 1-line SKILL.md (currently just a script) |
| R12 | `HKIAL/skills/hkial-frontend-disambiguation/SKILL.md` v1.0.0 | 2026-06-12 | NONE | Fresh |
| R13 | `HKIAL/skills/hkial-handoff-discipline/SKILL.md` v1.0.0 | 2026-06-12 | NONE | Fresh |
| R14 | `HKIAL/skills/hkial-pre-commit-gate/SKILL.md` v1.0.0 | 2026-06-12 | NONE | Fresh |
| R15 | `HKIAL/skills/hkial-container-view-pattern/SKILL.md` v1.0.0 | 2026-06-12 | NONE | Fresh |
| R16 | `HKIAL/skills/hkial-setup-onboarding/SKILL.md` v1.0.0 | 2026-06-12 | NONE | Fresh |
| R17 | `HKIAL/skills/hkial-azure-deploy/SKILL.md` v1.0.0 | 2026-06-12 | NONE | Fresh |

---

## 15. HKIAL-API dev order redesign (the API-first protocol)

> **Motivation**: the current rot shows that the API is being patched reactively to fix front-end bugs (B2, B3, M4, M5 — all 6.2.35+ follow-ups to 6.2.30 front-end changes). The fix is to redesign the dev order so the API is the SOURCE of truth, and frontends consume a stable contract.

### 15.1 The new dev order (5 phases, must be sequential)

```
Phase 0 — SPEC (this file)
   │
   ▼
Phase 1 — SCHEMA (Laravel migration + Eloquent model + $casts + $fillable + JsonResource if needed)
   │
   ▼
Phase 2 — CONTRACT TEST (PHPUnit round-trip with realistic fixtures — the same fixtures the frontend will mock)
   │
   ▼
Phase 3 — IMPLEMENTATION (Controller validator + store/update + service call)
   │
   ▼
Phase 4 — FRONTEND CONSUMPTION (api.ts type + service function + container spread + form onSubmit) — both frontends in parallel
   │
   ▼
Phase 5 — E2E VERIFICATION (Playwright spec, real browser, real backend, pageerror listener)
```

### 15.2 Phase 0 — SPEC (this file)

Before ANY code:
- Update §6 (API) / §7 (Auth) / §8 (Booking) / §9 (Pricing) for the new feature
- Add 1 line per new field with `+added YYYY-MM-DD round 6.2.N`
- If new invariant: add to §2/§3, update INV count
- If new anti-pattern: add to §5
- Self-critique: 3-5 trade-offs + known-shortcut + silent-regression risks (per HKIAL/AGENTS.md §8 "fix it as your best")

**Anti-pattern to break**: the current pattern is "fix front-end, then update spec" — which means the spec is always 1 round behind. The new pattern is "update spec, then implement".

### 15.3 Phase 1 — SCHEMA (no controller logic yet)

Order of work:
1. **Migration**: `php artisan make:migration add_<field>_to_<table>_table`. Run `php artisan migrate --pretend` first to see the SQL, then drop `--pretend` for real (against SQLite `:memory:` for tests, then against dev MySQL — per INV-X2, NEVER `migrate:fresh --seed` against dev MySQL).
2. **Eloquent model `$fillable`**: add the new field. **Always verify with the 7-layer pre-flight in reverse**: form → container → api.ts → validator → **$fillable** (this layer) → DB. The 6.2.35 bug was a missing $fillable.
3. **Eloquent model `$casts`**: boolean / decimal:2 / array (for JSON) / datetime / enum (for status enums).
4. **`JsonResource` if needed**: only when the API response shape needs to diverge from the Eloquent model (e.g. hide internal columns, rename). Otherwise skip — controllers return raw Eloquent (see §6.3).
5. **PHPUnit migration test**: verify the new column exists + default + nullable.

**Pre-flight gate**: before Phase 2, the migration must be reversible (`php artisan migrate:rollback --step=1` works), the model must compile (`php -l` + `php artisan tinker --execute='new App\\Models\\Booking'`), and the SQLite test schema must reflect the new column.

### 15.4 Phase 2 — CONTRACT TEST (PHPUnit round-trip with REALISTIC fixtures)

The single most important phase. **Write the failing test FIRST, then implement**.

Test shape (the canonical 4-step round-trip):
```php
public function test_create_booking_with_<new_field>_round_trips(): void
{
    // 1. Create with realistic values (NOT "foo"/"bar")
    $payload = [
        // ... all required fields ...
        '<new_field>' => <realistic value>,
    ];
    $response = $this->postJson('/api/bookings', $payload);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // 2. Read back
    $get = $this->getJson("/api/bookings/{$id}");
    $get->assertStatus(200);
    $get->assertJsonPath('data.<new_field>', <expected value>);

    // 3. Update
    $update = $this->putJson("/api/bookings/{$id}", ['<new_field>' => <new realistic value>]);
    $update->assertStatus(200);

    // 4. Read back again (assert the new value, not the original)
    $get2 = $this->getJson("/api/bookings/{$id}");
    $get2->assertJsonPath('data.<new_field>', <new expected value>);
}
```

**Critical patterns** (the 5-Q contract):
- **Datetime**: include timezone-sensitive cases (HKT 14:00 round-trips as 14:00)
- **Decimal**: assert against string `'5000.00'`, not int `5000`
- **Boolean**: assert against `true` / `false`, not `1` / `0`
- **Enum**: assert against the enum value string, not the index
- **Member auth**: use `personal_access_tokens` insert pattern (see §7.4)
- **RBAC**: use `'Staff'` role + explicit permission array (see §7.6)
- **Realistic fixtures**: copy from the actual frontend payload (`page.on('request', ...)` capture in Playwright, see INV-X8). Do NOT make up a fixture — the 6.2.5 addons bug was caused by a fabricated fixture.

**Test count rule**: per round, add at least 3 PHPUnit tests per new field (create round-trip, update round-trip, validation rejection). For multi-field features, add a matrix test (`BookingFlowMatrixTest` is the canonical example — 218 cases).

### 15.5 Phase 3 — IMPLEMENTATION (controller + service)

Order of work:
1. **Controller validator**: add the new field to the `validate()` call. Use `sometimes|nullable` for update-only fields (creates-vs-updates asymmetric pattern).
2. **Controller store**: extract validated data, denormalise (`applyGuestCountFieldsToData` if per-kind), call `AddonsSyncService::sync` (BEFORE pricing — round 6.2.5), call `(new PricingApplyService())->apply($booking, $request)`, save.
3. **Controller update**: same as store, but `sometimes` on required fields, plus the **critical** `apply($booking, $request)` call (the 6.2.39 B2 bug was a missing call on member update).
4. **DB::transaction**: wrap store/update in a transaction with `lockForUpdate()` if there's a race (OTP, account credit).
5. **PHPUnit re-run**: phase 2 tests now pass.
6. **Stash-then-rerun**: confirm no regressions.

### 15.6 Phase 4 — FRONTEND CONSUMPTION (BOTH frontends in parallel)

**Both frontends MUST consume the new contract in the same commit window**. Per the 7-layer pre-flight (INV-X10), every layer must be touched:

For BOTH admin AND customer:
1. **TypeScript type** in `<frontend>/src/types/api.ts` (or equivalent) — add the new field
2. **API service function** in `services/api.ts` (or per-domain file) — include in the request payload
3. **Container** — destructure the new field, spread into the API call
4. **Form** — onSubmit includes the new field
5. **Mapper / normalizer** (if list page) — return type includes the new field
6. **figma-ui / view** — JSX renders the new field (if UI-facing)

**Pre-flight gate**: before Phase 5, run the frontend unit tests (Vitest). All must pass.

### 15.7 Phase 5 — E2E VERIFICATION (Playwright with real browser)

Per INV-9, the e2e MUST be a real browser render with `page.on('pageerror', ...)` + `page.on('console', ...)` listeners. The form payload interception pattern (per `hkial-e2e-login-auth` + `hkial-frontend-e2e-selector-pattern`):

```ts
test('full create flow', async ({ page }) => {
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  page.on('console', msg => { if (msg.type() === 'error') console.error('CONSOLE:', msg.text()); });

  // Capture the actual payload
  let interceptedPayload: any = null;
  page.on('request', req => {
    if (req.url().includes('/api/bookings') && req.method() === 'POST') {
      interceptedPayload = JSON.parse(req.postData() || '{}');
    }
  });

  // Login (Strategy A: API-then-inject)
  // ... see hkial-e2e-login-auth for the 3 auth strategies

  // Fill form
  await page.goto('/bookings/create');
  await page.getByLabel('Guest Name').fill('Test User');
  // ... fill all fields

  // Submit
  await page.getByRole('button', { name: 'Create' }).click();

  // Assert payload shape
  expect(interceptedPayload).toMatchObject({
    guest_name: 'Test User',
    <new_field>: <expected>,
    // ...
  });

  // Assert DOM (NOT just API)
  await expect(page.getByText('Booking #A-')).toBeVisible();
});
```

**Anti-pattern (the 6.2.3 lesson)**: an API-only test (no browser) is a contract test, not e2e. The form may submit a 201 but the page may be blank due to a null-deref. ALWAYS render the DOM and assert visible text.

### 15.8 Migration strategy for legacy fields (the "old code path still has the bug" problem)

When the new spec adds a field that the old code path doesn't have (the M2 `lounge`/`terminal` ghost-fillable problem, the M4 missing `has_limousine` validator problem):
1. **Add the migration** (if column doesn't exist)
2. **Update the validator** to accept the field
3. **Update the model** `$fillable` + `$casts` (this is what BUG #3 missed)
4. **Update the controller** store/update to persist the field
5. **Add a backfill migration** (one-off SQL `UPDATE bookings SET lounge = ... WHERE ...`) for pre-existing rows
6. **Add a PHPUnit test** that round-trips the field
7. **Add a Playwright e2e** that fills the form, submits, reloads, and asserts the value persists

The 6.2.35 + 6.2.36 + 6.2.39 sequence (4 rounds to fix one feature properly) is the ANTI-pattern. The new dev order should close a feature in 1-2 rounds max.

### 15.9 The "ship gate" (when can a round be marked DONE?)

A round is DONE when ALL of:
- [ ] Spec updated (§6/§7/§8/§9)
- [ ] Schema migrated (Phase 1)
- [ ] Contract tests pass (Phase 2)
- [ ] Backend implementation passes all tests (Phase 3)
- [ ] Both frontends consume the new field (Phase 4)
- [ ] Playwright e2e renders DOM with the new value (Phase 5)
- [ ] Handoff doc written (§13)
- [ ] Pre-commit gate green (§12)
- [ ] No new pre-existing fails (§11.4)

If any box is unchecked, the round is NOT DONE. Defer the rest to the next round (write a `docs/pending-changes/<date>-<topic>.md` doc, do NOT commit half-finished code).

---

## 16. Dev workflow redesign — anti-rott protocol

> **Motivation**: the current rot shows that (1) `backend/spec.md` is admin-only and March-2026 stale, (2) `pending-changes/` has 6 docs with unanswered Qs, (3) skills don't have version+last-used stamps, (4) the cross-references in `pointer-index.md` are slightly off. The fix is a systematic anti-rott protocol.

### 16.1 The 5 anti-rott rules

**Rule 1 — Spec is the source of truth, not the docs**
- This file (HKIAL/spec.md) is the canonical contract. Every other doc is a derivative.
- When the spec changes, the doc that references it gets a 1-line banner: `For canonical spec, see HKIAL/spec.md v<X>.<Y>.<Z>`. No rewrites of the derivative docs.
- When a doc contradicts the spec, the spec wins. Fix the doc.

**Rule 2 — Deltas, not rewrites**
- Each round (6.2.N+) writes a delta to the spec (§6.4 protocol), NOT a full rewrite. The handoff doc is the changelog.
- Old sections are not deleted; they're struck through with a `[retired YYYY-MM-DD round 6.2.N]` footnote.
- This makes `git log` of spec.md a chronological trace of every contract change.

**Rule 3 — Pending has a TTL (7-day rule)**
- Every `docs/pending-changes/<date>-<topic>.md` doc has a 7-day TTL from creation. If unanswered, the agent marks it:
  - `[STATUS: BLOCKED <user-Q1, Q2>]` if the design Qs are still open
  - `[STATUS: DEFERRED <reason>]` if Sky explicitly deferred
  - `[STATUS: CANCELLED <reason>]` if the feature is no longer wanted
- The status is added as a 1-line header. Statuses are reviewed weekly (every Monday).
- Q-F (Edit Booking coverage) currently violates this rule — 4 design Qs, partially answered, 1.5 weeks of work estimated. **Status: BLOCKED on Phase 2-4 design**.

**Rule 4 — Skills have a "last verified" stamp**
- Every skill's `SKILL.md` frontmatter gets 2 new fields:
  - `last-verified: YYYY-MM-DD` — the date the skill was last reviewed for accuracy
  - `applies-to-rounds: 6.0+` or `6.2.0+` — the round range where the skill is still accurate
- Skills older than 90 days from `last-verified` get an audit flag in §16.3.
- The 6 project-local skills are all v1.0.0 + dated 2026-06-12 (fresh). The 12 global skills: `hkial-customer-frontend-figma-codebase-sync` v1.24.0 (fresh), `contract-test-first-workflow` v0.6.0 (fresh), `hkial` umbrella v1.9.0 (fresh), `hkial-label-rename-audit-cookbook` v1.2.0 (fresh). The other 8 are unversioned — add versions.

**Rule 5 — Handoff is the contract, not the commit**
- The 6-section handoff (§13.1) is what the next session reads. The commit message is for `git log`.
- A round with no handoff = no record = next session re-discovers context = rot.
- The "no handoff needed" trigger table (§13.4) is strict: when in doubt, write one.

### 16.2 The 4 cross-doc consistency rules

When updating multiple docs in the same round, follow these 4 rules:

1. **The spec wins**: if HKIAL/spec.md says X, all derivative docs say X. Fix the derivative, not the spec.
2. **The handoff is the changelog**: if you add a new INV/Class/Anti-pattern, the handoff doc cites the new ID + the spec section.
3. **The README index is a 1-line append**: when you add a new handoff, add 1 row to `<subproject>/docs/handoff/README.md`. Don't rewrite the index.
4. **The pointer index is a 1-line append**: when you add a new round-specific reference, add 1 line to `HKIAL/references/pointer-index.md`. Don't rewrite the index.

### 16.3 Quarterly spec audit (the script that catches rot)

Add to `HKIAL/.hermes/scripts/spec-audit.sh` (new file):

```bash
#!/bin/bash
# Quarterly spec-audit — catches drift between spec, code, handoffs, and pending-changes
# Run: ./spec-audit.sh
# Outputs: list of contradictions + stale items

set -e

echo "=== HKIAL Spec Audit — $(date -u +%Y-%m-%d) ==="
echo

# 1. Handoff count by subproject (compare to spec §1.1 expected)
echo "--- 1. Handoff count ---"
echo "Customer: $(ls ~/Desktop/Projects/frontend_react/frontend/docs/handoff/*.md 2>/dev/null | grep -v README | wc -l) handoffs"
echo "Admin:    $(ls ~/Desktop/Projects/backend/hkial-react/docs/handoff/*.md 2>/dev/null | grep -v README | wc -l) handoffs"
echo "API:      $(ls ~/Desktop/Projects/backend/hkial-api/docs/handoff/*.md 2>/dev/null | grep -v README | wc -l) handoffs (expect 0 — no dir yet)"
echo "Pending:  $(ls ~/Desktop/Projects/backend/hkial-react/docs/pending-changes/*.md 2>/dev/null | wc -l) pending-changes"
echo

# 2. Pending-changes TTL check (any doc older than 7 days without [STATUS: ...] header?)
echo "--- 2. Pending TTL check (7-day rule) ---"
for f in ~/Desktop/Projects/backend/hkial-react/docs/pending-changes/*.md; do
  age=$(($(date +%s) - $(stat -f %m "$f")))
  days=$((age / 86400))
  has_status=$(grep -c "STATUS:" "$f" || true)
  if [ "$days" -gt 7 ] && [ "$has_status" -eq 0 ]; then
    echo "STALE: $f (${days} days old, no STATUS header)"
  fi
done
echo

# 3. Test baseline check (compare to spec §11.4 expected)
echo "--- 3. Test baseline (pre-existing fails) ---"
cd ~/Desktop/Projects/backend/hkial-api
fail_count=$(php artisan test 2>&1 | grep -oE "FAIL: [0-9]+" | grep -oE "[0-9]+" | head -1 || echo "0")
echo "hkial-api: $fail_count fails (expected ≤ 9: 1 contract + 5 matrix + 3 BUG-PINNED)"
cd ~/Desktop/Projects/backend/hkial-react
npx vitest run --reporter=basic 2>&1 | tail -3
echo

# 4. figma-ui dirty state (should be clean unless mid-session)
echo "--- 4. figma-ui dirty state ---"
cd ~/Desktop/Projects/frontend_react/frontend/src/components/figma-ui
git status --short | head -5 || echo "(clean)"
cd ~/Desktop/Projects/backend/hkial-react/src/components/figma-ui
git status --short | head -5 || echo "(clean)"
echo

# 5. Cross-doc consistency (does HKIAL/spec.md §0.3 update rule apply?)
echo "--- 5. Cross-doc consistency ---"
for old_doc in \
  ~/Desktop/Projects/backend/spec.md \
  ~/Desktop/Projects/frontend_react/frontend/PROJECT_SUMMARY.md \
  ~/Desktop/Projects/frontend_react/frontend/DEVELOPMENT_GUIDE.md \
  ~/Desktop/Projects/frontend_react/frontend/BOOKING_VIEW_INVENTORY.md; do
  has_banner=$(grep -c "HKIAL/spec.md" "$old_doc" 2>/dev/null || echo 0)
  if [ "$has_banner" -eq 0 ]; then
    echo "MISSING BANNER: $old_doc"
  fi
done
echo

# 6. Skill version + last-verified check
echo "--- 6. Skill versions ---"
for skill in ~/Desktop/Projects/HKIAL/skills/*/SKILL.md ~/.hermes/skills/software-development/hkial*/SKILL.md; do
  version=$(grep -E "^version:" "$skill" 2>/dev/null | head -1 | awk '{print $2}')
  last_verified=$(grep -E "^last-verified:" "$skill" 2>/dev/null | awk '{print $2}')
  if [ -z "$version" ]; then
    echo "NO VERSION: $skill"
  fi
done
echo

echo "=== Audit complete ==="
```

### 16.4 The round cadence (what every round MUST do)

Every round (6.2.N+) MUST, at minimum:
1. Read HKIAL/spec.md §14 (open bugs) — is this round closing any?
2. Read HKIAL/spec.md §3 (anti-patterns) — is the change hitting any?
3. Apply the dev order (§15): SPEC → SCHEMA → CONTRACT TEST → IMPLEMENTATION → FRONTEND CONSUMPTION → E2E
4. Run the pre-commit gate (§12) — 4 phases
5. Write a handoff doc (§13) — 6 sections
6. Update the README index — 1 row
7. Update the spec if a contract change — 1 line per §6.4 protocol
8. Close any open bug from §14 — move to FIXED subsection

**What a round MUST NOT do**:
- Skip phases of the dev order
- Write code without updating the spec
- Commit without running the pre-commit gate
- Skip the handoff doc (unless trivial — §13.4)
- Add to the pre-existing fail count
- `git add` inside figma-ui (INV-X1)
- `migrate:fresh --seed` against dev MySQL (INV-X2)

### 16.5 The "rot radar" (what to watch for)

These are the 5 leading indicators of rot:
1. **Pending-changes growing without resolution** (Q-F is the current canary — 4 Qs, 1.5 weeks work, 2 weeks unanswered)
2. **Pre-existing test fails growing** (the 6.2.31 cascade added 5+5+1 = 11 fails in 3 rounds; the 6.2.39 audit added 3 more)
3. **Skills without versions** (8 of 12 global skills are unversioned — risk of stale methodology)
4. **Cross-doc contradictions** (the 6.2.35 added to validator but not $fillable — and the spec didn't catch it; the next field added will likely repeat the bug)
5. **figma-ui dirty state persisting** (round 6.2.20 noted "submodule has uncommitted patches from 3 sessions" — the manual sync protocol is brittle)

**If any indicator fires, the round must address it** (not the next round — this round). The §14 OPEN bugs list is the scoreboard.

### 16.6 The "spec.md is alive" check (run every Monday)

```bash
# 1. Spec was updated in the last 14 days?
find HKIAL/spec.md -mtime -14

# 2. Any new INV/Class/Anti-pattern since last spec version?
git log --since="14 days ago" --grep="INV-\|class #\|PIT-" --oneline

# 3. Any open bug closed in the last 14 days?
grep "fixed" HKIAL/spec.md | head -5
```

If (1) is false, the spec is rotting — force a §14 review.

---

## 17. Cross-references + how to extend

### 17.1 The canonical doc tree

```
HKIAL/
├── AGENTS.md                           ← umbrella, 266 lines, auto-loads
├── README.md                           ← quick orientation
├── spec.md                             ← THIS FILE (v2.0.0, cross-project)
├── references/
│   ├── pointer-index.md                ← round + skill + INV cross-reference
│   └── test-inventory.html
├── skills/                              ← 6 project-local skills (v1.0.0 each)
│   ├── hkial-setup-onboarding/
│   ├── hkial-container-view-pattern/
│   ├── hkial-pre-commit-gate/
│   ├── hkial-frontend-disambiguation/
│   ├── hkial-azure-deploy/
│   └── hkial-handoff-discipline/
├── handoff/                             ← (when created) cross-project handoffs
└── .hermes/                             ← project-local Hermes state
    ├── MEMORY.md
    ├── config.yaml
    └── scripts/
        └── spec-audit.sh               ← quarterly anti-rott script

~/Desktop/Projects/
├── backend/
│   ├── AGENTS.md                       ← 68 lines, CLAUDE-style
│   ├── spec.md                         ← LEGACY (admin-only, March 2026) — add redirect banner
│   ├── .opencode/agent/hermes.md       ← 292 lines, 13 backend INV + SOPs
│   ├── hkial-api/
│   │   ├── api_endpoints.md            ← full /api/... route reference
│   │   ├── ADD_BOOKING_GUIDE.md        ← how to add a new booking flow
│   │   ├── PROBLEM.md                  ← outstanding backend problems
│   │   └── tests/Feature/              ← 46 feature tests
│   ├── hkial-react/
│   │   ├── docs/
│   │   │   ├── handoff/                ← 9 admin handoffs + README index
│   │   │   └── pending-changes/        ← 6 pending design Q&A
│   │   └── tests/e2e/                  ← 79 Playwright specs
│   └── docs/                            ← backend's own docs (architecture, process, knowledge-base)
└── frontend_react/
    ├── AGENTS.md                       ← 212 lines, customer umbrella
    ├── api_endpoints.md                ← customer endpoint reference
    └── frontend/
        ├── AGENTS.md                   ← customer project-specific
        ├── DEVELOPMENT_GUIDE.md        ← long-form tutorial (legacy, add banner)
        ├── PROJECT_SUMMARY.md          ← 73k system overview (legacy, add banner)
        ├── BOOKING_VIEW_INVENTORY.md   ← per-booking-view inventory (legacy, add banner)
        ├── PROMO_CODE_INVENTORY.md     ← promo code feature inventory
        ├── EDIT_BOOKING_API.md         ← EditBooking API contract
        ├── FIGMA_UI_BOUNDARY.md        ← figma-ui isolation rules
        ├── services/api.ts             ← 1952 lines, customer API client
        └── docs/handoff/               ← 4 customer handoffs
```

### 17.2 The 12 global Hermes skills (canonical references)

| Skill | Version | Purpose |
|---|---|---|
| `hkial` (umbrella) | 1.9.0 | Auto-loads 3 below. Monorepo discovery, auth, figma-ui sync |
| `hkial-customer-frontend-figma-codebase-sync` | 1.24.0 | 24-version figma-ui sync playbook (class #9 routing, #9b exception, #10 inverse sub-pattern, multi-session shared tree) |
| `hkial-frontend-bug-debug-checklist` | (TBD) | 12 bug classes + 4 defensive patterns + 7-layer pre-flight + admin/customer disambiguation |
| `hkial-e2e-login-auth` | 1.0.0 | 3 auth strategies (API-then-inject, UI-form-fill, storageState) + OTP 888888 + 3-min diagnostic |
| `hkial-frontend-e2e-selector-pattern` | (TBD) | Playwright selectors for figma-ui (buttons not radios, Radix combobox, type=date/time/number) |
| `hkial-debugging-stuck-loop` | (TBD) | Recovery protocol when 5+ turns into a bug + user steering signal interpretation |
| `hkial-label-rename-audit-cookbook` | 1.2.0 | 3 label classes (strict-compare trap, mapper-default enum-mismatch, UI-label-relabel) + 4-grep audit |
| `hkial-booking-view-contract-pilot` | (TBD) | Booking view contract pilot runbook |
| `contract-test-first-workflow` | 0.6.0 | 12 cross-layer anti-patterns (phantom-field, off-by-some, preview-path-lags, etc.) + audit-then-spec-test |
| `test-design-matrix` | 0.2.0 | Pre-test case design (Entity × Verb × Field × Bucket) + 5-Q product spec Q&A |
| `simplify-code` | 1.0.0 | Parallel 3-agent code cleanup (reuse / quality / efficiency) |
| `subagent-parallel-stream-isolation` | (TBD) | Multi-session working-tree isolation for git-worktree-isolated sessions |

### 17.3 How to extend this spec (the meta-rule)

When you add a new section / INV / Class / Anti-pattern / endpoint:
1. Add at the END of the relevant section (don't insert in the middle, to preserve §0.3 history rule)
2. Update §0.4 table of contents if a new top-level section
3. Add a 1-line entry in the changelog (the round number + date)
4. Update the handoff doc's "Files touched" with the spec section number (e.g. "HKIAL/spec.md §6.2 — +added has_wheelchair endpoint")
5. If a new skill is needed, add a project-local skill in `HKIAL/skills/<name>/SKILL.md` with the standard frontmatter (name, description, tags, version, last-verified, applies-to-rounds)
6. If a new round's handoff references a new invariant / anti-pattern, add a 1-line cross-reference here

### 17.4 The "spec supersedes X" log

| Date | Superseded | Replaced by | Notes |
|---|---|---|---|
| 2026-06-13 | `backend/spec.md` v1.0.0 (admin-only, March 2026) | HKIAL/spec.md v2.0.0 | Add 5-line banner to `backend/spec.md`: "LEGACY — see HKIAL/spec.md v2.0.0 for the cross-project canonical spec" |
| TBD | `frontend_react/frontend/PROJECT_SUMMARY.md` (73k) | HKIAL/spec.md v2.0.0 + PROJECT_SUMMARY.md kept as long-form | Add 5-line banner |
| TBD | `frontend_react/frontend/DEVELOPMENT_GUIDE.md` (23k) | HKIAL/spec.md v2.0.0 + DEVELOPMENT_GUIDE.md kept as long-form | Add 5-line banner |
| TBD | `frontend_react/frontend/BOOKING_VIEW_INVENTORY.md` (38k) | HKIAL/spec.md v2.0.0 + BOOKING_VIEW_INVENTORY.md kept as per-booking ground truth | Add 5-line banner |

---

## Appendix A — Round → spec delta log

(Append-only. Each new round adds 1 row.)

| Round | Date | Spec sections touched | Net delta |
|---|---|---|---|
| 6.0 | 2026-06-06 | §1, §8.2 (multi-resource) | Multi-resource scaling for single product kind (N suites OR M lounges) |
| 6.1 | 2026-06-07 | §8.2, §9.1 (multi-kind) | Multi-kind pricing (PS + LD in one booking) |
| 6.2 | 2026-06-08 | §7.2-7.3, §8.3 (Transit 2-leg + 6h gap) | Transit requires 2 legs + ≥6h gap |
| 6.2.5 | 2026-06-08 | §9 (addons pricing) | Addons fold into `bookings.total_price` |
| 6.2.6 | 2026-06-08 | §4 (class #12 added) | Map FlightType: Arrival/Departure/Transit 3-way |
| 6.2.6.1 | 2026-06-08 | §3 (INV-11 added) | `Transition` → `Transit` rename |
| 6.2.20 | 2026-06-09 | §3 (INV-12 added), §4 (class #10b) | Addons catalog drift fix (4 from DB, 22 flagged "coming soon") |
| 6.2.20 | 2026-06-09 | §3 (INV-13 added) | Pre-commit gate rule (Vitest + PHPUnit sample) |
| 6.2.28 | 2026-06-09 | §9.1 (staff discount) | Staff discount line item + reverse reapply |
| 6.2.30-38 | 2026-06-11 | §6.2, §8.2 (per-kind guest counts) | 5 per-kind top-level columns + `advanced_details` mirror |
| 6.2.31 | 2026-06-11 | §9.1 (multi-kind NFG) | Per-kind NFG split (BUG #1 still open) |
| 6.2.33 | 2026-06-10 | §9.4 (NFG infant = 0) | Source fix SHIPPED; 5 feature test fails deferred (Q-A) |
| 6.2.35 | 2026-06-11 | §6.4, §8.2 (3 boolean columns) | `has_wheelchair` + `has_security` + `has_private_sales` to validator — BUG #3 (silently dropped by `$fillable`) STILL OPEN |
| 6.2.36 | 2026-06-11 | §8.2, §8.3 (full coverage) | Member update validator + AddonsSyncService on update (9 new fields) |
| 6.2.38 | 2026-06-12 | §8.2 (per-kind fallback) | `applyGuestCountFieldsToData` per-kind fallback for customer bookings |
| 6.2.39 | 2026-06-12 | §14 (3 P0 + 11 M + 8 L) | Deep audit: 3 critical bugs, 11 medium, 8 low (see §14) |

---

**End of spec.md v2.0.0** — last updated 2026-06-13 (round 7.0-prep). Next quarterly audit: 2026-09-13.
