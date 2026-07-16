/**
 * BookingEditView.tsx
 *
 * 2026-06-28 round 6.2.72 — refactored into a thin orchestrator.
 * Pre-6.2.72 this file was a 1536-line monolith with internal state
 * for every form field. Round 6.2.72 extracted 11 section components
 * into `./booking/sections/` (`EditSectionFlight`, `EditSectionPassengers`,
 * `EditSectionNFGs`, `EditSectionPhysicalResource`, `EditSectionGuestCounts`,
 * `EditSectionAddons`, `EditSectionLimoStops`,
 * `EditSectionWheelchair`, `EditSectionStaff`, `EditSectionAccountInfo`).
 *
 * 2026-06-28 (round 6.2.75, Phase B — Create parity) — the
 * pre-6.2.75 `EditSectionBooleanAddons` is deleted; its 6
 * boolean toggles are folded into `EditSectionAddons` (the
 * unified card). This legacy orchestrator now renders
 * `EditSectionAddons` once instead of the two-card split.
 *
 * This file now:
 *   1. Holds lifted state via a single `useState<BookingFormData>`.
 *   2. Has useEffects that re-slice passengers[] / nonFlyingGuestsList[]
 *      arrays when per-kind counts change (round 6.2.7 invariant).
 *   3. Has `validateCompleteness` (round 6.2.65 gate) + `handleSave`.
 *   4. Renders the section components in order; reads/sets via
 *      `formData` + `onFormChange` props (controlled inputs).
 *
 * Usage (unchanged from 6.2.71):
 *   <BookingEdit
 *     bookingId="123"
 *     initialData={...}             // BookingFormData | null
 *     staffOptions={...}            // EditStaffOption[]
 *     suiteOptions={...}            // EditSuiteOption[]
 *     onSave={(data) => ...}
 *     onCancel={() => ...}
 *     isSubmitting={false}
 *   />
 *
 * Pre-6.2.72 history:
 *  - 2026-06-28 round 6.2.71 Phase 2 — standalone edit page is the
 *    single edit surface; this form exposes 50+ fields.
 *  - 2026-06-08 round 6.2.6.1 — INV-11 rename (Transit in flightType).
 *  - 2026-06-11 round 6.2.35 — Phase 1.1 account info editable.
 *  - 2026-06-11 round 6.2.37 — Limo stops + passenger detail forms.
 *  - 2026-06-12 round 6.2.39 — 4-key CATALOG_ADDONS.
 *  - 2026-06-23 round 6.2.65 — VIP/NFG completeness gate.
 *  - 2026-06-23 round 6.2.7 — per-kind count re-slice useEffect.
 *  - 2026-06-24 round 6.2.66 — back-compat age group strings.
 */

import { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, X, User, Building2, MessageSquare,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  EditSectionAccountInfo,
  EditSectionFlight,
  EditSectionGuestCounts,
  EditSectionPassengers,
  EditSectionNFGs,
  EditSectionPhysicalResource,
  EditSectionLimoStops,
  EditSectionWheelchair,
  EditSectionAddons,
  EditSectionStaff,
} from './booking/sections';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EditFlightType   = 'Arrival' | 'Departure' | 'Transit';
export type EditFlightClass  = 'Economy Class' | 'Business Class' | 'First Class';
export type EditPaymentMode  = 'Upfront' | 'Net Upfront' | 'On-Credit' | 'Bulk Purchase/Monthly Invoice';
export type EditAccountType  = 'Individual' | 'Corporate' | 'Agency';
export type EditMembershipTier = 'Diamond' | 'Platinum' | 'Gold' | 'Sapphire';
export type EditBookingChannel = 'Online' | 'Email/Call to HKIAL';
// 2026-06-29 (round 6.2.78, Bug #4) — Status Management enums
// moved into the orchestrator's type surface so the BookingFormData
// interface can reference them. Re-typed locally here (instead of
// imported from BookingDetail.tsx) so the orchestrator's compile
// stays self-contained; they are the exact unions BookingDetail.tsx
// line 96-99 exports.
export type BookingStatusValue =
  | 'Pending for Review' | 'Pending for Approval' | 'Approved' | 'Confirmed'
  | 'Rejected' | 'Cancelled' | 'No-show';
