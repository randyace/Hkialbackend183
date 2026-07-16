import { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { ArrowLeft, AlertCircle, Car, ShoppingBag, CreditCard, Mail, FileText, CheckCircle, XCircle, RotateCcw, Edit2, Trash2, Download, DollarSign, Plane, Clock, ShieldCheck, Accessibility, Plus, Minus, MapPin, User, Tag, Phone, MessageSquare, BadgePercent, X, Building2, Search, History, Users, ExternalLink, Utensils, Eye, GitMerge, CheckCheck, AlertTriangle, UserCheck, Ticket, RefreshCw, Gem, Trophy, Star, Heart, Briefcase, Info, Edit, Save } from 'lucide-react';
import { BookingInvoiceDialog } from './booking/BookingInvoiceDialog';
// 2026-06-28 (round 6.2.71, Phase 4A) — BookingEditDialog deleted.
// The standalone edit page (`/bookings/:id/edit`) is now the
// SINGLE edit surface for admin bookings; the modal trigger is
// replaced with a header button that calls `onOpenFullEditor`
// (which the parent wrapper translates to `navigate('/bookings/{id}/edit')`).
//
// 2026-06-28 (round 6.2.72, Phase B) — pivot: the standalone
// edit page is DEPRECATED. The detail page itself becomes the
// sole edit surface. The `onOpenFullEditor` button in the
// header is removed (Phase E), and the section components
// from `./booking/sections/` are slotted into a new "Editable
// Sections" container at the bottom of this page. The parent
// wrapper manages `formData` lifted state and the master Save.
import { BookingMovementLog, type MovementEntry, type MovementForm } from './booking/BookingMovementLog';
import { BookingGuestsSearcher } from './booking/BookingGuestsSearcher';
import { BookingCustomerProfile, type CustomerProfile } from './booking/BookingCustomerProfile';
// 2026-06-28 (round 6.2.72, Phase B) — section components for
// the inline-editable cards inside the new "Editable Sections"
// container. Each section is a controlled-input component
// reading from `formData` and patching via `onFormChange`.
// The parent wrapper (`../BookingDetail.tsx`) owns the lifted
// `formData` state and assembles these sections.
import {
  EditSectionAccountInfo,
  EditSectionFlight,
  EditSectionPhysicalResource,
  EditSectionLimoStops,
  EditSectionWheelchair,
  EditSectionAddons,
  EditSectionStaff,
} from './booking/sections';
// 2026-06-28 (round 6.2.72, Phase B) — `BookingFormData` +
// `EditStaffOption` + `EditSuiteOption` types from the
// orchestrator. The orchestrator (`./BookingEditView.tsx`)
// owns the master Save pattern; this file slots the section
// components inside an "Editable Sections" container.
// 2026-06-28 (round 6.2.73) — also `EditPassenger` +
// `EditNonFlyingGuest` for the upper VIP Passenger Details /
// Non-Flying Guest Details cards, which now accept lifted
// state via `passengersOverride` / `nonFlyingGuestsOverride`.
import type {
  BookingFormData,
  EditStaffOption,
  EditSuiteOption,
  EditPassenger,
  EditNonFlyingGuest,
} from './BookingEditView';
// 2026-07-09 (round 6.2.129, M11 residual) — single source of truth
// for persistable add-on keys. Pre-6.2.129 this page kept a 22-item
// drifted list (names that did not match bookable_items.name_en)
// that AddonsSyncService silently dropped. Create / Edit dialog /
// EditSectionAddons already import CATALOG_ADDONS; this closes the
// last admin surface still hardcoding its own list.
import { CATALOG_ADDONS } from './addons';
import { computeVisitTimeRange } from './BookingEditView';
import {
  formatGuestDisplayName,
  resolveSuggestionGuest,
} from '../../../../../services/guestMergeService';
import { MergeReviewModal } from '../../../../common/MergeReviewModal';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import type {
  Booking, HistoricalGuest, PassengerTitle, AgeGroup,
  PassengerDetail, NonFlyingGuest,
} from './booking/BookingDetailMocks';

// ── Save-flow payload types (2026-06-15) ───────────────────────────────────────
// 6 new save buttons were previously wired to `toast.success(...)` only (no
// API call). They now accept these payloads from a parent callback. The
// parent (the wrapper in `../BookingDetail.tsx`) handles the actual PATCH
// and the `rawAdvancedDetails` merge — see the existing `onSaveEdit` pattern.

export interface GuestDetailsCounts {
  numPremiereSuites: number;
  vipPassengersInPremiereSuite: number;
  nonFlyingGuestsInPremiereSuite: number;
  vipPassengersInLoungeDeluxe: number;
  nonFlyingGuestsInLoungeDeluxe: number;
}

export interface SuiteAssignmentPayload {
  /** Suite / lounge NAME (the view's `<select>` holds names, not ids). The wrapper resolves the id via `suiteService.getSuites()`. */
  assignedSuite: string;
  assignedDate: string;
  assignedStartTime: string;
  assignedEndTime: string;
}

export interface StaffAssignmentPayload {
  /** List of staff ids selected in the In-Charge Staff checkboxes. */
  selectedStaffIds: number[];
}

export type BookingStatusValue =
  | 'Pending for Review' | 'Pending for Approval' | 'Approved' | 'Confirmed'
  | 'Rejected' | 'Cancelled' | 'No-show';
export type PaymentStatusValue =
  | 'Not Required' | 'Pending' | 'Payment Link Sent' | 'Paid' | 'Overdue' | 'Refunded';

export interface UpdateStatusPayload {
  status: BookingStatusValue;
  paymentStatus: PaymentStatusValue;
  rejectionReason?: string;
}
import {
  HISTORICAL_GUESTS, DETAIL_AGENCY_DATA, EXPLICIT_BOOKING_OVERRIDES,
  emptyPassenger, MONTHS,
  isPassengerFilled, buildInitialPassengers,
  emptyNonFlyingGuest, buildInitialNonFlyingGuests,
  generateMockBooking,
} from './booking/BookingDetailMocks';

// 2026-06-28 (round 6.2.73) — type-bridge helpers between the
// upper-card's local `PassengerDetail[]` / `NonFlyingGuest[]`
// state (short-form `ageGroup` strings like 'Adults (aged 12
// and above)') and the lifted `EditPassenger[]` /
// `EditNonFlyingGuest[]` arrays (long-form union). Both
// representations are accepted by the backend (see
// `Booking.php::countAgeBandFromPassengerList` round 6.2.53 —
// long-form aliases + short-form aliases both work). We pick
// short-form on the way out (matches the existing master Save
// wire format) and accept either on the way in.
function toPassengerDetail(p: Partial<EditPassenger>): PassengerDetail {
  return {
    title: (p.title ?? '') as PassengerTitle,
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    travelDocNo: p.travelDocNo ?? '',
    membershipNo: p.membershipNo ?? '',
    ageGroup: (p.ageGroup ?? '') as AgeGroup,
    birthdayDay: p.birthdayDay ?? '',
    birthdayMonth: p.birthdayMonth ?? '',
    birthdayYear: p.birthdayYear ?? '',
    foodAllergies: p.foodAllergies ?? '',
  };
}

function toEditPassenger(p: PassengerDetail): EditPassenger {
  return {
    title: p.title,
    firstName: p.firstName,
    lastName: p.lastName,
    travelDocNo: p.travelDocNo,
    membershipNo: p.membershipNo || undefined,
    ageGroup: (p.ageGroup || '') as EditPassenger['ageGroup'],
    birthdayDay: p.birthdayDay || undefined,
    birthdayMonth: p.birthdayMonth || undefined,
    birthdayYear: p.birthdayYear || undefined,
    foodAllergies: p.foodAllergies || undefined,
  };
}

function toNonFlyingGuest(g: Partial<EditNonFlyingGuest>): NonFlyingGuest {
  return {
    title: (g.title ?? '') as PassengerTitle,
    firstName: g.firstName ?? '',
    lastName: g.lastName ?? '',
    ageGroup: (g.ageGroup ?? '') as AgeGroup,
    foodAllergies: g.foodAllergies ?? '',
  };
}

function toEditNonFlyingGuest(g: NonFlyingGuest): EditNonFlyingGuest {
  return {
    title: g.title,
    firstName: g.firstName,
    lastName: g.lastName,
    ageGroup: (g.ageGroup || '') as EditNonFlyingGuest['ageGroup'],
    foodAllergies: g.foodAllergies || undefined,
  };
}

interface BookingDetailProps {
  bookingId: number;
  onBack: () => void;
  // 2026-06-30 — forward `showTransit` to <EditSectionFlight>
  // so the Transit option + 2nd-leg block can be hidden. Wrapper
  // (admin BookingDetail.tsx) passes false per Sky's directive.
  showTransit?: boolean;
}

// ── Passenger detail types ────────────────────────��─────────────────────────
// ── MOCK constant (isolated) — container passes real booking via prop ─────────
const MOCK_BOOKING_ID = 1;

export interface BookingDetailFullProps extends BookingDetailProps {
  /** Pass fully-loaded Booking from CI4; when null component uses mock data internally */
  booking?: Booking | null;
  onEdit?: () => void;
  onApprove?: (id: number) => void;
  isLoading?: boolean;
  /**
   * 2026-06-29 (round 6.2.80, Bug #6 / Pilot 2 Bug 3) — active
   * promo-code catalog forwarded to `EditSectionAccountInfo`
   * so the Promo Code `<Select>` can present real codes (id /
   * code / discountType / discountValue). Mirrors the
   * `staffOptions` / `suiteOptions` empty-fallback pattern:
   * when omitted (figma-ui standalone preview), the section
   * renders the disabled text-input fallback so the MOCK
   * booking stays self-previewable per INV-X1.
   */
  promoCodeOptions?: Array<{
    id: number;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number | string;
  }>;
  /**
   * 2026-06-28 (round 6.2.71, Phase 4A) — Edit Booking header button.
   * Replaces the `onSaveEdit` + `isSavingEdit` props (which were
   * wired to the now-deleted `<BookingEditDialog>` modal). The
   * header button now calls `onOpenFullEditor(bookingId)` instead
   * of opening a modal; the parent wrapper navigates to
   * `/bookings/{id}/edit` (the standalone edit page).
   *
   * Single-edit-surface contract: there is now ONE place to edit
   * a booking — the standalone edit page. The 6 inline save cards
   * on this detail page (Save Guest Details / Save Assignment /
   * Save Staff Assignment / Save Passenger Details / Save Guest
   * Details for NFGs / Update Status) are still wired via their
   * own callbacks and remain operational for status transitions
   * + small in-place edits. Phase 4B will convert them to
   * read-only display in a follow-up patch (per the consolidation
   * plan — see `docs/handoff/2026-06-28-booking-edit-flow-consolidation-phase-1.md`).
   */
  onOpenFullEditor?: (bookingId: number) => void;
  /**
   * Round 6.2.12 (2026-06-08, user-reported: "this part
   * should not be 3600, it is bookings/684") — live price
   * preview from `POST /api/bookings/price-preview`. The
   * wrapper fetches this on mount + after the edit dialog
   * saves (to refresh the total after any change). When the
   * booking is in `payment_status: Pending` (no committed
   * `booking.amount` yet), the page displays this value
   * instead of the local `headCountRate × pax` estimate
   * (which was wrong for booking 684: 3 pax × HK$1,200 =
   * HK$3,600, vs the backend's correct HK$25,000). Set to
   * `null` while loading or on fetch error to fall back to
   * the local estimate.
   */
  livePreviewTotal?: number | null;
  // 2026-06-17 (round 6.2.47) — the price-preview's
  // `breakdown[]` array. Forwarded to `BookingInvoiceDialog`
  // so the dialog renders one row per line item instead of
  // the round 6.2.13 single-line "Lounge Access" black box.
  // Wrapper populates this from the same
  // `POST /api/bookings/price-preview` response that supplies
  // `livePreviewTotal`.
  livePreviewBreakdown?: Array<{ key: string; label: string; qty: number; unit_price: number; subtotal: number; product?: string }>;
  // 2026-06-11 — round 6.2.34 UX. Wrapper pre-fetches the
  // booking's account (for the "View Customer Profile"
  // dialog) on mount + on account change, then maps the
  // Account JSON into a `CustomerProfile` and passes the
  // result here. The dialog reads spouse / preferences /
  // allergies / dietary / movements / remarks / vipProfile
  // from this prop (per INV-12/15 — no hard-coded mock
  // data; INV-9 — no parallel useState in view). The 3
  // states are:
  //   - `undefined` → booking has no accountId (legacy);
  //                  click handler falls back to a
  //                  per-booking synthesised profile with
  //                  only the 12 base fields
  //   - `null`      → wrapper fetch failed (network / 401);
  //                  same fallback as `undefined`
  //   - `value`     → real data, dialog renders it
  customerProfile?: CustomerProfile | null;
  // ── 2026-06-15 — round 6.2.41, save buttons fix ─────────────────────────────
  // Six save buttons on this page were previously wired to `toast.success(...)`
  // only — no API call, no persistence. The user reported:
  //   "in the admin panel booking detail page, Save Passenger Details is
  //    not working at all, please check and fix. other save button on that
  //    page may be broken too"
  // Each callback below receives the relevant payload and is expected to
  // PUT to the backend (or call `bookingService.updateBookingStatus` for
  // status), then re-fetch the booking so the page reflects the change.
  // The view handles "no callback provided" by showing a friendly
  // "Save not yet wired" toast so legacy / standalone preview render
  // paths (BookingDetailMocks) don't crash.
  /** Save Premiere Suite / Lounge Deluxe guest counts. */
  onSaveGuestDetails?: (counts: GuestDetailsCounts) => Promise<void>;
  isSavingGuestDetails?: boolean;
  /** Save suite / lounge table + date + time slot (Confirmed+Paid only). */
  onSaveAssignment?: (payload: SuiteAssignmentPayload) => Promise<void>;
  isSavingAssignment?: boolean;
  /** Save in-charge staff checkboxes (Confirmed+Paid only). */
  onSaveStaffAssignment?: (payload: StaffAssignmentPayload) => Promise<void>;
  isSavingStaffAssignment?: boolean;
  /** Save VIP passenger name / doc / birthday / allergies cards. */
  onSavePassengerDetails?: (passengers: PassengerDetail[]) => Promise<void>;
  isSavingPassengerDetails?: boolean;
  /** Save non-flying guest name / ageGroup / allergies cards. */
  onSaveNonFlyingGuestDetails?: (nfgs: NonFlyingGuest[]) => Promise<void>;
  isSavingNonFlyingGuestDetails?: boolean;
  /** Save booking status + payment status + rejection reason. */
  onUpdateStatus?: (payload: UpdateStatusPayload) => Promise<void>;
  isUpdatingStatus?: boolean;
  // 2026-06-19 (round 6.2.49, payment_getway merge) — Send
  // Adyen payment link callback. Forwarded from the parent
  // wrapper (which owns the `paymentApi` import) to the
  // `BookingInvoiceDialog` (figma-ui) so the "Generate Payment
  // Link" button in the invoice dialog hits the real
  // `POST /api/bookings/{id}/send-payment-link` endpoint
  // instead of being a toast-stub.
  onSendPaymentLink?: () => Promise<void>;
  // 2026-06-17 (round 6.2.47) — fired after a successful
  // `send-invoice` POST. The parent wrapper uses this to
  // refresh the booking's payment_status on the page.
  onInvoiceSent?: (response: { invoice_no: string; data: Record<string, unknown> }) => void;
  // 2026-06-17 (round 6.2.47 follow-up) — pass-through for
  // the invoice dialog's API base URL. The dialog defaults
  // to `window.location.origin` (the Vite dev server, NOT the
  // Laravel API), which causes the fetch / blob download to
  // hit `http://localhost:5173/api/bookings/{id}/invoice.pdf`
  // — Vite has no `/api` proxy, so the request 404s or returns
  // the SPA's index.html (depending on history fallback).
  // The parent wrapper reads the same `VITE_API_BASE_URL` /
  // default `http://localhost:8000/api` constant used by
  // `bookingService.ts` and forwards it here.
  apiBaseUrl?: string;
  // 2026-06-17 (round 6.2.47 follow-up) — Sanctum bearer token
  // for the staff user. The dialog already falls back to
  // `localStorage.auth_token` if omitted, but passing it
  // explicitly avoids a race where the dialog mounts before
  // the token is persisted (the wrapper has just done a
  // login round-trip on its own path).
  authToken?: string;
  /**
   * CRM Identity Resolution — pending soft-merge suggestions from
   * `GET /api/bookings/{id}/merge-suggestions`. When non-empty, the
   * Figma "Similar Profile Detected" banner is shown.
   */
  pendingSuggestions?: Array<{
    id: string;
    new_guest_id: string;
    existing_guest_id: string;
    match_score: number;
    status: string;
    existing_guest?: {
      id: string;
      title?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      passport_prefix?: string | null;
      dob?: string | null;
      food_allergies?: unknown;
      dietary_requirements?: unknown;
    } | null;
    new_guest?: {
      id: string;
      title?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      passport_prefix?: string | null;
      dob?: string | null;
      food_allergies?: unknown;
      dietary_requirements?: unknown;
    } | null;
  }>;
  /** Runs `POST /api/guests/{guestId}/trigger-match` with guest_profiles UUID (not ACC-…). */
  onRunIdentityCheck?: (guestProfileId: string) => void | Promise<void>;
  isRunningIdentityCheck?: boolean;
  /** Guest profile UUID used by Run Identity Check. */
  identityGuestId?: string | null;
  /**
   * Called after a successful profile merge confirm so the wrapper can
   * refresh booking details + pending merge suggestions.
   */
  onMergeComplete?: () => void | Promise<void>;
  // 2026-06-23 (round 6.2.49 follow-up #3) — parent-delegated
  // invoice handlers. The current figma-ui dialog is still
  // self-contained (it uses `apiBaseUrl`/`authToken`/`onInvoiceSent`),
  // but the parent wrapper also passes these for the delegated
  // variant. Keep them optional so the wrapper type-checks; they
  // are intentionally ignored until the next figma-ui refactor.
  onSendInvoice?: () => Promise<unknown>;
  onDownloadPdf?: () => Promise<void>;
  // 2026-06-18 (round 6.2.48) — Movement Log (round-trip
  // through `GET/POST/DELETE /api/bookings/{id}/movements`).
  // Wrapper fetches `movements` on mount + after each add/
  // delete. The view passes the data + callbacks through to
  // `BookingMovementLog` (the dialog). Without these props,
  // the dialog renders its built-in empty state and the Add
  // button is disabled.
  movements?: MovementEntry[];
  onAddMovement?: (form: MovementForm) => Promise<void>;
  onDeleteMovement?: (id: number) => Promise<void>;
  isAddingMovement?: boolean;
  isDeletingMovement?: boolean;

  // 2026-06-28 (round 6.2.72, Phase B) — Inline Editable Sections
  // container. Per Sky's pivot from round 6.2.71, the standalone
  // edit page (`/bookings/:id/edit`) is deprecated; the detail
  // page is now the sole edit surface. The 11 section components
  // (in `./booking/sections/`) are slotted into a new container
  // at the bottom of this page, controlled by lifted `formData`
  // state owned by the parent wrapper. The master Save button
  // calls `onSaveAllChanges(formData)` which the wrapper handles
  // (PUT + refetch). Sky can lock down individual sections later.
  /** Lifted BookingFormData state — drives the 11 section components. */
  formData?: BookingFormData;
  /** Patch the lifted formData. The wrapper merges via shallow Object.assign. */
  onFormChange?: (patch: Partial<BookingFormData>) => void;
  /** Master Save callback — receives the full formData. Wrapper does PUT + refetch. */
  onSaveAllChanges?: (data: BookingFormData) => Promise<void> | void;
  /** Master Save in-flight indicator (wrapper sets true during PUT). */
  isSavingAllChanges?: boolean;
  /** Staff roster for In-Charge Staff multi-select. Fetched from `/api/system/users`. */
  staffOptions?: EditStaffOption[];
  /** Physical resource catalog for PS/LD checkboxes. Fetched from `/api/suites`. */
  suiteOptions?: EditSuiteOption[];

  // 2026-06-28 (round 6.2.73) — Lift the upper Booking
  // Details / VIP Passenger Details / Non-Flying Guest Details
  // cards' state to the parent wrapper's `formData`. Sky's Q3
  // + Q4: the whole page IS the editor; the upper cards'
  // existing editable inputs (PS/LD counts + passenger/NFG
  // rows) are wired to `formData` via these override props +
  // onChange callbacks. When the override is provided, it
  // wins over the legacy local useState. After a master Save
  // refetch, the parent's formData updates → overrides change
  // → a useEffect below re-seeds local state so the inputs
  // reflect the new server values.
  numPremiereSuitesOverride?: number;
  vipPassengersInPremiereSuiteOverride?: number;
  nonFlyingGuestsInPremiereSuiteOverride?: number;
  vipPassengersInLoungeDeluxeOverride?: number;
  nonFlyingGuestsInLoungeDeluxeOverride?: number;
  passengersOverride?: EditPassenger[];
  nonFlyingGuestsOverride?: EditNonFlyingGuest[];
  /** Patch the lifted formData counts when an upper-card input changes. */
  onGuestCountChange?: (patch: Partial<GuestDetailsCounts>) => void;
  /** Replace the lifted formData passengers[] when an upper VIP row changes. */
  onPassengersChange?: (next: EditPassenger[]) => void;
  /** Replace the lifted formData nonFlyingGuestsList[] when an upper NFG row changes. */
  onNonFlyingGuestsChange?: (next: EditNonFlyingGuest[]) => void;
  /**
   * `true` when the upper-card binding rules (PS must have ≥1
   * VIP, max 6 guests per PS, max 3 NFG per LD, etc.) are
   * violated. Disables the master Save button so the admin
   * must fix the violation before saving. Computed by the
   * parent wrapper from `formData`.
   */
  hasGuestErrors?: boolean;
  // 2026-06-28 — number of VIP / NFG rows whose required fields
  // (Title / First Name / Last Name / Age Group / [Travel Doc
  // No. for VIPs]) are blank. Surfaced in the master Save
  // warning text + used by the local fallback (line ~1260+)
  // when the wrapper doesn't pass `hasGuestErrors`. Computed by
  // the parent wrapper from `formData`.
  incompleteVipInfoCount?: number;

  // 2026-06-28 (round 6.2.75, Phase B — Create parity) —
  // DB price map from `GET /api/bookable-items`. Forwarded
  // to the unified `EditSectionAddons` so the chips + dropdown
  // show DB prices instead of hard-coded `CATALOG_ADDONS.defaultPrice`.
  // Optional — falls back to defaultPrice when missing (mirrors
  // Create's behavior at CreateBooking.tsx:2706-2716).
  bookableItemPrices?: Record<string, number>;
  /** 2026-07-16 — Lane B catalog picker slot. */
  catalogAddonSlot?: React.ReactNode;
}

export function BookingDetail({ bookingId = MOCK_BOOKING_ID, booking: bookingProp, onBack, onApprove, isLoading = false, onOpenFullEditor, livePreviewTotal = null, livePreviewBreakdown = [], customerProfile = null, onSaveGuestDetails, isSavingGuestDetails = false, onSaveAssignment, isSavingAssignment = false, onSaveStaffAssignment, isSavingStaffAssignment = false, onSavePassengerDetails, isSavingPassengerDetails = false, onSaveNonFlyingGuestDetails, isSavingNonFlyingGuestDetails = false, onUpdateStatus, isUpdatingStatus = false, onSendPaymentLink, onInvoiceSent, apiBaseUrl, authToken, pendingSuggestions = [], onRunIdentityCheck, isRunningIdentityCheck = false, identityGuestId = null, onMergeComplete, movements = [], onAddMovement, onDeleteMovement, isAddingMovement = false, isDeletingMovement = false, formData, onFormChange, onSaveAllChanges, isSavingAllChanges = false, staffOptions = [], suiteOptions = [], promoCodeOptions = [], numPremiereSuitesOverride, vipPassengersInPremiereSuiteOverride, nonFlyingGuestsInPremiereSuiteOverride, vipPassengersInLoungeDeluxeOverride, nonFlyingGuestsInLoungeDeluxeOverride, passengersOverride, nonFlyingGuestsOverride, onGuestCountChange, onPassengersChange, onNonFlyingGuestsChange, hasGuestErrors = false, incompleteVipInfoCount = 0, bookableItemPrices, catalogAddonSlot, // 2026-06-30 — forward `showTransit` to <EditSectionFlight>; default true (backward-compat)
 showTransit = true }: BookingDetailFullProps) {
  const [showInvoice, setShowInvoice] = useState(false);

  // ── Movement Log ─────────────────────────────────────────────────────────
  const [isMovementLogOpen, setIsMovementLogOpen] = useState(false);
  // ── Stubs for dead-code blocks that reference now-extracted state ────────
  // (These are inert; they silence TypeScript errors in {false && ...} blocks
  //  that were not yet pruned from the file after sub-component extraction.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [bookingMovements, setBookingMovements] = useState<never[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAddMovementOpen, setIsAddMovementOpen] = useState(false);
  // Edit-dialog stubs (block moved to BookingEditDialog.tsx)
  interface _EditLimoStop { id: number; type: 'Pick-up' | 'Destination'; location: string; }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editFlightType,        setEditFlightType]        = useState<'Arrival'|'Departure'|'Transition'>('Departure');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editFlightNo,          setEditFlightNo]          = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editFlightTime,        setEditFlightTime]        = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editFlightClass,       setEditFlightClass]       = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editFlightDest,        setEditFlightDest]        = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editFlightOrigin,      setEditFlightOrigin]      = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editNumLuggage,        setEditNumLuggage]        = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editSuite,             setEditSuite]             = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editVisitDate,         setEditVisitDate]         = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editVisitTime,         setEditVisitTime]         = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editNumGuests,         setEditNumGuests]         = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editNonFlying,         setEditNonFlying]         = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editSelectedServices,  setEditSelectedServices]  = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editAddonSearch,       setEditAddonSearch]       = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showEditAddonDropdown, setShowEditAddonDropdown] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editLimoStops,         setEditLimoStops]         = useState<_EditLimoStop[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addEditLimoStop    = () => {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeEditLimoStop = (_id: number) => {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateEditLimoStop = (_id: number, _field: keyof _EditLimoStop, _val: string) => {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editSpecialReqs,       setEditSpecialReqs]       = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEditToggleService = (_key: string) => {};
  // ─────────────────────────────────────────────────────────────────────────

  // ── Customer Searcher ────────────────────────────────────────────────────
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchQuery,  setCustomerSearchQuery]  = useState('');
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  const booking = bookingProp || generateMockBooking(bookingId);

  // Editable guest fields — Premiere Suite
  // 2026-06-28 (round 6.2.73) — local `useState` retained for
  // legacy callers (no overrides). When `numPremiereSuitesOverride`
  // is provided by the parent wrapper, it wins. The `setNumPremiereSuites`
  // wrapper also emits via `onGuestCountChange` so the wrapper's
  // `formData` stays in sync.
  const [localNumPremiereSuites, setLocalNumPremiereSuites] = useState(booking.numberOfPremiereSuites ?? 0);
  const numPremiereSuites = numPremiereSuitesOverride ?? localNumPremiereSuites;
  const setNumPremiereSuites = (val: number) => {
    setLocalNumPremiereSuites(val);
    onGuestCountChange?.({ numPremiereSuites: val });
  };
  // After a master Save refetch, the parent re-maps the booking
  // → formData → override changes → sync local state.
  useEffect(() => {
    if (numPremiereSuitesOverride !== undefined) setLocalNumPremiereSuites(numPremiereSuitesOverride);
  }, [numPremiereSuitesOverride]);

  const [localVipPS, setLocalVipPS] = useState(booking.vipPassengersInPremiereSuite ?? 0);
  const vipPS = vipPassengersInPremiereSuiteOverride ?? localVipPS;
  const setVipPS = (val: number) => {
    setLocalVipPS(val);
    onGuestCountChange?.({ vipPassengersInPremiereSuite: val });
  };
  useEffect(() => {
    if (vipPassengersInPremiereSuiteOverride !== undefined) setLocalVipPS(vipPassengersInPremiereSuiteOverride);
  }, [vipPassengersInPremiereSuiteOverride]);

  const [localNonFlyingPS, setLocalNonFlyingPS] = useState(booking.nonFlyingGuestsInPremiereSuite ?? 0);
  const nonFlyingPS = nonFlyingGuestsInPremiereSuiteOverride ?? localNonFlyingPS;
  const setNonFlyingPS = (val: number) => {
    setLocalNonFlyingPS(val);
    onGuestCountChange?.({ nonFlyingGuestsInPremiereSuite: val });
  };
  useEffect(() => {
    if (nonFlyingGuestsInPremiereSuiteOverride !== undefined) setLocalNonFlyingPS(nonFlyingGuestsInPremiereSuiteOverride);
  }, [nonFlyingGuestsInPremiereSuiteOverride]);

  // Editable guest fields — Lounge Deluxe
  const [localVipLD, setLocalVipLD] = useState(booking.vipPassengersInLoungeDeluxe ?? 0);
  const vipLD = vipPassengersInLoungeDeluxeOverride ?? localVipLD;
  const setVipLD = (val: number) => {
    setLocalVipLD(val);
    onGuestCountChange?.({ vipPassengersInLoungeDeluxe: val });
  };
  useEffect(() => {
    if (vipPassengersInLoungeDeluxeOverride !== undefined) setLocalVipLD(vipPassengersInLoungeDeluxeOverride);
  }, [vipPassengersInLoungeDeluxeOverride]);

  // VIP Passenger detail forms — one entry per VIP passenger (PS + LD)
  // 2026-06-28 (round 6.2.73) — local `useState` retained for
  // legacy callers (no `passengersOverride`). When the override
  // is provided, it wins. Two useEffects keep the two in sync:
  //   1. local `passengers` change → emit via `onPassengersChange`
  //   2. `passengersOverride` change → re-seed local state
  //      (handles the master Save refetch path)
  // Both useEffects track a JSON hash of the last-emitted /
  // last-synced value to avoid an infinite loop (each emit
  // causes a formData update → override change → sync useEffect
  // would fire → loop).
  const [passengers, setPassengers] = useState<PassengerDetail[]>(() =>
    booking.passengers && booking.passengers.length > 0
      ? booking.passengers.map(p => ({
          title: (p.title || '') as PassengerTitle,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          travelDocNo: p.travelDocNo || '',
          membershipNo: p.membershipNo || '',
          ageGroup: (p.ageGroup || '') as AgeGroup,
          birthdayDay: p.birthdayDay || '',
          birthdayMonth: p.birthdayMonth || '',
          birthdayYear: p.birthdayYear || '',
          foodAllergies: p.foodAllergies || '',
        }))
      : bookingProp
        ? Array.from(
            { length: (booking.vipPassengersInPremiereSuite ?? 0) + (booking.vipPassengersInLoungeDeluxe ?? 0) },
            emptyPassenger
          )
        : buildInitialPassengers(
            (booking.vipPassengersInPremiereSuite ?? 0) + (booking.vipPassengersInLoungeDeluxe ?? 0),
            bookingId
          )
  );
  // 2026-06-28 (round 6.2.73) — JSON hash of the last-emitted
  // value to prevent the emit↔sync feedback loop.
  const lastEmittedPassengersRef = useRef<string>('');
  // Emit local state → onPassengersChange when local changes.
  // Round 6.2.73 (lifted state): the parent wrapper merges
  // this into its `formData.passengers[]` so the master Save
  // PUT payload includes the latest upper-card edits.
  useEffect(() => {
    if (onPassengersChange) {
      const next = passengers.map(toEditPassenger);
      const hash = JSON.stringify(next);
      if (hash !== lastEmittedPassengersRef.current) {
        lastEmittedPassengersRef.current = hash;
        onPassengersChange(next);
      }
    }
  }, [passengers, onPassengersChange]);
  // Re-seed local state from override (post-master-Save refetch
  // path; override change = parent updated formData.passengers).
  // Skip the very first fire so we don't overwrite the
  // useState initializer's value (which already loaded
  // booking.passengers per round 6.2.7).
  const isPassengersOverrideInitialMount = useRef(true);
  useEffect(() => {
    if (isPassengersOverrideInitialMount.current) {
      isPassengersOverrideInitialMount.current = false;
      return;
    }
    if (passengersOverride) {
      const overrideHash = JSON.stringify(passengersOverride);
      // Skip if override matches what we last emitted (prevents
      // the emit↔sync feedback loop).
      if (overrideHash !== lastEmittedPassengersRef.current) {
        setPassengers(passengersOverride.map(toPassengerDetail));
        lastEmittedPassengersRef.current = overrideHash;
      }
    }
  }, [passengersOverride]);

  // Sync passenger list length whenever the total VIP count changes
  // 2026-06-08 round 6.2.9 — passengers useEffect (the count-based
  // resize). Pre-6.2.9 this useEffect fired on mount + on every
  // stepper change, growing/truncating the `passengers` array to
  // match `vipPS + vipLD`. For bookings where the API's
  // `advanced_details.premiereVipPassengers + loungeVipPassengers`
  // (which feed `vipPS + vipLD`) didn't equal the actual
  // `booking.passengers[]` length, the useEffect OVERWROTE the
  // real data with empty placeholder cards. Example: booking
  // 674 has passengers=[Keith Luk] (length 1) but
  // vipPS + vipLD = 1 + 1 = 2, so the user saw [Keith Luk,
  // empty card] instead of just [Keith Luk].
  //
  // The fix: use a `useRef` "is initial mount" flag to skip the
  // mount-time fire. The useEffect now ONLY fires on user stepper
  // changes (where growing/truncating is the intended behavior).
  // Mount uses the `useState` initializer's value (which already
  // reads from `booking.passengers` per the round 6.2.7 fix).
  const isPassengersInitialMount = useRef(true);
  // 2026-06-26 — round 6.2.67 (M20 PS/LD order fix):
  // direction-aware grow. Same algorithm as the
  // CreateBooking.tsx:1132+ useEffect. Tracks previous
  // vipPS/vipLD via refs and INSERTS PS empties at the
  // PS/LD boundary instead of always appending to the
  // tail. See the CreateBooking comment for the full
  // rationale. The mount-skip ref (`isPassengersInitialMount`)
  // is preserved from the round 6.2.9 fix — it prevents
  // the useEffect from overwriting the `useState`
  // initializer's value on first mount (which loads
  // existing-booking passenger data per the round 6.2.7
  // fix).
  const prevVipPSRef = useRef(vipPS);
  const prevVipLDRef = useRef(vipLD);
  useEffect(() => {
    if (isPassengersInitialMount.current) {
      isPassengersInitialMount.current = false;
      prevVipPSRef.current = vipPS;
      prevVipLDRef.current = vipLD;
      return;                                              // skip mount — initializer wins
    }
    const prevVipPS = prevVipPSRef.current;
    const prevVipLD = prevVipLDRef.current;
    prevVipPSRef.current = vipPS;
    prevVipLDRef.current = vipLD;
    const psDelta = vipPS - prevVipPS;
    const ldDelta = vipLD - prevVipLD;
    setPassengers(prev => {
      const total = vipPS + vipLD;
      // 2026-06-08 round 6.2.11 — INV-13: only-GROW
      // semantics even on post-mount fires. Pre-6.2.11:
      // prev.slice(0, total) would silently destroy
      // user-typed data if the user changes the stepper.
      if (prev.length >= total) return prev;                // never truncate (INV-13)
      let next = prev;
      if (ldDelta > 0) {
        next = [...next, ...Array.from({ length: ldDelta }, emptyPassenger)];
      }
      if (psDelta > 0) {
        const insertAt = prevVipPS;
        next = [
          ...next.slice(0, insertAt),
          ...Array.from({ length: psDelta }, emptyPassenger),
          ...next.slice(insertAt),
        ];
      }
      return next;
    });
  }, [vipPS, vipLD]);

  const updatePassenger = (idx: number, field: keyof PassengerDetail, value: string) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // ── Add New Item (add-on services) ─────────────────────────────────────────
  // 2026-07-09 (round 6.2.129, M11 residual) — derive from shared
  // CATALOG_ADDONS only (4 persistable catalog keys). Pre-6.2.129
  // this was a 22-item hard-coded list with names that did not
  // match bookable_items.name_en → AddonsSyncService silent drop.
  type AddonService = string;
  const addonServices: { key: AddonService; icon: ReactNode; desc: string; defaultPrice: string }[] =
    CATALOG_ADDONS.map((a) => ({
      key: a.key,
      icon: a.icon,
      desc: a.desc,
      defaultPrice: a.defaultPrice.toFixed(2),
    }));
  const [selectedAddon, setSelectedAddon] = useState<AddonService | null>(null);
  const [addonQty, setAddonQty]           = useState(1);
  const [addonUnitPrice, setAddonUnitPrice] = useState('');
  const [addonDiscount, setAddonDiscount]   = useState('0');
  const [addonRemarks, setAddonRemarks]     = useState('');
  const [addonSearch, setAddonSearch]       = useState('');
  const [showAddonDropdown, setShowAddonDropdown] = useState(false);

  // Limousine — multiple stops
  interface LimoStop { id: number; type: 'Pick-up' | 'Destination'; location: string; }
  const [limoStops, setLimoStops] = useState<LimoStop[]>([{ id: 1, type: 'Pick-up', location: '' }]);
  const addLimoStop    = () => setLimoStops(prev => [...prev, { id: Date.now(), type: 'Destination', location: '' }]);
  const removeLimoStop = (id: number) => setLimoStops(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  const updateLimoStop = (id: number, field: keyof LimoStop, value: string) =>
    setLimoStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  // Wheelchair — passenger name
  const [wheelchairPassenger, setWheelchairPassenger] = useState('');

  const handleSelectAddon = (key: AddonService, defaultPrice: string) => {
    setSelectedAddon(key);
    setAddonUnitPrice(defaultPrice);
    setAddonQty(1);
    setAddonDiscount('0');
    setLimoStops([{ id: 1, type: 'Pick-up', location: '' }]);
    setWheelchairPassenger('');
    setAddonSearch('');
    setShowAddonDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedAddon) { toast.error('Please select an add-on service first.'); return; }
    if (selectedAddon === 'Limousine Transfer' && limoStops.every(s => !s.location.trim())) {
      toast.error('Please enter at least one destination or pick-up point.');
      return;
    }
    if (selectedAddon === 'Wheelchair Assistance' && !wheelchairPassenger.trim()) {
      toast.error('Please enter the passenger name.');
      return;
    }

    // Persist into lifted edit formData so multiple add-ons can be
    // stacked (pre-fix only toasted and reset — the 2nd pick
    // replaced the 1st and nothing reached Save All Changes).
    if (formData && onFormChange) {
      if (selectedAddon === 'Limousine Transfer') {
        onFormChange({
          hasLimousine: true,
          limoStops: limoStops.map((s) => ({
            id: s.id,
            type: s.type,
            location: s.location,
          })),
        });
      } else if (selectedAddon === 'Wheelchair Assistance') {
        onFormChange({
          hasWheelchair: true,
          wheelchairPassenger: wheelchairPassenger.trim(),
        });
      } else if (selectedAddon === 'Security Escort Service') {
        onFormChange({ hasSecurity: true });
      } else if (selectedAddon === 'Lounge Extension') {
        onFormChange({
          hasLoungeExtension: true,
          loungeExtensionQty: Math.max(1, Math.min(6, addonQty || 1)),
        });
      } else {
        // Lane B / unexpected catalog name — qty-only selection.
        const prev = formData.catalogAddonSelections ?? [];
        const without = prev.filter((s) => s.name !== selectedAddon);
        onFormChange({
          catalogAddonSelections: [
            ...without,
            { name: selectedAddon, quantity: Math.max(1, addonQty || 1) },
          ],
        });
      }
      toast.success(`"${selectedAddon}" added. Click Save All Changes below to persist.`);
    } else {
      toast.success(`"${selectedAddon}" added to booking!`);
    }

    setSelectedAddon(null);
    setAddonQty(1);
    setAddonUnitPrice('');
    setAddonDiscount('0');
    setAddonRemarks('');
    setAddonSearch('');
    setShowAddonDropdown(false);
    setLimoStops([{ id: 1, type: 'Pick-up', location: '' }]);
    setWheelchairPassenger('');
  };

  // ── Edit Booking Dialog ──────────────────────────────────────────────────
  // 2026-06-28 (round 6.2.71, Phase 4A) — `isEditBookingOpen`
  // state DELETED. The modal that used to open on this state
  // (`<BookingEditDialog>`) was removed per the consolidation
  // plan. The header's `[Edit Booking]` button now calls
  // `onOpenFullEditor?.(bookingId)` (parent wrapper navigates
  // to `/bookings/{id}/edit`). The dead
  // `{false && false && <div>` block that held the old inline
  // edit dialog JSX (lines 4028-4720 pre-Phase 4) was also
  // removed; the entire 700+ line dead-code block is gone.
  // ────────────────────────────────────────────────────────────────────

  // ── Contact Person (from booking data) ──────────────────────────────────
  // 2026-06-28 (round 6.2.76) — split `regionCode` from the local
  // `contactNo` on initial load. The API stores the contact phone
  // as either `+XXX 9876-5432` (post-6.2.8 customer form) or
  // `+XXX-9876-5432` (legacy / admin form). The pre-6.2.76 view
  // stuffed the whole string into one `contactNo` input, so the
  // region code leaked into the number field on display.
  //
  // 2026-06-28 (round 6.2.77) — wire to lifted `formData` /
  // `onFormChange` so user edits reach the master Save PUT. Pre-
  // 6.2.77 the inputs read from local useState only and onChange
  // never called `onFormChange` — `bookingToFormData` did NOT
  // populate contact fields either, so even the unsaved-state
  // didn't round-trip through the master Save. Now: prefer the
  // lifted `formData` field when present (parent wrapper has
  // fetched + mapped), otherwise fall back to local state
  // initialised from `booking.contactPerson` (standalone demo
  // mode + first-render flash). onChange dispatches to
  // `onFormChange` when available, else to local state.
  const parsePhone = (raw: string | undefined): { regionCode: string; contactNo: string } => {
    if (!raw) return { regionCode: '', contactNo: '' };
    // Match "+XXX" or "+XX-XXX" prefix followed by whitespace or
    // a dash, then the local number.
    const m = raw.match(/^(\+\d+(?:-\d+)?)[\s\-]+(.+)$/);
    if (m) return { regionCode: m[1], contactNo: m[2] };
    return { regionCode: '', contactNo: raw };
  };
  const initialPhone = parsePhone(booking.contactPerson?.phone);
  const [localContactName,  setLocalContactName]  = useState(booking.contactPerson?.name ?? '');
  const [localContactEmail, setLocalContactEmail] = useState(booking.contactPerson?.email ?? '');
  const [localRegionCode,   setLocalRegionCode]   = useState(initialPhone.regionCode);
  const [localContactNo,    setLocalContactNo]    = useState(initialPhone.contactNo);
  const [localBookingMemo,  setLocalBookingMemo]  = useState(booking.contactPerson?.memo ?? '');
  const contactName  = formData?.contactName  ?? localContactName;
  const contactEmail = formData?.contactEmail ?? localContactEmail;
  const regionCode   = formData?.regionCode   ?? localRegionCode;
  const contactNo    = formData?.contactNo    ?? localContactNo;
  const bookingMemo  = formData?.contactMemo  ?? localBookingMemo;
  // Helper dispatchers: push to lifted formData when the parent
  // wrapper provides onFormChange (master Save path), else fall
  // back to local state (standalone demo mode without formData).
  const setContactName  = (v: string) => {
    if (onFormChange) onFormChange({ contactName: v });
    else setLocalContactName(v);
  };
  const setContactEmail = (v: string) => {
    if (onFormChange) onFormChange({ contactEmail: v });
    else setLocalContactEmail(v);
  };
  const setRegionCode   = (v: string) => {
    if (onFormChange) onFormChange({ regionCode: v });
    else setLocalRegionCode(v);
  };
  const setContactNo    = (v: string) => {
    if (onFormChange) onFormChange({ contactNo: v });
    else setLocalContactNo(v);
  };
  const setBookingMemo  = (v: string) => {
    if (onFormChange) onFormChange({ contactMemo: v });
    else setLocalBookingMemo(v);
  };

  // ── Promotion / Redemption Code ──────────────────────────────────────────
  // 2026-07-02 (round 6.2.82) — REMOVED the legacy "13. Promotion /
  // Redemption Code" Card. The card validated against a 6-entry
  // `MOCK_PROMOS` hardcoded dictionary (SUMMER2024 / VIP20 / WELCOME /
  // TRAVEL10 / REDEEM50 / DIAMOND15), so real promo codes added via
  // `POST /api/promo-codes` (PromoCodeList / PromoCodeEdit) were
  // always rejected with "Invalid or expired code". The card's
  // `promoApplied` state was also local-only and never seeded from
  // the booking's eager-loaded `promo_code` FK, so an existing
  // applied code did not show up. The proper edit surface is the
  // Promo Code `<Select>` in `<EditSectionAccountInfo>` (slot
  // `<EditSectionAccountInfo formData={...} promoCodeOptions={...} />`
  // further down), which is wired to:
  //   • `promoCodeService.getPromoCodes({status:'active', per_page:100})`
  //     loaded in the wrapper's parallel-fetch (BookingDetail.tsx:482)
  //   • `formData.promoCodeId` seeded from `bookingToFormData` reading
  //     `currentBooking.promo_code_id` (the eager FK) + the
  //     `promoCode` string from `currentBooking.promo_code?.code`
  //     (BookingDetail.tsx:757-763)
  //   • `handleMasterSave` writes `promo_code_id` top-level in the
  //     PUT body (BookingDetail.tsx:1358)
  // That path was shipped in round 6.2.80 and is the source of truth.
  // The standalone-preview / figma Make export path stays intact
  // per INV-X1 — the EditSectionAccountInfo's `promoCodeOptions`
  // empty-fallback renders a disabled `placeholder="e.g. SUMMER2024"`
  // text input so the view remains self-previewable.

  // ── Suite & Time Assignment (Confirmed + Paid) ────────────────────────────
  // 2026-06-28 (round 6.2.76) — "Suite / Lounge Table Assignment"
  // card REMOVED. Per Sky: "we don't need the 'Suite / Lounge Table
  // Assignment' which is showing after the booking is paid. we can
  // keep using the visit date and visit time section". The visit
  // date/time inputs in `<EditSectionFlight>` (round 6.2.74) are
  // the canonical edit surface for time, and the physical-resource
  // multi-select in `<EditSectionPhysicalResource>` (round 6.2.73)
  // covers location. The hardcoded `SUITE_OPTIONS` list + the four
  // `assigned*` useStates + the `{isConfirmedAndPaid && (<Card>...)}`
  // JSX block are all gone.
  //
  // `isConfirmedAndPaid` is kept — it's still used by the Refund
  // action button in the page header (line ~1528 pre-6.2.76).
  const isConfirmedAndPaid = booking.status === 'Confirmed' && booking.paymentStatus === 'Paid';

  // 2026-06-28 (round 6.2.71, Phase 5) — fake In-Charge Staff state
  // (hardcoded `ALL_STAFF` + `selectedStaffIds` + `toggleStaff`) REMOVED.
  // The real staff picker is now `<EditSectionStaff>` (bottom of the
  // page), backed by `/api/system/users` and `formData.assignedStaffIds`.

  // ── Refund Dialog ─────────────────────────────────────────────────────────
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount,     setRefundAmount]     = useState('');
  const [refundReason,     setRefundReason]     = useState('');
  const handleProcessRefund = () => {
    const amt = parseFloat(refundAmount.replace(/[^0-9.]/g, ''));
    if (!amt || amt <= 0) { toast.error('Please enter a valid refund amount.'); return; }
    if (amt > amountDueAfterVouchers) {
      toast.error(`Refund amount cannot exceed the maximum refundable amount of HK$${amountDueAfterVouchers.toLocaleString()}.`);
      return;
    }
    toast.success('Refund case submitted!', {
      description: `HK$${amt.toLocaleString()} refund for ${booking.bookingNo} has been passed to Refund Reports.`,
    });
    setShowRefundDialog(false);
    setRefundAmount('');
    setRefundReason('');
  };

  // ── Voucher System ────────────────────────────────────────────────────────
  // Customer's total entry vouchers available in their account (mock)
  const customerTotalVouchers = bookingId % 5 === 0 ? 4 : bookingId % 3 === 0 ? 3 : bookingId % 2 === 0 ? 2 : 1;
  // Round 6.2.13 (2026-06-08) — REMOVED `headCountRate` and
  // `headCountTotal` per the user directive ("we are not using
  // headCountRate now, the calculation need to improve, we
  // make them call the same endpoint first"). The wrapper
  // passes a `livePreviewTotal` prop (sourced from
  // `POST /api/bookings/price-preview`) which is the source of
  // truth for the Total Amount display. The old
  // `headCountRate × pax` local calculation was wrong for
  // booking 684 (3 pax × HK$1,200 = HK$3,600, vs the
  // backend's correct HK$25,000).
  //
  // `voucherUnitValue` is set to 0 as a placeholder for the
  // voucher model. The voucher display will be improved in a
  // future round when the user revisits the voucher pricing
  // model.
  // Food & Beverage is always complimentary (free). Only non-food add-ons cost extra.
  // 2026-06-08 round 6.2.9 — Service Items calculation fix.
  // Pre-6.2.9 this was hardcoded to `(hasLimousine ? 800 : 0) + (hasShopping ? 500 : 0)`,
  // which (a) ignored all other addons (wheelchair, security, private transport,
  // lounge extension) and (b) used a flat constant rather than the actual
  // per-addon subtotals from `booking_items`. The user's report:
  // "Service Items in the booking calculation is doing wrong calculation, the
  // total there should not related to the number of guest, it should be the
  // sum of the addons." The new source is the canonical
  // `booking.addons[]` array (populated by `bookingService.ts` round 6.1.2
  // from `api.booking_items[]`). Each addon row carries a `subtotal`
  // (= unitPrice × quantity, written by AddonsSyncService at create/update
  // time — the per-guest multiplier was never there to begin with). The sum
  // is the per-booking "Additional Services" total, independent of the
  // number of guests. F&B is NOT counted here (it's complimentary, rendered
  // separately as a fixed "HK$0 / Complimentary" row).
  const serviceSubtotal = (booking.addons ?? []).reduce(
    (sum, addon) => sum + (Number(addon.subtotal) || 0),
    0,
  );
  // Round 6.2.13: voucher unit value is 0 placeholder (was
  // `headCountRate = 1200`). Voucher model will be revised in
  // a future round per the user directive.
  const voucherUnitValue = 0;

  // ── Delete-passenger dialog ───────────────────────────────────────────────
  interface DeletePassengerDialog {
    section: 'PS' | 'LD';
    newValue: number;
    removeCount: number;
    candidates: { globalIdx: number; label: string; subtitle: string }[];
    selected: Set<number>;
  }
  const [deleteDialog, setDeleteDialog] = useState<DeletePassengerDialog | null>(null);

  const openDeleteDialog = (section: 'PS' | 'LD', newValue: number) => {
    const currentCount = section === 'PS' ? vipPS : vipLD;
    const removeCount = currentCount - newValue;
    const slice = section === 'PS'
      ? passengers.slice(0, vipPS)
      : passengers.slice(vipPS, vipPS + vipLD);
    const offset = section === 'PS' ? 0 : vipPS;
    const candidates = slice.map((p, i) => ({
      globalIdx: offset + i,
      label: [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || `Passenger ${offset + i + 1}`,
      subtitle: [
        p.ageGroup || '',
        p.travelDocNo ? `Doc: ${p.travelDocNo}` : '',
        p.membershipNo ? `Mem: ${p.membershipNo}` : '',
      ].filter(Boolean).join('  ·  ') || 'No details filled',
    }));
    setDeleteDialog({ section, newValue, removeCount, candidates, selected: new Set() });
  };

  const handleVipPSChange = (raw: string) => {
    const newVal = Math.max(0, parseInt(raw) || 0);
    if (newVal < vipPS && passengers.slice(0, vipPS).some(isPassengerFilled)) {
      openDeleteDialog('PS', newVal);
    } else {
      setVipPS(newVal);
    }
  };

  const handleVipLDChange = (raw: string) => {
    const newVal = Math.max(0, parseInt(raw) || 0);
    if (newVal < vipLD && passengers.slice(vipPS, vipPS + vipLD).some(isPassengerFilled)) {
      openDeleteDialog('LD', newVal);
    } else {
      setVipLD(newVal);
    }
  };

  const toggleDeleteSelection = (globalIdx: number) => {
    setDeleteDialog(prev => {
      if (!prev) return prev;
      const next = new Set(prev.selected);
      if (next.has(globalIdx)) next.delete(globalIdx);
      else next.add(globalIdx);
      return { ...prev, selected: next };
    });
  };

  const confirmDeletePassengers = () => {
    if (!deleteDialog) return;
    const { section, newValue, selected } = deleteDialog;
    setPassengers(prev => prev.filter((_, i) => !selected.has(i)));
    if (section === 'PS') setVipPS(newValue);
    else setVipLD(newValue);
    setDeleteDialog(null);
  };
  // ─────────────────────────────────────────────────────────────────────────

  // 2026-06-28 (round 6.2.73) — `nonFlyingLD` lifted to formData
  // via override. See comment block above for the same pattern.
  const [localNonFlyingLD, setLocalNonFlyingLD] = useState(booking.nonFlyingGuestsInLoungeDeluxe ?? 0);
  const nonFlyingLD = nonFlyingGuestsInLoungeDeluxeOverride ?? localNonFlyingLD;
  const setNonFlyingLD = (val: number) => {
    setLocalNonFlyingLD(val);
    onGuestCountChange?.({ nonFlyingGuestsInLoungeDeluxe: val });
  };
  useEffect(() => {
    if (nonFlyingGuestsInLoungeDeluxeOverride !== undefined) setLocalNonFlyingLD(nonFlyingGuestsInLoungeDeluxeOverride);
  }, [nonFlyingGuestsInLoungeDeluxeOverride]);

  // ── Status Management state (2026-06-15, round 6.2.41) ─────────────────────
  // Pre-fix the Status Management card used `defaultValue={booking.status}`
  // (uncontrolled selects + textarea) — Save just toasted without ever
  // reading the user's selection. Now they are controlled; the new
  // `onUpdateStatus` callback (line above) reads these values on click.
  // 2026-06-29 (round 6.2.78, Bug #4) — Status Management
  // card lifted to `formData` via the same local+override+onFormChange
  // dispatcher pattern as the round 6.2.77 contact fields.
  // Pre-6.2.78 these useState hooks were local-only and the
  // master Save handler never read them. Post-6.2.78 the
  // JSX-bound `value` reads from `formData?.status` /
  // `formData?.paymentStatus` / `formData?.rejectionReason`
  // when the parent wrapper provides them (master Save path),
  // else from local state (standalone demo mode + first-render
  // flash). The `onChange` handlers dispatch to `onFormChange`
  // when available, else to the local setter (per the contact
  // field convention at lines 783-823).
  const [localStatusValue,        setLocalStatusValue]        = useState<BookingStatusValue>(booking.status);
  const [localPaymentStatusValue, setLocalPaymentStatusValue] = useState<PaymentStatusValue>(booking.paymentStatus);
  const [localRejectionReasonText, setLocalRejectionReasonText] = useState(booking.rejectionReason ?? '');
  const statusValue         = formData?.status         ?? localStatusValue;
  const paymentStatusValue  = formData?.paymentStatus  ?? localPaymentStatusValue;
  const rejectionReasonText = formData?.rejectionReason ?? localRejectionReasonText;
  const setStatusValue = (v: BookingStatusValue) => {
    if (onFormChange) onFormChange({ status: v });
    else setLocalStatusValue(v);
  };
  const setPaymentStatusValue = (v: PaymentStatusValue) => {
    if (onFormChange) onFormChange({ paymentStatus: v });
    else setLocalPaymentStatusValue(v);
  };
  const setRejectionReasonText = (v: string) => {
    if (onFormChange) onFormChange({ rejectionReason: v });
    else setLocalRejectionReasonText(v);
  };

  // ── Per-guest voucher toggles (true = this guest's entry is covered by a voucher) ──
  // Only Account Owner and Spouse are eligible; toggling consumes one voucher from account.
  const [passengerVoucherUsed, setPassengerVoucherUsed] = useState<boolean[]>([]);
  const [nonFlyingVoucherUsed, setNonFlyingVoucherUsed] = useState<boolean[]>([]);

  // Non-Flying Guest detail forms
  // 2026-06-08 round 6.2.7 — read the initial non-flying guests from
  // `booking.nonFlyingGuestsList` (the mapper populates this from
  // api.advanced_details.nonFlyingGuests[]). Pre-6.2.7 the
  // initializer always called `buildInitialNonFlyingGuests()` which
  // generated MOCK data keyed by bookingId, so the view always
  // showed mock data even when the booking had real non-flying
  // guests. Fall back to the mock generator only when the
  // prop is missing or empty (standalone-preview mode, e.g. the
  // figma-ui view rendered without a real booking).
  const [nonFlyingGuests, setNonFlyingGuests] = useState<NonFlyingGuest[]>(() => {
    const realList = booking.nonFlyingGuestsList;
    if (Array.isArray(realList) && realList.length > 0) {
      return realList.map((g) => ({
        title: g.title ?? '',
        firstName: g.firstName ?? '',
        lastName: g.lastName ?? '',
        ageGroup: g.ageGroup ?? 'Adults (aged 12 and above)',
      }));
    }
    // 2026-06-14 — for a real booking, don't auto-fill mock personal
    // data when VIP/NFG counts are increased. Use empty placeholders
    // so staff enter real guest details. Keep mock seeds only for the
    // standalone figma-ui preview (no booking prop).
    return bookingProp
      ? Array.from(
          { length: (booking.nonFlyingGuestsInPremiereSuite ?? 0) + (booking.nonFlyingGuestsInLoungeDeluxe ?? 0) },
          emptyNonFlyingGuest
        )
      : buildInitialNonFlyingGuests(
          (booking.nonFlyingGuestsInPremiereSuite ?? 0) + (booking.nonFlyingGuestsInLoungeDeluxe ?? 0),
          bookingId
        );
  });
  // 2026-06-28 (round 6.2.73) — see the same pattern in the
  // `passengers` state above. Re-seed from `nonFlyingGuestsOverride`
  // after a master Save refetch; emit local edits via
  // `onNonFlyingGuestsChange` so the lifted `formData` stays in sync.
  // Both useEffects share a JSON hash ref to avoid emit↔sync loop.
  const lastEmittedNonFlyingRef = useRef<string>('');
  useEffect(() => {
    if (onNonFlyingGuestsChange) {
      const next = nonFlyingGuests.map(toEditNonFlyingGuest);
      const hash = JSON.stringify(next);
      if (hash !== lastEmittedNonFlyingRef.current) {
        lastEmittedNonFlyingRef.current = hash;
        onNonFlyingGuestsChange(next);
      }
    }
  }, [nonFlyingGuests, onNonFlyingGuestsChange]);
  const isNonFlyingOverrideInitialMount = useRef(true);
  useEffect(() => {
    if (isNonFlyingOverrideInitialMount.current) {
      isNonFlyingOverrideInitialMount.current = false;
      return;
    }
    if (nonFlyingGuestsOverride) {
      const overrideHash = JSON.stringify(nonFlyingGuestsOverride);
      if (overrideHash !== lastEmittedNonFlyingRef.current) {
        setNonFlyingGuests(nonFlyingGuestsOverride.map(toNonFlyingGuest));
        lastEmittedNonFlyingRef.current = overrideHash;
      }
    }
  }, [nonFlyingGuestsOverride]);

  // 2026-06-08 round 6.2.9 — same fix as the passengers useEffect
  // (line 165+). Skip the mount-time fire so the `useState`
  // initializer's value (which reads from
  // `booking.nonFlyingGuestsList` per the round 6.2.7 fix) is
  // preserved. Example: booking 674 has
  // nonFlyingGuestsList=[Will Boss, Mary Jane] (length 2) but
  // nonFlyingPS + nonFlyingLD = 2 + 2 = 4, so the user saw
  // [Will Boss, Mary Jane, empty, empty] instead of just
  // [Will Boss, Mary Jane].
  const isNonFlyingInitialMount = useRef(true);
  // 2026-06-26 — round 6.2.67 (M20 PS/LD order fix):
  // direction-aware grow. Same algorithm as the VIP
  // useEffect at line 335+ and the CreateBooking.tsx
  // useEffect at line 1132+. INSERTs PS empties at the
  // PS/LD boundary; APPENDs LD empties at the tail.
  // `isNonFlyingInitialMount` mount-skip ref preserved
  // (round 6.2.9 fix).
  const prevNonFlyingPSRef = useRef(nonFlyingPS);
  const prevNonFlyingLDRef = useRef(nonFlyingLD);
  useEffect(() => {
    if (isNonFlyingInitialMount.current) {
      isNonFlyingInitialMount.current = false;
      prevNonFlyingPSRef.current = nonFlyingPS;
      prevNonFlyingLDRef.current = nonFlyingLD;
      return;                                              // skip mount — initializer wins
    }
    const prevNonFlyingPS = prevNonFlyingPSRef.current;
    const prevNonFlyingLD = prevNonFlyingLDRef.current;
    prevNonFlyingPSRef.current = nonFlyingPS;
    prevNonFlyingLDRef.current = nonFlyingLD;
    const psDelta = nonFlyingPS - prevNonFlyingPS;
    const ldDelta = nonFlyingLD - prevNonFlyingLD;
    setNonFlyingGuests(prev => {
      const total = nonFlyingPS + nonFlyingLD;
      // 2026-06-08 round 6.2.11 — INV-13: only-GROW
      // semantics. See the passengers useEffect for the
      // full comment. The TRUNCATE branch is removed;
      // removal goes through the explicit delete dialog.
      if (prev.length >= total) return prev;                // never truncate (INV-13)
      let next = prev;
      if (ldDelta > 0) {
        next = [...next, ...Array.from({ length: ldDelta }, emptyNonFlyingGuest)];
      }
      if (psDelta > 0) {
        const insertAt = prevNonFlyingPS;
        next = [
          ...next.slice(0, insertAt),
          ...Array.from({ length: psDelta }, emptyNonFlyingGuest),
          ...next.slice(insertAt),
        ];
      }
      return next;
    });
  }, [nonFlyingPS, nonFlyingLD]);

  const updateNonFlyingGuest = (idx: number, field: keyof NonFlyingGuest, value: string) => {
    setNonFlyingGuests(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));
  };

  // Sync voucher toggle arrays when guest counts change
  useEffect(() => {
    const total = vipPS + vipLD;
    setPassengerVoucherUsed(prev => {
      if (prev.length === total) return prev;
      if (prev.length < total) return [...prev, ...Array.from({ length: total - prev.length }, () => false)];
      return prev.slice(0, total);
    });
  }, [vipPS, vipLD]);

  useEffect(() => {
    const total = nonFlyingPS + nonFlyingLD;
    setNonFlyingVoucherUsed(prev => {
      if (prev.length === total) return prev;
      if (prev.length < total) return [...prev, ...Array.from({ length: total - prev.length }, () => false)];
      return prev.slice(0, total);
    });
  }, [nonFlyingPS, nonFlyingLD]);

  // ── Role helpers — determine if a guest is Account Owner / Spouse ──────────
  // 2026-06-08 round 6.2.8 — bookings/684 spouse fix.
  // Pre-6.2.8 the helpers hard-coded `idx === 1 → 'Spouse'`, which
  // produced false-positive Spouse badges on accounts that have
  // no spouse on record (e.g. booking/684, account=YUEN SHING,
  // profile_spouse=null — 2 VIP passengers were both marked
  // Spouse despite no spouse existing). The fix: source-of-truth
  // is `booking.accountProfileSpouse` (the raw
  // `api.account.profile_spouse` JSON). A passenger is only
  // "Spouse" when (a) the account has a spouse on record AND
  // (b) the passenger's (firstName, lastName) match. Otherwise
  // idx 0 is the Account Owner and every other idx is a Guest.
  //
  // Match tolerance: case-insensitive, whitespace-trimmed,
  // both firstName AND lastName must match. If the account has
  // a spouse on record but no passenger matches, we fall back
  // to "no Spouse" rather than guessing which idx maps to the
  // spouse (this is safer than the pre-6.2.8 silent false
  // positive). Surface a small inline warning in the passenger
  // header if a profile_spouse exists but no match was found.
  const accountSpouse = booking.accountProfileSpouse;
  const accountHasSpouse = Boolean(
    accountSpouse && (accountSpouse.firstName?.trim() || accountSpouse.lastName?.trim())
  );
  const matchesAccountSpouse = (p: { firstName?: string; lastName?: string }): boolean => {
    if (!accountHasSpouse) return false;
    const f = (s?: string) => (s ?? '').trim().toLowerCase();
    return (
      f(p.firstName) === f(accountSpouse.firstName) &&
      f(p.lastName) === f(accountSpouse.lastName)
    );
  };
  const getPassengerRole = (idx: number): 'Account Owner' | 'Spouse' | 'Guest' => {
    if (idx === 0) return 'Account Owner';
    if (accountHasSpouse && passengers[idx] && matchesAccountSpouse(passengers[idx])) return 'Spouse';
    return 'Guest';
  };
  // Non-Flying Guest 0 may be the spouse only if (a) the account
  // has a spouse on record AND (b) the account's spouse is not
  // already represented in the VIP passenger list AND (c) the
  // NFG[0] name matches. This replaces the pre-6.2.8 rule that
  // hard-coded `idx === 0 && (vipPS + vipLD) <= 1 → 'Spouse'`,
  // which also produced false positives on accounts without a
  // spouse on record.
  const getNFGRole = (idx: number): 'Spouse' | 'Guest' => {
    if (idx !== 0) return 'Guest';
    if (!accountHasSpouse) return 'Guest';
    // If the spouse slot is already taken by a VIP passenger,
    // the NFG[0] is just a guest.
    const spouseAlreadyInVIP = passengers.some((p) => matchesAccountSpouse(p));
    if (spouseAlreadyInVIP) return 'Guest';
    if (nonFlyingGuests[idx] && matchesAccountSpouse(nonFlyingGuests[idx])) return 'Spouse';
    return 'Guest';
  };
  // 2026-06-08 round 6.2.8 — companion flag for the inline
  // warning. When the account has a spouse on record but no
  // passenger / NFG matches, the badge silently drops. Show a
  // small "Profile has spouse on record: {name} — not in this
  // booking" warning in the passenger-list header so staff can
  // fix the data without digging through account settings.
  const profileSpouseDisplayName = accountHasSpouse
    ? [accountSpouse!.title, accountSpouse!.firstName, accountSpouse!.lastName]
        .filter(Boolean).join(' ').trim() || '(spouse profile)'
    : '';
  const profileSpouseMatched = accountHasSpouse && (
    passengers.some(matchesAccountSpouse) || nonFlyingGuests.some(matchesAccountSpouse)
  );
  const isVoucherEligibleRole = (role: string): boolean =>
    role === 'Account Owner' || role === 'Spouse';

  // Computed voucher totals
  const totalPassengerVouchersUsed = passengerVoucherUsed.filter(Boolean).length;
  const totalNFGVouchersUsed = nonFlyingVoucherUsed.filter(Boolean).length;
  const totalVouchersApplied = totalPassengerVouchersUsed + totalNFGVouchersUsed;
  const remainingVouchers = Math.max(0, customerTotalVouchers - totalVouchersApplied);

  // Pricing with new voucher model
  // Round 6.2.13: removed `headCountTotal`. The Total Amount
  // now comes from `livePreviewTotal` (sourced from the
  // backend's `POST /api/bookings/price-preview`). Voucher
  // discount will be modelled in a future round per the
  // user directive.
  const voucherCount = totalVouchersApplied; // alias for invoice dialog compat
  const voucherTotal = 0;                          // placeholder (was `totalVouchersApplied * headCountRate`)
  // 2026-06-28 (round 6.2.76) — max refundable amount was hardcoded
  // to 0 ("placeholder (was `headCountTotal + serviceSubtotal -
  // voucherTotal`)"), which broke the refund dialog for every
  // booking. Sky's report: "After the booking was paid, the Refund
  // max amount is still $0". `bookingService.formatAmount()` formats
  // the persisted `total_price` as `"HK$12,345"` (or empty string
  // when null); parse that back to a number so the Refund dialog's
  // cap and the Fill-Max button reflect the actual paid amount.
  // Voucher deduction is still 0 (placeholder) — vouchers are not
  // refundable (see the "Vouchers non-refundable note" below), so
  // the cap equals `parseAmount(booking.amount)` for now.
  const parseAmount = (s: string | number | null | undefined): number => {
    if (s === null || s === undefined) return 0;
    if (typeof s === 'number') return Number.isFinite(s) ? s : 0;
    // Skip the placeholder strings the ViewBooking type allows.
    if (s === 'Pending Calculation' || s === 'Re-calculation' || s === 'Manual Adjustment') return 0;
    const cleaned = s.replace(/[^0-9.]/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const amountDueAfterVouchers = parseAmount(booking.amount);

  // Toggle a single passenger's voucher
  const togglePassengerVoucher = (idx: number) => {
    const role = getPassengerRole(idx);
    if (!isVoucherEligibleRole(role)) return;
    setPassengerVoucherUsed(prev => {
      const next = [...prev];
      const turning_on = !next[idx];
      if (turning_on && remainingVouchers === 0) return prev; // no vouchers left
      next[idx] = !next[idx];
      return next;
    });
  };

  // Toggle a non-flying guest's voucher
  const toggleNFGVoucher = (idx: number) => {
    const role = getNFGRole(idx);
    if (!isVoucherEligibleRole(role)) return;
    setNonFlyingVoucherUsed(prev => {
      const next = [...prev];
      const turning_on = !next[idx];
      if (turning_on && remainingVouchers === 0) return prev;
      next[idx] = !next[idx];
      return next;
    });
  };

  // ── Validation ──────────────────────────────────────────────────
  // Rule 1: max 6 guests (VIP + non-flying) per Premiere Suite
  const psMaxGuests = numPremiereSuites * 6;
  const psTotalGuests = vipPS + nonFlyingPS;
  const psOverCapacity = numPremiereSuites > 0 && psTotalGuests > psMaxGuests;

  // Rule 2: max 3 non-flying guests per booking in Lounge Deluxe
  const ldNonFlyingExceeded = nonFlyingLD > 3;

  // Rule 3: each booking must include at least 1 VIP passenger
  const psNoVip = numPremiereSuites > 0 && vipPS === 0;
  // 2026-06-11 — LD VIP=0 is valid when the booking is all-PS
  // (no LD intent). LD intent signal: user has NFG assigned
  // to LD, OR lounges were pre-assigned. Pre-this-fix the rule
  // was "vipLD === 0" which falsely flagged all-PS-only
  // bookings (1 PS + 0 LD) as missing the LD VIP — the user
  // has no LD at all, so the "1 VIP per LD" rule shouldn't
  // fire. Reverting the regression: round 6.2.34 UX.
  const hasLdIntent = nonFlyingLD > 0 || (booking.assignedLoungeNames?.length ?? 0) > 0;
  const ldNoVip = vipLD === 0 && hasLdIntent;

  // Rule 4: if any PS guests exist, at least 1 Premiere Suite must be booked
  const psGuestsWithoutSuite = (vipPS > 0 || nonFlyingPS > 0) && numPremiereSuites === 0;

  // 2026-06-28 — VIP / NFG completeness gate (round 6.2.65
  // carry-over from the legacy BookingEditView). Required
  // fields per row match the create form's invariant
  // [PS VIPs..., LD VIPs..., PS NFGs..., LD NFGs...] so #N
  // numbering matches what the admin sees in the section
  // forms. Used by the local fallback for `hasGuestErrors`
  // when the wrapper doesn't pass the prop, and surfaced in
  // the master Save warning text via `incompleteVipInfoCount`.
  function getMissingPassengerFields(p: { title: string; firstName: string; lastName: string; ageGroup: string; travelDocNo: string }): string[] {
    const missing: string[] = [];
    if (!p.title) missing.push('Title');
    if (!p.firstName) missing.push('First Name');
    if (!p.lastName) missing.push('Last Name');
    if (!p.ageGroup) missing.push('Age Group');
    if (!p.travelDocNo) missing.push('Travel Doc No.');
    return missing;
  }
  function getMissingNfgFields(g: { title: string; firstName: string; lastName: string; ageGroup: string }): string[] {
    const missing: string[] = [];
    if (!g.title) missing.push('Title');
    if (!g.firstName) missing.push('First Name');
    if (!g.lastName) missing.push('Last Name');
    if (!g.ageGroup) missing.push('Age Group');
    return missing;
  }
  // Compute the local completeness count when the wrapper
  // doesn't supply one (legacy callers / figma-ui preview
  // without a real `formData` payload). Source-of-truth for
  // the prop is the wrapper's `BookingDetail.tsx` memo.
  const localIncompleteVipInfoCount = useMemo(() => {
    if (!formData) return 0;
    const data = formData;
    const vipPS = data.vipPassengersInPremiereSuite ?? 0;
    const vipLD = data.vipPassengersInLoungeDeluxe ?? 0;
    const nonFlyingPS = data.nonFlyingGuestsInPremiereSuite ?? 0;
    const nonFlyingLD = data.nonFlyingGuestsInLoungeDeluxe ?? 0;
    const psPax = (data.passengers ?? []).slice(0, vipPS);
    const ldPax = (data.passengers ?? []).slice(vipPS, vipPS + vipLD);
    const psNfg = (data.nonFlyingGuestsList ?? []).slice(0, nonFlyingPS);
    const ldNfg = (data.nonFlyingGuestsList ?? []).slice(nonFlyingPS, nonFlyingPS + nonFlyingLD);
    let count = 0;
    [...psPax, ...ldPax].forEach(p => { if (getMissingPassengerFields(p).length > 0) count++; });
    [...psNfg, ...ldNfg].forEach(g => { if (getMissingNfgFields(g).length > 0) count++; });
    return count;
  }, [formData]);
  // Wrapper-supplied value wins; local is the fallback.
  const effectiveIncompleteVipInfoCount = incompleteVipInfoCount > 0 ? incompleteVipInfoCount : localIncompleteVipInfoCount;

  const psErrors: string[] = [];
  if (psGuestsWithoutSuite) psErrors.push('Quantity of Premiere Suite must be at least 1 when guests are assigned to it.');
  if (psNoVip) psErrors.push('At least 1 VIP Passenger is required per Premiere Suite booking.');
  if (psOverCapacity) psErrors.push(`Total guests (${psTotalGuests}) exceeds the maximum of ${psMaxGuests} (6 per suite × ${numPremiereSuites} suite${numPremiereSuites > 1 ? 's' : ''}).`);

  const ldErrors: string[] = [];
  if (ldNoVip) ldErrors.push('At least 1 VIP Passenger is required for a Lounge Deluxe booking.');
  if (ldNonFlyingExceeded) ldErrors.push(`Non-Flying Guests (${nonFlyingLD}) exceeds the maximum of 3 per Lounge Deluxe booking.`);

  // 2026-06-28 — VIP / NFG completeness errors. Surfaced under
  // the PS section when any PS VIP / PS NFG is incomplete, under
  // the LD section when any LD VIP / LD NFG is incomplete.
  // Mirrors the create form's slice order
  // [PS VIPs..., LD VIPs..., PS NFGs..., LD NFGs...] so the
  // #N matches what the admin sees.
  // 2026-06-28 — VIP / NFG incompleteness counts (per PS/LD +
  // VIP/NFG slice). Surfaced inline in the VIP Passenger Details
  // and Non-Flying Guest Details card headers (lines ~2702 and
  // ~2952), NOT in the Booking Details (Part 1/Part 2) cards —
  // per Sky: "those warning should not be shown in the Booking
  // Details section. please show in VIP Passenger Details and
  // Non-Flying Guest Details instead".
  const psVipIncomplete = (formData?.passengers ?? []).slice(0, vipPS).filter(p => getMissingPassengerFields(p).length > 0).length;
  const ldVipIncomplete = (formData?.passengers ?? []).slice(vipPS, vipPS + vipLD).filter(p => getMissingPassengerFields(p).length > 0).length;
  const psNfgIncomplete = (formData?.nonFlyingGuestsList ?? []).slice(0, nonFlyingPS).filter(g => getMissingNfgFields(g).length > 0).length;
  const ldNfgIncomplete = (formData?.nonFlyingGuestsList ?? []).slice(nonFlyingPS, nonFlyingPS + nonFlyingLD).filter(g => getMissingNfgFields(g).length > 0).length;
  const totalVipIncomplete = psVipIncomplete + ldVipIncomplete;
  const totalNfgIncomplete = psNfgIncomplete + ldNfgIncomplete;

  // 2026-06-28 (round 6.2.73) — `hasGuestErrors` is now a
  // prop passed in by the parent wrapper (which mirrors the
  // same rules from `formData`). The local computation
  // `psErrors.length > 0 || ldErrors.length > 0` is kept as a
  // fallback for legacy callers (e.g. figma-ui preview without
  // a real booking) that don't pass the prop. The prop wins
  // because callers will pass `false` explicitly when no
  // errors — see the destructured `hasGuestErrors = false`
  // default at line 386.
  const localHasGuestErrors = psErrors.length > 0 || ldErrors.length > 0;

  // 2026-06-28 (round 6.2.74) — Sky's 3h booking-time rule. Computed
  // locally via the shared `computeVisitTimeRange` helper so the master
  // Save button stays gated when visitTime is out of range. The parent
  // wrapper (BookingDetail.tsx) also computes this for the `hasGuestErrors`
  // prop — when the prop is provided (current behavior post-6.2.73),
  // the wrapper already includes the visitTime error in the prop value.
  // Local computation here is the fallback for legacy callers.
  const visitTimeRange = useMemo(
    () => formData ? computeVisitTimeRange(formData) : {},
    [formData],
  );
  const hasVisitTimeError = !!visitTimeRange.error;

  const hasGuestErrorsFinal = hasGuestErrors || localHasGuestErrors || hasVisitTimeError;
  // ^ when the prop is provided, this equals the prop value;
  //   when it's NOT provided (default false), this equals the
  //   local computation.
  //   The local visitTimeError always fires when formData is provided
  //   — it's a free, deterministic check that doesn't depend on the
  //   wrapper passing a prop.

  // ── Similar Profile Detection ─────────────────────────────────────────────
  const [showSimilarBanner, setShowSimilarBanner] = useState(true);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeComplete, setMergeComplete] = useState(false);

  useEffect(() => {
    if (pendingSuggestions.length > 0) {
      setShowSimilarBanner(true);
      setMergeComplete(false);
    }
  }, [pendingSuggestions]);

  const openMergeDialog = () => {
    setShowMergeDialog(true);
  };
  // ───────────────────────────────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending for Review': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'Pending for Approval': 'bg-blue-100 text-blue-800 border border-blue-200',
      'Approved': 'bg-green-100 text-green-800 border border-green-200',
      'Confirmed': 'bg-green-100 text-green-800 border border-green-200',
      'Rejected': 'bg-red-100 text-red-800 border border-red-200',
      'Cancelled': 'bg-gray-100 text-gray-800 border border-gray-200',
      'No-show': 'bg-orange-100 text-orange-800 border border-orange-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Not Required': 'bg-gray-100 text-gray-600',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Payment Link Sent': 'bg-blue-100 text-blue-700',
      'Paid': 'bg-green-100 text-green-700',
      'Overdue': 'bg-red-100 text-red-700',
      'Refunded': 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 1. Back Button */}
      <div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
      </div>

      {/* 2. Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1>Booking Details - {booking.bookingNo}</h1>
            {booking.isAdHoc && (
              <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Ad-hoc Booking
              </Badge>
            )}
            {/* ── 2026-07-05 round 6.2.106 (recovery of 6.2.83 lost-edit) ──
                 Always-on header chip when booking.promoCode?.code is set.
                 Renders the code (font-mono) + the discount hint (-15% for
                 percentage; "Free bookings" for fixed+discountValue 0). ── */}
            {booking.promoCode?.code && (
              <Badge
                data-testid="booking-header-promo-chip"
                className="bg-indigo-100 text-indigo-800 border border-indigo-200"
              >
                <Tag className="w-3 h-3 mr-1" />
                <span className="font-mono">{booking.promoCode.code}</span>
                {booking.promoCode.discountType === 'percentage'
                  ? <span className="ml-1">−{booking.promoCode.discountValue}%</span>
                  : (booking.promoCode.freeSessions != null && booking.promoCode.freeSessions > 0)
                      || Number(booking.promoCode.discountValue) === 0
                    ? <span className="ml-1">
                        Free lounge · −{booking.promoCode.freeSessions ?? 1} LD fee
                        {(booking.promoCode.freeSessions ?? 1) !== 1 ? 's' : ''}
                      </span>
                    : null}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">View and manage booking information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInvoice(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Invoice
          </Button>
          {/* 2026-06-28 (round 6.2.72, Phase E) — `[Edit Booking
              (full editor)]` button REMOVED. Per Sky's pivot
              from round 6.2.71, the standalone edit page is
              deprecated. The detail page itself is now the sole
              edit surface (via the new "Editable Sections"
              container at the bottom — see Phase B). The
              `onOpenFullEditor` prop is kept in the interface
              for backward compatibility with the parent
              wrapper but is unused. */}
        </div>
      </div>

      {/* 3. Actions */}
      <Card className="p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-2">
          {/* Review Actions */}

          {/* Approval Actions — removed, use /bookings/review/:id for approval */}

          {/* Payment Actions */}
          {booking.paymentStatus === 'Pending' && booking.paymentMode === 'Upfront' && (
            <Button variant="outline" disabled>
              <CreditCard className="w-4 h-4 mr-2" />
              Generate Payment Link
            </Button>
          )}

          {booking.paymentStatus === 'Payment Link Sent' && (
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Send Payment Reminder
            </Button>
          )}

          {booking.paymentStatus === 'Overdue' && (
            <Button variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-activate Booking
            </Button>
          )}

          {/* Common Actions */}
          {booking.status === 'Confirmed' && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Generate QR Code
            </Button>
          )}

          <Button variant="outline" disabled>
            <Mail className="w-4 h-4 mr-2" />
            Share with Partners
          </Button>

          {/* 2026-06-27 — Movement Log + Guests Searcher buttons hidden
              per Sky directive. The dialogs + handlers are still wired
              so the button can be restored by uncommenting if needed. */}
          {false && (
            <Button variant="outline" onClick={() => setIsMovementLogOpen(true)}>
              <History className="w-4 h-4 mr-2" />
              Movement Log
            </Button>
          )}

          {false && (
            <Button variant="outline" disabled onClick={() => { setCustomerSearchQuery(''); setIsCustomerSearchOpen(true); }}>
              <Users className="w-4 h-4 mr-2" />
              Guests Searcher
            </Button>
          )}

          {/* Refund Action for Cancelled bookings with Paid status */}
          {booking.status === 'Cancelled' && 
           (booking.paymentStatus === 'Paid' || booking.paymentStatus === 'Payment Link Sent') && 
           booking.paymentStatus !== 'Refunded' && (
            <Button variant="outline" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
              <DollarSign className="w-4 h-4 mr-2" />
              Process Refund
            </Button>
          )}

          {/* Refund Action for Confirmed + Paid bookings */}
          {isConfirmedAndPaid && (
            <Button
              variant="outline"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
              onClick={() => { setRefundAmount(''); setRefundReason(''); setShowRefundDialog(true); }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refund
            </Button>
          )}

          {/* Cancel Booking — last in the actions list (2026-06-18) */}
          {booking.status !== 'Cancelled' && booking.status !== 'Rejected' && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                onUpdateStatus?.({
                  status: 'Cancelled',
                  paymentStatus: booking.paymentStatus,
                });
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancel Booking
            </Button>
          )}
        </div>
      </Card>

      {/* 4. Rejection Reason (if applicable) */}
      {booking.rejectionReason && (
        <Card className="p-6 border-red-200 bg-red-50">
          <h3 className="text-sm uppercase tracking-wide text-red-700 mb-2">Rejection Reason</h3>
          <p className="text-sm text-red-900">{booking.rejectionReason}</p>
        </Card>
      )}

      {/* 4b. 2026-06-29 (round 6.2.79-B, Bug #1) — Supervisor
          Decision card. Surfaces the supervisor's push-back /
          reject reason and timestamp + supervisor name when
          a supervisor has acted on the booking. Pre-6.2.79-B
          the supervisor's reason was overwritten by the next
          staff-reject event (both wrote to `rejection_reason`).
          Round 6.2.79-B separates the writes — supervisor now
          owns `supervisor_rejection_reason`; staff still owns
          `rejection_reason`. The staff view surfaces BOTH
          independently: the existing "Rejection Reason" card
          (line 1665) shows the staff's reason; this new
          "Supervisor Decision" card shows the supervisor's
          reason. Rendered when EITHER `supervisorRejectionReason`
          is set OR `supervisorRejectedAt` is set (i.e., the
          supervisor has at minimum stamped the booking). */}
      {(booking.supervisorRejectionReason || booking.supervisorRejectedAt) && (
        <Card className="p-6 border-amber-200 bg-amber-50">
          <h3 className="text-sm uppercase tracking-wide text-amber-700 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Supervisor Decision
          </h3>
          {booking.supervisorRejectionReason && (
            <p className="text-sm text-amber-900 mb-2">
              {booking.supervisorRejectionReason}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-amber-700">
            {booking.supervisorRejectedByName && (
              <span>By <strong>{booking.supervisorRejectedByName}</strong></span>
            )}
            {booking.supervisorRejectedAt && (
              <span>{new Date(booking.supervisorRejectedAt).toLocaleString()}</span>
            )}
          </div>
        </Card>
      )}

      {/* 5. Alert for Ad-hoc bookings */}
      {booking.isAdHoc && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900">
                <strong>Ad-hoc Booking Alert:</strong> This booking was made less than 48 hours before the flight time. 
                {booking.cutoffHours && (
                  <> Time remaining: {booking.cutoffHours} hours</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5.5 Similar Profile Detected — Figma Soft Merge banner */}
      {(() => {
        if (!pendingSuggestions.length || !showSimilarBanner || mergeComplete) return null;

        const primarySuggestion = pendingSuggestions[0];
        const newGuest = resolveSuggestionGuest(primarySuggestion, 'new');
        const fullName = formatGuestDisplayName(newGuest);
        const matchScoreLabel = pendingSuggestions.length > 1
          ? `${pendingSuggestions.length} Similar Profiles`
          : (typeof primarySuggestion.match_score === 'number'
            ? `${primarySuggestion.match_score}% Match Score`
            : 'Similar Profile');

        return (
          <>
            <Card className="p-5 border-amber-300 bg-amber-50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-amber-900">Similar Profile Detected</h3>
                    <Badge className="bg-amber-200 text-amber-800 border border-amber-300 text-xs px-2 py-0.5">
                      {matchScoreLabel}
                    </Badge>
                  </div>
                  <p className="text-sm text-amber-800">
                    {pendingSuggestions.length > 1 ? (
                      <>
                        <strong>{pendingSuggestions.length}</strong> profiles matching <strong>{fullName}</strong> were found. Do you want to review those profiles?
                      </>
                    ) : (
                      <>
                        A profile matching <strong>{fullName}</strong> — same name, date of birth, gender and passport number — was found in a previous booking. Do you want to review those profiles?
                      </>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5" onClick={() => openMergeDialog()}>
                      <Eye className="w-3.5 h-3.5" />
                      View Profiles
                    </Button>
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 gap-1.5" onClick={() => setShowSimilarBanner(false)}>
                      <X className="w-3.5 h-3.5" />
                      Ignore
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <MergeReviewModal
              isOpen={showMergeDialog}
              onClose={() => setShowMergeDialog(false)}
              pendingSuggestions={pendingSuggestions}
              accountNo={booking.accountNo}
              accountType={booking.accountType}
              membershipType={(booking as { membershipType?: string }).membershipType}
              bookingNo={booking.bookingNo}
              onIgnore={() => {
                setShowMergeDialog(false);
                setShowSimilarBanner(false);
              }}
              onMergeComplete={async () => {
                setShowMergeDialog(false);
                setMergeComplete(true);
                setShowSimilarBanner(false);
                await onMergeComplete?.();
              }}
            />
          </>
        );
      })()}

      {/* 6. Guest Information */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm uppercase tracking-wide text-gray-500">Guest Information</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // 2026-06-11 — round 6.2.34 UX. Use the wrapper's
              // pre-fetched `customerProfile` (real Account
              // data via `GET /api/accounts/{booking.accountId}`)
              // when present. Fall back to a per-booking
              // synthesised profile (12 base fields only) for
              // legacy bookings with no accountId, or when the
              // wrapper's fetch failed. INV-12 / INV-15: no
              // hard-coded directory — the fallback uses the
              // booking's own data, not a fixed mock list.
              if (customerProfile) {
                setSelectedCustomer(customerProfile);
              } else {
                setSelectedCustomer({
                  id: 0,
                  accountNo: booking.accountNo,
                  name: booking.guestName,
                  type: booking.accountType || 'Individual',
                  email: `${booking.guestName.toLowerCase().replace(' ', '.')}@email.com`,
                  phone: '+852 9000 0000',
                  membershipType: booking.accountType === 'Individual' ? 'Gold' : undefined,
                  membershipExpiry: booking.accountType === 'Individual' ? '2026-12-31' : undefined,
                  status: 'Active',
                  totalBookings: bookingId % 15 + 3,
                  createdDate: '2024-01-01',
                });
              }
              setIsCustomerProfileOpen(true);
            }}
            className="flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Customer Profile
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-600">Guest Name</label>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-lg">{booking.guestName}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
                disabled={isRunningIdentityCheck || !identityGuestId || !onRunIdentityCheck}
                onClick={() => {
                  // Pass guest_profiles UUID only — never booking.accountNo (ACC-…).
                  if (!identityGuestId) {
                    return;
                  }
                  void onRunIdentityCheck?.(identityGuestId);
                }}
                title={!identityGuestId ? 'Guest ID missing' : (isRunningIdentityCheck ? 'Scanning…' : 'Run Identity Check')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningIdentityCheck ? 'animate-spin' : ''}`} />
                {isRunningIdentityCheck ? 'Scanning…' : 'Run Identity Check'}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">User ID</label>
            <p className="text-lg">{booking.accountNo}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Account Type</label>
            <p className="text-lg">{booking.accountType}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Number of Guests</label>
            <p className="text-lg">{booking.numberOfGuests} total</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Non-Flying Guests</label>
            <p className="text-lg">{booking.nonFlyingGuests || 0}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Payment Method</label>
            <p className="text-lg">{booking.paymentMode || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Account Discount</label>
            <p className="text-lg text-green-600">
              {booking.agencyDiscountRate
                ? `${booking.agencyDiscountRate}% (Agency Default)`
                : '—'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Promotion Code</label>
            <p className="text-lg">{booking.agencyCode || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Account Remark</label>
            <p className="text-lg">—</p>
          </div>
        </div>
      </Card>

      {/* 7. Flight Information */}
      <Card className="p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Flight Information</h3>
        <div className="grid grid-cols-4 gap-6">
          {/* Row 1 — Flight Type & Arrival Date (above Flight Number) */}
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">Flight Type</label>
            {booking.flightType === 'Arrival' ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2a1 1 0 0 0-.9.3L2.5 6.9a1 1 0 0 0 .1 1.4L8 12l-2 3H4l-1 1 3 2 2 3 1-1v-2l3-2 3.5 5.4a1 1 0 0 0 1.4.1l1.4-1.4a1 1 0 0 0 .3-.9z"/>
                  </svg>
                  Arrival
                </span>
              </div>
            ) : booking.flightType === 'Transit' ? (
              // 2026-06-08 round 6.2.6 — added the Transit case.
              // Distinct amber color (Q1=a) differentiates from
              // Arrival (blue) + Departure (purple). Pre-6.2.6 this
              // ternary fell through to the Departure branch, so
              // Transit bookings showed the wrong badge.
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800 border border-amber-200">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* Transfer / transit icon: 2 planes */}
                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2a1 1 0 0 0-.9.3L2.5 6.9a1 1 0 0 0 .1 1.4L8 12l-2 3H4l-1 1 3 2 2 3 1-1v-2l3-2 3.5 5.4a1 1 0 0 0 1.4.1l1.4-1.4a1 1 0 0 0 .3-.9z"/>
                    <path d="M7 4l1.5 6L4 11.5l-.5 1 2 1 2 1.5 1-1.5L8 7l-1-3z"/>
                  </svg>
                  Transit
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200">
                  <svg className="w-3.5 h-3.5 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2a1 1 0 0 0-.9.3L2.5 6.9a1 1 0 0 0 .1 1.4L8 12l-2 3H4l-1 1 3 2 2 3 1-1v-2l3-2 3.5 5.4a1 1 0 0 0 1.4.1l1.4-1.4a1 1 0 0 0 .3-.9z"/>
                  </svg>
                  Departure
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">
              {booking.flightType === 'Arrival' ? 'Arrival Date'
                : booking.flightType === 'Transit' ? '1st Leg Arrival Date'
                : 'Departure Date'}
            </label>
            <p className="text-lg">{booking.arrivalDate || '—'}</p>
          </div>
          {/* Row 1 continued — Flight Number & Flight Time */}
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">Flight Number</label>
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-gray-400" />
              <p className="text-lg">{booking.flightNo}</p>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">Flight Time (STD/STA)</label>
            <p className="text-lg">{booking.flightTime}</p>
          </div>
          {/* Row 2 — Route, Luggage, Flight Class */}
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">Route</label>
            <p className="text-lg">{booking.flightOrigin || '—'} → {booking.flightDestination || '—'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">Number of Luggage</label>
            <p className="text-lg">{booking.numberOfLuggage || 0} pcs</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">Flight Class (Main VIP Passenger)</label>
            {booking.flightClass ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${
                booking.flightClass === 'First Class'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : booking.flightClass === 'Business Class'
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {booking.flightClass === 'First Class' && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                )}
                {booking.flightClass === 'Business Class' && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                )}
                {booking.flightClass}
              </span>
            ) : (
              <p className="text-lg text-gray-400">—</p>
            )}
          </div>
        </div>

        {/* 2026-06-08 round 6.2.6 — Transit 2nd-leg display (Q2=b: same
            Card, sub-heading, separator). Only renders for Transit
            bookings where legs[] is populated. Pre-6.2.6 this section
            didn't exist; Transit bookings showed only the 1st-leg
            fields. The 1st-leg grid above shows the inbound (Flight
            Date / Number / Time / Route / Class); this block shows
            the outbound (2nd flight) + the 6h+ gap computed from the
            1st-leg arrival vs the 2nd-leg arrival. The 2nd-leg
            "Route" is omitted because ViewBooking.legs[] only has
            4 fields (flightNo / flightTime / arrivalDate / flightClass)
            per round 6.2.2's mapper — origin/destination are the
            same as the 1st leg's (HKG is implicit for transit at
            HKG). The gap display (Q3=a) makes the 6h rule visible
            to staff. */}
        {booking.flightType === 'Transit' && booking.legs && booking.legs.length >= 2 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">
              2nd Flight (Outbound)
            </h4>
            <div className="grid grid-cols-5 gap-6">
              <div>
                <label className="text-sm text-gray-600 block mb-[10px]">Flight Number</label>
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-gray-400" />
                  <p className="text-lg">{booking.legs[1].flightNo || '—'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-[10px]">Flight Time (STD)</label>
                <p className="text-lg">{booking.legs[1].flightTime || '—'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-[10px]">Route</label>
                {/* 2026-06-08 round 6.2.6.1 — Route column for the
                    2nd-leg block. Format: "{origin} → {destination}".
                    For Transit at HKG, origin = legs[1].flightOrigin
                    (= HKG, the transit hub) and destination =
                    legs[1].flightDestination (= the 1st leg's
                    origin, e.g. LHR). Falls back to just the
                    destination if origin is missing (defensive
                    for legacy/malformed data). */}
                <p className="text-lg">
                  {booking.legs[1].flightOrigin || 'HKG'}
                  {' → '}
                  {(booking.legs[1].flightDestination || booking.legs[1].destination || '—')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-[10px]">
                  {/* 2026-06-08 round 6.2.8 — customer follow-up.
                      Customer renamed the timestamp to
                      `departureDate` for leg 2 (leg 2 is the
                      OUTBOUND flight from HKG, so the timestamp
                      is the departure time, not arrival). The
                      column label now reflects that. The cell
                      value prefers `departureDate` and falls
                      back to `arrivalDate` for legacy bookings. */}
                  Departure Date &amp; Time
                </label>
                <p className="text-lg">{booking.legs[1].departureDate || booking.legs[1].arrivalDate || '—'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-[10px]">Flight Class</label>
                {booking.legs[1].flightClass ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${
                    booking.legs[1].flightClass === 'First Class'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : booking.legs[1].flightClass === 'Business Class'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {booking.legs[1].flightClass}
                  </span>
                ) : (
                  <p className="text-lg text-gray-400">—</p>
                )}
              </div>
            </div>
            {/* Gap display: computed from 1st-leg arrivalDate vs
                2nd-leg arrivalDate. Round 6.2 backend's TransitLegsRule
                enforces >= 6h; this display makes it visible to staff. */}
            {(() => {
              const l0 = booking.arrivalDate ? new Date(booking.arrivalDate.replace(' ', 'T')) : null;
              const l1 = booking.legs[1].arrivalDate ? new Date(booking.legs[1].arrivalDate.replace(' ', 'T')) : null;
              if (!l0 || !l1 || isNaN(l0.getTime()) || isNaN(l1.getTime())) return null;
              const diffMs = l1.getTime() - l0.getTime();
              const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
              const hours = Math.floor(diffMs / 3600000);
              const mins = Math.floor((diffMs % 3600000) / 60000);
              const isValid = diffMs >= SIX_HOURS_MS;
              return (
                <p
                  className={`text-sm mt-4 flex items-center gap-1.5 ${isValid ? 'text-green-700' : 'text-red-700'}`}
                  data-testid="transit-gap-display"
                >
                  <Info className="w-4 h-4 flex-shrink-0" />
                  Transit gap: <strong>{hours}h {mins}m</strong>
                  {isValid ? ' (compliant with 6h minimum)' : ' (BELOW 6h minimum — data error)'}.
                </p>
              );
            })()}
          </div>
        )}
      </Card>

      {/* 8. Booking Details */}
      <Card className="p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Booking Details</h3>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <label className="text-sm text-gray-600">Suite/Lounge</label>
            <p className="text-lg">{booking.suite || 'Not assigned'}</p>
            {(booking.assignedSuiteNames?.length || booking.assignedLoungeNames?.length) ? (
              <div className="mt-2 space-y-1.5">
                {booking.assignedSuiteNames && booking.assignedSuiteNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Suites</span>
                    {booking.assignedSuiteNames.map(name => (
                      <span key={name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
                {booking.assignedLoungeNames && booking.assignedLoungeNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Lounges</span>
                    {booking.assignedLoungeNames.map(name => (
                      <span key={name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <div>
            <label className="text-sm text-gray-600">Date & Time</label>
            <p className="text-lg">{booking.dateTime}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Payment Mode</label>
            <p className="text-lg">{booking.paymentMode}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Booking Type</label>
            <p className="text-lg">{booking.bookingType}</p>
          </div>
        </div>

        {/* Part 1: Premiere Suite */}
        <div className={`border rounded-lg p-4 mb-4 ${psErrors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Part 1 — Premiere Suite</h4>
              <p className="text-xs text-gray-500 mt-0.5">Max 6 guests (VIP + Non-Flying) per suite · At least 1 VIP Passenger required</p>
            </div>
            {numPremiereSuites > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${psOverCapacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {psTotalGuests} / {psMaxGuests} guests used
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-600 block mb-[10px]">Quantity of Premiere Suite</label>
              <input
                type="number"
                min={0}
                value={numPremiereSuites}
                onChange={e => setNumPremiereSuites(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${psGuestsWithoutSuite ? 'border-red-400 bg-red-50' : ''}`}
              />
              {psGuestsWithoutSuite && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Must be at least 1
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-[10px]">Quantity of VIP Passengers</label>
              <input
                type="number"
                min={0}
                value={vipPS}
                onChange={e => handleVipPSChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${psNoVip ? 'border-red-400 bg-red-50' : ''}`}
              />
              {psNoVip && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Required
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-[10px]">Quantity of Non-Flying Guests</label>
              <input
                type="number"
                min={0}
                value={nonFlyingPS}
                onChange={e => setNonFlyingPS(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${psOverCapacity ? 'border-red-400 bg-red-50' : ''}`}
              />
            </div>
          </div>

          {psErrors.length > 0 && (
            <div className="mt-3 space-y-1">
              {psErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Part 2: Lounge Deluxe */}
        <div className={`border rounded-lg p-4 ${ldErrors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Part 2 — Lounge Deluxe</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Max 3 Non-Flying Guests per booking
                {hasLdIntent && ' · At least 1 VIP Passenger required'}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${ldNonFlyingExceeded ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {nonFlyingLD} / 3 non-flying used
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-600 block mb-[10px]">Quantity of VIP Passengers</label>
              <input
                type="number"
                min={0}
                value={vipLD}
                onChange={e => handleVipLDChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${ldNoVip ? 'border-red-400 bg-red-50' : ''}`}
              />
              {ldNoVip && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Required
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-[10px]">Quantity of Non-Flying Guests</label>
              <input
                type="number"
                min={0}
                value={nonFlyingLD}
                onChange={e => setNonFlyingLD(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${ldNonFlyingExceeded ? 'border-red-400 bg-red-50' : ''}`}
              />
              {ldNonFlyingExceeded && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Max 3 allowed
                </p>
              )}
            </div>
          </div>

          {ldErrors.length > 0 && (
            <div className="mt-3 space-y-1">
              {ldErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2026-06-28 (round 6.2.73) — "Save Guest Details" button
            REMOVED in round 6.2.71 Phase 4B. Per-kind guest counts
            shown above are wired to lifted `formData` via
            `numPremiereSuitesOverride` / `vipPassengersInPremiereSuiteOverride`
            / `nonFlyingGuestsInPremiereSuiteOverride` /
            `vipPassengersInLoungeDeluxeOverride` /
            `nonFlyingGuestsInLoungeDeluxeOverride` +
            `onGuestCountChange` (Sky's Q4 — "we will rely on that
            sect to config the guest composition"). The master
            Save button at the bottom of this page aggregates
            these into `PUT /api/bookings/{id}`. */}
      </Card>

      {/* 2026-06-28 (round 6.2.73, Sky's #4) — Physical Resource
          assignment moved up to just below the Booking Details
          Part 1/2 card. Per Sky: "move the Physical Resources up,
          just below Booking Details: Part 1 — Premiere Suite and
          Part 2 — Lounge Deluxe". The PS/LD checkbox grids
          populate `assignedSuiteIds[]` / `assignedLoungeIds[]`
          which the backend uses to resolve the pricing product
          (premiere_suite | lounge_deluxe | mixed). Per Sky's
          follow-up: the count inputs above are the pricing
          source of truth (drives pricing); the location
          assignment here is "extra info, not affecting the price,
          so we have to keep both". The master Save button at the
          bottom of the page aggregates everything via lifted
          `formData`. */}
      {formData && onFormChange && (
        <EditSectionPhysicalResource
          formData={formData}
          onFormChange={onFormChange}
          suiteOptions={suiteOptions}
        />
      )}

      {/* 8b. Suite & Time Assignment — REMOVED in round 6.2.76 (Sky's
          "remove the Suite / Lounge Table Assignment which is
          showing after the booking is paid"). Visit date/time
          inputs in `<EditSectionFlight>` and physical-resource
          multi-select in `<EditSectionPhysicalResource>` are the
          canonical edit surfaces for time + location. */}

      {/* 2026-06-28 (round 6.2.71, Phase 5) — fake "In-Charge Staff"
        card REMOVED from the detail page. It used a hardcoded
        `ALL_STAFF` checklist that did not persist (read-only
        toggle for visual feedback only) and was redundant with
        the real `EditSectionStaff` block rendered below, which
        reads from `bookings.assigned_staff_ids` and the staff
        roster fetched from `/api/system/users`. */}

      {/* 9. Contact Person */}
      <Card className="p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Contact Person</h3>
        <div className="grid grid-cols-3 gap-6">
          {/* Name */}
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Name</span>
            </label>
            <input
              type="text"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Full name of contact person"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          {/* Contact Email */}
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Contact Email</span>
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="e.g. contact@example.com"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          {/* Contact No — round 6.2.76: region code + local number split */}
          <div>
            <label className="text-sm text-gray-600 block mb-[10px]">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Contact No.</span>
            </label>
            <div className="flex gap-2">
              {/* 2026-06-28 (round 6.2.76) — short region-code select.
                  Mirrors the Create form's pattern (CreateBooking.tsx
                  uses a `<RegionCodeCombobox>` sourced from
                  `GET /api/lookups/region-codes`; here we use a
                  simple <select> with the most common HKG guest
                  codes — pragmatic simplification since the parent
                  wrapper only needs the region-code prefix to
                  re-assemble `contactNo` as `${regionCode}
                  ${contactNo}` on the master Save PUT.
                  2026-06-28 (round 6.2.77) — wired to lifted
                  formData / onFormChange so user edits persist
                  (was display-only pre-6.2.77). */}
              <select
                value={regionCode}
                onChange={e => setRegionCode(e.target.value)}
                aria-label="Region code"
                className="w-28 px-2 py-2 border rounded text-sm bg-white"
              >
                <option value="">—</option>
                <option value="+852">+852 (HK)</option>
                <option value="+86">+86 (CN)</option>
                <option value="+1">+1 (US/CA)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+81">+81 (JP)</option>
                <option value="+65">+65 (SG)</option>
                <option value="+61">+61 (AU)</option>
                <option value="+886">+886 (TW)</option>
                <option value="+853">+853 (MO)</option>
                <option value="+82">+82 (KR)</option>
              </select>
              <input
                type="tel"
                value={contactNo}
                onChange={e => setContactNo(e.target.value)}
                placeholder="9123 4567"
                className="flex-1 px-3 py-2 border rounded text-sm"
              />
            </div>
          </div>
          {/* Booking Memo — full width */}
          <div className="col-span-3">
            <label className="text-sm text-gray-600 block mb-[10px]">
              <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Booking Memo</span>
            </label>
            <textarea
              value={bookingMemo}
              onChange={e => setBookingMemo(e.target.value)}
              placeholder="Internal notes or special instructions for this booking..."
              className="w-full px-3 py-2 border rounded text-sm resize-none"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* 10. VIP Passenger Details */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm uppercase tracking-wide text-gray-500">VIP Passenger Details</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {passengers.length} passenger{passengers.length !== 1 ? 's' : ''} —
              {vipPS > 0 && ` ${vipPS} from Premiere Suite`}
              {vipPS > 0 && vipLD > 0 && ','}
              {vipLD > 0 && ` ${vipLD} from Lounge Deluxe`}
            </p>
            {/* 2026-06-08 round 6.2.8 — bookings/684 spouse fix.
                When the account has a spouse on record but no
                passenger or NFG in this booking matches the
                spouse's name, the Spouse badge silently drops.
                Show a small warning here so staff can spot data
                drift between the account profile and this
                booking's passenger list. Triggers only when
                accountHasSpouse && !profileSpouseMatched. */}
            {accountHasSpouse && !profileSpouseMatched && (
              <div
                className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800"
                data-testid="profile-spouse-unmatched-warning"
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">
                  Account profile has spouse on record: <strong>{profileSpouseDisplayName}</strong>
                  {' '}— no matching passenger or non-flying guest in this booking.
                </span>
              </div>
            )}
            {/* 2026-06-28 — VIP Passenger completeness inline warning.
                Moved here from the Booking Details (Part 1 / Part 2)
                card per Sky's directive. Surfaces any VIP Passenger
                row (PS or LD) with missing Title / First Name / Last
                Name / Age Group / Travel Doc No. */}
            {totalVipIncomplete > 0 && (
              <div
                className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-800"
                data-testid="vip-passenger-incomplete-warning"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">
                  {totalVipIncomplete} VIP Passenger row{totalVipIncomplete === 1 ? '' : 's'} incomplete — fill in Title / First Name / Last Name / Age Group / Travel Doc No.
                </span>
              </div>
            )}
          </div>
          {passengers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <Ticket className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-800">
                {remainingVouchers} / {customerTotalVouchers} voucher{customerTotalVouchers !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}
          {passengers.length === 0 && (
            <span className="text-xs text-gray-400 italic">No VIP passengers assigned yet.</span>
          )}
        </div>

        {passengers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
            <p className="text-sm">Assign VIP Passengers in the Booking Details section above to fill in passenger details.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {passengers.map((p, idx) => {
              const isPS = idx < vipPS;
              const role = getPassengerRole(idx);
              const voucherOn = passengerVoucherUsed[idx] ?? false;
              const eligible = isVoucherEligibleRole(role);
              const isOwner = role === 'Account Owner';
              const isSpouse = role === 'Spouse';

              // Border/bg highlight for owner and spouse
              const cardBorder = isOwner
                ? 'border-amber-300 ring-1 ring-amber-200'
                : isSpouse
                ? 'border-rose-300 ring-1 ring-rose-100'
                : 'border-gray-200';

              return (
                <div key={idx} className={`border rounded-lg overflow-hidden ${cardBorder}`}>
                  {/* Passenger header */}
                  <div className={`flex items-center gap-3 px-4 py-2 ${
                    isOwner ? 'bg-amber-50 border-b border-amber-200' :
                    isSpouse ? 'bg-rose-50 border-b border-rose-200' :
                    isPS ? 'bg-purple-50 border-b border-purple-100' : 'bg-blue-50 border-b border-blue-100'
                  }`}>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPS ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {isPS ? 'Premiere Suite' : 'Lounge Deluxe'}
                    </span>
                    {/* Role badge */}
                    {isOwner && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                        <Star className="w-3 h-3" /> Account Owner
                      </span>
                    )}
                    {isSpouse && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-xs font-bold">
                        <Heart className="w-3 h-3" /> Spouse
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      VIP Passenger {idx + 1}
                      {p.firstName && p.lastName ? ` — ${p.firstName} ${p.lastName}` : ''}
                    </span>
                    {/* Voucher toggle — only for owner/spouse */}
                    {eligible && (
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-gray-500">Use Voucher</span>
                        <button
                          type="button"
                          onClick={() => togglePassengerVoucher(idx)}
                          disabled={!voucherOn && remainingVouchers === 0}
                          title={!voucherOn && remainingVouchers === 0 ? 'No vouchers remaining' : voucherOn ? 'Remove voucher' : 'Apply voucher (covers HK$1,200 entry)'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            voucherOn
                              ? 'bg-amber-500'
                              : remainingVouchers === 0
                              ? 'bg-gray-200 cursor-not-allowed'
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${voucherOn ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        {voucherOn && (
                          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            <Ticket className="w-3 h-3 inline mr-0.5" />Entry Free
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Row 1: Title | First Name | Last Name | Travel Document No */}
                    <div className="grid grid-cols-6 gap-4">
                      <div className="col-span-1">
                        <label className="text-sm text-gray-600 block mb-[10px]">Title</label>
                        <select
                          value={p.title}
                          onChange={e => updatePassenger(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        >
                          <option value="">—</option>
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Ms">Ms</option>
                          <option value="Miss">Miss</option>
                          <option value="Dr">Dr</option>
                          <option value="Prof">Prof</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600 block mb-[10px]">First Name</label>
                        <input
                          type="text"
                          value={p.firstName}
                          onChange={e => updatePassenger(idx, 'firstName', e.target.value)}
                          placeholder="First name"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600 block mb-[10px]">Last Name</label>
                        <input
                          type="text"
                          value={p.lastName}
                          onChange={e => updatePassenger(idx, 'lastName', e.target.value)}
                          placeholder="Last name"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-sm text-gray-600 block mb-[10px]">Travel Document No.</label>
                        <input
                          type="text"
                          value={p.travelDocNo}
                          onChange={e => updatePassenger(idx, 'travelDocNo', e.target.value)}
                          placeholder="e.g. K12345678"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    </div>

                    {/* Row 2: Membership No | Age Group | Birthday (Day / Month / Year) */}
                    <div className="grid grid-cols-6 gap-4">
                      <div className="col-span-1">
                        <label className="text-sm text-gray-600 block mb-[10px]">Membership No.</label>
                        <input
                          type="text"
                          value={p.membershipNo}
                          onChange={e => updatePassenger(idx, 'membershipNo', e.target.value)}
                          placeholder="MEM-XXXX"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600 block mb-[10px]">Age Group</label>
                        <select
                          value={p.ageGroup}
                          onChange={e => updatePassenger(idx, 'ageGroup', e.target.value)}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        >
                          <option value="">Select age group</option>
                          <option value="Adults (aged 12 and above)">Adults (aged 12 and above)</option>
                          <option value="Children (aged 2-11)">Children (aged 2-11)</option>
                          <option value="Infants (under 2 years old)">Infants (under 2 years old)</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-sm text-gray-600 block mb-[10px]">Birthday</label>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={p.birthdayDay}
                            onChange={e => updatePassenger(idx, 'birthdayDay', e.target.value)}
                            className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                          >
                            <option value="">Day</option>
                            {Array.from({ length: 31 }, (_, d) => String(d + 1).padStart(2, '0')).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <select
                            value={p.birthdayMonth}
                            onChange={e => updatePassenger(idx, 'birthdayMonth', e.target.value)}
                            className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                          >
                            <option value="">Month</option>
                            {MONTHS.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={p.birthdayYear}
                            onChange={e => updatePassenger(idx, 'birthdayYear', e.target.value)}
                            placeholder="Year"
                            min={1900}
                            max={new Date().getFullYear()}
                            className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Food Allergies — full width */}
                    <div>
                      <label className="text-sm text-gray-600 mb-[10px] flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-red-400" />
                        Food Allergies
                      </label>
                      <input
                        type="text"
                        value={p.foodAllergies}
                        onChange={e => updatePassenger(idx, 'foodAllergies', e.target.value)}
                        placeholder="e.g. Shellfish, Peanuts, Dairy — leave blank if none"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-200 ${p.foodAllergies ? 'border-red-300 bg-red-50' : ''}`}
                      />
                      {p.foodAllergies && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Allergy noted — please inform kitchen & F&B staff
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 2026-06-28 (round 6.2.71, Phase 4B) — "Save Passenger Details"
            button REMOVED. The per-passenger cards above remain
            rendered with the existing data (name / ageGroup /
            travelDocNo / birthday / membershipNo) but edits
            don't persist from the detail page. Admin edits via
            the standalone edit page (click `[Edit Booking (full editor)]`
            in the header). The VIP/NFG completeness gate (round
            6.2.65) is now enforced on the standalone edit page's
            Save Changes handler. */}
          </div>
        )}
      </Card>

      {/* 11. Non-Flying Guest Details */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm uppercase tracking-wide text-gray-500">Non-Flying Guest Details</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {nonFlyingGuests.length} guest{nonFlyingGuests.length !== 1 ? 's' : ''} —
              {nonFlyingPS > 0 && ` ${nonFlyingPS} from Premiere Suite`}
              {nonFlyingPS > 0 && nonFlyingLD > 0 && ','}
              {nonFlyingLD > 0 && ` ${nonFlyingLD} from Lounge Deluxe`}
            </p>
            {/* 2026-06-28 — Non-Flying Guest completeness inline warning.
                Moved here from the Booking Details (Part 1 / Part 2)
                card per Sky's directive. Surfaces any NFG row (PS or
                LD) with missing Title / First Name / Last Name / Age
                Group. NFGs do NOT have a Travel Doc No. field. */}
            {totalNfgIncomplete > 0 && (
              <div
                className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-800"
                data-testid="nfg-incomplete-warning"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">
                  {totalNfgIncomplete} Non-Flying Guest row{totalNfgIncomplete === 1 ? '' : 's'} incomplete — fill in Title / First Name / Last Name / Age Group.
                </span>
              </div>
            )}
          </div>
          {nonFlyingGuests.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <Ticket className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-800">
                {remainingVouchers} / {customerTotalVouchers} voucher{customerTotalVouchers !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}
        </div>

        {nonFlyingGuests.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
            <p className="text-sm">Assign Non-Flying Guests in the Booking Details section above to fill in guest details.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nonFlyingGuests.map((g, idx) => {
              const isPS = idx < nonFlyingPS;
              const role = getNFGRole(idx);
              const voucherOn = nonFlyingVoucherUsed[idx] ?? false;
              const eligible = isVoucherEligibleRole(role);
              const isSpouseNFG = role === 'Spouse';

              const cardBorder = isSpouseNFG
                ? 'border-rose-300 ring-1 ring-rose-100'
                : 'border-gray-200';

              return (
                <div key={idx} className={`border rounded-lg overflow-hidden ${cardBorder}`}>
                  {/* Guest header */}
                  <div className={`flex items-center gap-3 px-4 py-2 ${
                    isSpouseNFG ? 'bg-rose-50 border-b border-rose-200' :
                    isPS ? 'bg-purple-50 border-b border-purple-100' : 'bg-blue-50 border-b border-blue-100'
                  }`}>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPS ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {isPS ? 'Premiere Suite' : 'Lounge Deluxe'}
                    </span>
                    {isSpouseNFG && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-xs font-bold">
                        <Heart className="w-3 h-3" /> Spouse
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      Non-Flying Guest {idx + 1}
                      {g.firstName && g.lastName ? ` — ${g.firstName} ${g.lastName}` : ''}
                    </span>
                    {/* Voucher toggle for spouse */}
                    {eligible && (
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-gray-500">Use Voucher</span>
                        <button
                          type="button"
                          onClick={() => toggleNFGVoucher(idx)}
                          disabled={!voucherOn && remainingVouchers === 0}
                          title={!voucherOn && remainingVouchers === 0 ? 'No vouchers remaining' : voucherOn ? 'Remove voucher' : 'Apply voucher (covers HK$1,200 entry)'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            voucherOn
                              ? 'bg-amber-500'
                              : remainingVouchers === 0
                              ? 'bg-gray-200 cursor-not-allowed'
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${voucherOn ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        {voucherOn && (
                          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            <Ticket className="w-3 h-3 inline mr-0.5" />Entry Free
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      {/* Title */}
                      <div>
                        <label className="text-sm text-gray-600 block mb-[10px]">Title</label>
                        <select
                          value={g.title}
                          onChange={e => updateNonFlyingGuest(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        >
                          <option value="">—</option>
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Ms">Ms</option>
                          <option value="Miss">Miss</option>
                          <option value="Dr">Dr</option>
                          <option value="Prof">Prof</option>
                        </select>
                      </div>
                      {/* First Name */}
                      <div>
                        <label className="text-sm text-gray-600 block mb-[10px]">First Name</label>
                        <input
                          type="text"
                          value={g.firstName}
                          onChange={e => updateNonFlyingGuest(idx, 'firstName', e.target.value)}
                          placeholder="First name"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      {/* Last Name */}
                      <div>
                        <label className="text-sm text-gray-600 block mb-[10px]">Last Name</label>
                        <input
                          type="text"
                          value={g.lastName}
                          onChange={e => updateNonFlyingGuest(idx, 'lastName', e.target.value)}
                          placeholder="Last name"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      {/* Age Group */}
                      <div>
                        <label className="text-sm text-gray-600 block mb-[10px]">Age Group</label>
                        <select
                          value={g.ageGroup}
                          onChange={e => updateNonFlyingGuest(idx, 'ageGroup', e.target.value)}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        >
                          <option value="">Select age group</option>
                          <option value="Adults (aged 12 and above)">Adults (aged 12 and above)</option>
                          <option value="Children (aged 2-11)">Children (aged 2-11)</option>
                          <option value="Infants (under 2 years old)">Infants (under 2 years old)</option>
                        </select>
                      </div>
                    </div>
                    {/* Food Allergies */}
                    <div>
                      <label className="text-sm text-gray-600 mb-[10px] flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-red-400" />
                        Food Allergies
                      </label>
                      <input
                        type="text"
                        value={g.foodAllergies}
                        onChange={e => updateNonFlyingGuest(idx, 'foodAllergies', e.target.value)}
                        placeholder="e.g. Peanuts, Shellfish — leave blank if none"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-200 ${g.foodAllergies ? 'border-red-300 bg-red-50' : ''}`}
                      />
                      {g.foodAllergies && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Allergy noted — please inform kitchen & F&B staff
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 2026-06-28 (round 6.2.71, Phase 4B) — "Save Guest Details (NFG)"
            button REMOVED. NFG detail edits go through the
            standalone edit page (single edit surface). The
            per-NFG cards above remain rendered with existing
            data (name / ageGroup / foodAllergies) but edits
            don't persist from the detail page. */}
          </div>
        )}
      </Card>

      {/* Pricing Information — Agency Discount Breakdown */}
      {booking.agencyDiscountRate && booking.originalAmountValue && booking.finalAmountValue ? (
        <Card className="p-6 border-green-200 bg-green-50/40">
          <div className="flex items-center gap-2 mb-4">
            <BadgePercent className="w-5 h-5 text-green-700" />
            <h3 className="text-sm uppercase tracking-wide text-green-800">Agency Discount Applied</h3>
          </div>

          {/* Agency Info Banner */}
          <div className="flex items-center gap-3 bg-white border border-green-200 rounded-lg px-4 py-3 mb-5">
            <Building2 className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{booking.agencyName}</p>
              <p className="text-xs text-gray-500">{booking.agencyCode} · Default Discount Rate: <span className="text-green-700 font-medium">{booking.agencyDiscountRate}%</span></p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
              <BadgePercent className="w-3.5 h-3.5" />
              {booking.agencyDiscountRate}% OFF
            </span>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white border border-green-100 rounded-lg divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-600">Base Service Amount</span>
              <span className="text-sm font-medium text-gray-800">HK${booking.originalAmountValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3 bg-green-50/60">
              <div className="flex items-center gap-2">
                <BadgePercent className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">Agency Discount ({booking.agencyDiscountRate}%)</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Auto-applied</span>
              </div>
              <span className="text-sm font-medium text-green-700">
                − HK${(booking.originalAmountValue - booking.finalAmountValue).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4 bg-green-50">
              <span className="font-semibold text-gray-900">Total Payable</span>
              <div className="text-right">
                <p className="text-xs text-gray-400 line-through">HK${booking.originalAmountValue.toLocaleString()}</p>
                <p className="text-xl font-semibold text-green-700">HK${booking.finalAmountValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700">
              Discount automatically applied based on <strong>{booking.agencyName}</strong>'s contracted rate. 
              Total savings: <strong>HK${(booking.originalAmountValue - booking.finalAmountValue).toLocaleString()}</strong>
            </p>
          </div>
        </Card>
      ) : null}

      {/* Round 6.2.137 — Membership free PS/LD waiver (persisted price_breakdown) */}
      {(() => {
        const membershipLines = (booking.priceBreakdown ?? []).filter(
          (line) => typeof line.key === 'string' && line.key.startsWith('membership_'),
        );
        if (membershipLines.length === 0) return null;
        const original = booking.originalAmountValue
          ?? membershipLines.reduce((sum, line) => sum + Math.abs(Number(line.subtotal) || 0), 0);
        const final = booking.finalAmountValue
          ?? (booking.totalPrice != null ? Number(booking.totalPrice) : Math.max(0, original - membershipLines.reduce((s, l) => s + Math.abs(Number(l.subtotal) || 0), 0)));
        return (
          <Card className="p-6 border-indigo-200 bg-indigo-50/40" data-testid="membership-benefit-pricing-card">
            <div className="flex items-center gap-2 mb-4">
              <Gem className="w-5 h-5 text-indigo-700" />
              <h3 className="text-sm uppercase tracking-wide text-indigo-800">Membership Benefit Applied</h3>
            </div>
            <div className="bg-white border border-indigo-100 rounded-lg divide-y divide-gray-100">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-600">Base Service Amount</span>
                <span className="text-sm font-medium text-gray-800">HK${original.toLocaleString()}</span>
              </div>
              {membershipLines.map((line) => (
                <div key={line.key} className="flex items-center justify-between px-5 py-3 bg-indigo-50/60">
                  <div className="flex items-center gap-2">
                    <Gem className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-indigo-800">{line.label || line.key}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Waived</span>
                  </div>
                  <span className="text-sm font-medium text-indigo-700">
                    − HK${Math.abs(Number(line.subtotal) || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-4 bg-indigo-50">
                <span className="font-semibold text-gray-900">Total Payable</span>
                <div className="text-right">
                  <p className="text-xs text-gray-400 line-through">HK${original.toLocaleString()}</p>
                  <p className="text-xl font-semibold text-indigo-700">HK${final.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* 12. Service Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm uppercase tracking-wide text-gray-500">Service Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* SECTION 1: Suite & Lounge */}
              <tr className="bg-blue-50">
                <td colSpan={5} className="px-4 py-2">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Suite & Lounge</p>
                </td>
              </tr>
              
              {/* Head Count Entry Fee — removed round 6.1.5 (2026-06-07).
                  Backend PricingService no longer emits an `entry_fee`
                  line in `price_breakdown` (the only items now are
                  `base` + `add_on_non_flying_guest` + `addons`), and
                  the previous UI formula (`max(4 pax counts,
                  numberOfGuests) * HK$1200`) was a ghost charge that
                  did not match the backend total. Confirmed with
                  user: the Entry Fee (Head Count) line should not
                  render at all. The line below is the empty stub
                  kept for traceability; the wrapping fragment
                  renders nothing.
              */}
              {/* Round 6.2.13 (2026-06-08) — REMOVED the dead-code
                * block that was here. Pre-6.2.13 it was
                * `{false && (<tr>...${headCountTotal}...)}` —
                * the outer `{false && ...}` was intended to
                * skip rendering, BUT the JSX compiler still
                * eagerly evaluates the children (to build the
                * `React.createElement` args), which throws
                * `headCountTotal is not defined` at runtime.
                * Per the user directive ("we are not using
                * headCountRate now"), the entire head-count
                * line is removed. The new "Pricing
                * Information" card (line 3306+) shows the
                * `livePreviewTotal` (from
                * `POST /api/bookings/price-preview`) as the
                * Total Amount. */}
              <tr>
                <td colSpan={5} className="px-4 py-2 bg-gray-50">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Remarks by Staff:</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded text-sm resize-none"
                      rows={2}
                      defaultValue={''}
                    />
                  </div>
                </td>
              </tr>

              {/* SECTION 2: Additional Services */}
              <>
                  <tr className="bg-purple-50">
                    <td colSpan={5} className="px-4 py-2">
                      <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide">Additional Services</p>
                    </td>
                  </tr>

                  {/* Food & Beverage — always complimentary */}
                  {true && (
                <>
                  <tr>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Utensils className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Food & Beverage Package</p>
                          <p className="text-xs text-gray-500">Premium Selection — all food & drinks complimentary</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">1</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-green-600 font-medium">HK$0</span>
                    </td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">Complimentary</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-4 py-2 bg-gray-50">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600">Remarks by Staff:</label>
                        <textarea 
                          className="w-full px-3 py-2 border rounded text-sm resize-none"
                          rows={2}
                          defaultValue="Food & beverage complimentary — dietary restrictions noted"
                        />
                      </div>
                    </td>
                  </tr>
                </>
              )}

              {/* Limousine Service */}
              {booking.hasLimousine && (() => {
                // Round 6.1.2 (2026-06-07): render the structured limo
                // addon (quantity / unit_price / subtotal / destinations)
                // from `booking.addons` instead of the previous hard-coded
                // `defaultValue={1}` / `defaultValue="800.00"` /
                // `defaultValue="Pickup at Terminal 1"` which never
                // reflected the staff's actual input. Fall back to the
                // legacy single-line display only when `booking.addons`
                // is missing or empty (legacy bookings created before
                // the round 4.x AddonsSyncService shipped).
                const limoAddon = booking.addons?.find(
                  (a) => a.name === 'Limousine Transfer',
                );
                const limoQty = limoAddon?.quantity ?? 1;
                const limoUnit = limoAddon?.unitPrice ?? 800;
                const limoSubtotal = limoAddon?.subtotal ?? 800;
                const limoDestinations = limoAddon?.destinations ?? [];
                const limoRemarks = limoDestinations.length > 0
                  ? limoDestinations.join(' → ')
                  : 'Pickup at Terminal 1';
                return (
                  <>
                    <tr>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="font-medium">Limousine Transfer Service</p>
                            <p className="text-xs text-gray-500">Airport Transfer</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          defaultValue={limoQty}
                          className="w-20 px-2 py-1 border rounded text-center"
                          min="1"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="text"
                          defaultValue={limoUnit.toFixed(2)}
                          className="w-32 px-2 py-1 border rounded text-right"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3 text-right font-medium">HK${limoSubtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-4 py-2 bg-gray-50">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-600">Remarks by Staff:</label>
                          <textarea
                            className="w-full px-3 py-2 border rounded text-sm resize-none"
                            rows={2}
                            defaultValue={limoRemarks}
                            readOnly
                          />
                        </div>
                      </td>
                    </tr>
                  </>
                );
              })()}

              {/* Shopping Service */}
              {booking.hasShopping && (
                <>
                  <tr>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-medium">In-lounge Shopping Service</p>
                          <p className="text-xs text-gray-500">Personal Shopping Assistant</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        defaultValue={1} 
                        className="w-20 px-2 py-1 border rounded text-center"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input 
                        type="text" 
                        defaultValue="500.00"
                        className="w-32 px-2 py-1 border rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right font-medium">HK$500</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-4 py-2 bg-gray-50">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600">Remarks by Staff:</label>
                        <textarea 
                          className="w-full px-3 py-2 border rounded text-sm resize-none"
                          rows={2}
                          defaultValue="Complimentary gift wrapping"
                        />
                      </div>
                    </td>
                  </tr>
                </>
              )}

              {/* Lounge Extension Service — round 6.2.81 (Bug B:
                  "lounge extension not shown in admin panel booking
                  detail"). Customer mapper writes a "Lounge Extension"
                  booking_items row with `quantity` = hours (1-6 cap).
                  The booking detail read view previously had no named
                  row for it (only Limo + Shopping had explicit
                  sections; the e2e at tests/e2e/booking-lifecycle-addons.spec.ts:297-299
                  had commented this gap). Reads from `booking.addons[]`
                  (populated by `mapBookingFromApi` from
                  `api.booking_items[].bookable_item.name_en`) —
                  mirrors the Limo block above (:3432-3500).
                  Renders only when at least one addon row has
                  `name === 'Lounge Extension'`. The edit form's
                  separate Lounge Extension toggle + qty stepper
                  lives in `EditSectionAddons.tsx:226-261`. */}
              {booking.addons?.some(a => a.name === 'Lounge Extension') && (() => {
                const loungeAddon = booking.addons!.find(a => a.name === 'Lounge Extension')!;
                const qty = Number(loungeAddon.quantity ?? 1);
                const unit = Number(loungeAddon.unitPrice ?? 1500);
                const subtotal = Number(loungeAddon.subtotal ?? unit * qty);
                return (
                  <>
                    <tr>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="font-medium">Lounge Extension Service</p>
                            <p className="text-xs text-gray-500">Additional hours beyond the base 3 hours</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          defaultValue={qty}
                          className="w-20 px-2 py-1 border rounded text-center"
                          min="1"
                          max="6"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="text"
                          defaultValue={unit.toFixed(2)}
                          className="w-32 px-2 py-1 border rounded text-right"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3 text-right font-medium">HK${subtotal.toLocaleString()}</td>
                    </tr>
                  </>
                );
              })()}

              {/* Spa Service */}
              {false && (
                <>
                  <tr>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">Express Spa Treatment</p>
                        <p className="text-xs text-gray-500">30-minute massage</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        defaultValue={1} 
                        className="w-20 px-2 py-1 border rounded text-center"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input 
                        type="text" 
                        defaultValue="600.00"
                        className="w-32 px-2 py-1 border rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">15%</td>
                    <td className="px-4 py-3 text-right font-medium">HK$510</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-4 py-2 bg-gray-50">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600">Remarks by Staff:</label>
                        <textarea 
                          className="w-full px-3 py-2 border rounded text-sm resize-none"
                          rows={2}
                          defaultValue="Member promotional rate"
                        />
                      </div>
                    </td>
                  </tr>
                </>
              )}

              {false && (
                <>
                  <tr>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">Private Meeting Room</p>
                        <p className="text-xs text-gray-500">2-hour booking</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        defaultValue={1} 
                        className="w-20 px-2 py-1 border rounded text-center"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input 
                        type="text" 
                        defaultValue="1200.00"
                        className="w-32 px-2 py-1 border rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right font-medium">HK$1,200</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-4 py-2 bg-gray-50">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600">Remarks by Staff:</label>
                        <textarea 
                          className="w-full px-3 py-2 border rounded text-sm resize-none"
                          rows={2}
                          defaultValue="AV equipment included"
                        />
                      </div>
                    </td>
                  </tr>
                </>
              )}
              </>

              {/* ADD NEW ITEM SECTION */}
              <tr className="bg-green-50">
                <td colSpan={5} className="px-4 py-2">
                  <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">Add New Item</p>
                </td>
              </tr>

              {/* Step 1 — Service search */}
              <tr className="bg-green-50/30">
                <td colSpan={5} className="px-4 pt-3 pb-2">
                  <p className="text-xs text-gray-500 mb-2">
                    Search and select an add-on, then click Add Item. You can add multiple
                    services one at a time — remember to Save All Changes below.
                  </p>
                  <div className="relative">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Type to search services, e.g. Limousine, Fast Track, Shower…"
                        value={addonSearch}
                        onChange={e => { setAddonSearch(e.target.value); setShowAddonDropdown(true); }}
                        onFocus={() => setShowAddonDropdown(true)}
                        onBlur={() => setTimeout(() => setShowAddonDropdown(false), 150)}
                        className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      {addonSearch && (
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setAddonSearch(''); setShowAddonDropdown(false); setSelectedAddon(null); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Selected badge */}
                    {selectedAddon && !showAddonDropdown && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-md text-sm text-green-800">
                        {addonServices.find(s => s.key === selectedAddon)?.icon}
                        <span>{selectedAddon}</span>
                        <button
                          type="button"
                          onClick={() => { setSelectedAddon(null); setAddonSearch(''); }}
                          className="ml-1 text-green-500 hover:text-green-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Dropdown results */}
                    {showAddonDropdown && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                        {(() => {
                          const q = addonSearch.trim().toLowerCase();
                          const results = q
                            ? addonServices.filter(s =>
                                s.key.toLowerCase().includes(q) ||
                                s.desc.toLowerCase().includes(q)
                              )
                            : addonServices;
                          if (results.length === 0) {
                            return (
                              <div className="px-4 py-3 text-sm text-gray-500">
                                No services found for "<span className="font-medium">{addonSearch}</span>"
                              </div>
                            );
                          }
                          return results.map(({ key, icon, desc, defaultPrice }) => (
                            <button
                              key={key}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => handleSelectAddon(key, defaultPrice)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-green-50 border-b border-gray-100 last:border-0 transition-colors ${
                                selectedAddon === key ? 'bg-green-50' : ''
                              }`}
                            >
                              <span className={`p-1.5 rounded-md shrink-0 ${selectedAddon === key ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{key}</p>
                                <p className="text-xs text-gray-500">{desc}</p>
                              </div>
                              <span className="text-xs text-gray-500 shrink-0">
                                {parseFloat(defaultPrice) === 0 ? 'Complimentary' : `HK$${parseFloat(defaultPrice).toLocaleString()}`}
                              </span>
                              {selectedAddon === key && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </td>
              </tr>

              {/* Step 2 — Qty / Price / Discount / Add button (only when a service is selected) */}
              {selectedAddon && (
                <tr className="bg-green-50/20 border-t border-green-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-100 text-green-800 text-sm">
                        {addonServices.find(s => s.key === selectedAddon)?.icon}
                        {selectedAddon}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      value={addonQty}
                      onChange={e => setAddonQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1 border rounded text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto"
                      min="1"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-gray-400">HK$</span>
                      <input
                        type="text"
                        value={addonUnitPrice}
                        onChange={e => setAddonUnitPrice(e.target.value)}
                        className="w-28 px-2 py-1 border rounded text-right"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="text"
                        value={addonDiscount}
                        onChange={e => setAddonDiscount(e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-right"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleAddItem}
                    >
                      Add Item
                    </Button>
                  </td>
                </tr>
              )}

              {/* Step 2.5 — Service-specific extra fields */}
              {selectedAddon === 'Limousine Transfer' && (
                <tr className="bg-blue-50/40 border-t border-blue-100">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-blue-800">Destinations / Pick-up Points</p>
                    </div>
                    <div className="space-y-2">
                      {limoStops.map((stop, idx) => (
                        <div key={stop.id} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <select
                            value={stop.type}
                            onChange={e => updateLimoStop(stop.id, 'type', e.target.value)}
                            className="px-2 py-1.5 border rounded text-sm bg-white w-36 shrink-0"
                          >
                            <option value="Pick-up">Pick-up</option>
                            <option value="Destination">Destination</option>
                          </select>
                          <input
                            type="text"
                            value={stop.location}
                            onChange={e => updateLimoStop(stop.id, 'location', e.target.value)}
                            placeholder={stop.type === 'Pick-up' ? 'e.g. Terminal 1, Arrival Hall' : 'e.g. Four Seasons Hotel, HK'}
                            className="flex-1 px-3 py-1.5 border rounded text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeLimoStop(stop.id)}
                            disabled={limoStops.length === 1}
                            className="p-1.5 rounded border text-gray-400 hover:text-red-500 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addLimoStop}
                      className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add another stop
                    </button>
                  </td>
                </tr>
              )}

              {selectedAddon === 'Wheelchair Assistance' && (
                <tr className="bg-orange-50/40 border-t border-orange-100">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-orange-600" />
                      <p className="text-xs text-orange-800">Passenger Requiring Assistance</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={wheelchairPassenger}
                        onChange={e => setWheelchairPassenger(e.target.value)}
                        placeholder="Enter full name of passenger..."
                        className="w-80 px-3 py-1.5 border rounded text-sm"
                      />
                      <p className="text-xs text-gray-400">As shown on travel document</p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Step 3 — Remarks */}
              <tr className="bg-green-50/20">
                <td colSpan={5} className="px-4 pb-3 pt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600 mb-[10px]">Remarks by Staff:</label>
                    <textarea
                      value={addonRemarks}
                      onChange={e => setAddonRemarks(e.target.value)}
                      className="w-full px-3 py-2 border rounded text-sm resize-none"
                      rows={2}
                      placeholder="Enter remarks for this new item..."
                    />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot className="border-t-2">
              {/* Round 6.2.13 (2026-06-08) — REMOVED the
                * dead-code block that was here. Pre-6.2.13 it
                * was `{false && (<tr>...${headCountTotal}...)}`
                * — the outer `{false && ...}` was intended to
                * skip rendering, BUT the JSX compiler still
                * eagerly evaluates the children (to build the
                * `React.createElement` args), which throws
                * `headCountTotal is not defined` at runtime.
                * Per the user directive ("we are not using
                * headCountRate now"), the entire head-count
                * row is removed. The Subtotal + Total Amount
                * in the invoice dialog use `livePreviewTotal`
                * (from `POST /api/bookings/price-preview`). */}
              {/* Food note — always free */}
              <tr className="bg-green-50">
                <td colSpan={3} className="px-4 py-2 text-right text-sm text-green-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5" />
                    Food & Beverage (incl. pre-order):
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-sm font-medium text-green-600" colSpan={2}>
                  Complimentary
                </td>
              </tr>
              {/* Service subtotal row */}
              {serviceSubtotal > 0 && (
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-600">Additional Services Subtotal:</td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-800" colSpan={2}>
                    HK${Math.round(serviceSubtotal).toLocaleString()}
                  </td>
                </tr>
              )}
              {/* Voucher rows — per-guest toggles */}
              {totalVouchersApplied > 0 && (
                <>
                  <tr className="bg-amber-50">
                    <td colSpan={3} className="px-4 py-2 text-right">
                      <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                        <Ticket className="w-3.5 h-3.5" />
                        Entry Vouchers Applied ({totalVouchersApplied} × HK${voucherUnitValue.toLocaleString()} — Account Owner &amp; Spouse):
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-amber-700" colSpan={2}>
                      − HK${voucherTotal.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-amber-50">
                    <td colSpan={5} className="px-4 pb-2">
                      <div className="flex gap-2 justify-end flex-wrap">
                        {/* Passenger vouchers — label is the
                            role from the round 6.2.8 helper, so a
                            guest who is not Account Owner / Spouse
                            (e.g. account has no spouse on record
                            and this passenger is a regular guest)
                            renders as "Guest" instead of being
                            mis-labelled "Spouse". */}
                        {passengerVoucherUsed.map((used, i) =>
                          used ? (
                            <span key={`pv-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs">
                              <Ticket className="w-3 h-3" />
                              {getPassengerRole(i)} — VIP Pax {i + 1}
                            </span>
                          ) : null
                        )}
                        {/* Non-flying guest vouchers — label is the
                            role from the round 6.2.8 helper. The
                            pre-6.2.8 code hard-coded "Spouse" for
                            every NFG voucher, which was wrong when
                            the account had no spouse on record. */}
                        {nonFlyingVoucherUsed.map((used, i) =>
                          used ? (
                            <span key={`nv-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs">
                              <Ticket className="w-3 h-3" />
                              {getNFGRole(i)} — Non-Flying Guest {i + 1}
                            </span>
                          ) : null
                        )}
                      </div>
                    </td>
                  </tr>
                </>
              )}
              {/* Remaining vouchers note */}
              <tr className="bg-amber-50/40">
                <td colSpan={5} className="px-4 py-1.5 text-right">
                  <span className="text-xs text-amber-600">
                    Customer has {customerTotalVouchers} voucher{customerTotalVouchers !== 1 ? 's' : ''} in account · {totalVouchersApplied} used this booking · {remainingVouchers} remaining
                  </span>
                </td>
              </tr>
              {/* Total */}
              <tr className="bg-gray-100">
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900">
                  {totalVouchersApplied > 0 ? 'Amount Payable (after entry vouchers):' : 'Total Amount:'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-green-600 text-base">
                  HK${amountDueAfterVouchers.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* 13. Promotion / Redemption Code — REMOVED 2026-07-02 (round 6.2.82).
          The card validated against a 6-entry hardcoded `MOCK_PROMOS`
          dictionary (SUMMER2024 / VIP20 / WELCOME / TRAVEL10 / REDEEM50 /
          DIAMOND15), so real promo codes created via
          `POST /api/promo-codes` were always rejected with "Invalid or
          expired code". The proper edit surface is the Promo Code
          `<Select>` in `<EditSectionAccountInfo>` further down (wired
          to `promoCodeService.getPromoCodes` + `formData.promoCodeId`
          in round 6.2.80). See L848-880 for the full rationale. */}

      {/* 15. Pricing Information */}
      <Card className="p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Pricing Information</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-600">Total</label>
            {/*
             * If staff has set a final amount, show that.
             * Otherwise show the live preview from
             * `POST /api/bookings/price-preview` (sourced via
             * the wrapper's `livePreviewTotal` prop). Per the
             * round 6.2.13 user directive ("we are not using
             * headCountRate now, we make them call the same
             * endpoint first"): NO MORE local fallback. If the
             * live preview is null (loading or fetch error),
             * show "Pending pricing" instead of a fabricated
             * number.
             */}
            <p className="text-lg font-semibold text-gray-900">
              {booking.amount
                ? booking.amount
                : livePreviewTotal !== null
                  ? `HK$${livePreviewTotal.toLocaleString()}`
                  : 'Pending pricing'}
            </p>
            {!booking.amount && (
              <p className="text-xs text-amber-600 mt-1">
                {livePreviewTotal !== null
                  ? 'Live preview (not yet priced)'
                  : 'Awaiting backend pricing'}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-600">Payment</label>
            <p className="text-lg font-semibold text-blue-600">
              {/* Round 6.2.12 + 6.2.13: prefer `livePreviewTotal`
               * (from `POST /api/bookings/price-preview`) when
               * `booking.amount` is not yet committed (i.e.
               * the booking is `payment_status: Pending`). Per
               * the round 6.2.13 user directive, NO MORE local
               * `headCountRate × pax` estimate fallback. */}
              {booking.paymentStatus === 'Paid' || booking.paymentStatus === 'Refunded'
                ? booking.amount
                : booking.amount
                || (livePreviewTotal !== null
                    ? `HK$${livePreviewTotal.toLocaleString()}`
                    : 'Pending pricing')}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Balance</label>
            <p className="text-lg font-semibold text-red-600">
              {/* Round 6.2.13: removed `headCountTotal +
               * serviceSubtotal` local estimate. Show "Pending
               * pricing" instead per the user directive. */}
              {booking.paymentStatus === 'Paid' || booking.paymentStatus === 'Refunded'
                ? 'HK$0'
                : booking.amount
                  || (livePreviewTotal !== null
                      ? `HK$${livePreviewTotal.toLocaleString()}`
                      : 'Pending pricing')}
            </p>
          </div>
        </div>
        {/* ── 2026-07-05 round 6.2.106 (recovery of 6.2.83 lost-edit) ──
             Pricing-card deduction row when booking.promoCode?.code is
             set AND originalAmountValue ≠ finalAmountValue. Renders the
             persisted delta as `− HK$X`. Hides for pre-6.2.83
             un-deducted bookings (the chip is the "needs pricing:reprice"
             signal). ── */}
        {booking.promoCode?.code
          && booking.originalAmountValue != null
          && booking.finalAmountValue != null
          && booking.originalAmountValue !== booking.finalAmountValue && (
          <div
            data-testid="pricing-promo-deduction-row"
            className="mt-3 flex items-center justify-between px-4 py-2 bg-indigo-50 border border-indigo-100 rounded"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-sm text-indigo-800 font-medium">
                {booking.promoCode.discountType === 'percentage'
                  ? `Promo Discount (${booking.promoCode.code})`
                  : `Promo free lounge (${booking.promoCode.code})`}
              </span>
              <span className="text-xs text-indigo-600">
                {booking.promoCode.discountType === 'percentage'
                  ? `${booking.promoCode.discountValue}% off`
                  : `Deduction of ${booking.promoCode.freeSessions ?? 1} LD fee${(booking.promoCode.freeSessions ?? 1) !== 1 ? 's' : ''}`}
              </span>
            </div>
            <span className="text-sm font-medium text-indigo-700">
              − HK${(booking.originalAmountValue - booking.finalAmountValue).toLocaleString()}
            </span>
          </div>
        )}
      </Card>

      {/* 16. Status Management */}
      <Card className="p-6">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">Status Management</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Booking Status</label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={statusValue}
              onChange={e => setStatusValue(e.target.value as BookingStatusValue)}
            >
              <option value="Pending for Review">Pending for Review</option>
              <option value="Pending for Approval">Pending for Approval</option>
              <option value="Approved">Approved</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-show">No-show</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Payment Status</label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={paymentStatusValue}
              onChange={e => setPaymentStatusValue(e.target.value as PaymentStatusValue)}
            >
              <option value="Not Required">Not Required</option>
              <option value="Pending">Pending</option>
              <option value="Payment Link Sent">Payment Link Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-600 mb-2 block">Status Update Reason / Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded resize-none"
              rows={3}
              placeholder="Enter reason for status change or additional notes..."
              value={rejectionReasonText}
              onChange={e => setRejectionReasonText(e.target.value)}
            />
          </div>
          {/* 2026-06-28 (round 6.2.71, Phase 4B) — "Update Status" button
              REMOVED. Booking status transitions (Pending for
              Review → Pending for Approval → Approved →
              Confirmed, etc.) now happen via the supervisor
              approval queue (`/bookings/supervising-approval`)
              and the staff approval queue (`/bookings/approve`).
              The status dropdown + reason textarea remain on
              the detail page for VISIBILITY but are no longer
              editable from here. The wrapper's `handleUpdateStatus`
              + `onUpdateStatus` prop forwarding will be removed
              in Phase 5. */}
        </div>
      </Card>

      {/* Invoice Dialog */}
      {/* Round 6.2.13 (2026-06-08) — REMOVED `headCountRate` and
        * `headCountTotal` props per the user directive. The
        * invoice now uses the same `livePreviewTotal` prop as
        * the detail page (sourced from
        * `POST /api/bookings/price-preview`). Both the page
        * AND the invoice call the same endpoint, per the
        * "make them call the same endpoint first" directive.
        *
        * Round 6.2.137 — prefer committed total_price +
        * price_breakdown (membership waiver included) over a
        * live preview that may still be loading / missing
        * account_id. */}
      <BookingInvoiceDialog
        open={showInvoice}
        onClose={() => setShowInvoice(false)}
        booking={booking}
        bookingId={bookingId}
        voucherCount={voucherCount}
        voucherTotal={voucherTotal}
        voucherUnitValue={voucherUnitValue}
        livePreviewTotal={
          booking.totalPrice != null
            ? Number(booking.totalPrice)
            : livePreviewTotal
        }
        breakdown={
          (booking.priceBreakdown && booking.priceBreakdown.length > 0)
            ? booking.priceBreakdown
            : livePreviewBreakdown
        }
        serviceSubtotal={serviceSubtotal}
        amountDueAfterVouchers={amountDueAfterVouchers}
        getStatusColor={getStatusColor}
        getPaymentStatusColor={getPaymentStatusColor}
        onSendPaymentLink={onSendPaymentLink}
        onInvoiceSent={onInvoiceSent}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
      />

      {/* [Legacy invoice content removed — now handled by BookingInvoiceDialog above] */}

      {/* ── Delete VIP Passenger Dialog ─────────────────────────────────── */}
      {deleteDialog && (() => {
        const { section, newValue, removeCount, candidates, selected } = deleteDialog;
        const sectionLabel = section === 'PS' ? 'Premiere Suite' : 'Lounge Deluxe';
        const currentCount = section === 'PS' ? vipPS : vipLD;
        const selectionReady = selected.size === removeCount;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDeleteDialog(null)}
            />
            {/* Panel */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              {/* Header */}
              <div className="bg-red-600 px-6 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-white text-base">Remove VIP Passengers</h2>
                  <p className="text-red-100 text-xs mt-0.5">
                    Reducing <span className="font-semibold">{sectionLabel}</span> VIP Passengers
                    from <span className="font-semibold">{currentCount}</span> to{' '}
                    <span className="font-semibold">{newValue}</span>
                  </p>
                </div>
              </div>

              {/* Instruction bar */}
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between">
                <p className="text-xs text-amber-800">
                  Select exactly <span className="font-semibold">{removeCount}</span> passenger{removeCount > 1 ? 's' : ''} to remove.
                  The remaining passenger information will be preserved.
                </p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-3 flex-shrink-0 transition-colors ${
                  selectionReady ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {selected.size} / {removeCount} selected
                </span>
              </div>

              {/* Candidate list */}
              <div className="px-6 py-4 space-y-2 max-h-72 overflow-y-auto">
                {candidates.map(({ globalIdx, label, subtitle }) => {
                  const checked = selected.has(globalIdx);
                  const disabled = !checked && selected.size >= removeCount;
                  return (
                    <label
                      key={globalIdx}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-red-50 border-red-300'
                          : disabled
                          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => !disabled && toggleDeleteSelection(globalIdx)}
                        className="mt-0.5 accent-red-600"
                      />
                      <div className="min-w-0">
                        <p className={`text-sm ${checked ? 'text-red-800 line-through' : 'text-gray-800'}`}>
                          {label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
                      </div>
                      {checked && (
                        <span className="ml-auto flex-shrink-0 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Will be removed
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteDialog(null)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePassengers}
                  disabled={!selectionReady}
                  className={`px-5 py-2 text-sm rounded-lg text-white transition-colors ${
                    selectionReady
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Remove {removeCount} Passenger{removeCount > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ────────────────────────────────────────────────────────────────── */}

      {/* 2026-06-28 (round 6.2.72, Phase B) — Inline Editable
          Sections container. Per Sky's pivot from round 6.2.71,
          the standalone edit page (`/bookings/:id/edit`) is
          deprecated; this detail page is now the sole edit
          surface. The 11 section components below cover all 50+
          fields the admin previously edited via the deleted
          `<BookingEditDialog>` modal + 6 inline save cards.

          State management: parent wrapper (`../BookingDetail.tsx`)
          owns the lifted `formData` state and passes it via the
          `formData` prop + `onFormChange` patch callback. The
          master Save button at the bottom of this container
          calls `onSaveAllChanges(formData)` which the wrapper
          handles (PUT + refetch). Sky can later lock down
          individual sections (delete from this container) per
          the round 6.2.72 plan.

          The remaining 8 sections render only when `formData` is
          provided (i.e. parent wrapper mounted the lifted state).
          Pre-6.2.72 callers (e.g. legacy tests, mocks) that
          don't pass `formData` see no Editable Sections block
          — the rest of the detail page (read-only display)
          remains operational. 2026-06-28 (round 6.2.73):
            • Removed `EditSectionGuestCounts` (#3), `EditSectionPassengers`
              (#4), `EditSectionNFGs` (#5) — the upper Booking
              Details / VIP Passenger Details / Non-Flying Guest
              Details cards are wired to lifted state via
              `numPremiereSuitesOverride` / `vipPassengersInPremiereSuiteOverride`
              / `passengersOverride` / `nonFlyingGuestsOverride` +
              `onGuestCountChange` / `onPassengersChange` /
              `onNonFlyingGuestsChange`. They are the canonical
              edit surfaces for those fields.
            • Removed the "Edit Booking · All sections · Master
              Save" banner line — Sky: "the whole page is the
              editor".
            • Moved `EditSectionPhysicalResource` (#6) up to
              just below the Booking Details Part 1/2 card (see
              the Booking Details Card render at line 1989+).
            • Added `hasGuestErrors` gating on the master Save
              button (binding rules enforced in lines 1026-1033). */}
      {formData && onFormChange && (
        <div className="pt-6 mt-6 border-t-2 border-blue-300 space-y-6">
          {/* 1. Account Settings (editable) */}
          <EditSectionAccountInfo formData={formData} onFormChange={onFormChange} promoCodeOptions={promoCodeOptions} />

          {/* 2. Flight + Visit + Suite + Payment (editable) */}
          <EditSectionFlight formData={formData} onFormChange={onFormChange} showTransit={showTransit} />

          {/* 3. Limo stops editor (gated on hasLimousine in detail logic) */}
          <EditSectionLimoStops formData={formData} onFormChange={onFormChange} />

          {/* 4. Wheelchair recipient (gated on hasWheelchair in section) */}
          <EditSectionWheelchair formData={formData} onFormChange={onFormChange} />

          {/* 5. Unified Add-on Services (Create parity per Sky 2026-06-28) —
              chips + searchable dropdown over CATALOG_ADDONS + Lounge
              Extension qty stepper + isAdHoc standalone toggle. Replaces
              the pre-6.2.75 split between EditSectionBooleanAddons +
              EditSectionAddons. */}
          <EditSectionAddons
            formData={formData}
            onFormChange={onFormChange}
            bookableItemPrices={bookableItemPrices}
            catalogAddonSlot={catalogAddonSlot}
          />

          {/* 7. In-Charge Staff multi-select */}
          <EditSectionStaff
            formData={formData}
            onFormChange={onFormChange}
            staffOptions={staffOptions}
          />

          {/* Master Save bar */}
          <Card className="p-5 border-blue-300 bg-blue-50/40">
            <div className="flex items-center justify-between">
              <div>
                {/* 2026-06-28 — Sky removed the "Master Save" title
                    and the "Sends all section values to PUT /api/bookings/{id}.
                    The detail page re-fetches on success." description
                    from this bar. The save button below still says
                    "Save All Changes" so the user knows what it does. */}
                {hasGuestErrorsFinal && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {effectiveIncompleteVipInfoCount > 0
                      ? `Resolve the binding-rule errors above and complete all ${effectiveIncompleteVipInfoCount} VIP Passenger / NFG row${effectiveIncompleteVipInfoCount === 1 ? '' : 's'} (Title / First Name / Last Name / Age Group${vipPS + vipLD > 0 ? ' / Travel Doc No.' : ''}) before saving.`
                      : 'Resolve the binding-rule errors above (PS must have ≥1 VIP, max 6 per PS, max 3 NFG per LD, etc.) and the 3h visit-time rule before saving.'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isSavingAllChanges}
                >
                  <X className="w-4 h-4 mr-1.5" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={() => onSaveAllChanges?.(formData)}
                  disabled={isSavingAllChanges || hasGuestErrorsFinal}
                  title={hasGuestErrorsFinal
                    ? (effectiveIncompleteVipInfoCount > 0
                        ? `Resolve the binding-rule errors above and complete all ${effectiveIncompleteVipInfoCount} VIP Passenger / NFG row${effectiveIncompleteVipInfoCount === 1 ? '' : 's'} before saving.`
                        : 'Resolve the binding-rule errors above (PS must have ≥1 VIP, max 6 per PS, max 3 NFG per LD, etc.) and the 3h visit-time rule before saving.')
                    : undefined}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {isSavingAllChanges ? 'Saving…' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Refund Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-600" />
              Process Refund — {booking.bookingNo}
            </DialogTitle>
            <DialogDescription>
              Enter the refund amount and reason below. The refund will not exceed the amount the customer paid (HK${amountDueAfterVouchers.toLocaleString()}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Booking summary reference */}
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-0.5">Guest</p>
                <p className="text-sm font-medium text-gray-800">{booking.guestName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{booking.accountNo}</p>
              </div>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-0.5">Booking Reference</p>
                <p className="text-sm font-medium text-gray-800 font-mono">{booking.bookingNo}</p>
                <p className="text-xs text-gray-400 mt-0.5">Payment: {booking.paymentMode}</p>
              </div>
            </div>

            {/* Maximum refund amount — prominent display */}
            <div className="px-4 py-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">Maximum Refundable Amount</p>
                  <p className="text-2xl font-bold text-purple-700">HK${amountDueAfterVouchers.toLocaleString()}</p>
                  <p className="text-xs text-purple-500 mt-1">
                    We will not refund more than the customer paid
                    {voucherCount > 0 ? ` (after ${voucherCount} voucher${voucherCount > 1 ? 's' : ''} deducted)` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => setRefundAmount(String(amountDueAfterVouchers))}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs hover:bg-purple-700 transition-colors font-medium"
                  >
                    Fill Max
                  </button>
                  <p className="text-xs text-purple-400 mt-1">Full refund</p>
                </div>
              </div>
              {/* Breakdown — Round 6.2.13 (2026-06-08):
                * replaced the "Head Count Total" line
                * (which used `headCountTotal`) with the
                * backend's authoritative `livePreviewTotal`
                * (from `POST /api/bookings/price-preview`).
                * Per the user directive, NO MORE local
                * `headCountRate × pax` calculation. */}
              <div className="mt-3 pt-3 border-t border-purple-200 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                <div>
                  <span className="text-purple-400">Live Preview Total: </span>
                  <span className="text-purple-700 font-medium">
                    {livePreviewTotal !== null
                      ? `HK$${livePreviewTotal.toLocaleString()}`
                      : 'Pending pricing'}
                  </span>
                </div>
                {serviceSubtotal > 0 && (
                  <div>
                    <span className="text-purple-400">Services: </span>
                    <span className="text-purple-700 font-medium">+ HK${serviceSubtotal.toLocaleString()}</span>
                  </div>
                )}
                {voucherCount > 0 && (
                  <div>
                    <span className="text-purple-400">Voucher Deduction: </span>
                    <span className="text-purple-700 font-medium">− HK${voucherTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vouchers non-refundable note */}
            {voucherCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Ticket className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  This booking used <strong>{voucherCount} voucher{voucherCount > 1 ? 's' : ''}</strong> (HK${voucherTotal.toLocaleString()} value). Vouchers are non-refundable and are excluded from the maximum refundable amount above.
                </p>
              </div>
            )}

            {/* Refund Amount */}
            <div>
              <label className="text-sm text-gray-700 font-medium block mb-[10px]">
                Refund Amount (HKD) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-l-md text-sm text-gray-600">HK$</span>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max={amountDueAfterVouchers}
                  step="0.01"
                  className={`flex-1 px-3 py-2 border rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    refundAmount && parseFloat(refundAmount) > amountDueAfterVouchers
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              </div>
              {refundAmount && parseFloat(refundAmount) > 0 && (
                parseFloat(refundAmount) > amountDueAfterVouchers ? (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Exceeds the maximum refundable amount of HK${amountDueAfterVouchers.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Refund: <strong className="text-purple-700">HK${parseFloat(refundAmount).toLocaleString('en', { minimumFractionDigits: 2 })}</strong>
                    {amountDueAfterVouchers > 0 && (
                      <span className="text-gray-400 ml-1">
                        ({Math.round((parseFloat(refundAmount) / amountDueAfterVouchers) * 100)}% of maximum)
                      </span>
                    )}
                  </p>
                )
              )}
            </div>

            {/* Refund Reason */}
            <div>
              <label className="text-sm text-gray-700 font-medium block mb-[10px]">Reason for Refund</label>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Enter the reason for this refund (e.g. service issue, guest complaint, cancellation)..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-purple-50 border border-purple-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700">
                After confirmation, this refund case will be logged in <strong>Refund Reports</strong> and a notification will be sent to the Finance team for processing.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={handleProcessRefund}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Confirm Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ─────────────────────────────────────────────────────────────────── */}


      {/* ── Customer Profile Dialog ──────────────────────────────────────── */}
      <BookingCustomerProfile
        open={isCustomerProfileOpen}
        onClose={() => setIsCustomerProfileOpen(false)}
        customer={selectedCustomer}
      />

    </div>
  );
}