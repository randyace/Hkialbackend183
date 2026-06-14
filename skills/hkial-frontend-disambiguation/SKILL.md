---
name: hkial-frontend-disambiguation
description: 30-second recipe to identify which HKIAL frontend the user is reporting on — customer (frontend_react, port 3000) or admin (backend/hkial-react, port 5173). Uses URL prefix, port, and a 3-line bundle-grep discriminator that finds the unique figma-ui marker string on each frontend. Use FIRST when the user reports a frontend bug without specifying which one, or when a fix lands in the wrong file. Trigger: "frontend", "UI", "page is blank", "field is missing", "X is wrong" + ambiguous frontend context.
tags: []
version: 1.0.0
author: Hermes Agent
license: MIT
last-verified: 2026-06-13
applies-to-rounds: 6.0+
metadata:
  hermes:
    tags: [HKIAL, frontend, disambiguation, bundle-grep, customer, admin, port, URL, discriminator, figma-ui]
---

# HKIAL Frontend Disambiguation

> **When to use**: FIRST thing when the user reports a frontend bug without explicitly naming which frontend. Catches the "I fixed the customer but the user was on admin" anti-pattern. Cross-references: HKIAL/AGENTS.md §1 (project map), `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` §"When the user reports a bug on the admin frontend".

## 1. The 30-second recipe (run BEFORE any source read)

### Step 1 — URL prefix + port

| URL | Frontend | Port (local) | Bundle hash on Azure |
|---|---|---|---|
| `https://viplonlinebookingfrontenddev-cpbabsb5fnb4hhgq.eastasia-01.azurewebsites.net/*` | **Customer** (frontend_react) | 3000 | (in `index.html` of customer Azure) |
| `https://viplonlinebookingbackenddev-djdnd5bycmccbacq.eastasia-01.azurewebsites.net/*` | **Admin** (backend/hkial-react) | 5173 | (in `index.html` of admin Azure) |

**Note**: the admin URL contains "backend" in its hostname. This is a legacy naming issue (admin is a frontend, not a backend), but it's the actual URL Sky uses. Don't get confused.

### Step 2 — Bundle-grep discriminator (when the URL is given but the front end is unclear)

```bash
URL="https://viplonlinebookingbackenddev-djdnd5bycmccbacq.eastasia-01.azurewebsites.net"  # admin (has /bookings/create)
# OR
URL="https://viplonlinebookingfrontenddev-cpbabsb5fnb4hhgq.eastasia-01.azurewebsites.net"  # customer (has /newbooking)

INDEX=$(curl -sL "$URL" | grep -oE 'index-[A-Za-z0-9_-]+\.js')
curl -sL "$URL/assets/$INDEX" -o /tmp/bundle.js

# Admin frontend (hkial-react) has these unique strings:
grep -c "VIP Passenger Details" /tmp/bundle.js        # admin's h2
grep -c "Non-Flying Guest Details" /tmp/bundle.js     # admin's h2
grep -c "guests used" /tmp/bundle.js                  # admin's counter pill

# Customer frontend (frontend_react) has these unique strings:
grep -c "VIP Passenger Information" /tmp/bundle.js    # customer's per-card h2
grep -c "Non-Flying Guest Information" /tmp/bundle.js # customer's per-card h2
```

**Decision matrix**:
| "VIP Passenger Details" | "VIP Passenger Information" | Frontend |
|---|---|---|
| 1+ matches | 0 matches | **Admin** (backend/hkial-react) |
| 0 matches | 1+ matches | **Customer** (frontend_react) |
| both match | both match | Stale bundle — clear cache and re-grep |
| neither | neither | Wrong URL, no SPA, or empty page |

### Step 3 — Confirm with the per-URL table (if Step 1+2 are inconclusive)

For known HKIAL routes:

| URL path | Frontend | Live source file |
|---|---|---|
| `/auth`, `/login` | Customer | `frontend_react/frontend/src/components/AuthPage.tsx` (WRAPPER) |
| `/dashboard` | Customer | `frontend_react/frontend/src/containers/DashboardContainer.tsx` |
| `/mybooking`, `/mybooking/details/:id` | Customer | `frontend_react/frontend/src/containers/BookingsContainer.tsx` + `components/EditBooking.tsx` |
| `/newbooking` | Customer | `frontend_react/frontend/src/containers/NewBookingContainer.tsx` |
| `/settings`, `/services`, `/visit-history`, `/voucher-batches` | Customer | corresponding `*Container.tsx` |
| `/login` (staff) | Admin | `backend/hkial-react/src/components/figma-ui/src/app/components/Login.tsx` |
| `/dashboard` (admin) | Admin | `backend/hkial-react/src/components/figma-ui/src/app/components/Dashboard.tsx` |
| `/bookings`, `/bookings/create`, `/bookings/:id`, `/bookings/review/:id` | Admin | `backend/hkial-react/src/components/figma-ui/src/app/components/CreateBooking.tsx` / `BookingDetail.tsx` / `BookingReviewPage.tsx` / `BookingReview.tsx` |
| `/accounts`, `/accounts/:id` | Admin | `backend/hkial-react/src/components/figma-ui/src/app/components/AccountList.tsx` / `AccountCreation.tsx` / `MemberDetail.tsx` |
| `/price-management` | Admin | `backend/hkial-react/src/components/figma-ui/src/app/components/PriceManagement.tsx` |

## 2. The 5 common disambiguation errors (and how to recover)