export type PaymentStatusValue =
  | 'Not Required' | 'Pending' | 'Payment Link Sent' | 'Paid' | 'Overdue' | 'Refunded';

export interface EditPassenger {
  title: string;
  firstName: string;
  lastName: string;
  ageGroup: 'Adult (13+ years)' | 'Children (aged 2-11)' | 'Infants (under 2 years old)' | 'Child' | 'Infant' | '';
  birthdayDay?: string;
  birthdayMonth?: string;
  birthdayYear?: string;
  travelDocNo: string;
  membershipNo?: string;
  foodAllergies?: string;
}
export interface EditNonFlyingGuest {
  title: string;
  firstName: string;
  lastName: string;
  ageGroup: 'Adult (13+ years)' | 'Children (aged 2-11)' | 'Infants (under 2 years old)' | 'Child' | 'Infant' | '';
  foodAllergies?: string;
}

export interface EditLimoStop {
  id: number;
  type: 'Pick-up' | 'Destination';
  location: string;
}

export interface EditStaffOption {
  id: number;
  name: string;
  role: string;
}

export interface EditSuiteOption {
  id: number;
  name: string;
  kind: 'suite' | 'lounge';
}

// ── 3h booking-time rule (round 6.2.74) ───────────────────────────────────────
// Sky's directive: "The booking time not later than arrival time 3 hour,
// not ealier then departure them 3 hour". Parsing:
//   - booking_time ≤ arrival_time + 3h   (at most 3h AFTER flight arrives at HKG)
//   - booking_time ≥ departure_time - 3h (at least 3h BEFORE flight departs from HKG)
//
// For each flightType:
//   - Departure: only departure rule applies → [flightTime - 3h, flightTime]
//   - Arrival:   only arrival rule applies   → [flightTime, flightTime + 3h]
//   - Transit:   combined rule using leg1 (arrival at HKG) + leg2 (departure
//                from HKG) → [leg2 - 3h, leg1 + 3h]. Range always non-empty
//                due to the backend's 6h MAX transit rule (round 6.2.98).

export interface VisitTimeRange {
  /** HH:MM (00:00–23:59) — min bound for the visit time input. */
  min?: string;
  /** HH:MM (00:00–23:59) — max bound for the visit time input. */
  max?: string;
  /** User-facing error message when visitTime is out of range. */
  error?: string;
}

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function hhmmToMinutes(hhmm: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function minutesToHHMM(mins: number): string {
  // Wrap to [0, 1440) — handles cross-midnight arithmetic
  // (e.g., flightTime 23:30 + 3h = 02:30 next day).
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 2026-07-05 (round 6.2.104) — parse "YYYY-MM-DD" + "HH:MM" into
 *  absolute UTC minutes-since-epoch. Treats the date+time as UTC
 *  wall clock (no TZ adjustment) — the ±180min window is too short
 *  for any realistic TZ drift. Returns null on any parse failure
 *  so callers can fall back to the empty-range no-validation path. */
function dateTimeToAbsMinutes(date: string, time: string): number | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!dm) return null;
  const tm = /^(\d{2}):(\d{2})$/.exec(time);
  if (!tm) return null;
  return Math.floor(
    Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2]) / 60000,
  );
}

/**
 * Compute the valid visit-time range and a violation message for a booking
 * per Sky's 3h rule (see block comment above). Returns empty range when
 * `visitTime` / `visitDate` is unset OR any flight date+time field needed
 * for the rule is missing or invalid (caller can decide whether to gate save).
 *
 * 2026-07-05 (round 6.2.104) — widened to take `arrivalDate` / `visitDate` /
 * `leg2ArrivalDate` so the verdict compares absolute UTC minutes, fixing the
 * midnight-crossing bug where late-night Arrivals + next-morning visits
 * (and early-morning Departures + previous-night visits) were falsely
 * rejected by HH:MM-only comparison.
 */
