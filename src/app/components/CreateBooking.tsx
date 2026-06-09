import { useState, useEffect, useRef } from 'react';
import {
  Calendar, Plus, BadgePercent, Building2, CheckCircle, Info, Tag,
  AlertCircle, Plane, Car, ShoppingBag, Accessibility, ShieldCheck,
  Star, User, Mail, Phone, MessageSquare, Luggage, MapPin,
  X, CreditCard, RotateCcw, ChevronDown, ChevronUp, Clock,
  Search, FileText, DollarSign, Minus
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
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
import { Shuffle } from 'lucide-react';

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

const MEMBERSHIP_DISCOUNT: Record<string, number> = {
  Gold: 5, Platinum: 8, Diamond: 12, Sapphire: 15,
};

// Auto-generate a booking number preview
const now = new Date();
const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
const BOOKING_SEQ = String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');

// ── Types ─────────────────────────────────────────────────────────────────────

type PassengerTitle = 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Dr' | 'Prof' | '';
type AgeGroup = 'Adult (13+ years)' | 'Child (2-12 years)' | 'Infant (0-2 years)' | '';
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
}

interface NonFlyingGuest {
  title: PassengerTitle;
  firstName: string;
  lastName: string;
  ageGroup: AgeGroup;
}

interface LimoStop {
  id: number;
  type: 'Pick-up' | 'Destination';
  location: string;
}

const emptyPassenger = (): PassengerDetail => ({
  title: '', firstName: '', lastName: '', travelDocNo: '',
  membershipNo: '', ageGroup: '', birthdayDay: '', birthdayMonth: '', birthdayYear: '',
});

