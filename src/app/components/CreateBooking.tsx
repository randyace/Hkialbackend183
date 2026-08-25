import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, Plus, BadgePercent, Building2, CheckCircle, Info, Tag,
  AlertCircle, Plane, Car, ShoppingBag, Accessibility, ShieldCheck,
  Star, User, Mail, Phone, MessageSquare, Luggage, MapPin,
  X, CreditCard, RotateCcw, ChevronDown, ChevronUp, Clock,
  Search, FileText, DollarSign, Minus, Loader2
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
// 2026-06-12 (round 6.2.39, M11 fix) — import the shared
// catalog of add-on services. The pre-6.2.39 hardcoded
// CREATE_ADDON_SERVICES (4 items) is replaced by this import.
// CATALOG_ADDON_MAP was never exported from addons.tsx (dead import
// residual from 6.2.39). Only CATALOG_ADDONS is the shared catalog.
import { CATALOG_ADDONS } from './addons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { toast } from 'sonner@2.0.3';
// 2026-06-28 (round 6.2.74) — Sky's 3h booking-time rule. The helper
// computes the valid visitTime range + an error message; reused by
// EditSectionFlight in the admin edit page.
import { computeVisitTimeRange } from './BookingEditView';
import { NationalityTypeahead, isValidCountryCode } from '../../../../../components/NationalityTypeahead';
import { AirportTypeahead } from '../../../../../components/AirportTypeahead';
import { REGION_CODES as FALLBACK_REGION_CODES } from '../../../../../utils/regionCodes';
import { sanitizeEnglishName } from '../../../../../utils/englishName';
// Round 6.2.30 (2026-06-10) — `Shuffle` icon import removed.
// It was only used by the Quick Fill Demo button, which
// was removed in the same commit (both here in the
// figma-ui submodule and the wrapper's `handleQuickFill`
// function). If a local dev demo button is ever re-added,
// restore the import.

// ── Constants ─────────────────────────────────────────────────────────────────

const TRAVEL_AGENCY_LIST = [
  { name: 'Wings Travel Agency', code: 'TA-WG-001', discountRate: 15, paymentMethod: 'On-Credit'                   },
  { name: 'EGL Tours',           code: 'TA-EG-001', discountRate: 20, paymentMethod: 'Bulk Purchase/Monthly Invoice'},
  { name: 'Hong Thai Travel',    code: 'TA-HT-001', discountRate: 10, paymentMethod: 'Upfront'                      },
  { name: 'Wing On Travel',      code: 'TA-WO-001', discountRate: 12, paymentMethod: 'On-Credit'                   },
  { name: 'Klook Travel',        code: 'TA-KL-001', discountRate:  8, paymentMethod: 'Upfront'                      },
  { name: 'CTrip Hong Kong',     code: 'TA-CT-001', discountRate: 18, paymentMethod: 'Bulk Purchase/Monthly Invoice'},
  { name: 'Jetour Holidays',     code: 'TA-JT-001', discountRate:  5, paymentMethod: 'Upfront'                      },
];

const SUITE_OPTIONS: string[] = [];

const SUITE_RATES: Record<string, number> = {};


const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Round 6.2.136 — Individual membership has NO tier % discount.
// Benefits are free LD entries + free PS upgrades (see accounts.ld_entries_remaining
// / ps_free_upgrades_remaining). The old MEMBERSHIP_DISCOUNT map
// (Gold 5 / Platinum 8 / Diamond 12 / Sapphire 15) was mock UI data and
// incorrectly auto-filled Account Discount. Removed.

function formatMembershipQuota(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value === -1) return 'Unlimited';
  return String(value);
}

// Auto-generate a booking number preview
const now = new Date();
const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
const BOOKING_SEQ = String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');

// ── Time5MinSelect (port from customer NewBooking.tsx, round 6.2.121) ──────

/**
 * Two-column HH:MM time picker with a fixed 5-minute step on the minute
 * column. Built from native `<select>` elements so the browser renders ONLY
 * the options we provide — Chrome/Safari's native `<input type="time">`
 * picker ignores `step={300}` and still shows all 60 minutes, and Safari /
 * Firefox also have edge cases with the native picker's `min` / `max`
 * enforcement (the visit-time `min`/`max` setter on the native input was
 * what Sky flagged as "not working fine in safari and firefox").
 *
 * Ported byte-for-byte from the customer-side `NewBooking.tsx::Time5MinSelect`
 * (frontend/src/components/figma-ui/src/app/components/NewBooking.tsx:375)
 * at Sky's request on 2026-07-07. Same shape, same `HH:MM` wire value so
 * the parent wrapper `flightTime` / `visitTime` destructure at
 * `hkial-react/src/components/CreateBooking.tsx:804` works unchanged.
 *
 * Inlined here (instead of imported from a parent-tree component) per
 * INV-X1 — figma-ui files must keep working when Sky copies them back into
 * the Figma Make code base, which has no access to hkial-react/src/components.
 *
 * Adoption sites in this file:
 *   - leg 1 Flight Time (STD/STA)
 *   - leg 2 Flight Time (Transit only)
 *   - Visit Time (replaces the native picker's `min`/`max` UX; the 3h rule
 *     is still enforced via `visitTimeRangeError` + red border + the
 *     master submit-disabled gate at line 3163)
 */
const TIME5MIN_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const TIME5MIN_MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

/** Inner selects are visually transparent so the wrapper's border/background
 *  shows through. They split the row equally via `flex-1`. */
const TIME5MIN_SELECT_CLS =
  'flex-1 min-w-0 bg-transparent border-0 outline-none text-sm cursor-pointer appearance-none text-center px-2 py-0';