export function computeVisitTimeRange(
  formData: Pick<
    BookingFormData,
    | 'flightType' | 'flightTime' | 'visitTime' | 'visitDate'
    | 'arrivalDate' | 'leg2FlightTime' | 'leg2ArrivalDate'
  >,
): VisitTimeRange {
  const visitDate = formData.visitDate;
  const visitTime = formData.visitTime;
  const flightTime = formData.flightTime;
  const flightType = formData.flightType;
  if (!visitTime || !HHMM_RE.test(visitTime)) return {};
  if (!visitDate) return {};
  if (!flightTime || !HHMM_RE.test(flightTime)) return {};
  const visitAbs = dateTimeToAbsMinutes(visitDate, visitTime);
  if (visitAbs === null) return {};

  if (flightType === 'Departure') {
    const arrivalDate = formData.arrivalDate;
    if (!arrivalDate) return {};
    const flightAbs = dateTimeToAbsMinutes(arrivalDate, flightTime);
    if (flightAbs === null) return {};
    const diff = visitAbs - flightAbs;
    const minMins = hhmmToMinutes(flightTime) - 180;
    const maxMins = hhmmToMinutes(flightTime);
    if (diff > 0) {
      return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins),
        error: `Visit time must be before flight departure (${minutesToHHMM(minMins)} – ${minutesToHHMM(maxMins)}).` };
    }
    if (diff < -180) {
      return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins),
        error: `Visit time must be at least 3h before flight departure (${minutesToHHMM(minMins)} – ${minutesToHHMM(maxMins)}).` };
    }
    return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins) };
  }

  if (flightType === 'Arrival') {
    const arrivalDate = formData.arrivalDate;
    if (!arrivalDate) return {};
    const flightAbs = dateTimeToAbsMinutes(arrivalDate, flightTime);
    if (flightAbs === null) return {};
    const diff = visitAbs - flightAbs;
    const minMins = hhmmToMinutes(flightTime);
    const maxMins = hhmmToMinutes(flightTime) + 180;
    if (diff < 0) {
      return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins),
        error: `Visit time must be after flight arrival (${minutesToHHMM(minMins)} – ${minutesToHHMM(maxMins)}).` };
    }
    if (diff > 180) {
      return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins),
        error: `Visit time must be within 3h after flight arrival (${minutesToHHMM(minMins)} – ${minutesToHHMM(maxMins)}).` };
    }
    return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins) };
  }

  if (flightType === 'Transit') {
    const arrivalDate = formData.arrivalDate;
    const leg2FlightTime = formData.leg2FlightTime;
    const leg2ArrivalDate = formData.leg2ArrivalDate;
    if (!arrivalDate || !leg2FlightTime || !HHMM_RE.test(leg2FlightTime) || !leg2ArrivalDate) return {};
    const leg1Abs = dateTimeToAbsMinutes(arrivalDate, flightTime);
    const leg2Abs = dateTimeToAbsMinutes(leg2ArrivalDate, leg2FlightTime);
    if (leg1Abs === null || leg2Abs === null) return {};
    const diffLeg1 = visitAbs - leg1Abs;
    const diffLeg2 = visitAbs - leg2Abs;
    const maxMins = hhmmToMinutes(flightTime) + 180;          // leg1 arrival + 3h
    const minMins = hhmmToMinutes(leg2FlightTime) - 180;      // leg2 departure - 3h
    if (diffLeg1 < 0) {
      return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins),
        error: `Visit time must be after 1st-leg arrival (${minutesToHHMM(minMins)} – ${minutesToHHMM(maxMins)}).` };
    }
    if (diffLeg1 > 180) {
      return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins),
        error: `Visit time must be within 3h after 1st-leg arrival (${minutesToHHMM(minMins)} – ${minutesToHHMM(maxMins)}).` };
    }
    if (diffLeg2 > 0) {
      return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins),
        error: `Visit time must be before 2nd-leg departure (${minutesToHHMM(minMins)} – ${minutesToHHMM(maxMins)}).` };
    }
    if (diffLeg2 < -180) {
      return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins),
        error: `Visit time must be at least 3h before 2nd-leg departure (${minutesToHHMM(minMins)} – ${minutesToHHMM(maxMins)}).` };
    }
    return { min: minutesToHHMM(minMins), max: minutesToHHMM(maxMins) };
  }

  return {};
}

