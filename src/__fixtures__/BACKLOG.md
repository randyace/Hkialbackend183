# figma-ui Pure Presentational Refactor — Backlog

This file tracks the staged rollout of the "figma-ui pure presentational layer" architecture,
following the plan in `.cursor/plans/figma-ui_pure_presentational_refactor_*.plan.md`.

## Architecture rules

- **Page views** in `figma-ui/src/app/components/` MUST NOT contain `generateMock*`, `mock*` arrays,
  `INITIAL_*` data seeds, hard-coded business records, or `useState` initialised with such data.
- A view MAY keep ephemeral UI state only (open dialog, expanded row, hover/highlight, animation toggles).
- All filter, search, pagination, sort, and selection state lives in the caller (smart container OR preview wrapper).
- **Mock data only lives in `figma-ui/src/__fixtures__/`**. Imported only by standalone preview wrappers
  in `__fixtures__/previews/<Page>Preview.tsx` and from there used by `figma-ui/src/app/routes.tsx`.
- **Production builds** of `hkial-react` MUST never tree-shake-pull `__fixtures__/`. Production smart
  containers in `hkial-react/src/components/<Page>.tsx` pass real DB data via props.

## Refactor pattern (per page view)

For each `figma-ui/src/app/components/<Page>.tsx` that still inlines mock data:

1. Move every literal mock data block (`generateMock*`, `INITIAL_*`, top-level `const fooData = [...]`,
   embedded constants like `TRAVEL_AGENCY_DATA`, `firstNames`, `lastNames`, `airlines`)
   into `figma-ui/src/__fixtures__/<Page>.fixture.ts`. Export named: `mockXxx`.
2. Define `<Page>Props` capturing all business data, server-pagination/filter primitives, handlers,
   and display helpers the caller may want to override.
3. Strip data state from the view: remove `useState(mockX)` and any internal `.filter().sort()`.
   Render strictly from `props`. Keep only UI-only `useState`.
4. Create `figma-ui/src/__fixtures__/previews/<Page>Preview.tsx` that:
   - imports the fixture from `__fixtures__/<Page>.fixture.ts`
   - holds local `useState` for filter/search/pagination
   - re-implements the in-memory filter/sort logic that previously lived in the view
   - passes everything down to `<PageView ... />`.
5. Update `figma-ui/src/app/routes.tsx` to use the `<Page>Preview` wrapper instead of the bare view.
6. If a `hkial-react/src/components/<Page>.tsx` smart container exists, ensure it passes the same prop
   interface (with real DB data via `services/*` + a small snake_case → camelCase transform when needed).

## Status

### Completed (Wave A — production leak fix, 4 pages)

These four views were directly imported by production smart containers, causing mock data to render
instead of DB data. They are now strictly props-driven and consume real data via their containers.

| View | Fixture | Preview | Smart container wired |
|------|---------|---------|------------------------|
| `Dashboard` | yes | yes | yes (real `bookingService` + `accountService` + transforms) |
| `AccountList` | yes | yes | yes (real `accountService`) |
| `BookingManagement` | yes | yes | yes (real `bookingService` + `transformApiBooking`) |
| `POSFoodAlert` | yes | yes | yes (real `posOrderService.getKitchenOrders` + 30s poll) |

### Completed (Wave B / C — 10 additional pages refactored)

Refactored as part of this session; not currently consumed by any production smart container.

| View | Fixture | Preview |
|------|---------|---------|
| `MemberCompany` | yes | yes |
| `GradingPackages` | yes | yes |
| `BookableItems` | yes | yes |
| `AuditLogs` | yes | yes |
| `LoungeLayout` | yes | yes |
| `OpportunityTracking` | yes | yes |
| `PromoCodeList` | yes | yes |
| `SystemUsers` | yes | yes |
| `TravelAgency` | yes | yes |
| `POSBookingDetail` | yes | yes |

### Remaining views with inline mock data (1 file)

