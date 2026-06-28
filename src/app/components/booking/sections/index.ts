/**
 * booking/sections/index.ts
 *
 * 2026-06-28 round 6.2.72 — barrel export for the 11 section
 * components. Each section is a controlled-input component
 * receiving `formData` (full BookingFormData) + `onFormChange`
 * (controlled inputs). The orchestrator `BookingEditView.tsx`
 * holds lifted state and assembles sections.
 *
 * 2026-06-28 round 6.2.75 (Phase B — Create parity) — merged
 * `EditSectionBooleanAddons` (6 boolean toggles) into
 * `EditSectionAddons` (the unified card). The barrelled list
 * now exports 10 components instead of 11; the
 * `EditSectionBooleanAddons` file is deleted.
 *
 * Sections:
 *  - EditSectionAccountInfo      — membership / discount / promo / channel / remark
 *  - EditSectionFlight           — flightType + flight fields + leg2 + numberOfLuggage + visit + suite + paymentMode
 *  - EditSectionGuestCounts      — 5 per-kind guest counts (PS/LD VIPs + NFGs)
 *  - EditSectionPassengers       — per-row passenger forms
 *  - EditSectionNFGs             — per-row NFG forms
 *  - EditSectionPhysicalResource — assignedSuiteIds[] + assignedLoungeIds[] checkbox grids
 *  - EditSectionLimoStops        — per-row Pick-up/Destination editor
 *  - EditSectionWheelchair       — Wheelchair recipient text input (gated on hasWheelchair)
 *  - EditSectionAddons           — Unified Add-on Services card (chips + searchable
 *                                  dropdown over CATALOG_ADDONS + Lounge Extension
 *                                  qty stepper + isAdHoc standalone toggle).
 *                                  Round 6.2.75 unified the pre-6.2.75 split
 *                                  `EditSectionBooleanAddons` + the legacy
 *                                  4-key CATALOG_ADDONS checkboxes into this
 *                                  one card (Create parity per Sky 2026-06-28).
 *  - EditSectionStaff            — In-Charge Staff multi-select (assignedStaffIds[])
 */

export { EditSectionAccountInfo } from './EditSectionAccountInfo';
export { EditSectionFlight } from './EditSectionFlight';
export { EditSectionGuestCounts } from './EditSectionGuestCounts';
export { EditSectionPassengers } from './EditSectionPassengers';
export { EditSectionNFGs } from './EditSectionNFGs';
export { EditSectionPhysicalResource } from './EditSectionPhysicalResource';
export { EditSectionLimoStops } from './EditSectionLimoStops';
export { EditSectionWheelchair } from './EditSectionWheelchair';
export { EditSectionAddons } from './EditSectionAddons';
export { EditSectionStaff } from './EditSectionStaff';