export interface BookingFormData {
  bookingNo: string;
  accountType: EditAccountType;
  accountNo: string;
  guestName: string;
  companyName?: string;
  agencyName?: string;
  flightType: EditFlightType;
  flightNo: string;
  flightTime: string;
  flightOrigin?: string;
  flightDestination?: string;
  flightClass?: EditFlightClass;
  /** 2026-07-05 (round 6.2.104) — flight date for the 1st leg. For
   *  Arrival flights this is the arrival date; for Departure flights
   *  this is the departure date; for Transit flights this is the
   *  1st-leg (inbound to HKG) date. Optional: callers leave it
   *  undefined when the date hasn't been entered yet, and the
   *  helper returns `{}` (no validation) in that case. */
  arrivalDate?: string;
  leg2ArrivalDate?: string;
  leg2FlightNo?: string;
  leg2FlightTime?: string;
  leg2FlightClass?: EditFlightClass;
  leg2Destination?: string;
  visitDate: string;
  visitTime: string;
  suite: string;
  assignedSuiteIds?: number[];
  assignedLoungeIds?: number[];
  numberOfLuggage?: number;
  numberOfGuests: number;
  nonFlyingGuests: number;
  numPremiereSuites: number;
  vipPassengersInPremiereSuite: number;
  nonFlyingGuestsInPremiereSuite: number;
  vipPassengersInLoungeDeluxe: number;
  nonFlyingGuestsInLoungeDeluxe: number;
  passengers: EditPassenger[];
  nonFlyingGuestsList: EditNonFlyingGuest[];
  hasLimousine: boolean;
  hasShopping: boolean;
  hasWheelchair: boolean;
  hasSecurity: boolean;
  hasPrivateSales: boolean;
  isAdHoc: boolean;
  // 2026-06-28 (round 6.2.75, Phase B — Create parity) —
  // Lounge Extension + qty stepper. Create form has had these
  // since round 6.2.20; Edit form was missing them. The
  // parent wrapper's PUT submit had been hardcoding
  // `hasLoungeExtension: false, loungeExtensionQty: 0`, which
  // silently wiped any pre-existing Lounge Extension item
  // whenever the staff saved an edit. Surface both fields
  // here so the unified EditSectionAddons can drive them
  // and the wrapper can pass them through to
  // `buildAddonsItems({hasLoungeExtension, loungeExtensionQty})`.
  hasLoungeExtension: boolean;
  loungeExtensionQty: number;
  limoStops: EditLimoStop[];
  wheelchairPassenger: string;
  selectedAddonKeys: string[];
  /** 2026-07-16 — Lane B catalog picks (qty-only). */
  catalogAddonSelections?: Array<{ name: string; quantity: number }>;
  assignedStaffIds: number[];
  paymentMode: EditPaymentMode;
  specialRequests?: string;
  membershipTier?: EditMembershipTier;
  accountDiscountPct?: number;
  /**
   * Round 6.2.139 — opt-in for free LD entry / free PS upgrade on edit reprice.
   */
  useMembershipLdFree?: boolean;
  useMembershipPsFree?: boolean;
  /** Display-only remaining quotas from the account (edit membership card). */
  ldEntriesRemaining?: number | null;
  psFreeUpgradesRemaining?: number | null;
  // 2026-06-29 (round 6.2.80, Bug #6 / Pilot 2 Bug 3) — FK to
  // `promo_codes.id` (top-level column on `bookings`, NOT
  // the legacy `advanced_details.account.promoApplied` nested
  // block). The wrapper's `handleMasterSave` writes this
  // as `promo_code_id` in the top-level PUT body; the backend
  // `BookingController::update` validator accepts it as
  // `sometimes|nullable|exists:promo_codes,id`. The legacy
  // `promoCode?: string` field below is retained for
  // backward-compat with admin-created bookings that pre-date
  // round 6.2.80 (the wrapper still writes it to
  // `advanced_details.account.promoApplied.code` in
  // `handleMasterSave`). New code should populate
  // `promoCodeId` from `mapBookingFromApi.promoCodeId` and
  // let the legacy field stay empty.
  promoCodeId?: number | null;
  promoCode?: string;
  promoDiscountPct?: number;
  accountRemark?: string;
  bookingChannel?: EditBookingChannel;
  // 2026-06-28 (round 6.2.77) — Contact Person save follow-up.
  // The detail page's Contact Person card was display-only after
  // the round 6.2.76 regionCode split fix; user edits did not
  // reach `formData`, so the master Save PUT silently dropped
  // them. Add these 5 fields so onFormChange patches flow into
  // the lifted state and the master Save handler's
  // `advanced_details.contact` block (parent BookingDetail.tsx
  // handleMasterSave) includes the edited values. `regionCode`
  // + `contactNo` are kept separate on the wire (the API stores
  // `contactNo` as a single string `${regionCode} ${contactNo}`
  // — see CreateBooking.tsx:1111-1113 + the parent wrapper's
  // assemble logic).
  contactName?: string;
  contactEmail?: string;
  regionCode?: string;
  contactNo?: string;
  contactMemo?: string;
  // 2026-06-29 (round 6.2.78, Bug #4) — Status Management card
  // wires through the master Save. The 3 controls (Booking
  // Status dropdown / Payment Status dropdown / Status Update
  // Reason textarea) use the figma-ui display-string enum
  // (`'No-show'`, `'Payment Link Sent'`, etc.); the parent
  // wrapper's `handleMasterSave` maps them to the backend
  // PascalCase wire format (`'NoShow'`, `'PaymentLinkSent'`)
  // before the PUT. Pre-6.2.78 these lived only in figma-ui
  // local useState and were never persisted.
  status: BookingStatusValue;
  paymentStatus: PaymentStatusValue;
  rejectionReason?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface BookingEditProps {
  bookingId?: string;
  initialData?: BookingFormData | null;
  staffOptions?: EditStaffOption[];
  suiteOptions?: EditSuiteOption[];
  onSave?: (data: BookingFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// ── MOCK default (still here for demo / dev preview) ──────────────────────────

const MOCK_BOOKING_FORM: BookingFormData = {
  bookingNo:        'A-202604-000001',
  accountType:      'Individual',
  accountNo:        'ACC-2026-0101',
  guestName:        'James Hoffmann',
  flightType:       'Departure',
  flightNo:         'CX234',
  flightTime:       '12:30',
  flightOrigin:     'HKG',
  flightDestination: 'NRT',
  flightClass:      'Business Class',
  visitDate:        '2026-04-15',
  visitTime:        '09:00',
  suite:            'Premier Suite A',
  assignedSuiteIds: [],
  assignedLoungeIds: [],
  numberOfLuggage:  1,
  numberOfGuests:   2,
  nonFlyingGuests:  0,
  numPremiereSuites: 1,
  vipPassengersInPremiereSuite: 1,
  nonFlyingGuestsInPremiereSuite: 0,
  vipPassengersInLoungeDeluxe: 1,
  nonFlyingGuestsInLoungeDeluxe: 0,
  passengers: [
    { title: 'Mr', firstName: 'James', lastName: 'Hoffmann', ageGroup: 'Adult (13+ years)', travelDocNo: 'P1234567', membershipNo: 'CX-DIA-001' },
    { title: 'Mrs', firstName: 'Sarah', lastName: 'Hoffmann', ageGroup: 'Adult (13+ years)', travelDocNo: 'P7654321' },
  ],
  nonFlyingGuestsList: [],
  hasLimousine:     true,
  hasShopping:      false,
  hasWheelchair:    false,
  hasSecurity:      false,
  hasPrivateSales:  false,
  isAdHoc:          false,
  hasLoungeExtension: false,
  loungeExtensionQty: 1,
  limoStops:        [{ id: 1, type: 'Pick-up', location: 'HKG Terminal 1' }],
  wheelchairPassenger: '',
  selectedAddonKeys: [],
  catalogAddonSelections: [],
  assignedStaffIds: [],
  paymentMode:      'Upfront',
  specialRequests:  '',
  // 2026-06-29 (round 6.2.78, Bug #4) — defaults for the Status
  // Management card. Match the backend's seeded default values
  // (`status: PendingForReview`, `payment_status: Pending`) mapped
  // to the figma-ui display-string enum.
  status: 'Pending for Review',
  paymentStatus: 'Pending',
  rejectionReason: '',
  // 2026-06-29 (round 6.2.80, Bug #6 / Pilot 2 Bug 3) —
  // default the new `promoCodeId` FK to `null` (no code
  // attached). The MOCK booking has no promo code; the
  // EditSectionAccountInfo card's new `<Select>` (added
  // round 6.2.80) renders the placeholder when this is
  // null. Legacy `promoCode` string is also empty here (the
  // wrapper's `bookingToFormData` seeds it from
  // `booking.promoCode?.code ?? ''` on real bookings).
  promoCodeId: null,
};

// ── VIP/NFG completeness gate helpers (round 6.2.65) ──────────────────────────

function getMissingPassengerFields(p: EditPassenger): string[] {
  const missing: string[] = [];
  if (!p.title) missing.push('Title');
  if (!p.firstName) missing.push('First Name');
  if (!p.lastName) missing.push('Last Name');
  if (!p.ageGroup) missing.push('Age Group');
  if (!p.travelDocNo) missing.push('Travel Doc No.');
  return missing;
}
function getMissingNfgFields(g: EditNonFlyingGuest): string[] {
  const missing: string[] = [];
  if (!g.title) missing.push('Title');
  if (!g.firstName) missing.push('First Name');
  if (!g.lastName) missing.push('Last Name');
  if (!g.ageGroup) missing.push('Age Group');
  return missing;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingEdit({
  bookingId,
  initialData,
  staffOptions = [],
  suiteOptions = [],
  onSave      = () => {},
  onCancel    = () => {},
  isSubmitting = false,
}: BookingEditProps) {
  const seed = initialData ?? MOCK_BOOKING_FORM;

  // 2026-06-28 round 6.2.72 — LIFTED STATE. Single useState
  // replaces the 30+ individual useStates from pre-6.2.72.
  // Sections are controlled components; onFormChange merges
  // patches via shallow Object.assign.
  const [formData, setFormData] = useState<BookingFormData>(seed);
  const onFormChange = (patch: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  };

  // 2026-06-23 round 6.2.7 — re-count useEffect for VIP passengers.
  // When the admin changes a per-kind VIP count, the passenger
  // array is sliced / padded to match. Order is [PS VIPs..., LD VIPs...]
  // (create form's invariant). The parent wrapper's `handleSave`
  // splits the array back into `suite_passengers[]` +
  // `lounge_suite_passengers[]` using the round 6.2.68 order-based
  // partition.
  useEffect(() => {
    const targetVipCount = formData.vipPassengersInPremiereSuite + formData.vipPassengersInLoungeDeluxe;
    setFormData(prev => {
      if (prev.passengers.length === targetVipCount) return prev;
      if (prev.passengers.length > targetVipCount) {
        return { ...prev, passengers: prev.passengers.slice(0, targetVipCount) };
      }
      return {
        ...prev,
        passengers: [
          ...prev.passengers,
          ...Array.from({ length: targetVipCount - prev.passengers.length }, () => ({
            title: '',
            firstName: '',
            lastName: '',
            ageGroup: '' as const,
            travelDocNo: '',
          })),
        ],
      };
    });
  }, [formData.vipPassengersInPremiereSuite, formData.vipPassengersInLoungeDeluxe]);

  // 2026-06-23 round 6.2.7 — re-count useEffect for NFGs.
  useEffect(() => {
    const targetNfgCount = formData.nonFlyingGuestsInPremiereSuite + formData.nonFlyingGuestsInLoungeDeluxe;
    setFormData(prev => {
      if (prev.nonFlyingGuestsList.length === targetNfgCount) return prev;
      if (prev.nonFlyingGuestsList.length > targetNfgCount) {
        return { ...prev, nonFlyingGuestsList: prev.nonFlyingGuestsList.slice(0, targetNfgCount) };
      }
      return {
        ...prev,
        nonFlyingGuestsList: [
          ...prev.nonFlyingGuestsList,
          ...Array.from({ length: targetNfgCount - prev.nonFlyingGuestsList.length }, () => ({
            title: '',
            firstName: '',
            lastName: '',
            ageGroup: '' as const,
          })),
        ],
      };
    });
  }, [formData.nonFlyingGuestsInPremiereSuite, formData.nonFlyingGuestsInLoungeDeluxe]);

  // 2026-06-23 round 6.2.65 — VIP/NFG completeness gate.
  // Validate before saving. Returns the first 3 incomplete
  // passengers / NFGs and aggregates the rest into an
  // "...and N more" suffix. The slice order matches the create
  // form's invariant [PS VIPs..., LD VIPs..., PS NFGs..., LD NFGs...]
  // so "#N" matches what the admin sees in the form.
  const validateCompleteness = (data: BookingFormData): { ok: true } | { ok: false; message: string } => {
    const incomplete: string[] = [];
    const psPax = data.passengers.slice(0, data.vipPassengersInPremiereSuite);
    const ldPax = data.passengers.slice(data.vipPassengersInPremiereSuite, data.vipPassengersInPremiereSuite + data.vipPassengersInLoungeDeluxe);
    [...psPax, ...ldPax].forEach((p, i) => {
      const missing = getMissingPassengerFields(p);
      if (missing.length > 0) {
        const name = [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || `Passenger ${i + 1}`;
        incomplete.push(`#${i + 1} ${name} — missing ${missing.join(', ')}`);
      }
    });
    const psNfg = data.nonFlyingGuestsList.slice(0, data.nonFlyingGuestsInPremiereSuite);
    const ldNfg = data.nonFlyingGuestsList.slice(data.nonFlyingGuestsInPremiereSuite, data.nonFlyingGuestsInPremiereSuite + data.nonFlyingGuestsInLoungeDeluxe);
    [...psNfg, ...ldNfg].forEach((g, i) => {
      const missing = getMissingNfgFields(g);
      if (missing.length > 0) {
        const name = [g.title, g.firstName, g.lastName].filter(Boolean).join(' ') || `NFG ${i + 1}`;
        incomplete.push(`#${i + 1} ${name} — missing ${missing.join(', ')}`);
      }
    });
    if (incomplete.length === 0) return { ok: true };
    const sample = incomplete.slice(0, 3);
    const extra = incomplete.length - sample.length;
    const suffix = extra > 0 ? `…and ${extra} more` : '';
    return { ok: false, message: `Please complete all VIP Passenger / NFG info (${incomplete.length} of ${data.passengers.length + data.nonFlyingGuestsList.length} incomplete).\n${sample.join('\n')}${suffix ? '\n' + suffix : ''}` };
  };

  const handleSave = () => {
    const validation = validateCompleteness(formData);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }
    onSave(formData);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="flex items-center gap-2">
              Edit Booking
              {bookingId && (
                <Badge className="bg-blue-100 text-blue-700 text-sm ml-1">{seed.bookingNo}</Badge>
              )}
            </h1>
            <p className="text-gray-500 mt-0.5">Modify booking details below. Changes will be saved after clicking "Save Changes".</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="w-4 h-4 mr-1.5" /> Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Account info (read-only summary) */}
      <Card className="p-5">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Account Information
        </h3>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <label className="block text-gray-500 mb-[10px]">Account No.</label>
            <p className="font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded border">{seed.accountNo}</p>
          </div>
          <div>
            <label className="block text-gray-500 mb-[10px]">Guest Name</label>
            <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded border">{seed.guestName}</p>
          </div>
          <div>
            <label className="block text-gray-500 mb-[10px]">Account Type</label>
            <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded border">{seed.accountType}</p>
          </div>
          {seed.companyName && (
            <div>
              <label className="block text-gray-500 mb-[10px]">Company</label>
              <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded border flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />{seed.companyName}
              </p>
            </div>
          )}
          {seed.agencyName && (
            <div>
              <label className="block text-gray-500 mb-[10px]">Agency</label>
              <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded border">{seed.agencyName}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Account Settings (editable) */}
      <EditSectionAccountInfo formData={formData} onFormChange={onFormChange} />

      {/* Flight + Visit + Suite + Payment (editable) */}
      <EditSectionFlight formData={formData} onFormChange={onFormChange} />

      {/* Per-kind guest counts (editable, drives pricing) */}
      <EditSectionGuestCounts formData={formData} onFormChange={onFormChange} />

      {/* Per-passenger detail forms (gated on row count > 0) */}
      <EditSectionPassengers formData={formData} onFormChange={onFormChange} />

      {/* Per-NFG detail forms (gated on row count > 0) */}
      <EditSectionNFGs formData={formData} onFormChange={onFormChange} />

      {/* Physical resource grid (PS + LD checkboxes) */}
      <EditSectionPhysicalResource
        formData={formData}
        onFormChange={onFormChange}
        suiteOptions={suiteOptions}
      />

      {/* Limousine stops editor */}
      <EditSectionLimoStops formData={formData} onFormChange={onFormChange} />

      {/* Wheelchair recipient (gated on hasWheelchair) */}
      <EditSectionWheelchair formData={formData} onFormChange={onFormChange} />

      {/* Unified Add-on Services card (Create parity per Sky 2026-06-28,
          round 6.2.75 Phase B). Replaces the pre-6.2.75 split between
          `EditSectionBooleanAddons` (6 boolean toggles) + `EditSectionAddons`
          (4-key CATALOG_ADDONS checkboxes). Chips + searchable dropdown over
          CATALOG_ADDONS + Lounge Extension qty stepper + isAdHoc standalone
          toggle. */}
      <EditSectionAddons formData={formData} onFormChange={onFormChange} />

      {/* In-Charge Staff multi-select */}
      <EditSectionStaff
        formData={formData}
        onFormChange={onFormChange}
        staffOptions={staffOptions}
      />

      {/* Special requests */}
      <Card className="p-5">
        <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Special Requests
        </h3>
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Notes for lounge staff</label>
          <textarea
            rows={4}
            value={formData.specialRequests ?? ''}
            onChange={e => onFormChange({ specialRequests: e.target.value })}
            placeholder="e.g. Birthday celebration, kosher meal required, guest requires extra privacy…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
          />
        </div>
      </Card>

      {/* Bottom action bar */}
      <div className="flex justify-end gap-3 pb-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="w-4 h-4 mr-1.5" /> Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

    </div>
  );
}