- `BookingDetail` (~4800 lines). Internal helpers (`DETAIL_AGENCY_DATA`, `mockNonFlyingSeeds`,
  `HISTORICAL_GUESTS`, `generateMockBooking`) are deeply entangled. Extract to
  `__fixtures__/BookingDetail.fixture.ts` and change the view's prop signature from
  `{ bookingId, onBack }` to `{ booking, onBack, ...handlers }`. The view's internal dialogs
  and tabs can keep their UI state. Not currently imported by any production smart container.

### Remaining views without explicit `generateMock*` but still stateful (Wave B/C — ~24 pages)

These compile clean against the grep gate (no `generateMock*` / `INITIAL_*`) but still have inline
business data (`MOCK_*` const arrays, hard-coded records, default-valued `useState`). Not currently
leaking into production. Refactor with the same per-view recipe when convenient.

Approximate sizes (bigger = more effort):

- `OpportunityTracking` — done.
- `PurchaseManagement` (583 lines) — depends on `PurchaseCreate` (which exports `MOCK_ACCOUNTS`,
  `INITIAL_RECORDS`, `BUNDLE_COLORS`); refactor `PurchaseCreate` first or extract shared types.
- `Reports` (851 lines).
- `BalanceTracker` (821 lines).
- `KitchenDisplay` (829 lines).
- `PromoCodeUsage` (878 lines).
- `RefundReport` (1070 lines).
- `SupervisingApproval` (1062 lines).
- `BookingApproval` (1155 lines).
- `MemberDetail` (2213 lines).

Plus the long tail of edit / detail / create dialogs:
`AccountCreation`, `ApplicationReview`, `BookableItemEdit`, `BookingReview`, `BookingReviewPage`,
`BookingSchedules`, `BookingSettings`, `CompanyEdit`, `CorporateProfiles`, `CorporateReports`,
`CreateBooking`, `Layout`, `POSCheckout`, `POSFloorPlan`, `PreOrderPage`, `PromoCodeEdit`,
`PromoCodeGeneratedPage`, `PurchaseCreate`, `QREntryScanner`, `Sidebar` (figma-ui-only,
production has its own), `SuiteBookingSchedules`, `SupervisingApprovalReview`,
`TableBookingSchedules`, `TravelAgencyDetail`.

### Container sweep (production)

For containers in `hkial-react/src/components/*` that still inline legacy JSX where a `figma-ui` page
view exists, replace the JSX with `<PageView {...props} />`. Today only three containers actually
import a `figma-ui` page view:

- `Dashboard.tsx` — done.
- `AccountList.tsx` — done.
- `BookingManagement.tsx` — done.
- `POSFoodAlert.tsx` — done.

The other ~30 containers import only `ui/*` primitives (`Card`, `Badge`, etc.) and inline their own
JSX. Migrating them to delegate to the new pure `figma-ui` views is a follow-up clean-up; it does not
cause a mock-data leak today.

### Verification gates

After each wave:

- `cd hkial-react && npm run build` — green at every commit cluster in this session.
- `cd hkial-react/src/components/figma-ui && npm run build` — requires `npm install` inside
  `figma-ui/` first; not run in this session because the standalone project has no installed
  `node_modules`. The figma-ui sources compile fine as part of the parent `hkial-react` build.
- Grep gate (must return zero outside `__fixtures__/`) for the high-signal identifiers:
  `generateMock`, `mockAccounts`, `mockBookings`, `INITIAL_PENDING`, `TRAVEL_AGENCY_DATA`,
  `firstNames`, `lastNames`, `airlines`. Currently only `BookingDetail` violates this gate
  (see "Remaining views with inline mock data" above).

### Manual smoke tests (left for the user)

- Login → Dashboard renders DB data (no `Cathay Pacific Welcome` mock card).
- Customers → AccountList renders DB rows (no fake `Wong Chi Ming` etc.).
- Bookings → BookingManagement renders DB rows.
- POS → POSFoodAlert pulls real kitchen orders from `/pos/kitchen` (or shows nothing if API empty).