### Error 1 — Patched customer when user was on admin

**Symptom**: user reports "field X is missing" on admin, agent patches `frontend_react/frontend/src/components/...`, user comes back saying "still missing".

**Recovery**:
1. Run §1 Step 2 (bundle-grep) to confirm which frontend
2. Run the 7-layer pre-flight (INV-X10) on the correct subproject
3. Apply the inverse sub-pattern audit (3-grep in HKIAL/skills/hkial-container-view-pattern §3) — the JSX is likely in figma-ui on the admin side

### Error 2 — Patched admin when user was on customer

**Symptom**: agent patches `backend/hkial-react/src/components/...`, but the customer's `/mybooking/details/706` still shows the bug.

**Recovery**: same as Error 1, but the other direction. The customer has Container/View in `frontend_react/frontend/src/containers/` (not `backend/hkial-react/src/components/containers/`).

### Error 3 — Patched wrapper when JSX is in figma-ui (class #9 on customer, class #10 on admin)

**Symptom**: code change compiles, test passes, but the user sees no visual change.

**Recovery**:
- **Customer**: see `frontend_react/AGENTS.md` §3 (the file-split trap table)
- **Admin**: see `HKIAL/skills/hkial-container-view-pattern/SKILL.md` §3 (3-grep audit)

### Error 4 — Touched the submodule git (INV-X1 violation: `git add` / `commit` / `push` inside, or bumped parent pointer)

**Symptom**: opencode's own actions corrupted the user's sync workflow. Note: per INV-X1 (updated 2026-06-14), **patching** the figma-ui working tree is allowed — the violation is only the git operations and the parent pointer bump.

**Recovery**:
1. `cd backend/hkial-react/src/components/figma-ui && git log --oneline -5` to see if a stray commit landed
2. `git reset --soft HEAD~1` (if needed, in submodule ONLY with user permission)
3. `cd ../../../../ && git status` to see parent pointer state
4. **Surface to user immediately** — the manual sync protocol is now broken

### Error 5 — Confused Azure URL (the "backend" in the admin hostname)

**Symptom**: agent goes to "viplonlinebooking**backend**dev" thinking it's the API, but it's actually the admin panel.

**Recovery**:
| URL substring | What it actually is |
|---|---|
| `viplonlinebookingapidev-*.azurewebsites.net` | Laravel API (port 8000) |
| `viplonlinebookingbackenddev-*.azurewebsites.net` | Admin panel (port 5173) |
| `viplonlinebookingfrontenddev-*.azurewebsites.net` | Customer panel (port 3000) |

**Mnemonic**: "backend" in the admin URL is a Sky-era naming accident — admin is a frontend, not a backend. The pattern is `<role>dev-<suffix>.eastasia-01.azurewebsites.net` where role = api/backend/frontend.

## 3. When the user gives you a booking ID

The booking ID alone does not disambiguate. Both frontends show bookings. Use the URL the user is on:

| User context | Frontend | Live source for `/bookings/:id` (admin) or `/mybooking/details/:id` (customer) |
|---|---|---|
| "I see the bug on my admin panel when I look at booking 743" | Admin | `backend/hkial-react/src/components/figma-ui/src/app/components/BookingDetail.tsx` |
| "I'm on the customer side, on /mybooking/details/706" | Customer | `frontend_react/frontend/src/components/EditBooking.tsx` (WRAPPER) |
| "I just see booking 743 in the database" | DB only | `backend/hkial-api/app/Http/Controllers/Api/BookingController.php` |
| "I have a Playwright spec that opens the page" | Read the spec URL | Use §1 Step 1 to disambiguate |

## 4. When the user gives you a screenshot

| Screenshot contains | Frontend |
|---|---|
| Sky-blue HKIAL logo + "Welcome, [Name]" in nav, "My Bookings" sidebar | Customer |
| Dark sidebar with "Bookings / Accounts / Price Management / Promo Codes" | Admin |
| "VIP Passenger Details" h2 with Premiere Suite / Lounge Deluxe cards stacked | Admin (CreateBooking) |
| "VIP Passenger Information #1" / "#2" / "#3" per-card headers | Customer (NewBooking) |
| Staff login form with "admin@example.com" placeholder (local) or "Enter your email" (Azure) | Admin login |

## 5. When all else fails — ask the user

The 30-second recipe catches 95% of cases. For the 5% edge case (e.g. user says "the form" without URL or screenshot), ask ONCE with a short Q&A:

> "Which frontend are you on?
> A) Customer (`viplonlinebookingfrontenddev-...`) — `/newbooking`, `/mybooking`, `/dashboard`
> B) Admin (`viplonlinebookingbackenddev-...`) — `/bookings/create`, `/accounts`, `/price-management`"

If the user is terse ("1a", "option B", "frontend"), treat it as a decision and execute (per INV-X7, no re-confirm).

## 6. Related skills / cross-references

- `HKIAL/AGENTS.md` §1 (project map) + §7 (Azure URLs)
- `HKIAL/skills/hkial-container-view-pattern/SKILL.md` §3 (3-grep audit for admin)
- `~/.hermes/skills/hkial-frontend-bug-debug-checklist/SKILL.md` §"When the user reports a bug on the admin frontend"
- `frontend_react/AGENTS.md` §3 (customer file-split trap table)
- `backend/.opencode/agent/hermes.md` §"Project Map" + §"Container/View Architecture"