function Time5MinSelect({
  value,
  onChange,
  required,
  wrapperClassName,
  wrapperStyle,
  testId,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
  testId?: string;
  id?: string;
}) {
  // Parse `HH:MM` defensively (mirrors the parent-tree Time5MinSelect).
  // Empty / malformed → both columns empty so the disabled `HH`/`MM`
  // placeholder is shown rather than a stale `00`.
  let safeH = '';
  let safeM = '';
  if (value && value.includes(':')) {
    const [hStr = '', mStr = ''] = value.split(':');
    const hNum = Number(hStr);
    const mNum = Number(mStr);
    if (Number.isFinite(hNum) && Number.isFinite(mNum)) {
      safeH = hStr.padStart(2, '0');
      safeM = mStr.padStart(2, '0').slice(0, 2);
    }
  }
  return (
    <div
      id={id}
      className={`flex items-center gap-2 ${wrapperClassName ?? ''}`}
      style={wrapperStyle}
      data-testid={testId}
      data-hkial-time-5min-select
    >
      <select
        aria-label="Hour"
        value={safeH}
        onChange={(e) => onChange(`${e.target.value}:${safeM || '00'}`)}
        required={required}
        className={TIME5MIN_SELECT_CLS}
      >
        <option value="" disabled hidden>HH</option>
        {TIME5MIN_HOURS.map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <span className="opacity-60 text-sm select-none">:</span>
      <select
        aria-label="Minute"
        value={safeM}
        onChange={(e) => onChange(`${safeH || '00'}:${e.target.value}`)}
        required={required}
        className={TIME5MIN_SELECT_CLS}
      >
        <option value="" disabled hidden>MM</option>
        {TIME5MIN_MINUTES.map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  );
}

const DATE_INPUT_BASE_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';

function dateInputClassName(value: string): string {
  return value
    ? `${DATE_INPUT_BASE_CLASS} bg-white`
    : `${DATE_INPUT_BASE_CLASS} bg-[#ececec]`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PassengerTitle = 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Dr' | 'Prof' | '';
type AgeGroup = 'Adults (aged 12 and above)' | 'Children (aged 2-11)' | 'Infants (under 2 years old)' | '';
type MembershipTier = 'Gold' | 'Platinum' | 'Diamond' | 'Sapphire';
type PaymentMode = 'Upfront' | 'Net Upfront' | 'On-Credit' | 'Bulk Purchase/Monthly Invoice';
type FlightClass = 'Economy Class' | 'Business Class' | 'First Class';
type FlightType = 'Arrival' | 'Departure' | 'Transit';

interface PassengerDetail {
  title: PassengerTitle;
  firstName: string;
  lastName: string;
  travelDocNo: string;
  membershipNo: string;
  ageGroup: AgeGroup;
  birthdayDay: string;
  birthdayMonth: string;
  birthdayYear: string;
  // 2026-06-25 — round 6.2.63 (bug 3): add per-passenger food
  // allergies so the create-booking form can capture them at
  // submission time (the detail/edit view at BookingDetail.tsx
  // already has the field; the create form was the missing
  // surface). The backend's `passengers` JSON column accepts
  // arbitrary keys — `foodAllergies` was already wired on the
  // read path in `bookingService.ts:883` (which maps
  // `passenger.foodAllergies ?? ''` from the AD blob). The
  // pre-6.2.63 create form was the only surface that didn't
  // collect it, so admin-created bookings were missing the
  // allergy even when the customer provided it on the
  // customer-side newbooking flow.
  foodAllergies: string;
  /** ISO 3166-1 alpha-2 (mandatory). */
  nationality: string;
}

interface NonFlyingGuest {
  title: PassengerTitle;
  firstName: string;
  lastName: string;
  ageGroup: AgeGroup;
  /** Exact age (2–11) when ageGroup is Children (aged 2-11). */
  age?: number | '';
  // 2026-06-25 — round 6.2.63 (bug 3): same as PassengerDetail.
  foodAllergies: string;
  /** ISO 3166-1 alpha-2 (mandatory). */
  nationality: string;
}

interface LimoStop {
  id: number;
  type: 'Pick-up' | 'Destination';
  location: string;
}

const emptyPassenger = (): PassengerDetail => ({
  title: '', firstName: '', lastName: '', travelDocNo: '',
  membershipNo: '', ageGroup: '', birthdayDay: '', birthdayMonth: '', birthdayYear: '',
  foodAllergies: '',
  nationality: '',
});

const emptyNonFlying = (): NonFlyingGuest => ({
  title: '', firstName: '', lastName: '', ageGroup: '',
  foodAllergies: '',
  nationality: '',
});

const isPassengerFilled = (p: PassengerDetail) =>
  !!(p.title || p.firstName || p.lastName || p.travelDocNo || p.ageGroup || p.birthdayDay);

// ── MOCK constants (already module-scoped above: TRAVEL_AGENCY_LIST, SUITE_OPTIONS etc.) ──

export interface BookingFormData {
  accountType: string;
  accountNumber: string;
  guestName: string;
  flightNo: string;
  flightTime: string;
  // 2026-06-08 round 6.2.2 — I-T-N1: add `arrivalDate` (the flight's
  // date) to the formData shape. Previously the figma-ui view kept
  // this in local state (`arrivalDate` useState, line 306) but never
  // emitted it to the wrapper. For Transit bookings, the wrapper's
  // payload builder reads `arrivalDate` for `legs[0].arrivalDate`;
  // with the field missing the wrapper's own useState stayed `''`
  // forever → `legs[0].arrivalDate = undefined` → backend 422
  // "Leg 0.arrivalDate is required for Transit bookings." Now in
  // the formData shape so the wrapper can read it.
  arrivalDate?: string;
  visitDate: string;
  visitTime: string;
  numberOfGuests: number;
  paymentMode: string;
  selectedAddonKeys: string[];
  assignedSuiteIds: number[];
  assignedLoungeIds: number[];
  // 2026-06-08 — Transit 2nd-leg fields. The figma-ui view emits
  // undefined when flightType !== 'Transit' so the wrapper can
  // drop them from the payload.
  leg2ArrivalDate?: string;
  leg2FlightNo?: string;
  leg2FlightTime?: string;
  leg2FlightClass?: 'Economy Class' | 'Business Class' | 'First Class' | '';
  /**
   * 2026-06-10 — explicit Premiere Suite / Lounge Deluxe quantities
   * + per-section VIP / Non-Flying Guest counts. The wrapper reads
   * these for the POST `/bookings` payload
   * (`advanced_details.{premiere_suites, vip_ps, vip_ld, ...}`).
   * Mirror of the same fields the figma-ui view pushes through
   * `onAddonStateChange` for the live `usePricePreview`.
   */
  numPremiereSuites: number;
  numLoungeDeluxe: number;
  vipPS: number;
  nonFlyingPS: number;
  vipLD: number;
  nonFlyingLD: number;
  /**
   * 2026-06-23 — Region code (e.g. '852') for the contact person
   * phone number. The form renders this as a typeahead
   * `<RegionCodeCombobox>` (sourced from
   * `GET /api/lookups/region-codes` via the wrapper's
   * `regionCodes` prop). The number part is filtered to digits +
   * '-' only via `filterContactNumber`. The wrapper combines the
   * two with a single space for `guest_phone` on submit
   * (e.g. `852 91234567`), matching the existing AccountCreation
   * phone format.
   */
  regionCode: string;
  /**
   * 2026-06-08 — pre-validated 6h gap error string. When the form
   * detects legs[1].arrivalDate - legs[0].arrivalDate < 6h, the
   * submit button is disabled and this message is rendered inline.
   * The wrapper surfaces it back to the user; the backend's
   * TransitLegsRule is the source of truth.
   */
  transitGapError?: string | null;
  /**
   * 2026-06-09 — staff-editable Account Discount override. `undefined`
   * = no override (use the tier/agency default); a number = percent.
   * The wrapper reads it for `advanced_details.account.accountDiscountPct`.
   */
  accountDiscountPct?: number;
  /**
   * Round 6.2.139 — use free LD entry / free PS upgrade credits.
   * Default true when eligible. false = charge without burning that credit.
   */
  useMembershipLdFree?: boolean;
  useMembershipPsFree?: boolean;
}

// ── Account searcher ───────────────────────────────────────────────────────────

interface AccountOption {
  id: number;
  accountNumber: string;
  name: string;
  type: 'Individual' | 'Corporate' | 'Agency';
}

// ── Props interface ───────────────────────────────────────────────────────────
/**
 * Dev Quick Fill apply API (wired from admin wrapper `__dev__`).
 * Delete this type + `renderDevQuickFill` prop with the `__dev__` folder before pentest.
 */
export interface CreateBookingDevQuickFillPayload {
  premiereSuiteQty: number;
  premiereVipQty: number;
  loungeVipQty: number;
  assignedPhysicalSuites: string[];
  assignedLobbySeats: string[];
  accountType: 'Individual' | 'Corporate' | 'Agency' | '';
  accountNumber: string;
  paymentMode: 'Upfront' | 'Net Upfront' | 'On-Credit' | 'Bulk Purchase/Monthly Invoice' | '';
  flightType: 'Arrival' | 'Departure' | 'Transit';
  departureDate: string;
  flightNo: string;
  flightTime: string;
  visitDate: string;
  visitTime: string;
  passengerTitle: 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Dr' | 'Prof' | '';
  passengerFirstName: string;
  passengerLastNameTemplate: string;
  passengerTravelDocNo: string;
  passengerAgeGroup:
    | 'Adults (aged 12 and above)'
    | 'Children (aged 2-11)'
    | 'Infants (under 2 years old)'
    | '';
  passengerBirthdayDay: string;
  passengerBirthdayMonth: string;
  passengerBirthdayYear: string;
  passengerNationality: string;
}

export interface CreateBookingDevQuickFillRenderApi {
  apply: (payload: CreateBookingDevQuickFillPayload) => void;
  accountSearchResults?: AccountOption[];
  accountSearchLoading?: boolean;
  onAccountSearch?: (query: string) => void;
  onAccountSelect?: (account: AccountOption) => void;
  setShowAccountDropdown?: (open: boolean) => void;
}

export interface CreateBookingProps {
  // 2026-06-30 — hide Transit option in the Flight Type 3-way toggle
  // + the 2nd-leg block + the Transit-only Destination "optional"
  // hint. Default true (backward-compat). Wrapper (admin
  // CreateBooking.tsx) passes false per Sky's directive.
  showTransit?: boolean;
  /**
   * RFQ B8 — when false, hide passenger/NFG food-allergy inputs and
   * de-emphasize dietary copy in special requests. Default true.
   * Driven by booking_settings.show_dietary_fields.
   */
  showDietaryFields?: boolean;
  /**
   * Dev-only slot under Booking No. Provided by the admin wrapper when
   * the signed-in email is on the `__dev__` allowlist. Remove before pentest.
   */
  renderDevQuickFill?: (api: CreateBookingDevQuickFillRenderApi) => React.ReactNode;
  onSubmit?: (data: BookingFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  accountSearchResults?: AccountOption[];
  accountSearchLoading?: boolean;
  showAccountDropdown?: boolean;
  setShowAccountDropdown?: (open: boolean) => void;
  onAccountSearch?: (query: string) => void;
  onAccountSelect?: (account: AccountOption) => void;
  onAccountClear?: () => void;
  onGuestSearch?: (query: string) => void;
  onGuestSearchSelect?: (account: AccountOption) => void;
  /** undefined = not searched yet, [] = searched but empty, [...] = results */
  guestSearchResults?: AccountOption[] | undefined;
  guestSearchLoading?: boolean;
  showGuestDropdown?: boolean;
  setShowGuestDropdown?: (open: boolean) => void;
  selectedAccount?: {
    id: number;
    account_number: string;
    type: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone: string;
    membership_type?: string;
    company_name?: string;
    company?: Array<{
      id?: number;
      company_name?: string;
    }>;
    // Round 6.2.136 — Individual membership quotas (from Account.show).
    // null = not initialised / not a member; -1 LD = unlimited.
    ld_entries_remaining?: number | null;
    ps_free_upgrades_remaining?: number | null;
    // Round 6.2.143 / 2026-07-28 — TravelAgency / Corporate money credit.
    // available ≈ credit_balance − credit_on_hold (+ credit_limit when set).
    // Agency OnCredit: hold at create, capture at Approved (not spend-at-create).
    credit_balance?: number | string | null;
    credit_on_hold?: number | string | null;
    credit_limit?: number | string | null;
    // 2026-06-14 — round 6.2.37. Eager-loaded TravelAgency
    // relation from `AccountController::show()`. Single-element
    // array (HasMany) — usually `[{ agency_code, agency_name,
    // discount_rate, payment_method }]` for TravelAgency-typed
    // accounts, `[]` for Individual/Corporate, or `[]` if no
    // agency row is linked. Used to drive the read-only agency
    // label below (replaces the legacy Select dropdown that
    // was sourced from the hardcoded `TRAVEL_AGENCY_LIST`).
    travel_agency?: Array<{
      id: number;
      agency_code: string;
      agency_name: string;
      discount_rate?: number;
      payment_method?: string;
    }>;
  } | null;
  /**
   * Validate + apply a promo code via the parent (API).
   * When provided, the view is controlled: parent owns `promoApplied` /
   * `promoError` and the Apply button only forwards the typed code.
   * Without this prop the view keeps a local mock apply path.
   */
  onApplyPromo?: (code: string) => void | Promise<void>;
  /** Clear the applied promo (wrapper-owned when `onApplyPromo` is set). */
  onClearPromo?: () => void;
  /**
   * Wrapper-owned applied promo. Used when `onApplyPromo` is provided.
   * `benefit` is the secondary line (e.g. "15% off" or "Free lounge · …").
   */
  promoApplied?: {
    code: string;
    label: string;
    discountPct: number;
    benefit?: string;
    promoType?: string;
    freeSessions?: number | null;
  } | null;
  /** Wrapper-owned validate error string. */
  promoError?: string;
  /** Disable Apply while the wrapper's validate request is in flight. */
  promoValidating?: boolean;
  selectedAddonKeys?: string[];
  // Minted on POST. Empty on create so the header chip stays hidden.
  bookingNo?: string;
  /** Physical resources fetched by the wrapper from /api/suites. */
  physicalSuites?: Array<{ id: number; suite_name: string; capacity: number; kind: 'suite' | 'lounge' }>;
  physicalLounges?: Array<{ id: number; suite_name: string; capacity: number; kind: 'suite' | 'lounge' }>;
  /** Selected suite/lounge ids (owned by the wrapper, synced both ways). */
  assignedSuiteIds?: number[];
  setAssignedSuiteIds?: (ids: number[]) => void;
  assignedLoungeIds?: number[];
  setAssignedLoungeIds?: (ids: number[]) => void;
  liveBreakdown?: Array<{ key: string; label: string; qty: number; unit_price: number; subtotal: number }>;
  liveTotal?: number | null;
  liveRulesApplied?: string[];
  liveWarnings?: string[];
  /**
   * 2026-06-23 — Region codes for the Contact Person phone region
   * dropdown. Sourced from `GET /api/lookups/region-codes` by the
   * wrapper (same data path as AccountCreation). When the prop is
   * empty/undefined, the form falls back to a small hardcoded
   * list (HK/CN/US/UK) so the form is still usable in offline
   * mocks. Each entry is `{ code, name }`.
   */
  regionCodes?: { code: string; name: string }[];
  /**
   * HKIAL addons pricing fix round 5.3 (2026-06-05): the figma-ui
   * sub-module owns the addons state in its local useState (hasLimousine,
   * limoStops, hasShopping, hasWheelchair, wheelchairPassenger, hasSecurity,
   * hasPrivateSales), and the wrapper parent needs the live values to feed
   * `usePricePreview` so the in-form "Price Breakdown" card can show the
   * addon subtotal in real time. The wrapper can't reach the figma-ui
   * internal state directly, so we push every change out through this
   * callback. A single useEffect watches the 7 state vars and fires
   * `onAddonStateChange` whenever any of them change.
   *
   * IMPORTANT — submodule-handling note:
   *
   * This prop was added in a figma-ui sub-module commit on 2026-06-05
   * (round 5.3 of the addons-pricing fix). Because the HKIAL backend
   * repo does NOT commit the figma-ui sub-module pointer, this change
   * must be:
   *   (1) committed inside the figma-ui sub-module by you, the operator
   *       (Randy's figma-ui pipeline is automated and would clobber
   *       any in-submodule uncommitted change on the next sync);
   *   (2) pushed to the figma-ui origin;
   *   (3) the parent backend repo's `src/components/figma-ui` pointer
   *       then needs to be advanced to that new commit.
   * Until all three are done, the deployed form behaves as if this prop
   * does not exist: the live "Price Breakdown" card stays at the base
   * line (e.g. HKD 5,000 for one Lounge Deluxe booking) and does not
   * reflect the addons subtotal in real time. See
   * `HKIAL_BOOKING_ADDONS_PRICING_FIX_2026_06_05.md` Part 5.3 for the
   * full rationale.
   */
  onAddonStateChange?: (state: {
    hasLimousine: boolean;
    limoStops: LimoStop[];
    hasShopping: boolean;
    hasWheelchair: boolean;
    wheelchairPassenger: string;
    hasSecurity: boolean;
    hasPrivateSales: boolean;
    // Round 6.2.20 (2026-06-09) — Lounge Extension (with qty).
    // The wrapper maps these into the `addons.items[]` shape
    // that the backend AddonsSyncService expects, with
    // quantity = loungeExtensionQty.
    hasLoungeExtension: boolean;
    loungeExtensionQty: number;
    // Round 5.7 (2026-06-06): pricing-relevant accommodation +
    // guest-count state. The wrapper sums these into
    // `number_of_guests` / `non_flying_guests` before calling
    // `usePricePreview` (and ultimately the backend
    // `PricingPreviewService`).
    vipLD: number;
    vipPS: number;
    nonFlyingLD: number;
    nonFlyingPS: number;
    numPremiereSuites: number;
    // 2026-06-10 — explicit Lounge Deluxe quantity (mirror of
    // `numPremiereSuites` for LD). Defaults to 0 in the form so
    // the user opts in; the wrapper reads this flat key
    // (`loungeSuites`) into `usePricePreview` to drive the live
    // price preview (round 6.2.14 contract — backend accepts
    // `assigned_suite_count` / `assigned_lounge_count` without
    // ids).
    numLoungeDeluxe: number;
    // Round 5.9 (2026-06-06): pricing-relevant passenger counts
    // and additional-hours. The wrapper passes these straight
    // through to `usePricePreview` (which already accepts them
    // since round 1.5; they were just always 0 because the
    // figma-ui form never pushed them through the callback).
    childrenUnder2: number;
    childrenAge2To11: number;
    additionalHours: number;
    // Round 6.2.28 (2026-06-09) — staff-editable account discount
    // override. `undefined` = no override; number 0-100 = percent
    // off the FINAL totalPrice (the last step in the backend
    // PricingService). The wrapper reads this and forwards it to
    // `usePricePreview` → backend live preview, so the "Price
    // Breakdown" card updates as the staff types. The submit path
    // is independent: `BookingFormData.accountDiscountPct` is
    // emitted in the formData and the wrapper persists it in
    // `advanced_details.account.accountDiscountPct` (see the
    // `handleSubmit` wrapper for the 2 emit sites).
    accountDiscountPct: number | undefined;
    // Round 6.2.139 — staff opt-in for free LD / free PS credits.
    useMembershipLdFree: boolean;
    useMembershipPsFree: boolean;
    /**
     * Mixed LD+PS sitting. Named VIP rows (PS then LD, same order as
     * the form passengers[] slice) so live preview can tell who sits
     * in which room.
     */
    passengers: Array<{ firstName: string; lastName: string }>;
  }) => void;
  /**
   * 2026-06-08 round 6.2.8 — bookable items price map sourced from
   * `GET /api/bookable-items` (populated by the wrapper via
   * `fetchBookableItemPriceMap` in the parent repo). Used to render
   * the form's addons chips + dropdown with the CORRECT prices
   * from the DB, not the hard-coded "fictional" prices in the
   * `CREATE_ADDON_SERVICES` array. Pre-6.2.8 the Limo chip showed
   * "+HK$1,500" (hard-coded) while the actual charge was HK$800
   * (DB). See `bookableItemsCache.ts` for the full rationale.
   *
   * Format: `{ 'Limousine Transfer': 800, 'Airport Limousine Service': 1000, ... }`
   * Addons whose `name_en` is NOT in this map fall through to the
   * hard-coded `price` + `badge` in `CREATE_ADDON_SERVICES` (these
   * are the 25 fabricated "display-only" addons marked with
   * "(coming soon)" in the key).
   */
  bookableItemPrices?: Record<string, number>;
  /**
   * 2026-07-23 — FlightAware AeroAPI autofill. Wrapper calls
   * `GET /api/flights/lookup` and returns mapped fields; the view
   * applies them to local flight state. Absent = hide Lookup button.
   */
  onFlightLookup?: (params: {
    flightNo: string;
    flightDate: string;
    flightType: 'Arrival' | 'Departure' | 'Transit';
  }) => Promise<{
    flightNo?: string | null;
    flightDate?: string | null;
    flightTime?: string | null;
    origin?: string | null;
    destination?: string | null;
  } | null>;
  /**
   * 2026-07-16 — Lane B "Other add-on services" slot owned by the
   * wrapper (CatalogAddonPicker). Rendered after Lane A specials
   * inside the Add-on Services card.
   */
  catalogAddonSlot?: React.ReactNode;
  /**
   * Wrapper-owned payment modes (settlement / credit facility).
   * When provided, do not type-gate the dropdown. Absent = standalone
   * mock uses the local reporting-label table.
   */
  paymentModeOptions?: PaymentMode[];
  /** Wrapper default when the current value is missing or not in options. */
  defaultPaymentMode?: PaymentMode | '';
  /**
   * Wrapper-owned membership species (D2). When provided (including false),
   * Membership tier + free LD/PS follow this flag, not Individual type.
   * Absent = standalone mock still Individual-gates.
   */
  showMembershipBenefits?: boolean;
  /**
   * Wrapper-owned Travel Agency panel (linked travel_agency row).
   * When provided (including false), do not Agency-type-gate the panel.
   */
  showTravelAgency?: boolean;
  /**
   * Wrapper-owned Account Credit card (credit facility / credit numbers).
   * When provided (including false), do not Agency-type-gate the card.
   */
  showAccountCredit?: boolean;
  /**
   * Wrapper-owned Company Name field (company relation / company_name).
   * When provided (including false), do not Corporate-type-gate the field.
   */
  showCompanyName?: boolean;
}

// 2026-06-23 — phone-region code typeahead + number filter, shared
// with figma-ui AccountCreation.tsx. Copied here (rather than
// extracting to a shared module) to keep the figma-ui surface
// self-contained per the figma Make copy-paste constraint (INV-X1):
// figma Make cannot supply cross-file imports outside the tree it
// generates, so inline is the only safe option. Keep the two
// copies in sync if behaviour changes.

// Phone number input filter — digits and '-' only. Mirrors
// AccountCreation.tsx::filterContactNumber.
const filterContactNumber = (v: string) => v.replace(/[^0-9-]/g, '');

// Splits a stored contact phone into the region code + number
// pair that the split input uses. Mirrors
// `hkial-react/src/utils/splitContactPhone.ts` (INV-X1: Figma
// Make cannot import that module, so this copy stays inline).
//
// The old `/^(\+\d{1,4})\s*(.*)$/` take-1-to-4-digits regex
// clipped the first local digit whenever the stored phone had
// no space (`+85298765432` → region `+8529` unknown → `+852`
// + number `8765432`). Match the longest known prefix instead.
function splitContactPhone(
  raw: string | undefined | null,
  options: { code: string; name: string }[],
): { regionCode: string; contactNumber: string } {
  if (!raw) return { regionCode: '+852', contactNumber: '' };
  const trimmed = String(raw).trim();
  if (!trimmed) return { regionCode: '+852', contactNumber: '' };

  const codes = options
    .map((o) => o.code)
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .sort((a, b) => b.length - a.length);

  const compactHay = trimmed.replace(/[\s().]/g, '');
  const hasLeadingPlus = trimmed.startsWith('+');

  for (const code of codes) {
    const compactCode = code.replace(/[\s().]/g, '');
    if (!compactCode) continue;

    const digitLen = compactCode.replace(/\D/g, '').length;
    if (digitLen <= 1 && !hasLeadingPlus) continue;

    if (compactHay.startsWith(compactCode)) {
      return {
        regionCode: code,
        contactNumber: compactHay.slice(compactCode.length).replace(/[^0-9-]/g, ''),
      };
    }

    const codeNoPlus = compactCode.replace(/^\+/, '');
    if (codeNoPlus && compactHay.startsWith(codeNoPlus)) {
      return {
        regionCode: code.startsWith('+') ? code : `+${code}`,
        contactNumber: compactHay.slice(codeNoPlus.length).replace(/[^0-9-]/g, ''),
      };
    }
  }

  const spaced = trimmed.match(/^(\+\d{1,4}(?:-\d{1,4})?)\s+(.+)$/);
  if (spaced) {
    return {
      regionCode: spaced[1],
      contactNumber: spaced[2].replace(/[^0-9-]/g, ''),
    };
  }

  return { regionCode: '+852', contactNumber: trimmed.replace(/[^0-9-]/g, '') };
}

// Typeahead combobox for the phone region code. Reads from the
// `regionCodes` prop (sourced from `GET /api/lookups/region-codes`
// by the wrapper). Falls back to the full canonical list when the
// prop is empty (offline mock / pre-fetch state) so the form is
// still usable.
//
// 2026-06-24 (Sky) — synced to the backend LookupController::regionCodes
// payload (and the customer-frontend `utils/regionCodes` mirror) so the
// `+` prefix matches the API and `o.code === value` match logic works
// when the API is down. Codes carry the leading `+` (the pre-2026-06-24
// fallback used `852`/`86`/`1`/`44` without the prefix, which silently
// broke match for users whose `regionCode` came from the live API).
// 2026-07-04 (Sky) — switched to the customer-side
// `ContactNoSplit`-style pattern (AuthPage.tsx:170-228 +
// NewBooking.tsx:602-749 + EditBooking.tsx:161-269). The
// pre-7.4 figma-ui shape had its own internal `query`
// state + `hasFocus` toggle + a focus-aware `displayValue`
// that swapped between the typed text and the formatted
// "code - name" string. In practice the focus-aware
// display was confusing — the typeahead felt "stuck"
// because the formatted string would re-appear mid-typing
// if focus was lost (e.g. user clicked a sibling input)
// and the parent's `value` was the formatted string (the
// only thing the parent could read). The customer-side
// pattern is simpler: the parent owns `regionCode`, the
// input is bound directly to it, the filter is a `useMemo`
// keyed on `regionCode`, and the dropdown uses a chevron
// toggle. The 4 working repo sites all use this exact
// shape — this is the "still not working like others"
// fix Sky asked for.
function RegionCodeCombobox({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select region code',
}: {
  id?: string;
  value: string;
  options: { code: string; name: string }[];
  onChange: (code: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter the option list against the current input value
  // (the parent's `value` is the single source of truth — no
  // internal `query` state to keep in sync). Mirrors
  // `AuthPage.tsx:176-182` and `NewBooking.tsx:624-630`.
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q),
    );
  }, [value, options]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pickRegion = (code: string) => {
    onChange(code);
    setOpen(false);
    setHighlight(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = filtered[highlight];
      if (pick) pickRegion(pick.code);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id || 'rc'}-listbox`}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => { setOpen(true); setHighlight(0); }}
        onKeyDown={handleKeyDown}
        required
        className="pr-8"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Toggle region code list"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          id={`${id || 'rc'}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <li className="p-3 text-gray-500 text-sm">
              {options.length === 0 ? 'Loading region codes…' : 'No matching region codes'}
            </li>
          ) : (
            filtered.map((rc, idx) => {
              const selected = value === rc.code;
              const isHighlighted = idx === highlight;
              return (
                <li
                  key={rc.code}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => { e.preventDefault(); pickRegion(rc.code); }}
                  className={`p-3 cursor-pointer border-b last:border-b-0 flex justify-between items-center text-sm ${
                    isHighlighted ? 'bg-blue-50' : ''
                  } ${selected ? 'font-semibold' : ''}`}
                >
                  <span>{rc.name}</span>
                  <span className="text-gray-500">{rc.code}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateBooking({
  showTransit = true,
  showDietaryFields = true,
  renderDevQuickFill,
  onSubmit,
  onCancel,
  isSubmitting = false,
  accountSearchResults,
  accountSearchLoading,
  showAccountDropdown = false,
  setShowAccountDropdown,
  onAccountSearch,
  onAccountSelect,
  onAccountClear,
  onGuestSearch,
  onGuestSearchSelect,
  guestSearchResults = undefined,
  guestSearchLoading = false,
  showGuestDropdown = false,
  setShowGuestDropdown,
  selectedAccount = null,
  onApplyPromo,
  onClearPromo,
  promoApplied: promoAppliedProp,
  promoError: promoErrorProp,
  promoValidating = false,
  selectedAddonKeys = [],
  bookingNo = '',
  physicalSuites = [],
  physicalLounges = [],
  assignedSuiteIds = [],
  setAssignedSuiteIds,
  assignedLoungeIds = [],
  setAssignedLoungeIds,
  liveBreakdown = [],
  liveTotal = null,
  liveRulesApplied = [],
  liveWarnings = [],
  onAddonStateChange,
  // Round 6.2.19 (2026-06-08) — round 6.2.8 added the
  // prop to the interface (line 277) + the wrapper passes
  // it, but the function destructure (lines 282-314)
  // never picked it up. Result: `bookableItemPrices` was
  // referenced at line 1628 inside `resolveServiceDisplay`
  // (defined inline at line 1627) but the identifier was
  // NOT in scope → runtime ReferenceError when the user
  // clicked on an addon input:
  //   "Uncaught ReferenceError: bookableItemPrices is
  //    not defined at index-BBQSOAP0.js:98:63889"
  // Per INV-13, the structural fix is to destructure the
  // prop in the function signature. The figma-ui view's
  // function-level destructure mirrors the prop list in
  // CreateBookingProps; missing entries are silently
  // undefined when accessed (TS doesn't error because
  // `bookableItemPrices?.[svc.key]` uses optional chaining
  // — the optional chaining compiles to `bookableItemPrices
  // === undefined ? undefined : bookableItemPrices[svc.key]`,
  // and if `bookableItemPrices` itself is undeclared the
  // JS engine throws ReferenceError at parse time).
  bookableItemPrices = {},
  // 2026-06-23 — region codes for the Contact Person phone region
  // dropdown. When empty/undefined, the form falls back to a small
  // hardcoded list of common region codes so the form is still
  // usable in offline mocks (see `displayRegionCodes`).
  regionCodes = [],
  catalogAddonSlot,
  onFlightLookup,
  paymentModeOptions: paymentModeOptionsProp,
  defaultPaymentMode = '',
  showMembershipBenefits: showMembershipBenefitsProp,
  showTravelAgency: showTravelAgencyProp,
  showAccountCredit: showAccountCreditProp,
  showCompanyName: showCompanyNameProp,
}: CreateBookingProps) {

  // ── Account & Guest ─────────────────────────────────────────────────────────
  const [accountType, setAccountType] = useState<'Individual' | 'Corporate' | 'Agency' | ''>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [selectedAgencyCode, setSelectedAgencyCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [membershipTier, setMembershipTier] = useState<MembershipTier | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode | ''>('');
  const [bookingChannel, setBookingChannel] = useState<'Online' | 'Email/Call to HKIAL'>('Email/Call to HKIAL');
  const [promoInput, setPromoInput] = useState('');
  // Local promo state is only used when the wrapper does not provide
  // `onApplyPromo` (standalone / mock). Production admin CreateBooking
  // always passes onApplyPromo + controlled promoApplied/promoError so
  // validate → promo_code_id lives in the wrapper (round 6.2.148).
  const [localPromoApplied, setLocalPromoApplied] = useState<{
    code: string;
    label: string;
    discountPct: number;
    benefit?: string;
  } | null>(null);
  const [localPromoError, setLocalPromoError] = useState('');
  const isPromoControlled = typeof onApplyPromo === 'function';
  const promoApplied = isPromoControlled ? (promoAppliedProp ?? null) : localPromoApplied;
  const promoError = isPromoControlled ? (promoErrorProp ?? '') : localPromoError;
  const [accountRemark, setAccountRemark] = useState('');
  const [isAdHoc, setIsAdHoc] = useState(false);
  // 2026-06-09 — Account Discount is staff-editable, defaulting to the
  // tier/agency rate but always overridable (e.g. ad-hoc promotion).
  // `''` = no override; a number = percent (0-100).
  const [accountDiscountPct, setAccountDiscountPct] = useState<number | ''>('');
  // Round 6.2.139 — default OFF (staff must opt in to free credits).
  const [useMembershipLdFree, setUseMembershipLdFree] = useState(false);
  const [useMembershipPsFree, setUseMembershipPsFree] = useState(false);
  // Submit validation: field key → message for red borders + helper text.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const showMembershipBenefits = showMembershipBenefitsProp !== undefined
    ? showMembershipBenefitsProp
    : accountType === 'Individual';
  const showTravelAgency = showTravelAgencyProp !== undefined
    ? showTravelAgencyProp
    : accountType === 'Agency';
  const showAccountCredit = showAccountCreditProp !== undefined
    ? showAccountCreditProp
    : accountType === 'Agency';
  const showCompanyName = showCompanyNameProp !== undefined
    ? showCompanyNameProp
    : accountType === 'Corporate';

  // 2026-06-09 round 6.2.28 / 6.2.136 / 2026-07-17 — when an account is
  // selected, load Membership Tier from the account. Members do NOT get
  // a tier % discount (removed MEMBERSHIP_DISCOUNT auto-fill). Account
  // Discount stays blank for members (staff override only). Agency:
  // auto-fill Account Discount from travel_agencies.discount_rate
  // (spec §9 — Agency default). Free LD / PS quotas render separately.
  useEffect(() => {
    if (selectedAccount?.membership_type) {
      setMembershipTier(selectedAccount.membership_type as MembershipTier);
    } else {
      setMembershipTier('');
    }
    setUseMembershipLdFree(false);
    setUseMembershipPsFree(false);

    const agencyRate = Number(
      selectedAccount?.travel_agency?.[0]?.discount_rate ?? NaN,
    );
    if (Number.isFinite(agencyRate) && agencyRate > 0) {
      setAccountDiscountPct(Math.max(0, Math.min(100, Math.round(agencyRate))));
    } else {
      setAccountDiscountPct('');
    }
  }, [selectedAccount, accountType]);

  useEffect(() => {
    if (!showMembershipBenefits) {
      setUseMembershipLdFree(false);
      setUseMembershipPsFree(false);
    }
  }, [showMembershipBenefits]);

  // ── Flight ──────────────────────────────────────────────────────────────────
  const [flightType, setFlightType] = useState<FlightType>('Departure');
  const [arrivalDate, setArrivalDate] = useState('');
  const [flightNo, setFlightNo] = useState('');
  const [flightTime, setFlightTime] = useState('');
  const [flightOrigin, setFlightOrigin] = useState('');
  const [flightDestination, setFlightDestination] = useState('');
  const [numberOfLuggage, setNumberOfLuggage] = useState(1);
  const [flightClass, setFlightClass] = useState<FlightClass | ''>('');
  const [flightLookupLoading, setFlightLookupLoading] = useState(false);

  // 2026-06-08 — Transit 2nd leg (I-T2). The 1st leg is the existing
  // flightNo/flightTime/arrivalDate/flightClass above. The 2nd leg is
  // collected here. Only meaningful when flightType === 'Transit' — the
  // BookingFormData emits them as undefined otherwise, and the wrapper
  // drops them from the payload.
  const [leg2ArrivalDate, setLeg2ArrivalDate] = useState('');
  const [leg2FlightNo, setLeg2FlightNo] = useState('');
  const [leg2FlightTime, setLeg2FlightTime] = useState('');
  const [leg2FlightClass, setLeg2FlightClass] = useState<FlightClass | ''>('');
  // 2026-06-08 — inline 6h gap pre-check. The form shows this
  // string and disables submit when the gap is < 6h. The backend's
  // TransitLegsRule is the source of truth; this is for UX.
  const [transitGapError, setTransitGapError] = useState<string | null>(null);

  // ── Booking ─────────────────────────────────────────────────────────────────
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');

  // 2026-06-28 (round 6.2.74) — Sky's 3h booking-time rule. The
  // computed range is reactive — recomputed on every flight/visit
  // change via the helper. Disabled check on submit + input min/max.
  // NOTE: must come AFTER `visitTime` is declared above — TDZ otherwise
  // (this is the bug Sky hit on 2026-06-28 19:18 with a blank
  // create-booking page — ReferenceError "Cannot access 'Qe' before
  // initialization" on first render).
  const visitTimeRange = computeVisitTimeRange({
    flightType,
    flightTime,
    visitTime,
    visitDate,
    arrivalDate,
    leg2FlightTime,
    leg2ArrivalDate,
  });
  const visitTimeRangeError = visitTimeRange.error;

// ── Premiere Suite ──────────────────────────────────────────────────────────
  const [numPremiereSuites, setNumPremiereSuites] = useState(0);
  const [vipPS, setVipPS] = useState(0);
  const [nonFlyingPS, setNonFlyingPS] = useState(0);

  useEffect(() => {
    const includesPs = numPremiereSuites > 0 || vipPS > 0 || nonFlyingPS > 0;
    if (useMembershipPsFree && (!includesPs || !useMembershipLdFree)) {
      setUseMembershipPsFree(false);
    }
  }, [numPremiereSuites, vipPS, nonFlyingPS, useMembershipLdFree, useMembershipPsFree]);

  // ── Lounge Deluxe ───────────────────────────────────────────────────────────
  const [vipLD, setVipLD] = useState(0);
  const [nonFlyingLD, setNonFlyingLD] = useState(0);
  // 2026-06-23 — numLoungeDeluxe is DERIVED from vipLD, not a
  // separate useState. Per the booking-pricing rule "1 LD = 1
  // LDVIP" the Lounge Deluxe quantity equals the VIP passenger
  // count in the LD section, so the explicit Quantity input is
  // removed from the form. The wrapper still reads this flat
  // key (`loungeSuites` / `numLoungeDeluxe`) for the live
  // `usePricePreview` and the POST payload, so we keep the
  // identifier and just derive it. (Replaces the 2026-06-10
  // `useState(0)` for `numLoungeDeluxe` — see round 6.2.55.)
  const numLoungeDeluxe = vipLD;

  // ── Passengers ──────────────────────────────────────────────────────────────
  // 2026-06-26 — round 6.2.67 (M20 PS/LD order fix):
  // the seed was `[emptyPassenger()]` (length 1) — an artifact
  // from the Figma Make export that left a "ghost" entry at
  // array index 0. Combined with the direction-aware grow at
  // line 1132+, the ghost would persist at idx 2 after the
  // user bumps vipPS (e.g. vipPS 2 → 3 with the array already
  // length 5 due to the ghost + vipLD=2 → no growth fires,
  // and the ghost entry at idx 2 gets filled with the user's
  // "LD0" data via DOM input 2 — producing the Carol-at-PS
  // bug pattern). Fix: seed with `[]` so the array layout
  // matches `(vipPS + vipLD)` exactly after every grow.
  // The render's empty state (line 2221) handles the
  // `total = 0` case so no card is shown initially.
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [nonFlyingGuests, setNonFlyingGuests] = useState<NonFlyingGuest[]>([]);

  // ── Contact Person ──────────────────────────────────────────────────────────
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  // 2026-06-23 — regionCode is the phone region code (e.g. '852'),
  // typed via `<RegionCodeCombobox>` (see component below).
  // contactNo is the local number part, filtered to digits + '-'
  // only via `filterContactNumber`. The wrapper combines them with
  // a single space for `guest_phone` on submit.
  const [regionCode, setRegionCode] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [bookingMemo, setBookingMemo] = useState('');

  // 2026-06-28 — Sky's request: auto-fill the Contact Person
  // section (name / email / phone) when an account is selected.
  // The wrapper's `handleAccountSelect` already calls its own
  // `setContactName / setContactEmail / setContactNo`, but those
  // update the WRAPPER's state — not the figma-ui view's local
  // state, which is what the Contact Person inputs are bound
  // to. Mirroring the auto-fill here makes the inputs visible
  // right after `selectedAccount` lands (single round-trip
  // after `accountService.getAccount` resolves). Reverts to
  // empty when the account is cleared (e.g. via `onAccountClear`
  // which nulls `selectedAccount` in the wrapper). Split out
  // from the existing membership-tier `useEffect` (above) so
  // the React hooks ordering keeps `setContactName` etc.
  // declared before they're referenced (lint no-use-before-define).
  //
  // 2026-07-04 (Sky, round 6.2.103) — phone split. Before this
  // round the autofill pushed the WHOLE `selectedAccount.phone`
  // (e.g. "+852 9876-5432") into the number input, leaving the
  // region-code field empty. The wrapper still emitted a valid
  // `guest_phone` (its own setContactNo + the fallback path at
  // CreateBooking.tsx:1115-1117), but the UI was broken: region
  // code field showed nothing, the number field held the whole
  // string with the leading "+852 " in it. Fix: split via
  // `splitContactPhone`, mirror the region into `regionCode`
  // and the digits/dash tail into `contactNo`. The combobox's
  // `value={value}` (regionCode) now matches an option, so the
  // highlighted/selected row lights up.
  useEffect(() => {
    if (selectedAccount) {
      if (selectedAccount.name) setContactName(selectedAccount.name);
      if (selectedAccount.email) setContactEmail(selectedAccount.email);
      if (selectedAccount.phone) {
        const split = splitContactPhone(
          selectedAccount.phone,
          (regionCodes && regionCodes.length > 0) ? regionCodes : FALLBACK_REGION_CODES,
        );
        setRegionCode(split.regionCode);
        setContactNo(split.contactNumber);
      }
    } else {
      setContactName('');
      setContactEmail('');
      setRegionCode('');
      setContactNo('');
    }
  }, [selectedAccount, regionCodes]);

  // ── Add-on Services ─────────────────────────────────────────────────────────
  const [hasLimousine, setHasLimousine] = useState(false);
  const [limoStops, setLimoStops] = useState<LimoStop[]>([{ id: 1, type: 'Pick-up', location: '' }]);
  const [hasShopping, setHasShopping] = useState(false);
  const [hasWheelchair, setHasWheelchair] = useState(false);
  const [wheelchairPassenger, setWheelchairPassenger] = useState('');
  const [hasSecurity, setHasSecurity] = useState(false);
  const [hasPrivateSales, setHasPrivateSales] = useState(false);
  // (bookableItemPrices comes from the wrapper as a prop
  // — see `bookableItemPrices?: Record<string, number>`
  // in CreateBookingProps. No local state needed.)
  // Round 6.2.20 (2026-06-09) — Lounge Extension now has a
  // custom UI with a qty stepper (per user directive "for
  // Lounge Extension, it should have qty"). The state holds
  // both the boolean (whether the user wants the extension)
  // and the qty (1-6 hours). Default qty=1, max=6.
  const [hasLoungeExtension, setHasLoungeExtension] = useState(false);
  const [loungeExtensionQty, setLoungeExtensionQty] = useState(1);
  const [addonSearch, setAddonSearch]             = useState('');
  const [showAddonDropdown, setShowAddonDropdown] = useState(false);

  // HKIAL addons pricing fix round 5.3 (2026-06-05): sync the addons
  // state variables out to the wrapper parent whenever any of them
  // change. The wrapper feeds these into `usePricePreview` so the
  // in-form "Price Breakdown" card can show the addon subtotal live.
  //
  // Round 5.7 (2026-06-06): extended to also sync the 5 pricing-
  // relevant accommodation / guest-count state variables
  // (`vipLD`, `vipPS`, `nonFlyingLD`, `nonFlyingPS`,
  // `numPremiereSuites`). The wrapper sums these into the
  // `number_of_guests` and `non_flying_guests` fields that the
  // backend's `PriceContext` consumes. The prop is still named
  // `onAddonStateChange` for backward compatibility with the
  // round 5.3 wiring; the payload simply now also carries
  // accommodation + guest counts.
  //
  // Round 5.9 (2026-06-06): extended to also sync 3 child/extra
  // pricing fields. The `passengers` array carries an `ageGroup`
  // enum; the counts of "Infant (0-2 years)" and "Children (aged
  // 2 to 11)" rows map to `childrenUnder2` and `childrenAge2To11`
  // in the backend's `PriceContext`.
  //
  // 2026-06-23 (round 6.2.53): child/infant rates apply to FLYING
  // VIP children/infants only. NFGs are billed as NFGs regardless
  // of age, so `nonFlyingGuests` is no longer counted here.
  //
  // 2026-06-24 (round 6.2.56) — per-kind children age-band
  // counts. The form's `passengers[]` array is ordered as
  // `[PS VIPs..., LD VIPs...]` (mirroring the customer form's
  // `buildSegmentedGuestsForAdvancedDetails` partitioning; the
  // figma-ui grid at line 1927 also slices `passengers` this way
  // for display). Slice by `vipPS` + `vipLD` to derive 4 per-kind
  // counts so the live "Price Breakdown" card doesn't leak a
  // LD child into the PS_VIP_Child line (pre-6.2.56 the live
  // preview only sent the GLOBAL `children_age_2_to_11`, and the
  // backend's `??`-chain in `PricingService::compute()` put the
  // same global count into BOTH sub-contexts — a 1-LD-child
  // booking showed "PS_VIP_Child: 1" AND "LD_VIP_Child: 1").
  // Counts FLYING VIP children/infants only (round 6.2.53 rule).
  // Mirror the slice boundaries used by the admin submit path
  // (`CreateBooking.tsx:768-769`) for symmetry: PS = indices
  // [0, vipPS), LD = indices [vipPS, vipPS + vipLD).
  useEffect(() => {
    const childUnder2 = passengers.filter((p) => p.ageGroup === 'Infants (under 2 years old)').length;
    const childAge2To11 = passengers.filter((p) => p.ageGroup === 'Children (aged 2-11)').length;
    // Round 6.2.56 — per-kind slice. Accept both Q-B long
    // strings (`'Children (aged 2-11)'` / `'Infants (under 2
    // years old)'`) and the legacy figma-ui short strings
    // (`'Children (aged 2 to 11)'` / `'Infant'`) for
    // back-compat with the form's local age-group enum (see
    // `CreateBooking.tsx:73`).
    const isChildAge = (p) =>
      p?.ageGroup === 'Children (aged 2-11)'
      || p?.ageGroup === 'Children (aged 2 to 11)'
      || p?.ageGroup === 'Child';
    const isInfantAge = (p) =>
      p?.ageGroup === 'Infants (under 2 years old)'
      || p?.ageGroup === 'Infant';
    const psPax = passengers.slice(0, vipPS);
    const ldPax = passengers.slice(vipPS, vipPS + vipLD);
    const premiereChildrenAge2To11 = psPax.filter(isChildAge).length;
    const premiereChildrenUnder2  = psPax.filter(isInfantAge).length;
    const loungeChildrenAge2To11   = ldPax.filter(isChildAge).length;
    const loungeChildrenUnder2    = ldPax.filter(isInfantAge).length;
    onAddonStateChange?.({
      hasLimousine,
      limoStops,
      hasShopping,
      hasWheelchair,
      wheelchairPassenger,
      hasSecurity,
      hasPrivateSales,
      // Round 6.2.20 (2026-06-09) — Lounge Extension
      // (with qty) per user directive.
      hasLoungeExtension,
      loungeExtensionQty,
      // Round 5.7 additions — pricing-relevant accommodation state.
      vipLD,
      vipPS,
      nonFlyingLD,
      nonFlyingPS,
      numPremiereSuites,
      // 2026-06-10 — explicit LD quantity (mirror of
      // `numPremiereSuites` for LD). The wrapper maps this
      // to `usePricePreview({ loungeSuites })` → backend
      // `assigned_lounge_count` flat key, which drives the
      // live price preview even when the user has not
      // checked any Lobby checkbox.
      numLoungeDeluxe,
      // Round 5.9 additions — pricing-relevant passenger counts.
      childrenUnder2: childUnder2,
      childrenAge2To11: childAge2To11,
      // Round 6.2.56 (2026-06-24) — per-kind children
      // age-band counts (mirror the admin submit path's
      // slice in `CreateBooking.tsx:768-786`). Each sent as
      // a top-level field on `PricePreviewInput`; the
      // helper's "omit undefined" contract preserves them
      // on the wire so the backend's `??`-chain picks the
      // per-kind field matching the sub-context's product.
      premiereChildrenAge2To11,
      premiereChildrenUnder2,
      loungeChildrenAge2To11,
      loungeChildrenUnder2,
      // R6.2.100 (2026-07-02): "Lounge Extension" / "Additional
      // Hour of Stay" now drives `bookings.additional_hours`
      // directly via the formal `prices.add_on_additional_hour`
      // price list (PS $3k/suite/hr, LD $1k/person/hr) instead
      // of a BookableItem item (HK$1500/hr flat, retired). The
      // Lounge Extension chip toggle still owns the UI state
      // here; its value is mirrored into `additionalHours` so
      // the wrapper can forward it to `usePricePreview` and the
      // POST body.
      additionalHours: hasLoungeExtension ? loungeExtensionQty : 0,
      // Round 6.2.28 (2026-06-09) — staff override. Push the
      // current value through the same channel so the wrapper
      // can forward it to `usePricePreview` → backend live
      // preview. `''` (untouched) → `undefined` (omitted on the
      // wire = "no override"); a number 0-100 → preserved
      // verbatim (the wrapper passes it through).
      accountDiscountPct: accountDiscountPct === '' ? undefined : accountDiscountPct,
      // Round 6.2.139 — membership free-credit opt-in for live preview.
      useMembershipLdFree,
      useMembershipPsFree,
      passengers: passengers.slice(0, vipPS + vipLD).map((p) => ({
        firstName: p?.firstName ?? '',
        lastName: p?.lastName ?? '',
      })),
    });
  }, [
    hasLimousine,
    limoStops,
    hasShopping,
    hasWheelchair,
    wheelchairPassenger,
    hasSecurity,
    hasPrivateSales,
    // Round 6.2.20 (2026-06-09) — Lounge Extension deps.
    hasLoungeExtension,
    loungeExtensionQty,
    // Round 5.7 additions.
    vipLD,
    vipPS,
    nonFlyingLD,
    nonFlyingPS,
    numPremiereSuites,
    // Round 5.9 additions.
    passengers,
    onAddonStateChange,
    // Round 6.2.28 (2026-06-09) — staff override. Re-fire
    // the effect so the live preview reflects the new value
    // (the wrapper's `usePricePreview` depends on
    // `input.accountDiscountPct`).
    accountDiscountPct,
    useMembershipLdFree,
    useMembershipPsFree,
  ]);

  // ── Guest Search Focus ──────────────────────────────────────────────────────
  const [guestSearchFocused, setGuestSearchFocused] = useState(false);

  // ── Special Requests ────────────────────────────────────────────────────────
  const [specialRequests, setSpecialRequests] = useState('');

  // ── Delete Passenger Dialog ─────────────────────────────────────────────────
  interface DeletePaxDialog {
    section: 'PS' | 'LD';
    newValue: number;
    candidates: { globalIdx: number; label: string }[];
    selected: Set<number>;
  }
  const [deleteDialog, setDeleteDialog] = useState<DeletePaxDialog | null>(null);

  // 2026-06-08 round 6.2.10 — passengers useEffect (Q1=b: only
  // GROW, never TRUNCATE). Pre-6.2.10 this useEffect fired on
  // every vipPS/vipLD change and BOTH grew (added empties when
  // count went up) AND truncated (cut entries when count went
  // down). The truncation branch was the source of the
  // "user typed 4 VIPs, only 2 saved" data-loss bug — see
  // `docs/handoff/2026-06-08-round-6.2.10-createform-only-grow.md`
  // for the full story. The fix: ONLY add empties when the
  // count went up. NEVER truncate. The user controls when
  // entries are removed via the explicit "Remove" button
  // (which calls `confirmDeletePassengers`).
  //
  // Round 6.2.22 (2026-06-09) — re-applied the round 6.2.10
  // fix that was lost in a Figma Make regen. The Figma Make
  // regen stripped the useEffect BODY, leaving only the
  // comment block. Same class of bug as round 6.2.19 (the
  // `bookableItemPrices` destructure was lost the same way).
  // Per the user report "the VIP Passenger Details list is
  // not expanded when I add vip" — the figma-ui view's
  // `passengers` array was initialized to `[emptyPassenger()]`
  // (1 entry) and NEVER grew, so the "VIP Passenger Details"
  // section always showed 1 form regardless of `vipPS`/`vipLD`.
  // The wrapper (parent) CreateBooking.tsx has its own copy
  // of this useEffect at line 310-318, but the figma-ui view
  // maintains its own local `passengers` state for the
  // "VIP Passenger Details" rendering. We need the useEffect
  // here too.
  // 2026-06-26 — round 6.2.67 (M20 PS/LD order fix):
  // direction-aware grow. Pre-6.2.67 this useEffect appended
  // all new empties to the TAIL of `passengers[]` regardless
  // of whether the growth came from PS or LD. When the user
  // bumped `vipPS` while `vipLD > 0` was already filled, the
  // render (`passengers.slice(0, vipPS+vipLD).map((p, idx) =>
  // { const isPS = idx < vipPS; ... })`) mis-classified the
  // original first LD card as PS (it now sat at idx >= vipPS
  // due to the tail-append) and the new empty card landed at
  // the very end, mis-labelled as LD. Fix: track previous
  // `vipPS` / `vipLD` via refs and INSERT new PS empties at
  // the PS/LD boundary (`prevVipPS` = the index of the first
  // LD card, or array length if no LD yet), while LD empties
  // still APPEND at the tail (LD is at the array end by
  // invariant). When both sections grow in the same render
  // (React batches the two `setState` calls), we append LD
  // empties first then splice PS empties at `prevVipPS` —
  // that index is unchanged by the LD append because LD
  // empties land AFTER position `prevVipPS`. Net result:
  // the array's PS-then-LD layout is preserved across any
  // (PS, LD) delta, so the render's `idx < vipPS` classifier
  // stays correct.
  const prevVipPSRef = useRef(vipPS);
  const prevVipLDRef = useRef(vipLD);
  useEffect(() => {
    const prevVipPS = prevVipPSRef.current;
    const prevVipLD = prevVipLDRef.current;
    prevVipPSRef.current = vipPS;
    prevVipLDRef.current = vipLD;
    const psDelta = vipPS - prevVipPS;
    const ldDelta = vipLD - prevVipLD;
    setPassengers((prev) => {
      const total = vipPS + vipLD;
      if (prev.length >= total) return prev; // INV-13 only-grow, never truncate
      let next = prev;
      if (ldDelta > 0) {
        next = [...next, ...Array.from({ length: ldDelta }, emptyPassenger)];
      }
      if (psDelta > 0) {
        // Splice PS empties at the PS/LD boundary (= the
        // FIRST LD card's position, OR array length when
        // there's no LD section yet). Indices below this
        // point are the existing PS section (untouched by
        // the LD append above since LD empties land at
        // indices >= prevVipPS + ldDelta in `next`, and
        // our splice point is `prevVipPS` which sits
        // BEFORE that).
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

  // 2026-06-08 round 6.2.10 — non-flying useEffect (Q1=b: only
  // GROW, never TRUNCATE). Same fix as the passengers useEffect
  // (line 472+). Pre-6.2.10 this useEffect truncated the array
  // when nonFlyingPS/nonFlyingLD went down, which LOST the
  // user-typed data. Fix: only add empties, never truncate.
  //
  // Round 6.2.22 (2026-06-09) — re-applied. Lost in Figma
  // Make regen.
  // 2026-06-26 — round 6.2.67 (M20 PS/LD order fix):
  // direction-aware grow. Same algorithm as the VIP
  // useEffect at line 1132+ — non-flying guests have the
  // same PS-then-LD array layout, so tail-append on a PS
  // bump would mis-classify the original first LD card
  // as PS. INSERT new PS empties at the PS/LD boundary
  // (`prevNonFlyingPS`); APPEND new LD empties at the
  // tail. See the VIP useEffect comment for the full
  // rationale.
  const prevNonFlyingPSRef = useRef(nonFlyingPS);
  const prevNonFlyingLDRef = useRef(nonFlyingLD);
  useEffect(() => {
    const prevNonFlyingPS = prevNonFlyingPSRef.current;
    const prevNonFlyingLD = prevNonFlyingLDRef.current;
    prevNonFlyingPSRef.current = nonFlyingPS;
    prevNonFlyingLDRef.current = nonFlyingLD;
    const psDelta = nonFlyingPS - prevNonFlyingPS;
    const ldDelta = nonFlyingLD - prevNonFlyingLD;
    setNonFlyingGuests((prev) => {
      const total = nonFlyingPS + nonFlyingLD;
      if (prev.length >= total) return prev; // INV-13 only-grow, never truncate
      let next = prev;
      if (ldDelta > 0) {
        next = [...next, ...Array.from({ length: ldDelta }, emptyNonFlying)];
      }
      if (psDelta > 0) {
        const insertAt = prevNonFlyingPS;
        next = [
          ...next.slice(0, insertAt),
          ...Array.from({ length: psDelta }, emptyNonFlying),
          ...next.slice(insertAt),
        ];
      }
      return next;
    });
  }, [nonFlyingPS, nonFlyingLD]);

  // 2026-06-08 round 6.2.10 — non-flying useEffect (Q1=b: only
  // GROW, never TRUNCATE). Same fix as the passengers useEffect
  // (line 472+). Pre-6.2.10 this useEffect truncated the array
  // when nonFlyingPS/nonFlyingLD went down, which LOST the
  // user-typed dat...[truncated]

  // ─── Derived ───────────────────────────────────────────────────────────────
  // 2026-06-14 — round 6.2.37. The agency of an account is
  // intrinsic — staff should never pick it ad-hoc. Derive
  // `selectedAgency` from the currently selected account's
  // eager-loaded `travel_agency` relation (single-element
  // array). Falls back to the legacy `TRAVEL_AGENCY_LIST` only
  // for back-compat with any future caller that still sets
  // `selectedAgencyCode` directly. The result is normalised to
  // camelCase (`name`/`code`/`discountRate`/`paymentMethod`)
  // so the existing call sites (discount placeholder, default
  // label, green confirmation card) keep working.
  const rawSelectedAgency =
    selectedAccount?.travel_agency?.[0]
    ?? TRAVEL_AGENCY_LIST.find(a => a.code === selectedAgencyCode)
    ?? null;
  const selectedAgency = rawSelectedAgency
    ? {
        name: (rawSelectedAgency as any).agency_name ?? (rawSelectedAgency as any).name,
        code: (rawSelectedAgency as any).agency_code ?? (rawSelectedAgency as any).code,
        discountRate: Number((rawSelectedAgency as any).discount_rate ?? (rawSelectedAgency as any).discountRate ?? 0),
        // travel_agencies has no payment_method column — Agency bookings
        // always default to On-Credit (credit balance). Mock list may still
        // carry paymentMethod for standalone demos.
        paymentMethod: ((rawSelectedAgency as any).payment_method
          ?? (rawSelectedAgency as any).paymentMethod
          ?? 'On-Credit') as PaymentMode,
      }
    : null;

  // Payment mode default follows wrapper options (settlement / credit
  // facility). Mock / standalone still defaults Agency to On-Credit.
  useEffect(() => {
    if (paymentModeOptionsProp && paymentModeOptionsProp.length > 0) {
      setPaymentMode((current) => {
        if (current && paymentModeOptionsProp.includes(current)) return current;
        if (defaultPaymentMode && paymentModeOptionsProp.includes(defaultPaymentMode)) {
          return defaultPaymentMode;
        }
        return '';
      });
      return;
    }
    const isAgency =
      accountType === 'Agency'
      || selectedAccount?.type === 'TravelAgency'
      || selectedAccount?.type === 'Agency';
    if (isAgency && (selectedAgencyCode || selectedAccount?.travel_agency?.[0])) {
      setPaymentMode('On-Credit');
    }
  }, [selectedAgencyCode, selectedAccount, accountType, paymentModeOptionsProp, defaultPaymentMode]);

  // ─── Passenger handlers ──────────────────────────────────────────────────────
  const updatePassenger = (idx: number, field: keyof PassengerDetail, value: string) =>
    setPassengers(prev => prev.map((p, i) => i === idx ? {
      ...p,
      [field]: (field === 'firstName' || field === 'lastName') ? sanitizeEnglishName(value) : value,
    } : p));

  const updateNonFlying = (idx: number, field: keyof NonFlyingGuest, value: string) =>
    setNonFlyingGuests(prev => prev.map((g, i) => i === idx ? {
      ...g,
      [field]: (field === 'firstName' || field === 'lastName') ? sanitizeEnglishName(value) : value,
    } : g));

  const openDeleteDialog = (section: 'PS' | 'LD', newValue: number) => {
    const currentCount = section === 'PS' ? vipPS : vipLD;
    if (newValue >= currentCount) {
      if (section === 'PS') setVipPS(newValue); else setVipLD(newValue);
      return;
    }
    const slice = section === 'PS' ? passengers.slice(0, vipPS) : passengers.slice(vipPS, vipPS + vipLD);
    const offset = section === 'PS' ? 0 : vipPS;
    if (!slice.some(isPassengerFilled)) {
      if (section === 'PS') setVipPS(newValue); else setVipLD(newValue);
      return;
    }
    const candidates = slice.map((p, i) => ({
      globalIdx: offset + i,
      label: [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || `Passenger ${offset + i + 1}`,
    }));
    setDeleteDialog({ section, newValue, candidates, selected: new Set() });
  };

  const toggleDeleteSelection = (idx: number) => setDeleteDialog(prev => {
    if (!prev) return prev;
    const next = new Set(prev.selected);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    return { ...prev, selected: next };
  });

  const confirmDeletePassengers = () => {
    if (!deleteDialog) return;
    const { section, newValue, selected } = deleteDialog;
    setPassengers(prev => prev.filter((_, i) => !selected.has(i)));
    if (section === 'PS') setVipPS(newValue); else setVipLD(newValue);
    setDeleteDialog(null);
  };

  // ─── Limousine handlers ───────────────────────────────────────────────────────
  const addLimoStop    = () => setLimoStops(prev => [...prev, { id: Date.now(), type: 'Destination', location: '' }]);
  const removeLimoStop = (id: number) => setLimoStops(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  const updateLimoStop = (id: number, field: keyof LimoStop, value: string) =>
    setLimoStops(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  // ─── Promo handlers ───────────────────────────────────────────────────────────
  // Controlled path: forward code to wrapper (API validate + set promoApplied).
  // Uncontrolled path: local mock apply for standalone figma previews.
  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      if (isPromoControlled) {
        void onApplyPromo?.('');
      } else {
        setLocalPromoError('Please enter a promo or redemption code.');
      }
      return;
    }
    if (isPromoControlled) {
      void onApplyPromo?.(code);
      return;
    }
    setLocalPromoApplied({
      code,
      label: code,
      discountPct: 10,
      benefit: '10% off',
    });
    setLocalPromoError('');
    setPromoInput('');
  };

  // Clear input after a successful controlled apply so re-open of the
  // entry field starts blank if the user later removes the code.
  useEffect(() => {
    if (isPromoControlled && promoApplied) {
      setPromoInput('');
    }
  }, [isPromoControlled, promoApplied]);

  // ─── Validation ──────────────────────────────────────────────────────────────
  // Round 6.2.31 (2026-06-10) — capacity chip now matches the
  // backend's Note 5 cap sum (PricingService L294). Both sides
  // use `vipPS + nonFlyingPS` only. Pre-6.2.31 the backend
  // added `childrenUnder2` and `childrenAge2To11` to the
  // capacity sum, double-counting every child / infant NFG
  // (once in `nonFlyingGuests`, again in `childrenUnder2` /
  // `childrenAge2To11`). Sky's directive 2026-06-10: "3 個
  // NFG 全部係嬰兒，應該 count 1 VIP + 3 capacity from 3
  // infants = 4 / 6" — i.e. each infant IS one capacity
  // (because the NFG form slot represents one person), the
  // 3 slots are 3 people, capacity = 4, no cap warning. The
  // frontend chip must display the same number the backend
  // enforces.
  // 2026-06-24 (round 6.2.60) — "at least 1 adult" rule
  // (per Sky 2026-06-24 directive: "we need to ensure at
  // least 1 adult per PS / LD"). Pre-this-fix the form
  // checked `vipPS === 0` / `vipLD === 0` (any flying VIP —
  // adult, child, or infant). A booking with 0 adults + 2
  // children in PS was accepted. The new check counts adults
  // = vipPS - childrenAge2To11PS - childrenUnder2PS and
  // rejects when adult count = 0. Children/infants ride
  // along on an adult's location; an adult is the anchor
  // for the free block + cap + note 5. The 4 per-kind
  // children counts (computed at L994-997 in the live-
  // preview useEffect) are derived here independently for
  // the validation pass — both reads slice `passengers[]`
  // the same way (PS = indices 0..vipPS-1, LD = indices
  // vipPS..vipPS+vipLD-1), so the two numbers stay in
  // lockstep. The duplicate computation is intentional
  // (the L994-997 values are scoped to the useEffect).
  const validationIsChildAge = (g: { ageGroup?: string }) =>
    g?.ageGroup === 'Children (aged 2-11)'
    || g?.ageGroup === 'Children (aged 2 to 11)'
    || g?.ageGroup === 'Child';
  const validationIsInfantAge = (g: { ageGroup?: string }) =>
    g?.ageGroup === 'Infants (under 2 years old)'
    || g?.ageGroup === 'Infant';
  const psPaxForValidation = passengers.slice(0, vipPS);
  const ldPaxForValidation = passengers.slice(vipPS, vipPS + vipLD);
  const premiereKidsForValidation = psPaxForValidation.filter(validationIsChildAge).length;
  const premiereInfantsForValidation = psPaxForValidation.filter(validationIsInfantAge).length;
  const loungeKidsForValidation = ldPaxForValidation.filter(validationIsChildAge).length;
  const loungeInfantsForValidation = ldPaxForValidation.filter(validationIsInfantAge).length;
  const psMaxGuests       = numPremiereSuites * 6;
  const psTotalGuests     = vipPS + nonFlyingPS;
  const psOverCapacity    = numPremiereSuites > 0 && psTotalGuests > psMaxGuests;
  const psAdults          = vipPS - premiereKidsForValidation - premiereInfantsForValidation;
  const ldAdults          = vipLD - loungeKidsForValidation - loungeInfantsForValidation;
  const psNoAdult         = numPremiereSuites > 0 && psAdults < 1;
  const psGuestsNoSuite   = (vipPS > 0 || nonFlyingPS > 0) && numPremiereSuites === 0;
  const ldNonFlyingOver   = nonFlyingLD > 3;
  const ldNoAdult         = (assignedLoungeIds.length > 0 || vipLD > 0 || nonFlyingLD > 0) && ldAdults < 1;
  // 2026-07-16 — booking must have at least one flying guest
  // (VIP under PS and/or LD). Pre-this-fix 0 PS + 0 LD
  // (vipPS=0, vipLD=0) passed validation because per-kind
  // adult checks only fire when that product is already in
  // play (`numPremiereSuites > 0` / lounge context). Empty
  // product bookings were submittable from admin Create.
  const noFlyingGuest     = vipPS + vipLD < 1;

  const bookingGuestErrors: string[] = [];
  if (noFlyingGuest) {
    bookingGuestErrors.push(
      'At least 1 flying guest (VIP passenger) is required. Set VIP Passengers under Premiere Suite and/or Lounge Deluxe.',
    );
  }

  const psErrors: string[] = [];
  if (psGuestsNoSuite) psErrors.push('Quantity of Premiere Suite must be at least 1 when guests are assigned to it.');
  if (psNoAdult)       psErrors.push('At least 1 Adult passenger is required per Premiere Suite booking.');
  if (psOverCapacity)  psErrors.push(`Total guests (${psTotalGuests}) exceeds the maximum of ${psMaxGuests} (6 per suite × ${numPremiereSuites}).`);

  const ldErrors: string[] = [];
  if (ldNoAdult)       ldErrors.push('At least 1 Adult passenger is required for a Lounge Deluxe booking.');
  if (ldNonFlyingOver) ldErrors.push(`Non-Flying Guests (${nonFlyingLD}) exceeds the maximum of 3 per Lounge Deluxe booking.`);

  // 2026-07-17 — nationality (ISO alpha-2) required on every configured guest row.
  const configuredVip = passengers.slice(0, vipPS + vipLD);
  const configuredNfg = nonFlyingGuests.slice(0, nonFlyingPS + nonFlyingLD);
  const vipMissingNationality = configuredVip.some((p) => !isValidCountryCode(p.nationality));
  const nfgMissingNationality = configuredNfg.some((g) => !isValidCountryCode(g.nationality));
  if (vipMissingNationality) {
    bookingGuestErrors.push('Nationality is required for each VIP Passenger (select from the country list).');
  }
  if (nfgMissingNationality) {
    bookingGuestErrors.push('Nationality is required for each Non-Flying Guest (select from the country list).');
  }
  const nfgMissingChildAge = configuredNfg.some(
    (g) => g.ageGroup === 'Children (aged 2-11)'
      && (typeof g.age !== 'number' || g.age < 2 || g.age > 11),
  );
  if (nfgMissingChildAge) {
    bookingGuestErrors.push('Child exact age (2–11) is required for each child Non-Flying Guest.');
  }

  const hasGuestErrors = bookingGuestErrors.length > 0 || psErrors.length > 0 || ldErrors.length > 0;

  const focusField = (fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = (
      el.matches('input, select, button, textarea')
        ? el
        : el.querySelector('input, select, button, textarea')
    ) as HTMLElement | null;
    focusable?.focus?.();
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    type FieldIssue = { fieldId: string; key: string; label: string; message: string };
    const issues: FieldIssue[] = [];

    if (!accountType) {
      issues.push({
        fieldId: 'create-account-type',
        key: 'accountType',
        label: 'Account Type',
        message: 'Please select an account type.',
      });
    }
    if (!accountNumber.trim()) {
      issues.push({
        fieldId: 'create-account-number',
        key: 'accountNumber',
        label: 'Account Number',
        message: 'Please enter the account number.',
      });
    }
    if (!visitDate) {
      issues.push({
        fieldId: 'create-visit-date',
        key: 'visitDate',
        label: 'Visit Date',
        message: 'Please enter the visit date.',
      });
    }
    if (!visitTime) {
      issues.push({
        fieldId: 'create-visit-time',
        key: 'visitTime',
        label: 'Visit Time',
        message: 'Please enter the visit time.',
      });
    }
    if (!flightNo) {
      issues.push({
        fieldId: 'create-flight-no',
        key: 'flightNo',
        label: 'Flight Number',
        message: 'Please enter the flight number.',
      });
    }
    if (!flightTime) {
      issues.push({
        fieldId: 'create-flightTime',
        key: 'flightTime',
        label: 'Flight Time',
        message: 'Please enter the flight time.',
      });
    }
    // 2026-06-08 — Transit 2nd-leg pre-checks. The backend's
    // TransitLegsRule is the source of truth; these are UX guards
    // that prevent the user from submitting a clearly invalid
    // Transit payload.
    if (flightType === 'Transit') {
      if (!leg2ArrivalDate) {
        issues.push({
          fieldId: 'create-leg2-arrivalDate',
          key: 'leg2ArrivalDate',
          label: '2nd Leg Arrival Date & Time',
          message: 'Please enter the 2nd leg arrival date and time.',
        });
      }
      if (!leg2FlightNo) {
        issues.push({
          fieldId: 'create-leg2-flightNo',
          key: 'leg2FlightNo',
          label: '2nd Leg Flight Number',
          message: 'Please enter the 2nd leg flight number.',
        });
      }
      if (!leg2FlightTime) {
        issues.push({
          fieldId: 'create-leg2-flightTime',
          key: 'leg2FlightTime',
          label: '2nd Leg Flight Time',
          message: 'Please enter the 2nd leg flight time.',
        });
      }
      if (!leg2FlightClass) {
        issues.push({
          fieldId: 'create-leg2-flightClass',
          key: 'leg2FlightClass',
          label: '2nd Leg Flight Class',
          message: 'Please select the 2nd leg flight class.',
        });
      }
      if (transitGapError) {
        issues.push({
          fieldId: 'create-leg2-arrivalDate',
          key: 'transitGap',
          label: 'Transit Gap',
          message: transitGapError,
        });
      }
    }

    if (issues.length > 0) {
      const nextErrors: Record<string, string> = {};
      for (const issue of issues) nextErrors[issue.key] = issue.message;
      setFieldErrors(nextErrors);
      const labels = issues.map((i) => i.label);
      const sample = labels.slice(0, 5).join(', ');
      toast.error(
        `Please complete ${issues.length} required field${issues.length === 1 ? '' : 's'}`,
        {
          description: sample + (labels.length > 5 ? ` · …and ${labels.length - 5} more` : ''),
        },
      );
      focusField(issues[0].fieldId);
      return;
    }

    if (hasGuestErrors) {
      setFieldErrors({});
      const allGuest = [...bookingGuestErrors, ...psErrors, ...ldErrors];
      const scrollId = (bookingGuestErrors.length > 0 || psErrors.length > 0)
        ? 'create-premiere-suite-section'
        : 'create-lounge-deluxe-section';
      toast.error(allGuest[0] ?? 'Please fix the guest detail errors before submitting.', {
        description: allGuest.length > 1
          ? allGuest.slice(1, 3).join('\n') + (allGuest.length > 3 ? `\n…and ${allGuest.length - 3} more` : '')
          : undefined,
      });
      focusField(scrollId);
      return;
    }
    // Premiere Suite: cap assigned suites to numPremiereSuites.
    if (numPremiereSuites > 0 && assignedSuiteIds.length > numPremiereSuites) {
      toast.error(`Premiere Suite assignments (${assignedSuiteIds.length}) cannot exceed Quantity of Premiere Suite (${numPremiereSuites}).`);
      focusField('create-premiere-suite-section');
      return;
    }
    // 2026-06-28 (round 6.2.74) — Lounge Deluxe: cap assigned lounges
    // to vipLD (per "1 LD = 1 LDVIP" pricing rule). The UI prevents
    // over-assignment via disabled checkboxes, but the submit handler
    // belt-and-braces in case the user finds a way to bypass the UI
    // (e.g., legacy autofill, paste, etc.).
    if (vipLD > 0 && assignedLoungeIds.length > vipLD) {
      toast.error(`Lounge Deluxe assignments (${assignedLoungeIds.length}) cannot exceed Quantity of VIP Passengers (LD) (${vipLD}).`);
      focusField('create-lounge-deluxe-section');
      return;
    }

    setFieldErrors({});
    const formData: BookingFormData = {
      accountType,
      accountNumber,
      guestName,
      visitDate,
      visitTime,
      // 2026-06-08 round 6.2.2 — I-T-N1: emit `arrivalDate` (the
      // flight's date, was stuck in local state). Wrapper's
      // payload builder reads it for `legs[0].arrivalDate` on
      // Transit bookings. Without this emit, the wrapper's own
      // `arrivalDate` useState stays `''` → legs[0].arrivalDate
      // = undefined → backend 422.
      arrivalDate,
      flightType,
      flightNo,
      flightTime,
      flightOrigin,
      flightDestination,
      numberOfLuggage,
      flightClass,
      numPremiereSuites,
      // 2026-06-23 — LD quantity is derived from vipLD (1 LD = 1
      // LDVIP). Wrapper still reads this flat key for the
      // advanced_details.loungeSuites block + live price preview.
      numLoungeDeluxe,
      vipPS,
      nonFlyingPS,
      vipLD,
      nonFlyingLD,
      passengers,
      nonFlyingGuests,
      contactName,
      contactEmail,
      // 2026-06-23 — region code for the contact phone (e.g. '852').
      // The number part `contactNo` is filtered to digits + '-'
      // only via `filterContactNumber` on input. Wrapper combines
      // `regionCode + ' ' + contactNo` for `guest_phone` on submit.
      regionCode,
      contactNo,
      promoCode: promoApplied?.code ?? '',
      specialRequests,
      paymentMode,
      selectedAddonKeys,
      assignedSuiteIds,
      assignedLoungeIds,
      // 2026-06-08 — Transit 2nd leg. Emitted as undefined when
      // flightType !== 'Transit' so the wrapper can drop them from
      // the payload (the backend's `required_if:flight_type,Transit`
      // rule will only fire when flight_type is Transit).
      leg2ArrivalDate: flightType === 'Transit' ? leg2ArrivalDate : undefined,
      leg2FlightNo:    flightType === 'Transit' ? leg2FlightNo : undefined,
      leg2FlightTime:  flightType === 'Transit' ? leg2FlightTime : undefined,
      leg2FlightClass: flightType === 'Transit' ? leg2FlightClass : undefined,
      transitGapError: transitGapError,
      // 2026-06-09 — staff override of the auto-derived account discount.
      // `''` (untouched) = no override → wrapper falls back to tier/agency default.
      accountDiscountPct: accountDiscountPct === '' ? undefined : accountDiscountPct,
      // Round 6.2.139 — free membership credit opt-in (default true).
      useMembershipLdFree,
      useMembershipPsFree,
    };
    onSubmit?.(formData);
  };

  const mockPaymentModeOptions = (): PaymentMode[] => {
    if (accountType === 'Individual')    return ['Upfront', 'Net Upfront'];
    if (accountType === 'Corporate')     return ['Bulk Purchase/Monthly Invoice'];
    if (accountType === 'Agency') return ['Upfront', 'Net Upfront', 'On-Credit'];
    return ['Upfront', 'Net Upfront', 'On-Credit', 'Bulk Purchase/Monthly Invoice'];
  };
  const resolvedPaymentModeOptions = (): PaymentMode[] => {
    if (paymentModeOptionsProp && paymentModeOptionsProp.length > 0) {
      return paymentModeOptionsProp;
    }
    return mockPaymentModeOptions();
  };

  // Dev Quick Fill — inject modal values into local form state.
  // Remove with `renderDevQuickFill` + `__dev__` folder before pentest.
  const applyDevQuickFill = (payload: CreateBookingDevQuickFillPayload) => {
    setAccountType(payload.accountType);
    setAccountNumber(payload.accountNumber);
    setPaymentMode(payload.paymentMode);
    setFlightType(payload.flightType);
    setArrivalDate(payload.departureDate);
    setFlightNo(payload.flightNo);
    setFlightTime(payload.flightTime);
    setVisitDate(payload.visitDate || payload.departureDate);
    setVisitTime(payload.visitTime);

    const premiereSuiteQty = Math.max(0, payload.premiereSuiteQty || 0);
    const premiereVipQty = Math.max(0, payload.premiereVipQty || 0);
    const loungeVipQty = Math.max(0, payload.loungeVipQty || 0);
    const totalVips = premiereVipQty + loungeVipQty;

    setNumPremiereSuites(premiereSuiteQty);
    setVipPS(premiereVipQty);
    setVipLD(loungeVipQty);
    prevVipPSRef.current = premiereVipQty;
    prevVipLDRef.current = loungeVipQty;

    const lastNameBase = payload.passengerLastNameTemplate.trim() || 'Guest';
    const docNoBase = payload.passengerTravelDocNo.trim() || 'doc';

    const generatedVips = Array.from({ length: totalVips }, (_, index) => ({
      ...emptyPassenger(),
      title: payload.passengerTitle,
      firstName: payload.passengerFirstName,
      lastName: `${lastNameBase} ${index + 1}`,
      travelDocNo: `${docNoBase}-${index + 1}`,
      ageGroup: payload.passengerAgeGroup,
      birthdayDay: payload.passengerBirthdayDay,
      birthdayMonth: payload.passengerBirthdayMonth,
      birthdayYear: payload.passengerBirthdayYear,
      nationality: payload.passengerNationality,
      foodAllergies: '',
    }));

    setPassengers(generatedVips);

    const normalizeName = (value: string) => value.trim().toLowerCase();
    const suiteNameSet = new Set(payload.assignedPhysicalSuites.map(normalizeName));
    const loungeNameSet = new Set(payload.assignedLobbySeats.map(normalizeName));

    const resolvedSuiteIds = physicalSuites
      .filter((s) => suiteNameSet.has(normalizeName(s.suite_name)))
      .map((s) => s.id);
    const resolvedLoungeIds = physicalLounges
      .filter((l) => loungeNameSet.has(normalizeName(l.suite_name)))
      .map((l) => l.id);

    if (setAssignedSuiteIds) {
      setAssignedSuiteIds(resolvedSuiteIds.slice(0, premiereSuiteQty));
    }
    if (setAssignedLoungeIds) {
      setAssignedLoungeIds(resolvedLoungeIds.slice(0, loungeVipQty));
    }

    setFieldErrors({});
    setShowAccountDropdown?.(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Create New Booking</h1>
          <p className="text-gray-600">Create a lounge booking for a customer</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Round 6.2.30 (2026-06-10) — Quick Fill Demo button
              removed (both here in the figma-ui submodule and
              the wrapper's `handleQuickFill` function — see
              round 6.2.30 commit). The wrapper's
              `VITE_ENABLE_BOOKING_QUICK_FILL` env-var guard
              already protected production, but the button
              was still rendered in admin and clashed with
              the new server-fetched Booking No. chip. The
              original button JSX is preserved in commit
              `0b02235` for reference if a local dev demo is
              ever needed. */}
          <div className="text-right">
            {bookingNo ? (
              <>
                <p className="text-xs text-gray-400">Booking No.</p>
                <p className="font-mono text-sm text-[#0f2942]">
                  {bookingNo}
                </p>
              </>
            ) : null}
            {typeof renderDevQuickFill === 'function'
              ? renderDevQuickFill({
                  apply: applyDevQuickFill,
                  accountSearchResults,
                  accountSearchLoading,
                  onAccountSearch,
                  onAccountSelect,
                  setShowAccountDropdown,
                })
              : null}
          </div>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>

        {/* ════════════════════════════════════════
            1. ACCOUNT & GUEST INFORMATION
            ════════════════════════════════════════ */}
        <Card className="p-6">
          <h2 className="mb-1">Account &amp; Guest Information</h2>
          <p className="text-sm text-gray-500 mb-6">
            Select account type and enter guest details. Agency accounts auto-apply their default discount rate.
          </p>

          {/* Account Type */}
          <div className="mb-6" id="create-account-type">
            <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Account Type <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-4">
              {(['Individual', 'Corporate', 'Agency'] as const).map(type => (
                <button key={type} type="button"
                  onClick={() => { setAccountType(type); setSelectedAgencyCode(''); setMembershipTier(''); setCompanyName(''); setPaymentMode(''); setFieldErrors((prev) => { const n = { ...prev }; delete n.accountType; return n; }); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center ${accountType === type ? 'border-[#0f2942] bg-[#0f2942]/5 text-[#0f2942]' : fieldErrors.accountType ? 'border-red-400 bg-red-50 text-gray-600' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${accountType === type ? 'bg-[#0f2942] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {type === 'Individual' && <User className="w-5 h-5" />}
                    {type === 'Corporate' && <Building2 className="w-5 h-5" />}
                    {type === 'Agency' && <Plane className="w-5 h-5" />}
                  </div>
                  <span className="text-sm font-medium">{type}</span>
                  {type === 'Agency' && <span className="text-xs text-green-600 flex items-center gap-1"><BadgePercent className="w-3 h-3" />Discount auto-applies</span>}
                </button>
              ))}
            </div>
            {fieldErrors.accountType && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1" role="alert">
                <AlertCircle className="w-3 h-3" />{fieldErrors.accountType}
              </p>
            )}
          </div>

          {/* Travel Agency — linked travel_agency row, not Agency type (D2). */}
          {showTravelAgency && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Travel Agency</label>
                {selectedAccount?.travel_agency?.[0] ? (
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 flex items-center gap-2 text-gray-700">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{selectedAccount.travel_agency[0].agency_name}</span>
                    <span className="text-xs text-gray-500">({selectedAccount.travel_agency[0].agency_code})</span>
                    {typeof selectedAccount.travel_agency[0].discount_rate === 'number' && (
                      <Badge className="ml-2 bg-green-100 text-green-800 text-xs px-1.5 py-0">{Number(selectedAccount.travel_agency[0].discount_rate)}% off</Badge>
                    )}
                  </div>
                ) : (
                  <div className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500 italic">
                    Search and select an account with a linked travel agency — the agency cannot be chosen ad-hoc.
                  </div>
                )}
              </div>
              {selectedAgency && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Default Discount Automatically Applied</p>
                    <p className="text-sm text-green-700 mt-0.5">
                      <strong>{selectedAgency.name}</strong> ({selectedAgency.code}) — <strong>{selectedAgency.discountRate}%</strong> off
                      {selectedAgency.paymentMethod ? <> · Payment: <strong>{selectedAgency.paymentMethod}</strong></> : null}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Credit card — credit facility / numbers, not Agency type (D2 / D6). */}
          {showAccountCredit && selectedAccount && (
            <div className="mb-6">
              <div
                className="rounded-lg border border-purple-200 bg-purple-50 p-4 flex items-start gap-3"
                data-testid="create-booking-agency-credit-card"
              >
                <BadgePercent className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-800">Account Credit Balance</p>
                  {(() => {
                    const balance = Number(selectedAccount.credit_balance) || 0;
                    const onHold = Number(selectedAccount.credit_on_hold ?? 0) || 0;
                    const limit = Number(selectedAccount.credit_limit ?? 0) || 0;
                    const available = balance - onHold + limit;
                    const fmt = (n: number) =>
                      n.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      });
                    return (
                      <>
                        <p className="text-sm text-purple-700 mt-0.5">
                          Available:{' '}
                          <strong data-testid="create-booking-credit-available">
                            HKD {fmt(available)}
                          </strong>
                          <span className="text-purple-600/90" data-testid="create-booking-credit-balance">
                            {' '}· Balance HKD {fmt(balance)}
                          </span>
                          {onHold > 0 ? (
                            <span className="text-purple-600/90" data-testid="create-booking-credit-on-hold">
                              {' '}· On hold HKD {fmt(onHold)}
                            </span>
                          ) : null}
                          {limit > 0 ? (
                            <span className="text-purple-600/90" data-testid="create-booking-credit-limit">
                              {' '}· Limit HKD {fmt(limit)}
                            </span>
                          ) : null}
                        </p>
                        {(paymentMode === 'On-Credit' || paymentMode === 'Bulk Purchase/Monthly Invoice') && (
                          <p className="text-xs text-purple-600 mt-1">
                            OnCredit places a <strong>hold at create</strong>; balance is captured when the
                            booking is <strong>Approved</strong>. Available already subtracts open holds.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Core Guest Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Account Number <span className="text-red-500">*</span></label>
              {accountSearchResults !== undefined ? (
                <div className="relative">
                  <input type="text"
                    id="create-account-number"
                    value={accountNumber}
                    onChange={e => { setAccountNumber(e.target.value); onAccountSearch?.(e.target.value); setFieldErrors((prev) => { if (!prev.accountNumber) return prev; const n = { ...prev }; delete n.accountNumber; return n; }); }}
                    onFocus={() => { onAccountSearch?.(accountNumber); setShowAccountDropdown(true); }}
                    placeholder="Search account number or name…"
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${fieldErrors.accountNumber ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                  {showAccountDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 max-h-52 overflow-y-auto">
                      {accountSearchLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Searching…</div>
                      ) : accountSearchResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No accounts found</div>
                      ) : accountSearchResults.map(acc => (
                        <button key={acc.id} type="button"
                          onMouseDown={e => { e.preventDefault(); setAccountNumber(acc.accountNumber); setAccountType(acc.type); setShowAccountDropdown(false); if (onAccountSelect) onAccountSelect(acc); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors">
                          <span className="text-xs font-mono text-gray-500 w-32 shrink-0">{acc.accountNumber}</span>
                          <span className="text-sm font-medium text-gray-900">{acc.name}</span>
                          <span className="ml-auto text-xs text-gray-400">{acc.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input type="text" id="create-account-number" value={accountNumber}
                  onChange={e => { setAccountNumber(e.target.value); onAccountSearch?.(e.target.value); setFieldErrors((prev) => { if (!prev.accountNumber) return prev; const n = { ...prev }; delete n.accountNumber; return n; }); }}
                  placeholder="e.g. ACC-2024-0012"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${fieldErrors.accountNumber ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
              )}
              {fieldErrors.accountNumber && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.accountNumber}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Search Guest</label>
              <div className="relative">
                <input type="text"
                  value={guestName}
                  onChange={e => { setGuestName(e.target.value); onGuestSearch?.(e.target.value); }}
                  onFocus={() => { setGuestSearchFocused(true); setShowGuestDropdown(true); if (guestName.length >= 1) onGuestSearch?.(guestName); }}
                  onBlur={() => setTimeout(() => setGuestSearchFocused(false), 200)}
                  placeholder="Search by name, phone, or email…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                {(showGuestDropdown || guestSearchFocused) && guestSearchResults !== undefined && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 max-h-52 overflow-y-auto">
                    {guestSearchLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">Searching…</div>
                    ) : guestSearchResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No guests found</div>
                    ) : guestSearchResults.map(acc => (
                      <button key={acc.id} type="button"
                        onMouseDown={e => { e.preventDefault(); setGuestName(acc.name); setAccountNumber(acc.accountNumber); setAccountType(acc.type); setShowGuestDropdown(false); setGuestSearchFocused(false); if (onGuestSearchSelect) onGuestSearchSelect(acc); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors">
                        <span className="text-xs font-mono text-gray-500 w-32 shrink-0">{acc.accountNumber}</span>
                        <span className="text-sm font-medium text-gray-900">{acc.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{acc.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2 grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block" style={{ marginBottom: '4px' }}>First Name</label>
                  <input type="text" value={selectedAccount?.first_name || ''} readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block" style={{ marginBottom: '4px' }}>Last Name</label>
                  <input type="text" value={selectedAccount?.last_name || ''} readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block" style={{ marginBottom: '4px' }}>Contact Number</label>
                  <input type="text" value={selectedAccount?.phone || ''} readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block" style={{ marginBottom: '4px' }}>E-mail</label>
                  <input type="text" value={selectedAccount?.email || ''} readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50" />
                </div>
              </div>
            {showCompanyName && (
              <div className="col-span-2">
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="Account company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            )}
            {showMembershipBenefits && (
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Membership Tier</label>
                <Select value={membershipTier} onValueChange={v => setMembershipTier(v as MembershipTier)} disabled={!!selectedAccount}>
                  <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                  <SelectContent>
                    {(['Gold', 'Platinum', 'Diamond', 'Sapphire'] as MembershipTier[]).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showMembershipBenefits && selectedAccount && (
              <div className="col-span-2 rounded-md border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                <p className="text-sm font-medium text-[#0f2942] mb-2">Membership benefits</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Free LD entries left</span>
                    <p className="font-semibold text-[#0f2942]" data-testid="membership-ld-remaining">
                      {formatMembershipQuota(selectedAccount.ld_entries_remaining)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Free PS upgrades left</span>
                    <p className="font-semibold text-[#0f2942]" data-testid="membership-ps-remaining">
                      {formatMembershipQuota(selectedAccount.ps_free_upgrades_remaining)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      data-testid="use-membership-ld-free"
                      checked={useMembershipLdFree}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setUseMembershipLdFree(on);
                        if (!on) setUseMembershipPsFree(false);
                      }}
                    />
                    <span>
                      <span className="font-medium text-[#0f2942]">Use free LD entry credit</span>
                      <span className="block text-xs text-gray-500">Pure LD: waive 1 LD base. Pure PS paid 40% off also requires this credit (burns 1 LD). Mixed + free PS: this is the dual-quota ticket, not a second LD waive.</span>
                    </span>
                  </label>
                  <label className={`flex items-start gap-2 text-sm ${(numPremiereSuites > 0 || vipPS > 0 || nonFlyingPS > 0) && useMembershipLdFree ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      data-testid="use-membership-ps-free"
                      checked={useMembershipPsFree}
                      disabled={
                        !((numPremiereSuites > 0 || vipPS > 0 || nonFlyingPS > 0) && useMembershipLdFree)
                      }
                      onChange={(e) => setUseMembershipPsFree(e.target.checked)}
                    />
                    <span>
                      <span className="font-medium text-[#0f2942]">Use free PS upgrade credit</span>
                      <span className="block text-xs text-gray-500">
                        Only when this booking includes Premiere Suite, and only together with the LD credit above (cannot use free PS alone). Mixed: free PS only — LD room stays charged.
                        {!(numPremiereSuites > 0 || vipPS > 0 || nonFlyingPS > 0) ? ' Add a Premiere Suite first.' : ''}
                        {(numPremiereSuites > 0 || vipPS > 0 || nonFlyingPS > 0) && !useMembershipLdFree ? ' Check LD credit first.' : ''}
                      </span>
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Uncheck to keep the credit unused for this booking. No tier % discount.
                </p>
              </div>
            )}
            <div id="create-payment-mode">
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Payment Mode <span className="text-red-500">*</span></label>
              <Select value={paymentMode} onValueChange={v => { setPaymentMode(v as PaymentMode); setFieldErrors((prev) => { if (!prev.paymentMode) return prev; const n = { ...prev }; delete n.paymentMode; return n; }); }}>
                <SelectTrigger className={fieldErrors.paymentMode ? 'border-red-400 bg-red-50' : undefined}><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                <SelectContent>
                  {resolvedPaymentModeOptions().map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.paymentMode && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.paymentMode}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Booking Channel</label>
              <div className="flex gap-3">
                {(['Online', 'Email/Call to HKIAL'] as const).map(ch => (
                  <button key={ch} type="button"
                    onClick={() => setBookingChannel(ch)}
                    className={`flex-1 px-3 py-2 rounded-md border text-sm transition-colors ${bookingChannel === ch ? 'border-[#0f2942] bg-[#0f2942] text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                  >{ch}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Account Discount</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={100} step={1}
                  value={accountDiscountPct}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') { setAccountDiscountPct(''); return; }
                    const n = Number(raw);
                    if (Number.isFinite(n)) setAccountDiscountPct(Math.max(0, Math.min(100, n)));
                  }}
                  placeholder={selectedAgency ? `${selectedAgency.discountRate}% (Agency Default)` : '0'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedAgency
                  ? <>Default {selectedAgency.discountRate}% (Agency){accountDiscountPct !== '' && <> · override {accountDiscountPct}%</>}</>
                  : showMembershipBenefits
                    ? <>Optional staff override only — members use free LD / PS upgrade benefits, not a tier %</>
                    : <>Optional staff override{accountDiscountPct !== '' && <> · {accountDiscountPct}%</>}</>}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Account Remark</label>
              <input type="text" value={accountRemark} onChange={e => setAccountRemark(e.target.value)}
                placeholder="e.g. VIP Member – Priority Service"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div className="flex items-center gap-3 col-span-2 pt-1">
              <Checkbox id="adhoc" checked={isAdHoc} onCheckedChange={v => setIsAdHoc(v as boolean)} />
              <label htmlFor="adhoc" className="cursor-pointer text-sm">
                <span className="font-medium">Mark as Ad-hoc / Urgent Booking</span>
                <span className="text-gray-500 ml-2">(booking submitted within 48-hour cut-off window)</span>
              </label>
              {isAdHoc && <Badge className="bg-amber-100 text-amber-700 border border-amber-200 ml-1">Ad-hoc</Badge>}
            </div>
          </div>
        </Card>

        {/* ════════════════════════════════════════
            2. FLIGHT INFORMATION
            ════════════════════════════════════════ */}
        <Card className="p-6">
          <h2 className="mb-6">Flight Information</h2>

          {/* Row 1 — Flight Type · Flight Date */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Flight Type */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Type <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {([
                  { type: 'Arrival'    as FlightType, activeClass: 'bg-emerald-600 border-emerald-600 text-white', iconClass: '-rotate-45' },
                  { type: 'Departure'  as FlightType, activeClass: 'bg-rose-600    border-rose-600    text-white', iconClass: 'rotate-45'  },
                  ...(showTransit ? [{ type: 'Transit' as FlightType, activeClass: 'bg-sky-600 border-sky-600 text-white', iconClass: 'rotate-90' }] : []),
                ]).map(({ type: ft, activeClass, iconClass }) => (
                  <button key={ft} type="button"
                    onClick={() => setFlightType(ft)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors ${
                      flightType === ft ? activeClass : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Plane className={`w-3.5 h-3.5 ${iconClass}`} />
                    {ft}
                  </button>
                ))}
              </div>
            </div>

            {/* Flight Date — label changes with type */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>
                {flightType === 'Arrival' ? 'Arrival Date' : flightType === 'Departure' ? 'Departure Date' : 'Flight Date'}
              </label>
              <input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)}
                className={dateInputClassName(arrivalDate)} />
            </div>
          </div>

          {/* Row 2 — Flight Number · Flight Time · Origin */}
          <div className="grid grid-cols-3 gap-6 mb-6">

            {/* Flight Number */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Number <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Plane className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" id="create-flight-no" value={flightNo}
                    onChange={e => { setFlightNo(e.target.value.toUpperCase()); setFieldErrors((prev) => { if (!prev.flightNo) return prev; const n = { ...prev }; delete n.flightNo; return n; }); }}
                    placeholder="e.g. CX880"
                    className={`w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${fieldErrors.flightNo ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                </div>
                {onFlightLookup ? (
                  <button
                    type="button"
                    data-testid="create-flight-lookup"
                    disabled={flightLookupLoading || !flightNo.trim() || !arrivalDate}
                    title={!arrivalDate ? 'Select flight date first' : 'Lookup flight details'}
                    onClick={async () => {
                      if (!onFlightLookup || !flightNo.trim() || !arrivalDate) return;
                      setFlightLookupLoading(true);
                      try {
                        const result = await onFlightLookup({
                          flightNo: flightNo.trim(),
                          flightDate: arrivalDate,
                          flightType,
                        });
                        if (!result) return;
                        if (result.flightNo) setFlightNo(result.flightNo.toUpperCase());
                        if (result.flightDate) setArrivalDate(result.flightDate);
                        if (result.flightTime) {
                          setFlightTime(result.flightTime);
                          setFieldErrors((prev) => {
                            if (!prev.flightTime && !prev.flightNo) return prev;
                            const n = { ...prev };
                            delete n.flightTime;
                            delete n.flightNo;
                            return n;
                          });
                        }
                        if (result.origin) setFlightOrigin(result.origin);
                        if (result.destination) setFlightDestination(result.destination);
                      } finally {
                        setFlightLookupLoading(false);
                      }
                    }}
                    className="shrink-0 px-3 py-2 text-sm font-medium border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    {flightLookupLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Search className="w-3.5 h-3.5" />}
                    Lookup
                  </button>
                ) : null}
              </div>
              {fieldErrors.flightNo && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.flightNo}
                </p>
              )}
            </div>

            {/* Flight Time */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Time (STD/STA) <span className="text-red-500">*</span></label>
              {/* 2026-07-07 (round 6.2.121) — Sky's Safari/Firefox
                  timepicker fix: replaced the native `<input type="time">`
                  (which ignored `step={300}` on Chrome/Safari AND had
                  buggy `min`/`max` enforcement on Firefox) with the
                  customer-side `Time5MinSelect` 2-column HH/MM select
                  pattern (ported from
                  `frontend/src/components/figma-ui/src/app/components/NewBooking.tsx:375`).
                  Step is now hard-coded to 5 minutes via 12 fixed
                  minute options (00, 05, 10, … 55). */}
              <Time5MinSelect
                id="create-flightTime"
                value={flightTime}
                onChange={(v) => { setFlightTime(v); setFieldErrors((prev) => { if (!prev.flightTime) return prev; const n = { ...prev }; delete n.flightTime; return n; }); }}
                wrapperClassName={`w-full px-3 py-2 border rounded-md text-sm focus-within:ring-2 focus-within:ring-blue-300 ${fieldErrors.flightTime ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                testId="create-flightTime"
              />
              {fieldErrors.flightTime && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.flightTime}
                </p>
              )}
            </div>

            {/* Origin — IATA typeahead (city / code search; stores 3-letter code) */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }} htmlFor="create-flight-origin">
                Origin (IATA)
              </label>
              <AirportTypeahead
                id="create-flight-origin"
                value={flightOrigin}
                onChange={setFlightOrigin}
                placeholder="Search IATA or city (e.g. LHR)"
                data-testid="create-flight-origin"
              />
            </div>
          </div>

          {/* Row 3 — Destination (optional for Transition) · Luggage · Flight Class */}
          <div className="grid grid-cols-3 gap-6">

            {/* Destination — IATA typeahead (city / code search; stores 3-letter code) */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }} htmlFor="create-flight-destination">
                Destination (IATA)
                {showTransit && flightType === 'Transit'
                  ? <span className="ml-2 text-xs font-normal text-gray-400">— optional</span>
                  : null
                }
              </label>
              <AirportTypeahead
                id="create-flight-destination"
                value={flightDestination}
                onChange={setFlightDestination}
                placeholder={showTransit && flightType === 'Transit' ? 'May be unknown' : 'Search IATA or city (e.g. HKG)'}
                data-testid="create-flight-destination"
              />
              {showTransit && flightType === 'Transit' && (
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  Final destination may not be identifiable from the transit flight number.
                </p>
              )}
            </div>

            {/* Luggage */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Number of Luggage</label>
              <div className="relative">
                <Luggage className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" min={0} value={numberOfLuggage}
                  onChange={e => setNumberOfLuggage(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>

            {/* Flight Class */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Class (Main VIP Passenger)</label>
              <Select value={flightClass} onValueChange={v => setFlightClass(v as FlightClass)}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy Class">Economy Class</SelectItem>
                  <SelectItem value="Business Class">Business Class</SelectItem>
                  <SelectItem value="First Class">
                    <span className="flex items-center gap-2"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />First Class</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2026-06-08 — Transit 2nd-leg block (I-T2, I-T3, I-T5).
              Visible only when flightType === 'Transit'. The 4 fields
              mirror the 1st leg above, plus a live 6h gap pre-check that
              shows the error inline and disables submit via
              `transitGapError`. The backend's TransitLegsRule is the
              source of truth; this is the UX layer that prevents the
              user from even trying to submit a < 6h gap.
              2026-06-30 — also gated on `showTransit` so the block
              disappears when the wrapper opts out of Transit. */}
          {showTransit && flightType === 'Transit' && (
            <div className="mt-6 pt-6 border-t border-gray-200" data-testid="transit-leg2-block">
              <h3 className="text-sm font-semibold text-sky-700 mb-1">2nd Flight (Outbound) <span className="text-red-500">*</span></h3>
              <p className="text-xs text-gray-500 mb-4">
                The 2nd leg of your transit. The 1st leg (above) is your inbound to HKG; this is your outbound.
                Gap between leg 1 arrival and leg 2 arrival must be at least 6 hours.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Leg 2 Arrival Date &amp; Time <span className="text-red-500">*</span></label>
                  <input
                    id="create-leg2-arrivalDate"
                    type="datetime-local"
                    value={leg2ArrivalDate}
                    onChange={e => {
                      setLeg2ArrivalDate(e.target.value);
                      setFieldErrors((prev) => {
                        if (!prev.leg2ArrivalDate && !prev.transitGap) return prev;
                        const n = { ...prev };
                        delete n.leg2ArrivalDate;
                        delete n.transitGap;
                        return n;
                      });
                      // 2026-06-08 — recompute gap error on change
                      // (live UX pre-check; backend is the source of truth).
                      if (flightType !== 'Transit') { setTransitGapError(null); return; }
                      const l0 = arrivalDate ? new Date(arrivalDate) : null;
                      const l1 = e.target.value ? new Date(e.target.value) : null;
                      if (!l0 || !l1 || isNaN(l0.getTime()) || isNaN(l1.getTime())) {
                        setTransitGapError(null);
                        return;
                      }
                      const diffMs = l1.getTime() - l0.getTime();
                      const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
                      if (diffMs < SIX_HOURS_MS) {
                        const hours = Math.floor(diffMs / 3600000);
                        const mins = Math.floor((diffMs % 3600000) / 60000);
                        setTransitGapError(`Transit gap must be at least 6 hours (got ${hours}h ${mins}m). Please pick a later outbound leg.`);
                      } else {
                        setTransitGapError(null);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${fieldErrors.leg2ArrivalDate || fieldErrors.transitGap ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    data-testid="leg2-arrivalDate"
                  />
                  {(fieldErrors.leg2ArrivalDate || fieldErrors.transitGap) && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3 h-3" />{fieldErrors.leg2ArrivalDate || fieldErrors.transitGap}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Leg 2 Flight Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Plane className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="create-leg2-flightNo"
                      type="text"
                      value={leg2FlightNo}
                      onChange={e => { setLeg2FlightNo(e.target.value.toUpperCase()); setFieldErrors((prev) => { if (!prev.leg2FlightNo) return prev; const n = { ...prev }; delete n.leg2FlightNo; return n; }); }}
                      placeholder="e.g. CX889"
                      data-testid="leg2-flightNo"
                      className={`w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${fieldErrors.leg2FlightNo ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                  </div>
                  {fieldErrors.leg2FlightNo && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3 h-3" />{fieldErrors.leg2FlightNo}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Leg 2 Flight Time (STD) <span className="text-red-500">*</span></label>
                  {/* 2026-07-07 (round 6.2.121) — see comment on the
                      leg-1 Flight Time cell above. Same Safari/Firefox
                      fix. `testId="leg2-flightTime"` is preserved so
                      Playwright e2e selectors that grep for it keep
                      working. */}
                  <Time5MinSelect
                    id="create-leg2-flightTime"
                    value={leg2FlightTime}
                    onChange={(v) => { setLeg2FlightTime(v); setFieldErrors((prev) => { if (!prev.leg2FlightTime) return prev; const n = { ...prev }; delete n.leg2FlightTime; return n; }); }}
                    wrapperClassName={`w-full px-3 py-2 border rounded-md text-sm focus-within:ring-2 focus-within:ring-blue-300 ${fieldErrors.leg2FlightTime ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    testId="leg2-flightTime"
                  />
                  {fieldErrors.leg2FlightTime && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3 h-3" />{fieldErrors.leg2FlightTime}
                    </p>
                  )}
                </div>
                <div id="create-leg2-flightClass">
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Leg 2 Flight Class <span className="text-red-500">*</span></label>
                  <Select value={leg2FlightClass} onValueChange={v => { setLeg2FlightClass(v as FlightClass); setFieldErrors((prev) => { if (!prev.leg2FlightClass) return prev; const n = { ...prev }; delete n.leg2FlightClass; return n; }); }}>
                    <SelectTrigger data-testid="leg2-flightClass" className={fieldErrors.leg2FlightClass ? 'border-red-400 bg-red-50' : undefined}><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Economy Class">Economy Class</SelectItem>
                      <SelectItem value="Business Class">Business Class</SelectItem>
                      <SelectItem value="First Class">
                        <span className="flex items-center gap-2"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />First Class</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.leg2FlightClass && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3 h-3" />{fieldErrors.leg2FlightClass}
                    </p>
                  )}
                </div>
              </div>
              {transitGapError && (
                <p className="text-sm text-red-600 mt-3 flex items-center gap-1.5" data-testid="transit-gap-error" role="alert">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  {transitGapError}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* ════════════════════════════════════════
            3. BOOKING DETAILS
            ════════════════════════════════════════ */}
        <Card className="p-6">
          <h2 className="mb-6">Booking Details</h2>

          {/* Visit Date / Time */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Visit Date <span className="text-red-500">*</span></label>
              <input type="date" id="create-visit-date" value={visitDate}
                onChange={e => { setVisitDate(e.target.value); setFieldErrors((prev) => { if (!prev.visitDate) return prev; const n = { ...prev }; delete n.visitDate; return n; }); }}
                className={`${dateInputClassName(visitDate)}${fieldErrors.visitDate ? ' border-red-400 bg-red-50' : ''}`} />
              {fieldErrors.visitDate && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" />{fieldErrors.visitDate}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Visit Time <span className="text-red-500">*</span></label>
              {/* 2026-07-07 (round 6.2.121) — Sky's Safari/Firefox
                  timepicker fix: swapped the native `<input type="time">`
                  (with `min`/`max` that didn't work on Safari/Firefox
                  for the 3h rule constraint) for the customer-side
                  `Time5MinSelect`. The `min`/`max` UX is dropped — the
                  3h rule is still enforced via `visitTimeRangeError` +
                  the red border + the master submit-disabled gate at
                  line 3163. `testId="create-visit-time"` is preserved
                  so Playwright e2e selectors keep working, but the
                  element is now a `<div>` (not `<input>`) — tests that
                  previously did `querySelector('input[type="time"][data-testid="create-visit-time"]')`
                  need to update to `querySelector('[data-testid="create-visit-time"]')`.
                  (No figma-ui tests target that testId today.) */}
              <Time5MinSelect
                id="create-visit-time"
                value={visitTime}
                onChange={(v) => { setVisitTime(v); setFieldErrors((prev) => { if (!prev.visitTime) return prev; const n = { ...prev }; delete n.visitTime; return n; }); }}
                required
                wrapperClassName={`w-full px-3 py-2 border rounded-md text-sm focus-within:ring-2 focus-within:ring-blue-300 ${
                  visitTimeRangeError || fieldErrors.visitTime ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                testId="create-visit-time"
              />
              {(visitTimeRangeError || fieldErrors.visitTime) && (
                <p className="text-xs text-red-600 mt-1 flex items-start gap-1" data-testid="create-visit-time-error" role="alert">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{visitTimeRangeError || fieldErrors.visitTime}</span>
                </p>
              )}
            </div>
          </div>

          {/* Premiere Suite — physical suite checkboxes (CIP 1-6, Function Room) */}
          <div id="create-premiere-suite-section" className={`border rounded-lg p-4 mb-4 ${psErrors.length > 0 || noFlyingGuest ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
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
            {bookingGuestErrors.length > 0 && (
              <div className="mb-3 space-y-1" data-testid="create-booking-no-flying-guest-error">
                {bookingGuestErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{err}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Quantity of Premiere Suite</label>
                <input type="number" min={0} value={numPremiereSuites}
                  onChange={e => setNumPremiereSuites(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${psGuestsNoSuite ? 'border-red-400 bg-red-50' : ''}`} />
                {psGuestsNoSuite && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Must be at least 1</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Quantity of VIP Passengers</label>
                <input type="number" min={0} value={vipPS}
                  onChange={e => openDeleteDialog('PS', Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${psNoAdult || noFlyingGuest ? 'border-red-400 bg-red-50' : ''}`} />
                {(psNoAdult || noFlyingGuest) && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Required</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Quantity of Non-Flying Guests</label>
                <input type="number" min={0} value={nonFlyingPS}
                  onChange={e => setNonFlyingPS(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${psOverCapacity ? 'border-red-400 bg-red-50' : ''}`} />
              </div>
            </div>

            {/* Premiere Suite — physical suite checkboxes */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Assign Physical Suites <span className="text-gray-400 font-normal">(optional)</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Check up to {numPremiereSuites} suite{numPremiereSuites === 1 ? '' : 's'} (CIP 1–6, Function Room).
                  </p>
                </div>
                {numPremiereSuites > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    assignedSuiteIds.length > numPremiereSuites
                      ? 'bg-red-100 text-red-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {assignedSuiteIds.length} / {numPremiereSuites} assigned
                  </span>
                )}
              </div>
              {numPremiereSuites === 0 ? (
                <p className="text-xs text-gray-400 italic">Set Quantity of Premiere Suite above to enable suite assignment.</p>
              ) : physicalSuites.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No physical suites available — ask an administrator to seed CIP 1-6 / Function Room.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {physicalSuites.map(s => {
                    const checked = assignedSuiteIds.includes(s.id);
                    const isAtCap = !checked && assignedSuiteIds.length >= numPremiereSuites;
                    return (
                      <label key={s.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors ${
                          checked
                            ? 'border-purple-300 bg-purple-50 text-purple-800'
                            : isAtCap
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}>
                        <Checkbox
                          checked={checked}
                          disabled={isAtCap}
                          onCheckedChange={v => {
                            if (!setAssignedSuiteIds) return;
                            setAssignedSuiteIds(
                              v
                                ? [...assignedSuiteIds, s.id]
                                : assignedSuiteIds.filter(id => id !== s.id)
                            );
                          }}
                        />
                        <span className="font-medium">{s.suite_name}</span>
                        <span className="text-xs text-gray-400 ml-auto">cap {s.capacity}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {psErrors.length > 0 && (
              <div className="mt-3 space-y-1">
                {psErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lounge Deluxe — physical lobby checkboxes (Lobby 1-8) */}
          <div id="create-lounge-deluxe-section" className={`border rounded-lg p-4 ${ldErrors.length > 0 || noFlyingGuest ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Part 2 — Lounge Deluxe</h4>
                <p className="text-xs text-gray-500 mt-0.5">Max 3 Non-Flying Guests per booking · At least 1 VIP Passenger required</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ldNonFlyingOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {nonFlyingLD} / 3 non-flying used
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Quantity of VIP Passengers</label>
                <input type="number" min={0} value={vipLD}
                  onChange={e => openDeleteDialog('LD', Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${ldNoAdult || noFlyingGuest ? 'border-red-400 bg-red-50' : ''}`} />
                {(ldNoAdult || noFlyingGuest) && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Required</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Quantity of Non-Flying Guests</label>
                <input type="number" min={0} value={nonFlyingLD}
                  onChange={e => setNonFlyingLD(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${ldNonFlyingOver ? 'border-red-400 bg-red-50' : ''}`} />
                {ldNonFlyingOver && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Max 3 allowed</p>}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Lounge Deluxe quantity = number of VIP Passengers (1 LD = 1 LDVIP).</p>

            {/* Lounge Deluxe — physical lobby checkboxes */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Assign Lobby Seats <span className="text-gray-400 font-normal">(optional, free choice)</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">Check any subset of Lobby 1–8 that the guest will use.</p>
                </div>
                {assignedLoungeIds.length > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    assignedLoungeIds.length > vipLD
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {/* Round 6.2.74 — counter cap = vipLD (NOT
                        physicalLounges.length as before). With
                        the new LD cap rule, vipLD is the maximum
                        number of lobbies that can be assigned. */}
                    {assignedLoungeIds.length} / {vipLD} assigned
                  </span>
                )}
              </div>
              {physicalLounges.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No physical lounges available — ask an administrator to seed Lobby 1-8.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {physicalLounges.map(l => {
                    const checked = assignedLoungeIds.includes(l.id);
                    // Round 6.2.74 — LD cap = vipLD (per the
                    // "1 LD = 1 LDVIP" pricing rule). Mirrors the
                    // PS cap (line 2081) + the EditSectionPhysicalResource
                    // (admin edit page). Without this cap the user
                    // could over-assign lobbies beyond what they paid for.
                    const isAtCap = !checked && assignedLoungeIds.length >= vipLD;
                    return (
                      <label key={l.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                          checked
                            ? 'border-blue-300 bg-blue-50 text-blue-800 cursor-pointer'
                            : isAtCap
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 cursor-pointer'
                        }`}>
                        <Checkbox
                          checked={checked}
                          disabled={isAtCap}
                          onCheckedChange={v => {
                            if (!setAssignedLoungeIds) return;
                            if (isAtCap && v) return; // belt-and-braces: refuse when capped
                            setAssignedLoungeIds(
                              v
                                ? [...assignedLoungeIds, l.id]
                                : assignedLoungeIds.filter(id => id !== l.id)
                            );
                          }}
                        />
                        <span className="font-medium">{l.suite_name}</span>
                        <span className="text-xs text-gray-400 ml-auto">cap {l.capacity}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {ldErrors.length > 0 && (
              <div className="mt-3 space-y-1">
                {ldErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ════════════════════════════════════════
            4. CONTACT PERSON
            ════════════════════════════════════════ */}
        <Card className="p-6">
          <h2 className="mb-6">Contact Person</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Name</span>
              </label>
              <input type="text" value={contactName} onChange={e => setContactName(e.target.value)}
                placeholder="Full name of contact person"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Contact Email</span>
              </label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                placeholder="e.g. contact@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Contact No.</span>
              </label>
              <div className="flex gap-2">
                {/* 2026-06-23 — replaced the hardcoded 4-region <select>
                    with the typeahead <RegionCodeCombobox> sourced from
                    GET /api/lookups/region-codes via the wrapper's
                    `regionCodes` prop. Width w-32 leaves room for the
                    formatted "852 - Hong Kong" display. */}
                <div className="w-32">
                  <RegionCodeCombobox
                    id="contactRegionCode"
                    value={regionCode}
                    options={(regionCodes && regionCodes.length > 0) ? regionCodes : FALLBACK_REGION_CODES}
                    onChange={setRegionCode}
                    placeholder="Region code"
                  />
                </div>
                <input type="tel" value={contactNo}
                  onChange={e => setContactNo(filterContactNumber(e.target.value))}
                  placeholder="9123-4567"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
            <div className="col-span-3">
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Booking Memo</span>
              </label>
              <textarea value={bookingMemo} onChange={e => setBookingMemo(e.target.value)}
                placeholder="Internal notes or special instructions for this booking…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                rows={3} />
            </div>
          </div>
        </Card>

        {/* ════════════════════════════════════════
            5. VIP PASSENGER DETAILS
            ════════════════════════════════════════ */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2>VIP Passenger Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {/* 2026-06-09 round 6.2.22 — badge count was
                    `passengers.length` (the raw array length),
                    which is wrong after decrement. The badge
                    should report the CONFIGURED count
                    (vipPS + vipLD), not the array length. The
                    array can be longer than the configured count
                    (the round 6.2.10 "only grow, never truncate"
                    useEffect preserves extra entries for
                    decrement-then-increment-back data preservation),
                    so the two numbers can diverge. Pin the badge
                    to the configured count to match what the user
                    sees in the cards. */}
                {vipPS + vipLD} passenger{(vipPS + vipLD) !== 1 ? 's' : ''} —
                {vipPS > 0 && ` ${vipPS} from Premiere Suite`}
                {vipPS > 0 && vipLD > 0 && ','}
                {vipLD > 0 && ` ${vipLD} from Lounge Deluxe`}
              </p>
            </div>
          </div>

          {(vipPS + vipLD) === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
              <p className="text-sm">Assign VIP Passengers in the Booking Details section above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 2026-06-09 round 6.2.22 — cap the rendered cards
                  to the CONFIGURED count (vipPS + vipLD), not the
                  raw array length. The round 6.2.10 "only grow,
                  never truncate" useEffect (line 542) intentionally
                  keeps the `passengers` array longer than the
                  configured count so that decrement-then-increment
                  preserves the user's typed data. Pre-6.2.22, the
                  render iterated the full array, so decrement left
                  "ghost" cards on screen (user reported "the cards
                  don't shorten when the qty decrease"). Same pattern
                  as the customer frontend's
                  `vipData.slice(0, totalVip).map` (which the admin
                  view was missing). */}
              {passengers.slice(0, vipPS + vipLD).map((p, idx) => {
                const isPS = idx < vipPS;
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className={`flex items-center gap-3 px-4 py-2 ${isPS ? 'bg-purple-50 border-b border-purple-100' : 'bg-blue-50 border-b border-blue-100'}`}>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPS ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {isPS ? 'Premiere Suite' : 'Lounge Deluxe'}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        VIP Passenger {idx + 1}{p.firstName && p.lastName ? ` — ${p.firstName} ${p.lastName}` : ''}
                      </span>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Row 1 */}
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-1">
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Title</label>
                          <select value={p.title} onChange={e => updatePassenger(idx, 'title', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-sm">
                            <option value="">—</option>
                            <option>Mr</option><option>Mrs</option><option>Ms</option><option>Miss</option><option>Dr</option><option>Prof</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>First Name</label>
                          <input type="text" value={p.firstName} onChange={e => updatePassenger(idx, 'firstName', e.target.value)}
                            placeholder="First name"
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Last Name</label>
                          <input type="text" value={p.lastName} onChange={e => updatePassenger(idx, 'lastName', e.target.value)}
                            placeholder="Last name"
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Travel Doc No.</label>
                          <input type="text" value={p.travelDocNo} onChange={e => updatePassenger(idx, 'travelDocNo', e.target.value)}
                            placeholder="e.g. K12345678"
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                      </div>
                      {/* Row 2 */}
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-1">
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Membership No.</label>
                          <input type="text" value={p.membershipNo} onChange={e => updatePassenger(idx, 'membershipNo', e.target.value)}
                            placeholder="MEM-XXXX"
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Age Group</label>
                          <select value={p.ageGroup} onChange={e => updatePassenger(idx, 'ageGroup', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-sm">
                            <option value="">Select age group</option>
                            <option value="Adults (aged 12 and above)">Adults (aged 12 and above)</option>
                            <option value="Children (aged 2-11)">Children (aged 2-11)</option>
                            <option value="Infants (under 2 years old)">Infants (under 2 years old)</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Birthday <span className="text-gray-400 font-normal">(optional)</span></label>
                          <div className="grid grid-cols-3 gap-2">
                            <select value={p.birthdayDay} onChange={e => updatePassenger(idx, 'birthdayDay', e.target.value)}
                              className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-sm">
                              <option value="">Day</option>
                              {Array.from({ length: 31 }, (_, d) => String(d + 1).padStart(2, '0')).map(d => <option key={d}>{d}</option>)}
                            </select>
                            <select value={p.birthdayMonth} onChange={e => updatePassenger(idx, 'birthdayMonth', e.target.value)}
                              className="w-full px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-sm">
                              <option value="">Month</option>
                              {MONTHS.map(m => <option key={m}>{m}</option>)}
                            </select>
                            <input type="number" value={p.birthdayYear} onChange={e => updatePassenger(idx, 'birthdayYear', e.target.value)}
                              placeholder="Year" min={1900} max={new Date().getFullYear()}
                              className="w-full px-2 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                          </div>
                        </div>
                      </div>
                      {/* Row 3: Nationality (ISO alpha-2) */}
                      <div>
                        <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Nationality *</label>
                        <NationalityTypeahead
                          id={`create-vip-nationality-${idx}`}
                          value={p.nationality}
                          required
                          onChange={(code) => updatePassenger(idx, 'nationality', code)}
                        />
                      </div>
                      {/* Row 4: Food Allergies — full width */}
                      {/* 2026-06-25 — round 6.2.63 (bug 3): surface
                        the food-allergies input on the CREATE
                        form (the edit form at BookingDetail.tsx
                        already has it). Mirrors the edit-form
                        field exactly so the read+write
                        symmetry is preserved.
                        RFQ B8 (2026-08-10): gated by showDietaryFields. */}
                      {showDietaryFields && (
                      <div>
                        <label className="text-sm text-gray-600 mb-[10px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          Food Allergies
                        </label>
                        <input
                          type="text"
                          value={p.foodAllergies}
                          onChange={e => updatePassenger(idx, 'foodAllergies', e.target.value)}
                          placeholder="e.g. Shellfish, Peanuts, Dairy — leave blank if none"
                          className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-200 text-sm ${p.foodAllergies ? 'border-red-300 bg-red-50' : ''}`}
                        />
                        {p.foodAllergies && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Allergy noted — please inform kitchen &amp; F&amp;B staff
                          </p>
                        )}
                      </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ════════════════════════════════════════
            6. NON-FLYING GUEST DETAILS
            ════════════════════════════════════════ */}
        {(nonFlyingPS + nonFlyingLD) > 0 && (
          <Card className="p-6">
            <div className="mb-5">
              <h2>Non-Flying Guest Details</h2>
              {/* 2026-06-09 round 6.2.22 — same fix as the VIP
                  badge (line 1492-1502): report the CONFIGURED
                  count (nonFlyingPS + nonFlyingLD), not the raw
                  array length. See the VIP badge comment for the
                  full rationale (round 6.2.10 "only grow" +
                  render cap). */}
              <p className="text-xs text-gray-400 mt-0.5">
                {nonFlyingPS + nonFlyingLD} guest{(nonFlyingPS + nonFlyingLD) !== 1 ? 's' : ''} —
                {nonFlyingPS > 0 && ` ${nonFlyingPS} from Premiere Suite`}
                {nonFlyingPS > 0 && nonFlyingLD > 0 && ','}
                {nonFlyingLD > 0 && ` ${nonFlyingLD} from Lounge Deluxe`}
              </p>
            </div>
            <div className="space-y-4">
              {/* 2026-06-09 round 6.2.22 — same fix as the VIP
                  render (line 1529): cap the rendered cards to
                  the CONFIGURED count (nonFlyingPS + nonFlyingLD).
                  See the VIP render comment for the full
                  rationale. */}
              {nonFlyingGuests.slice(0, nonFlyingPS + nonFlyingLD).map((g, idx) => {
                const isPS = idx < nonFlyingPS;
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className={`flex items-center gap-3 px-4 py-2 ${isPS ? 'bg-purple-50 border-b border-purple-100' : 'bg-blue-50 border-b border-blue-100'}`}>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPS ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {isPS ? 'Premiere Suite' : 'Lounge Deluxe'}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        Non-Flying Guest {idx + 1}{g.firstName && g.lastName ? ` — ${g.firstName} ${g.lastName}` : ''}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Title</label>
                          <select value={g.title} onChange={e => updateNonFlying(idx, 'title', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-sm">
                            <option value="">—</option>
                            <option>Mr</option><option>Mrs</option><option>Ms</option><option>Miss</option><option>Dr</option><option>Prof</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>First Name</label>
                          <input type="text" value={g.firstName} onChange={e => updateNonFlying(idx, 'firstName', e.target.value)}
                            placeholder="First name"
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Last Name</label>
                          <input type="text" value={g.lastName} onChange={e => updateNonFlying(idx, 'lastName', e.target.value)}
                            placeholder="Last name"
                            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Age Group</label>
                          <select value={g.ageGroup} onChange={e => {
                            const nextGroup = e.target.value as AgeGroup;
                            setNonFlyingGuests(prev => prev.map((guest, i) => {
                              if (i !== idx) return guest;
                              if (nextGroup === 'Children (aged 2-11)') {
                                return { ...guest, ageGroup: nextGroup };
                              }
                              return { ...guest, ageGroup: nextGroup, age: '' };
                            }));
                          }}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-sm">
                            <option value="">Select age group</option>
                            <option value="Adults (aged 12 and above)">Adults (aged 12 and above)</option>
                            <option value="Children (aged 2-11)">Children (aged 2-11)</option>
                            <option value="Infants (under 2 years old)">Infants (under 2 years old)</option>
                          </select>
                        </div>
                      </div>
                      {g.ageGroup === 'Children (aged 2-11)' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Child Exact Age (2-11) *
                          </label>
                          <select
                            value={g.age || ''}
                            onChange={(e) => {
                              const updatedGuests = [...nonFlyingGuests];
                              updatedGuests[idx] = {
                                ...updatedGuests[idx],
                                age: e.target.value ? Number(e.target.value) : '',
                              };
                              setNonFlyingGuests(updatedGuests);
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            required
                          >
                            <option value="">-- Please select child age --</option>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((age) => (
                              <option key={age} value={age}>
                                {age} years old
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="mt-4">
                        <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Nationality *</label>
                        <NationalityTypeahead
                          id={`create-nfg-nationality-${idx}`}
                          value={g.nationality}
                          required
                          onChange={(code) => updateNonFlying(idx, 'nationality', code)}
                        />
                      </div>
                      {/* 2026-06-25 — round 6.2.63 (bug 3):
                        food-allergies input on the NFG card,
                        mirroring the VIP passenger row. Same
                        field semantics (free-text, comma- or
                        semicolon-separated, blank = no known
                        allergies). The `foodAllergies` key is
                        emitted on the `nonFlyingGuests[]` row
                        of the booking's AD blob; the
                        BookingDetail view's NFG card already
                        reads `g.foodAllergies ?? ''` (line
                        2701) so the round-trip is symmetric.
                        RFQ B8 (2026-08-10): gated by showDietaryFields. */}
                      {showDietaryFields && (
                      <div className="mt-4">
                        <label className="text-sm text-gray-600 mb-[10px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          Food Allergies
                        </label>
                        <input
                          type="text"
                          value={g.foodAllergies}
                          onChange={e => updateNonFlying(idx, 'foodAllergies', e.target.value)}
                          placeholder="e.g. Peanuts, Shellfish — leave blank if none"
                          className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-200 text-sm ${g.foodAllergies ? 'border-red-300 bg-red-50' : ''}`}
                        />
                        {g.foodAllergies && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Allergy noted — please inform kitchen &amp; F&amp;B staff
                          </p>
                        )}
                      </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════
            7. ADD-ON SERVICES
            ════════════════════════════════════════ */}
        <Card className="p-6">
          <h2 className="mb-1">Add-on Services</h2>
          <p className="text-sm text-gray-500 mb-5">Search and select services to include with this booking.</p>

          {(() => {
            // Full service catalogue for Create Booking
            // ──────────────────────────────────────────────────────
            // 2026-06-08 round 6.2.8 — INV-12 (next) refactor.
            //   Pre-6.2.8 this array had 26 entries with HARD-CODED
            //   `price` + `badge` values. Only 1 of those 26
            //   (Limousine Transfer) actually mapped to a real
            //   `bookable_items` row, and the form's hard-coded
            //   price (HK$1,500) didn't match the DB price
            //   (HK$800). The user clicked Limo Transfer, saw
            //   "+HK$1,500" in the chip, but was actually
            //   charged HK$800 on submit. The form was the
            //   source of the misinformation.
            //
            //   The fix: for each entry, look up the `bookableItemPrices`
            //   prop (sourced from `GET /api/bookable-items`). If
            //   found, use the DB price + format the badge as
            //   "+HK${price}". If NOT found, the addon is a
            //   "display-only" placeholder (no real DB row);
            //   flag it with "(coming soon)" in the key and
            //   change the badge to "Contact us" so the user
            //   knows it's not a real bookable item.
            //
            //   This preserves the 26-entry "rich service
            //   catalog" UX (don't drop the placeholders) while
            //   fixing the misleading pricing.
            // ──────────────────────────────────────────────────────
            // 4-addon catalog (round 6.2.20, 2026-06-09).
            // Per the user directive ("we just start with
            // this four, clean others first"), the create
            // form now shows ONLY the 4 real bookable addons:
            //   1. Limousine Transfer       — id 12 (HK$800)
            //   2. Wheelchair Assistance    — id 98 (HK$0)
            //   3. Lounge Extension         — id 99 (HK$1500)
            //   4. Security Escort Service  — id 100 (HK$1200)
            //
            // The 22 "(coming soon)" placeholder entries
            // from round 6.2.8 are REMOVED. They were
            // fabricated (didn't exist in the DB) and
            // masked the real 31+ bookable_items. Future
            // tickets can re-add them as `display_only: true`
            // rows in the DB if needed.
            //
            // The icon is HARDCODED per addon (Car /
            // Accessibility / Clock / ShieldCheck). Future
            // ticket: add an `icon` field to the
            // `bookable_items` table so this can be
            // DB-sourced too.
            // ──────────────────────────────────────────────────────
            // 2026-06-12 (round 6.2.39, M11 fix) — replace the
            // hardcoded CREATE_ADDON_SERVICES (4 items) with
            // the shared CATALOG_ADDONS import. See
            // `components/addons.ts` for the source of truth.
            // The 4 names match the backend's `bookable_items`
            // catalog exactly (verified against
            // `BookableItemSeeder` + the migration
            // `2026_06_09_120100_seed_3_bookable_items.php`).
            const CREATE_ADDON_SERVICES = CATALOG_ADDONS.map((a) => ({
              key: a.key,
              icon: a.icon,
              desc: a.desc,
              price: String(a.defaultPrice),
              badge: a.badge ?? (a.defaultPrice > 0 ? `+HK$${a.defaultPrice.toLocaleString()}` : '+HK$—'),
              badgeClass: a.badgeClass,
            }));

            // 2026-06-08 round 6.2.8 — apply the DB price override for
            // any addon whose key matches a `bookableItemPrices` entry.
            // For "Limousine Transfer", the key is the exact match
            // (the prop is keyed by `name_en`). For the 25 "(coming
            // soon)" placeholders, the key has the suffix, so the
            // match fails (intentional — we don't want to override
            // a fabricated price with a real one for a different
            // service).
            const resolveServiceDisplay = (svc: typeof CREATE_ADDON_SERVICES[number]) => {
              const dbPrice = bookableItemPrices?.[svc.key];
              if (typeof dbPrice === 'number' && Number.isFinite(dbPrice) && dbPrice > 0) {
                return {
                  ...svc,
                  price: String(dbPrice),
                  badge: `+HK$${dbPrice.toLocaleString()}`,
                };
              }
              return svc;
            };

            // Map service keys to existing boolean states so price calculation stays intact
            const KEYED_BOOLEANS: Record<string, boolean> = {
              'Limousine Transfer': hasLimousine,
              'In-lounge Personal Shopping Assistance': hasShopping,
              'Wheelchair Assistance': hasWheelchair,
              'Security Escort Service': hasSecurity,
              'Private Sales': hasPrivateSales,
              // Round 6.2.20 (2026-06-09) — Lounge Extension toggle.
              'Lounge Extension': hasLoungeExtension,
            };
            const toggleByKey = (key: string, val: boolean) => {
              if (key === 'Limousine Transfer')                     setHasLimousine(val);
              else if (key === 'In-lounge Personal Shopping Assistance') setHasShopping(val);
              else if (key === 'Wheelchair Assistance')             setHasWheelchair(val);
              else if (key === 'Security Escort Service')           setHasSecurity(val);
              else if (key === 'Lounge Extension')                  setHasLoungeExtension(val);
              else if (key === 'Private Sales')                     setHasPrivateSales(val);
            };

            const selectedKeys = CREATE_ADDON_SERVICES
              .filter(s => KEYED_BOOLEANS[s.key])
              .map(s => s.key);

            const q = addonSearch.trim().toLowerCase();
            const dropdownResults = q
              ? CREATE_ADDON_SERVICES.filter(s =>
                  s.key.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
              : CREATE_ADDON_SERVICES;

            return (
              <div className="space-y-4">

                {/* Selected service chips */}
                {selectedKeys.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedKeys.map(key => {
                      // 2026-06-08 round 6.2.8 — apply DB price override
                      // for addons with matching `bookableItemPrices` entry
                      // (e.g. Limousine Transfer → DB HK$800 instead of
                      // hard-coded HK$1,500). For 25 "(coming soon)"
                      // placeholders, the key has a suffix so the match
                      // fails and we fall through to the hard-coded
                      // badge ("Contact us" / "On request").
                      const svc = resolveServiceDisplay(CREATE_ADDON_SERVICES.find(s => s.key === key)!);
                      return (
                        <div key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-800">
                          <span className="text-blue-500 shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{svc.icon}</span>
                          <span>{key}</span>
                          <Badge className={`ml-1 text-xs ${svc.badgeClass}`}>{svc.badge}</Badge>
                          <button
                            type="button"
                            onClick={() => toggleByKey(key, false)}
                            className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search services to add, e.g. Limousine, Fast Track, Shower…"
                      value={addonSearch}
                      onChange={e => { setAddonSearch(e.target.value); setShowAddonDropdown(true); }}
                      onFocus={() => setShowAddonDropdown(true)}
                      onBlur={() => setTimeout(() => setShowAddonDropdown(false), 150)}
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {addonSearch && (
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setAddonSearch(''); setShowAddonDropdown(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showAddonDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-64 overflow-y-auto">
                      {dropdownResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No services found for "<span className="font-medium">{addonSearch}</span>"
                        </div>
                      ) : dropdownResults.map((rawSvc) => {
                        // 2026-06-08 round 6.2.8 — apply DB price override
                        // (same pattern as the chip; resolved before
                        // destructuring so the dropdown row shows the
                        // real DB price for Limousine Transfer and the
                        // "Contact us" badge for the 25 placeholders).
                        const svc = resolveServiceDisplay(rawSvc);
                        const { key, icon, desc, badge, badgeClass } = svc;
                        const isSelected = !!KEYED_BOOLEANS[key] || (selectedKeys.includes(key));
                        const isTracked  = key in KEYED_BOOLEANS;
                        return (
                          <button
                            key={key}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              if (isTracked) {
                                toggleByKey(key, !isSelected);
                              }
                              setAddonSearch('');
                              setShowAddonDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-gray-100 last:border-0 transition-colors hover:bg-blue-50 ${isSelected ? 'bg-blue-50/60' : ''}`}
                          >
                            <span className={`p-1.5 rounded-md shrink-0 [&>svg]:w-4 [&>svg]:h-4 ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                              {icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{key}</p>
                              <p className="text-xs text-gray-500">{desc}</p>
                            </div>
                            <Badge className={`text-xs shrink-0 ${badgeClass}`}>{badge}</Badge>
                            {isSelected
                              ? <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                              : <Plus className="w-4 h-4 text-gray-300 shrink-0" />
                            }
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  {selectedKeys.length === 0
                    ? 'No services selected. Click the search bar above to browse all available services.'
                    : `${selectedKeys.length} service${selectedKeys.length !== 1 ? 's' : ''} selected. Click a tag above to remove.`
                  }
                </p>

                {/* Limousine stops (shown when Limousine Transfer is selected) */}
                {hasLimousine && (
                  <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Car className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-800 font-medium">Limousine Transfer — Pick-up &amp; Drop-off Stops</p>
                    </div>
                    <div className="space-y-2">
                      {limoStops.map((stop, i) => (
                        <div key={stop.id} className="flex gap-2 items-center">
                          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                          <select value={stop.type} onChange={e => updateLimoStop(stop.id, 'type', e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm w-32 bg-white shrink-0">
                            <option>Pick-up</option><option>Destination</option>
                          </select>
                          <div className="relative flex-1">
                            <MapPin className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" value={stop.location} onChange={e => updateLimoStop(stop.id, 'location', e.target.value)}
                              placeholder={stop.type === 'Pick-up' ? 'e.g. Terminal 1, Arrival Hall' : 'e.g. Four Seasons Hotel, HK'}
                              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-300" />
                          </div>
                          <button type="button" onClick={() => removeLimoStop(stop.id)} disabled={limoStops.length === 1}
                            className="p-1.5 rounded border text-gray-400 hover:text-red-500 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addLimoStop} className="mt-3 gap-1 text-purple-700 border-purple-300 hover:bg-purple-50">
                      <Plus className="w-3.5 h-3.5" />Add Stop
                    </Button>
                  </div>
                )}

                {/* Wheelchair passenger name (shown when Wheelchair Assistance is selected) */}
                {hasWheelchair && (
                  <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Accessibility className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-800 font-medium">Wheelchair Assistance — Passenger Details</p>
                    </div>
                    <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Passenger Name</label>
                    <input type="text" value={wheelchairPassenger} onChange={e => setWheelchairPassenger(e.target.value)}
                      placeholder="Name of passenger requiring assistance"
                      className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                )}

                {/* Round 6.2.20 (2026-06-09) — Lounge Extension qty
                    stepper (per user directive "for Lounge Extension,
                    it should have qty"). Shown when Lounge Extension
                    is selected. */}
                {hasLoungeExtension && (
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <p className="text-sm text-amber-800 font-medium">Lounge Extension — Additional Hours</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600">Hours</label>
                      <button type="button" onClick={() => setLoungeExtensionQty(q => Math.max(1, q - 1))}
                        disabled={loungeExtensionQty <= 1}
                        className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input type="number" min={1} max={6} value={loungeExtensionQty}
                        onChange={e => {
                          const n = parseInt(e.target.value, 10);
                          if (Number.isFinite(n)) setLoungeExtensionQty(Math.max(1, Math.min(6, n)));
                        }}
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300" />
                      <button type="button" onClick={() => setLoungeExtensionQty(q => Math.min(6, q + 1))}
                        disabled={loungeExtensionQty >= 6}
                        className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-gray-500">(max 6 hours per booking)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      HK${(bookableItemPrices?.['Lounge Extension'] ?? 0).toLocaleString()} per hour
                      {' × '}{loungeExtensionQty} hour{loungeExtensionQty !== 1 ? 's' : ''}
                      {' = '}
                      <span className="font-medium text-amber-700">
                        HK${((bookableItemPrices?.['Lounge Extension'] ?? 0) * loungeExtensionQty).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {/* 2026-07-16 — Lane B catalog slot (wrapper-owned picker) */}
                {catalogAddonSlot}

              </div>
            );
          })()}
        </Card>

        {/* ════════════════════════════════════════
            8. PROMO / REDEMPTION CODE
            ════════════════════════════════════════ */}
        <Card className="p-6">
          <h2 className="mb-1">Promotion / Redemption Code</h2>
          <p className="text-sm text-gray-500 mb-4">Enter a promo or redemption code to apply a discount to this booking.</p>
          {promoApplied ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-800">{promoApplied.code}</p>
                  <p className="text-xs text-green-600">
                    {promoApplied.benefit
                      ?? (promoApplied.promoType === 'Free bookings'
                        ? `Free lounge · deduction of ${promoApplied.freeSessions ?? 1} LD fee${(promoApplied.freeSessions ?? 1) !== 1 ? 's' : ''}`
                        : `${promoApplied.discountPct}% off`)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-green-700 hover:text-red-600"
                onClick={() => {
                  if (isPromoControlled) {
                    onClearPromo?.();
                  } else {
                    setLocalPromoApplied(null);
                  }
                  toast.info('Promotion code removed.');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => {
                    setPromoInput(e.target.value.toUpperCase());
                    if (!isPromoControlled) setLocalPromoError('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                  placeholder="e.g. SUMMER2024"
                  disabled={promoValidating}
                  className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${promoError ? 'border-red-400' : 'border-gray-300'}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={promoValidating}
                >
                  {promoValidating ? 'Checking…' : 'Apply'}
                </Button>
              </div>
              {promoError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{promoError}</p>}
            </div>
          )}
        </Card>

        {/* ════════════════════════════════════════
            9. SPECIAL REQUESTS
            ════════════════════════════════════════ */}
        <Card className="p-6">
          <h2 className="mb-1">Special Requests &amp; Notes</h2>
          <p className="text-sm text-gray-500 mb-4">
            {showDietaryFields
              ? 'Any dietary requirements, accessibility needs, or special instructions for the lounge team.'
              : 'Any accessibility needs or special instructions for the lounge team.'}
          </p>
          <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
            placeholder={showDietaryFields
              ? 'e.g. Birthday celebration, Kosher meal required, Allergy to nuts…'
              : 'e.g. Birthday celebration, wheelchair access…'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            rows={4} />
        </Card>

        {/* ════════════════════════════════════════
            10. PRICE BREAKDOWN (backend-live)
            ════════════════════════════════════════ */}
        {liveBreakdown.length > 0 && liveTotal !== null && (
          <Card className="p-6">
            <h2 className="mb-5">Price Breakdown</h2>
            <div className="space-y-2 text-sm max-w-md ml-auto">
              {liveBreakdown.map((item, i) => {
                const isDiscount = item.subtotal < 0
                  || item.key === 'account_discount'
                  || item.key === 'contract_discount'
                  || item.key === 'promo_discount'
                  || (typeof item.key === 'string' && item.key.startsWith('membership_'));
                return (
                <div key={i} className="flex justify-between py-1.5 border-b border-gray-100" data-testid={isDiscount ? `create-price-discount-${item.key}` : undefined}>
                  <span className={isDiscount ? 'text-green-700' : 'text-gray-600'}>
                    {item.label}{!isDiscount && item.qty > 1 ? ` × ${item.qty}` : ''}
                  </span>
                  <span className={isDiscount ? 'font-medium text-green-700' : undefined}>
                    {isDiscount
                      ? `− HK$${Math.abs(item.subtotal).toLocaleString()}`
                      : `HK$${item.subtotal.toLocaleString()}`}
                  </span>
                </div>
                );
              })}
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-[#0f2942]">HK${liveTotal.toLocaleString()}</span>
              </div>
              {liveRulesApplied.length > 0 && (
                <ul className="mt-2 text-xs text-emerald-700 space-y-1">
                  {liveRulesApplied.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              )}
              {liveWarnings.length > 0 && (
                <ul className="mt-2 text-xs text-amber-700 space-y-1">
                  {liveWarnings.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              )}
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════
            11. ACTIONS
            ════════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {hasGuestErrors && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-4 h-4" />Please fix guest detail errors before submitting.
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => toast.info('Form cleared.')}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0f2942] hover:bg-[#1a3d5c] text-white gap-2 px-8"
              // 2026-06-08 — Transit 2nd-leg gate: when the inline gap
              // error is set, the submit button is disabled so the user
              // can't bypass the gap rule by clicking fast. The submit
              // handler (handleSubmit above) ALSO re-checks the gap
              // before the onSubmit call, so this is defense in depth.
              // 2026-06-28 (round 6.2.74) — Sky's 3h booking-time rule
              // also gates submit (mirror of the admin edit page's
              // master Save button).
              disabled={hasGuestErrors || isSubmitting || (flightType === 'Transit' && !!transitGapError) || !!visitTimeRangeError}
              data-testid="create-booking-submit">
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />Create Booking
                </>
              )}
            </Button>
          </div>
        </div>

      </form>

      {/* ── Delete Passenger Confirmation Dialog ── */}
      <Dialog open={!!deleteDialog} onOpenChange={open => { if (!open) setDeleteDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Passengers</DialogTitle>
            <DialogDescription>
              You are reducing the VIP passenger count. Select which passenger(s) to remove. You must select exactly {deleteDialog?.candidates.length !== undefined ? (deleteDialog.candidates.length - deleteDialog!.newValue + (deleteDialog!.section === 'PS' ? deleteDialog!.newValue < vipPS ? vipPS - deleteDialog!.newValue : 0 : vipLD - deleteDialog!.newValue)) : ''} passenger(s) to remove.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 my-2">
            {deleteDialog?.candidates.map(c => (
              <label key={c.globalIdx} className="flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50">
                <input type="checkbox"
                  checked={deleteDialog.selected.has(c.globalIdx)}
                  onChange={() => toggleDeleteSelection(c.globalIdx)}
                  className="accent-red-500" />
                <span className="text-sm font-medium">{c.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeletePassengers}
              disabled={deleteDialog?.selected.size === 0}>
              Remove Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