const emptyNonFlying = (): NonFlyingGuest => ({
  title: '', firstName: '', lastName: '', ageGroup: '',
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
   * 2026-06-08 — pre-validated 6h gap error string. When the form
   * detects legs[1].arrivalDate - legs[0].arrivalDate < 6h, the
   * submit button is disabled and this message is rendered inline.
   * The wrapper surfaces it back to the user; the backend's
   * TransitLegsRule is the source of truth.
   */
  transitGapError?: string | null;
}

// ── Account searcher ───────────────────────────────────────────────────────────

interface AccountOption {
  id: number;
  accountNumber: string;
  name: string;
  type: 'Individual' | 'Corporate' | 'Agency';
}

// ── Props interface ───────────────────────────────────────────────────────────
export interface CreateBookingProps {
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
  } | null;
  onApplyPromo?: (code: string) => void;
  selectedAddonKeys?: string[];
  handleQuickFill?: () => void;
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
    // Round 5.9 (2026-06-06): pricing-relevant passenger counts
    // and additional-hours. The wrapper passes these straight
    // through to `usePricePreview` (which already accepts them
    // since round 1.5; they were just always 0 because the
    // figma-ui form never pushed them through the callback).
    childrenUnder2: number;
    childrenAge2To11: number;
    additionalHours: number;
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
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateBooking({
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
  selectedAddonKeys = [],
  handleQuickFill,
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
  const [promoApplied, setPromoApplied] = useState<{ code: string; label: string; discountPct: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [accountRemark, setAccountRemark] = useState('');
  const [isAdHoc, setIsAdHoc] = useState(false);

  // ── Flight ──────────────────────────────────────────────────────────────────
  const [flightType, setFlightType] = useState<FlightType>('Departure');
  const [arrivalDate, setArrivalDate] = useState('');
  const [flightNo, setFlightNo] = useState('');
  const [flightTime, setFlightTime] = useState('');
  const [flightOrigin, setFlightOrigin] = useState('');
  const [flightDestination, setFlightDestination] = useState('');
  const [numberOfLuggage, setNumberOfLuggage] = useState(1);
  const [flightClass, setFlightClass] = useState<FlightClass | ''>('');

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

  // ── Premiere Suite ──────────────────────────────────────────────────────────
  const [numPremiereSuites, setNumPremiereSuites] = useState(0);
  const [vipPS, setVipPS] = useState(0);
  const [nonFlyingPS, setNonFlyingPS] = useState(0);

  // ── Lounge Deluxe ───────────────────────────────��───────────────────────────
  const [vipLD, setVipLD] = useState(1);
  const [nonFlyingLD, setNonFlyingLD] = useState(0);

  // ── Passengers ──────────────────────────────────────────────────────────────
  const [passengers, setPassengers] = useState<PassengerDetail[]>([emptyPassenger()]);
  const [nonFlyingGuests, setNonFlyingGuests] = useState<NonFlyingGuest[]>([]);

  // ── Contact Person ──────────────────────────────────────────────────────────
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [bookingMemo, setBookingMemo] = useState('');

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
  // pricing fields. The `passengers` and `nonFlyingGuests` arrays
  // each carry an `ageGroup` enum; the counts of "Infant (0-2
  // years)" and "Child (2-12 years)" rows map to
  // `childrenUnder2` and `childrenAge2To11` in the backend's
  // `PriceContext`. The figma-ui form does NOT expose an
  // "additional hours" input yet (future ticket), so
  // `additionalHours` is hardcoded to 0.
  useEffect(() => {
    const childUnder2 = passengers.filter((p) => p.ageGroup === 'Infant (0-2 years)').length
      + nonFlyingGuests.filter((g) => g.ageGroup === 'Infant (0-2 years)').length;
    const childAge2To11 = passengers.filter((p) => p.ageGroup === 'Child (2-12 years)').length
      + nonFlyingGuests.filter((g) => g.ageGroup === 'Child (2-12 years)').length;
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
      // Round 5.9 additions — pricing-relevant passenger counts.
      childrenUnder2: childUnder2,
      childrenAge2To11: childAge2To11,
      additionalHours: 0,
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
    nonFlyingGuests,
    onAddonStateChange,
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
  useEffect(() => {
    const total = vipPS + vipLD;
    setPassengers((prev) => {
      if (prev.length >= total) return prev; // already enough or more — never truncate
      // Only-GROW: add empties to reach `total`.
      return [...prev, ...Array.from({ length: total - prev.length }, () => ({
        title: '',
        firstName: '',
        lastName: '',
        travelDocNo: '',
        membershipNo: '',
        ageGroup: '',
        birthdayDay: '',
        birthdayMonth: '',
        birthdayYear: '',
      }))];
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
  useEffect(() => {
    const total = nonFlyingPS + nonFlyingLD;
    setNonFlyingGuests((prev) => {
      if (prev.length >= total) return prev; // already enough or more — never truncate
      return [...prev, ...Array.from({ length: total - prev.length }, () => ({
        title: '',
        firstName: '',
        lastName: '',
        ageGroup: '',
      }))];
    });
  }, [nonFlyingPS, nonFlyingLD]);

  // 2026-06-08 round 6.2.10 — non-flying useEffect (Q1=b: only
  // GROW, never TRUNCATE). Same fix as the passengers useEffect
  // (line 472+). Pre-6.2.10 this useEffect truncated the array
  // when nonFlyingPS/nonFlyingLD went down, which LOST the
  // user-typed dat...[truncated]

  // ─── Derived ───────────────────────────────────────────────────────────────
  const selectedAgency = TRAVEL_AGENCY_LIST.find(a => a.code === selectedAgencyCode) || null;

  // Reset payment mode when agency selected
  useEffect(() => {
    if (selectedAgency) setPaymentMode(selectedAgency.paymentMethod as PaymentMode);
  }, [selectedAgencyCode]);

  // ─── Passenger handlers ──────────────────────────────────────────────────────
  const updatePassenger = (idx: number, field: keyof PassengerDetail, value: string) =>
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

  const updateNonFlying = (idx: number, field: keyof NonFlyingGuest, value: string) =>
    setNonFlyingGuests(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));

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
  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) { setPromoError('Please enter a promo or redemption code.'); return; }
    onApplyPromo?.(code);
  };

  // ─── Validation ──────────────────────────────────────────────────────────────
  const psMaxGuests       = numPremiereSuites * 6;
  const psTotalGuests     = vipPS + nonFlyingPS;
  const psOverCapacity    = numPremiereSuites > 0 && psTotalGuests > psMaxGuests;
  const psNoVip           = numPremiereSuites > 0 && vipPS === 0;
  const psGuestsNoSuite   = (vipPS > 0 || nonFlyingPS > 0) && numPremiereSuites === 0;
  const ldNonFlyingOver   = nonFlyingLD > 3;
  const ldNoVip           = (assignedLoungeIds.length > 0 || vipLD > 0 || nonFlyingLD > 0) && vipLD === 0;

  const psErrors: string[] = [];
  if (psGuestsNoSuite) psErrors.push('Quantity of Premiere Suite must be at least 1 when guests are assigned to it.');
  if (psNoVip)         psErrors.push('At least 1 VIP Passenger is required per Premiere Suite booking.');
  if (psOverCapacity)  psErrors.push(`Total guests (${psTotalGuests}) exceeds the maximum of ${psMaxGuests} (6 per suite × ${numPremiereSuites}).`);

  const ldErrors: string[] = [];
  if (ldNoVip)         ldErrors.push('At least 1 VIP Passenger is required for a Lounge Deluxe booking.');
  if (ldNonFlyingOver) ldErrors.push(`Non-Flying Guests (${nonFlyingLD}) exceeds the maximum of 3 per Lounge Deluxe booking.`);

  const hasGuestErrors = psErrors.length > 0 || ldErrors.length > 0;


  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType)            { toast.error('Please select an account type.');       return; }
    if (!visitDate || !visitTime){ toast.error('Please enter the visit date and time.'); return; }
    if (!flightNo)               { toast.error('Please enter the flight number.');       return; }
    if (!flightTime)             { toast.error('Please enter the flight time.');         return; }
    // 2026-06-08 — Transit 2nd-leg pre-checks. The backend's
    // TransitLegsRule is the source of truth; these are UX guards
    // that prevent the user from submitting a clearly invalid
    // Transit payload. We do NOT block on the 6h gap here because
    // the inline `transitGapError` already disables the button
    // (transitGapError !== null → form has the alert role rendered
    // and submit is disabled — see the bottom-of-form Submit button
    // below for the disabled-when-gap-error binding).
    if (flightType === 'Transit') {
      if (!leg2ArrivalDate)   { toast.error('Please enter the 2nd leg arrival date and time.'); return; }
      if (!leg2FlightNo)      { toast.error('Please enter the 2nd leg flight number.');        return; }
      if (!leg2FlightTime)    { toast.error('Please enter the 2nd leg flight time.');          return; }
      if (!leg2FlightClass)   { toast.error('Please select the 2nd leg flight class.');        return; }
      if (transitGapError)    { toast.error(transitGapError); return; }
    }
    if (hasGuestErrors)          { toast.error('Please fix the guest detail errors before submitting.'); return; }
    // Premiere Suite: cap assigned suites to numPremiereSuites.
    if (numPremiereSuites > 0 && assignedSuiteIds.length > numPremiereSuites) {
      toast.error(`Premiere Suite assignments (${assignedSuiteIds.length}) cannot exceed Quantity of Premiere Suite (${numPremiereSuites}).`);
      return;
    }
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
      vipPS,
      nonFlyingPS,
      vipLD,
      nonFlyingLD,
      passengers,
      nonFlyingGuests,
      contactName,
      contactEmail,
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
    };
    onSubmit?.(formData);
  };

  const paymentModeOptions = (): PaymentMode[] => {
    if (accountType === 'Individual')    return ['Upfront', 'Net Upfront'];
    if (accountType === 'Corporate')     return ['Bulk Purchase/Monthly Invoice'];
    if (accountType === 'Agency') return ['Upfront', 'Net Upfront', 'On-Credit'];
    if (accountType === 'Agency') return ['Upfront', 'On-Credit', 'Bulk Purchase/Monthly Invoice'];
    return ['Upfront', 'Net Upfront', 'On-Credit', 'Bulk Purchase/Monthly Invoice'];
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
          <Button
            type="button"
            variant="outline"
            onClick={handleQuickFill}
            className="gap-1 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border-yellow-400/50 text-yellow-700 hover:from-yellow-400/30 hover:to-amber-400/30 hover:border-yellow-500/70 hover:text-yellow-800 transition-all text-[10px] px-2 py-0.5 h-[25px]"
          >
            <Shuffle className="w-3 h-3" />
            Quick Fill Demo
          </Button>
          <div className="text-right">
            <p className="text-xs text-gray-400">Booking No. (preview)</p>
            <p className="font-mono text-sm text-[#0f2942]">
              {flightType === 'Arrival' ? 'A' : flightType === 'Departure' ? 'D' : 'T'}-{yyyymmdd}-{BOOKING_SEQ}
            </p>
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
            Select account type and enter guest details. Travel Agency accounts auto-apply their default discount rate.
          </p>

          {/* Account Type */}
          <div className="mb-6">
            <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Account Type <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-4">
              {(['Individual', 'Corporate', 'Agency'] as const).map(type => (
                <button key={type} type="button"
                  onClick={() => { setAccountType(type); setSelectedAgencyCode(''); setMembershipTier(''); setCompanyName(''); setPaymentMode(''); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center ${accountType === type ? 'border-[#0f2942] bg-[#0f2942]/5 text-[#0f2942]' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
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
          </div>

          {/* Travel Agency Selector */}
          {accountType === 'Agency' && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Select Agency <span className="text-red-500">*</span></label>
                <Select value={selectedAgencyCode} onValueChange={setSelectedAgencyCode}>
                  <SelectTrigger><SelectValue placeholder="— Choose a travel agency —" /></SelectTrigger>
                  <SelectContent>
                    {TRAVEL_AGENCY_LIST.map(a => (
                      <SelectItem key={a.code} value={a.code}>
                        <span className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {a.name}
                          <span className="ml-auto text-xs text-gray-400">{a.code}</span>
                          <Badge className="ml-2 bg-green-100 text-green-800 text-xs px-1.5 py-0">{a.discountRate}% off</Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedAgency && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Default Discount Automatically Applied</p>
                    <p className="text-sm text-green-700 mt-0.5">
                      <strong>{selectedAgency.name}</strong> ({selectedAgency.code}) — <strong>{selectedAgency.discountRate}%</strong> off · Payment: <strong>{selectedAgency.paymentMethod}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Core Guest Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Account Number <span className="text-red-500">*</span></label>
              {accountSearchResults !== undefined ? (
                <div className="relative">
                  <input type="text"
                    value={accountNumber}
                    onChange={e => { setAccountNumber(e.target.value); onAccountSearch?.(e.target.value); }}
                    onFocus={() => { onAccountSearch?.(accountNumber); setShowAccountDropdown(true); }}
                    placeholder="Search account number or name…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
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
                <input type="text" value={accountNumber} onChange={e => { setAccountNumber(e.target.value); onAccountSearch?.(e.target.value); }}
                  placeholder="e.g. ACC-2024-0012"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
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
            {accountType === 'Corporate' && (
              <div className="col-span-2">
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="Corporate account company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            )}
            {accountType === 'Individual' && (
              <div>
                <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Membership Tier</label>
                <Select value={membershipTier} onValueChange={v => setMembershipTier(v as MembershipTier)}>
                  <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                  <SelectContent>
                    {(['Gold', 'Platinum', 'Diamond', 'Sapphire'] as MembershipTier[]).map(t => (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          {t}{MEMBERSHIP_DISCOUNT[t] > 0 && <Badge className="bg-indigo-100 text-indigo-700 text-xs">{MEMBERSHIP_DISCOUNT[t]}% disc.</Badge>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Payment Mode <span className="text-red-500">*</span></label>
              <Select value={paymentMode} onValueChange={v => setPaymentMode(v as PaymentMode)}>
                <SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                <SelectContent>
                  {paymentModeOptions().map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <input type="text"
                value={selectedAgency ? `${selectedAgency.discountRate}% (Agency Default)` : membershipTier && MEMBERSHIP_DISCOUNT[membershipTier] > 0 ? `${MEMBERSHIP_DISCOUNT[membershipTier]}% (${membershipTier} Member)` : '—'}
                readOnly className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-green-700" />
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
                  { type: 'Transit'    as FlightType, activeClass: 'bg-sky-600     border-sky-600     text-white', iconClass: 'rotate-90'  },
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          {/* Row 2 — Flight Number · Flight Time · Origin */}
          <div className="grid grid-cols-3 gap-6 mb-6">

            {/* Flight Number */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Number <span className="text-red-500">*</span></label>
              <div className="relative">
                <Plane className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={flightNo} onChange={e => setFlightNo(e.target.value.toUpperCase())}
                  placeholder="e.g. CX880"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>

            {/* Flight Time */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Flight Time (STD/STA) <span className="text-red-500">*</span></label>
              <input type="time" value={flightTime} onChange={e => setFlightTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            {/* Origin */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Origin (IATA)</label>
              <input type="text" value={flightOrigin} onChange={e => setFlightOrigin(e.target.value.toUpperCase())}
                placeholder="e.g. LHR" maxLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 uppercase" />
            </div>
          </div>

          {/* Row 3 — Destination (optional for Transition) · Luggage · Flight Class */}
          <div className="grid grid-cols-3 gap-6">

            {/* Destination */}
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>
                Destination (IATA)
                {flightType === 'Transit'
                  ? <span className="ml-2 text-xs font-normal text-gray-400">— optional</span>
                  : null
                }
              </label>
              <input type="text" value={flightDestination} onChange={e => setFlightDestination(e.target.value.toUpperCase())}
                placeholder={flightType === 'Transit' ? 'May be unknown' : 'e.g. HKG'}
                maxLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 uppercase" />
              {flightType === 'Transit' && (
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
              user from even trying to submit a < 6h gap. */}
          {flightType === 'Transit' && (
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
                    type="datetime-local"
                    value={leg2ArrivalDate}
                    onChange={e => {
                      setLeg2ArrivalDate(e.target.value);
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    data-testid="leg2-arrivalDate"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Leg 2 Flight Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Plane className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={leg2FlightNo}
                      onChange={e => setLeg2FlightNo(e.target.value.toUpperCase())}
                      placeholder="e.g. CX889"
                      data-testid="leg2-flightNo"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Leg 2 Flight Time (STD) <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={leg2FlightTime}
                    onChange={e => setLeg2FlightTime(e.target.value)}
                    data-testid="leg2-flightTime"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Leg 2 Flight Class <span className="text-red-500">*</span></label>
                  <Select value={leg2FlightClass} onValueChange={v => setLeg2FlightClass(v as FlightClass)}>
                    <SelectTrigger data-testid="leg2-flightClass"><SelectValue placeholder="Select class" /></SelectTrigger>
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
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="text-sm font-medium block" style={{ marginBottom: '10px' }}>Visit Time <span className="text-red-500">*</span></label>
              <input type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          {/* Premiere Suite — physical suite checkboxes (CIP 1-6, Function Room) */}
          <div className={`border rounded-lg p-4 mb-4 ${psErrors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
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
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${psNoVip ? 'border-red-400 bg-red-50' : ''}`} />
                {psNoVip && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Required</p>}
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
          <div className={`border rounded-lg p-4 ${ldErrors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Part 2 — Lounge Deluxe</h4>
                <p className="text-xs text-gray-500 mt-0.5">Max 3 Non-Flying Guests per booking · At least 1 VIP Passenger required</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ldNonFlyingOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {nonFlyingLD} / 3 non-flying used
              </span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Quantity of VIP Passengers</label>
                <input type="number" min={0} value={vipLD}
                  onChange={e => openDeleteDialog('LD', Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${ldNoVip ? 'border-red-400 bg-red-50' : ''}`} />
                {ldNoVip && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Required</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Quantity of Non-Flying Guests</label>
                <input type="number" min={0} value={nonFlyingLD}
                  onChange={e => setNonFlyingLD(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${ldNonFlyingOver ? 'border-red-400 bg-red-50' : ''}`} />
                {ldNonFlyingOver && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Max 3 allowed</p>}
              </div>
            </div>

            {/* Lounge Deluxe — physical lobby checkboxes */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Assign Lobby Seats <span className="text-gray-400 font-normal">(optional, free choice)</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">Check any subset of Lobby 1–8 that the guest will use.</p>
                </div>
                {assignedLoungeIds.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                    {assignedLoungeIds.length} / {physicalLounges.length} assigned
                  </span>
                )}
              </div>
              {physicalLounges.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No physical lounges available — ask an administrator to seed Lobby 1-8.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {physicalLounges.map(l => {
                    const checked = assignedLoungeIds.includes(l.id);
                    return (
                      <label key={l.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors ${
                          checked
                            ? 'border-blue-300 bg-blue-50 text-blue-800'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={v => {
                            if (!setAssignedLoungeIds) return;
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
                <select className="px-2 py-2 border border-gray-300 rounded-md text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option>+852</option><option>+86</option><option>+1</option><option>+44</option>
                </select>
                <input type="tel" value={contactNo} onChange={e => setContactNo(e.target.value)}
                  placeholder="9123 4567"
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
                            <option>Adult (13+ years)</option>
                            <option>Child (2-12 years)</option>
                            <option>Infant (0-2 years)</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="text-sm text-gray-600 block" style={{ marginBottom: '10px' }}>Birthday</label>
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
                          <select value={g.ageGroup} onChange={e => updateNonFlying(idx, 'ageGroup', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-sm">
                            <option value="">Select age group</option>
                            <option>Adult (13+ years)</option>
                            <option>Child (2-12 years)</option>
                            <option>Infant (0-2 years)</option>
                          </select>
                        </div>
                      </div>
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
            const CREATE_ADDON_SERVICES: { key: string; icon: React.ReactNode; desc: string; price: string; badge: string; badgeClass: string }[] = [
              // The `price` field is unused for display (the
              // badge is sourced from `bookableItemPrices` at
              // render time via `resolveServiceDisplay`), but
              // it's still part of the type for backward
              // compatibility with the resolveServiceDisplay
              // return type.
              { key: 'Limousine Transfer',      icon: <Car className="w-4 h-4" />,          desc: 'Private car transfer service',                    price: '0',   badge: '+HK$—',        badgeClass: 'bg-purple-100 text-purple-700' },
              { key: 'Wheelchair Assistance',   icon: <Accessibility className="w-4 h-4" />, desc: 'Mobility and accessibility support',              price: '0',   badge: 'Contact us',  badgeClass: 'bg-gray-100 text-gray-600'    },
              { key: 'Lounge Extension',        icon: <Clock className="w-4 h-4" />,        desc: 'Extend VIP lounge access by an additional hour', price: '0',   badge: '+HK$—/hr',    badgeClass: 'bg-amber-100 text-amber-700'   },
              { key: 'Security Escort Service', icon: <ShieldCheck className="w-4 h-4" />,  desc: 'Dedicated security escort throughout',            price: '0',   badge: '+HK$—',        badgeClass: 'bg-amber-100 text-amber-700'   },
            ];

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
                  <p className="text-xs text-green-600">{promoApplied.label} — {promoApplied.benefit} off</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-green-700 hover:text-red-600"
                onClick={() => { setPromoApplied(null); toast.info('Promotion code removed.'); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3">
                <input type="text" value={promoInput} onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                  placeholder="e.g. SUMMER2024"
                  className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${promoError ? 'border-red-400' : 'border-gray-300'}`} />
                <Button type="button" variant="outline" onClick={handleApplyPromo}>Apply</Button>
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
          <p className="text-sm text-gray-500 mb-4">Any dietary requirements, accessibility needs, or special instructions for the lounge team.</p>
          <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
            placeholder="e.g. Birthday celebration, Kosher meal required, Allergy to nuts…"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            rows={4} />
        </Card>

        {/* ════════════════════════════════════════
            10. PRICE BREAKDOWN (backend-live)
            ════════════════════════════════════════ */}
        {liveBreakdown.length > 0 && liveTotal !== null && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <h2>Price Breakdown</h2>
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs">
                Live · backend PricingService
              </Badge>
            </div>
            <div className="space-y-2 text-sm max-w-md ml-auto">
              {liveBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">
                    {item.label}{item.qty > 1 ? ` × ${item.qty}` : ''}
                  </span>
                  <span>HK${item.subtotal.toLocaleString()}</span>
                </div>
              ))}
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
              disabled={hasGuestErrors || isSubmitting || (flightType === 'Transit' && !!transitGapError)}
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
