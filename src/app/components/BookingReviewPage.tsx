import { useState } from 'react';
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Plane,
  Car, ShoppingBag, Clock, Building2, CreditCard, BadgePercent,
  MailCheck, Info, FileEdit, User, ChevronRight, ShieldCheck,
  ClipboardCheck, Luggage, Tag, Phone, Mail, MessageSquare,
  Accessibility, MapPin, Star, Undo2
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PendingBooking {
  id: number;
  bookingNo: string;
  requestType: 'New Booking Request' | 'Edit Booking Request' | 'Cancel';
  guestName: string;
  accountNo: string;
  accountType: 'Individual' | 'Corporate' | 'Agency';
  membershipTier?: 'Gold' | 'Platinum' | 'Diamond' | 'Sapphire';
  companyName?: string;
  suite: string;
  dateTime: string;
  flightNo: string;
  flightTime: string;
  flightOrigin?: string;
  flightDestination?: string;
  flightType?: 'Arrival' | 'Departure' | 'Transit';
  numberOfGuests: number;
  nonFlyingGuests: number;
  hasLimousine: boolean;
  hasShopping: boolean;
  isAdHoc: boolean;
  paymentMode: 'Upfront' | 'Net Upfront' | 'On-Credit' | 'Bulk Purchase/Monthly Invoice';
  // 2026-06-11 round 6.2.34: surfaced from the wrapper mapper so the
  // Payment Method / Payment Mode label can relabel "On-Credit" →
  // "Pending Payment" for individual accounts that haven't paid.
  paymentStatus?: 'Not Required' | 'Pending' | 'Payment Link Sent' | 'Paid' | 'Overdue' | 'Refunded';
  amount: string;
  originalAmountValue?: number;
  finalAmountValue?: number;
  agencyName?: string;
  agencyDiscountRate?: number;
  bookingType: 'Online' | 'Email/Call to HKIAL';
  submittedAt: string;
  specialRequests?: string;
  // 2026-06-08 round 6.2.1 (review page data fix): the local
  // PendingBooking type now declares the 3 fields the view reads
  // instead of the hard-coded mock seeds. Source of truth is
  // ViewBooking in `services/bookingService.ts`; the wrapper
  // (BookingReviewPage.tsx in the parent repo) maps from there.
  // Optional so standalone-preview mode (no prop passed) still
  // works and the MOCK_PENDING_BOOKING fallback (which doesn't
  // have these fields) compiles.
  //
  // 2026-06-15 — round 6.2.42 (bug "review page shows wrong
  // per-suite breakdown for booking 132"). The 5 per-suite
  // fields below (numberOfPremiereSuites / vipPS / nonFlyingPS /
  // vipLD / nonFlyingLD) used to be derived in this view from
  // mock `id % N` formulas (see `numPremiereSuites` /
  // `vipPS` / etc. computed below). For real bookings the
  // wrapper passes the canonical values via `mapBookingFromApi`
  // → `mapApiBookingToPending`; the view's mock derivation
  // overwrote them. Adding the fields here (all optional so
  // standalone-preview mode still compiles) and switching the
  // view's derivation to "real data wins, mock fallback only
  // when no prop passed" makes the per-suite display match
  // the booking detail page.
  numberOfPremiereSuites?: number;
  vipPassengersInPremiereSuite?: number;
  nonFlyingGuestsInPremiereSuite?: number;
  vipPassengersInLoungeDeluxe?: number;
  nonFlyingGuestsInLoungeDeluxe?: number;
  passengers?: Array<{
    title?: string;
    firstName?: string;
    lastName?: string;
    travelDocNo?: string;
    membershipNo?: string;
    ageGroup?: string;
    birthdayDay?: string;
    birthdayMonth?: string;
    birthdayYear?: string;
    foodAllergies?: string;
  }>;
  nonFlyingGuestsList?: Array<{
    title?: string;
    firstName?: string;
    lastName?: string;
    ageGroup?: string;
  }>;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
    memo?: string;
  };
  // 2026-06-24: real applied promo code, populated by the
  // wrapper (parent repo) from `mapBookingFromApi`'s
  // `promoApplied.code` (which reads
  // `api.advanced_details.account.promoApplied.code`). When
  // present, the view renders this exact code; only when absent
  // does it fall back to the PROMO_CODES array (for
  // standalone-preview mode / figma Make import).
  promoCode?: string;
  /**
   * 2026-06-08 round 6.2.x (future ticket): addon items list,
   * populated by `mapBookingFromApi` from `api.booking_items`.
   * Not yet rendered by this view (wheelchair / private-sales
   * flags still use the `id % N` mock formulas); declared so the
   * wrapper mapper's spread doesn't fail the type check.
   */
  addons?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  // 2026-06-08 round 6.2 — Transit 2-leg round-trip. Read-only
  // here; the mapper exposes it on ViewBooking.legs[]. Not
  // rendered in this view yet (the 2-leg detail page is
  // BookingDetail, not BookingReviewPage); declared so the type
  // accepts the wrapper's mapped payload.
  legs?: Array<{
    flightNo: string;
    flightTime: string;
    arrivalDate: string;
    flightClass: 'Economy Class' | 'Business Class' | 'First Class';
  }>;
  originalData?: {
    suite?: string;
    dateTime?: string;
    flightNo?: string;
    flightTime?: string;
    flightOrigin?: string;
    flightDestination?: string;
    flightType?: 'Arrival' | 'Departure';
    numberOfGuests?: number;
    nonFlyingGuests?: number;
    hasLimousine?: boolean;
    hasShopping?: boolean;
    specialRequests?: string;
    guestName?: string;
    contactPerson?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
  /** Authoritative CR diff rows (wrapper maps from open_change_request.diff). */
  changeRows?: Array<{
    field: string;
    label: string;
    from: string;
    to: string;
  }>;
  // 2026-08-21 — Round 6.2.x (staff review shows supervisor
  // push-back). Mirror the round 6.2.79-B Supervisor Decision
  // surface (see `figma-ui/BookingDetail.tsx:2119-2139` +
  // `services/bookingService.ts:1172-1176`). Pre-this-round the
  // staff review page had no place to surface the supervisor's
  // push-back reason, so staff re-reviewing a pushed-back
  // booking had no idea why. The wrapper already preserves
  // these fields at runtime via `...base` spread in
  // `mapApiBookingToPending` (parent repo
  // `BookingReviewPage.tsx:277`); declaring them here makes the
  // view type-safe and pins the contract.
  supervisorRejectionReason?: string;
  supervisorRejectedAt?: string;
  supervisorRejectedByName?: string;
}

// ── Supplementary Mock Data ───────────────────────────────────────────────────

const PASSENGER_SEEDS = [
  { title: 'Mr',   firstName: 'John',   lastName: 'Smith',   ageGroup: 'Adults (aged 12 and above)', day: '14', month: 'March',     year: '1980', doc: 'K12345678', mem: 'MEM-0021' },
  { title: 'Mrs',  firstName: 'Mary',   lastName: 'Johnson', ageGroup: 'Adults (aged 12 and above)', day: '22', month: 'July',      year: '1975', doc: 'H98765432', mem: '' },
  { title: 'Mr',   firstName: 'David',  lastName: 'Lee',     ageGroup: 'Adults (aged 12 and above)', day: '05', month: 'November',  year: '1990', doc: 'A11223344', mem: 'MEM-0087' },
  { title: 'Miss', firstName: 'Sarah',  lastName: 'Chen',    ageGroup: 'Children (aged 2-11)',day: '30', month: 'January',   year: '2014', doc: 'B55667788', mem: '' },
  { title: 'Mr',   firstName: 'Robert', lastName: 'Wang',    ageGroup: 'Adults (aged 12 and above)', day: '18', month: 'September', year: '1968', doc: 'C99001122', mem: 'MEM-0145' },
  { title: 'Mrs',  firstName: 'Emma',   lastName: 'Wilson',  ageGroup: 'Adults (aged 12 and above)', day: '07', month: 'April',     year: '1983', doc: 'D33445566', mem: '' },
];

const NON_FLYING_SEEDS = [
  { title: 'Mrs',  firstName: 'Linda',  lastName: 'Brown',  ageGroup: 'Adults (aged 12 and above)'  },
  { title: 'Mr',   firstName: 'James',  lastName: 'Taylor', ageGroup: 'Adults (aged 12 and above)'  },
  { title: 'Miss', firstName: 'Sophie', lastName: 'Martin', ageGroup: 'Children (aged 2-11)' },
  { title: 'Mr',   firstName: 'Kevin',  lastName: 'Zhang',  ageGroup: 'Adults (aged 12 and above)'  },
];

const CONTACT_SEEDS = [
  { name: 'Alice Wong',   email: 'alice.wong@example.com',   phone: '+852 9123 4567', memo: 'Please ensure early check-in for VIP guest.' },
  { name: 'Brian Chan',   email: 'brian.chan@example.com',    phone: '+852 6234 5678', memo: '' },
  { name: 'Cynthia Lam',  email: 'cynthia.lam@example.com',  phone: '+852 5345 6789', memo: 'Guest is travelling with elderly parent.' },
  { name: 'David Ng',     email: 'david.ng@example.com',     phone: '+852 6456 7890', memo: '' },
  { name: 'Eva Cheung',   email: 'eva.cheung@example.com',   phone: '+852 9567 8901', memo: 'Corporate account — priority seating required.' },
];

// 2026-06-24: DIAMOND15 removed (was a hard-coded mock showing on
// supervisor-review page even when no promo code was actually applied
// — booking 306 had no real promo code but rendered DIAMOND15 here).
// The view now reads the real `booking.promoCode` (forwarded by the
// wrapper from `mapBookingFromApi` → `promoApplied.code`); this array
// is only a fallback for standalone-preview mode (no `booking` prop
// passed, e.g. figma Make import) to keep the preview rendering
// meaningful. Per INV-X1: don't break the figma Make import.
const PROMO_CODES = ['SUMMER2024', 'VIP20', 'WELCOME', '', 'TRAVEL10', '', '', '', '', ''];
const FLIGHT_CLASSES = ['Economy Class', 'Business Class', 'First Class'] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const accountTypeBadgeClass = (type: PendingBooking['accountType']) => {
  if (type === 'Individual')    return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
  if (type === 'Corporate')     return 'bg-blue-100 text-blue-800 border border-blue-200';
  if (type === 'Agency') return 'bg-purple-100 text-purple-800 border border-purple-200';
  return 'bg-gray-100 text-gray-700';
};

const membershipBadgeClass = (tier?: PendingBooking['membershipTier']) => {
  if (tier === 'Sapphire') return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
  if (tier === 'Diamond')  return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
  if (tier === 'Platinum') return 'bg-slate-100 text-slate-700 border border-slate-200';
  if (tier === 'Gold')     return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return '';
};

const paymentModeBadgeClass = (mode: PendingBooking['paymentMode']) => {
  if (mode === 'Upfront')                       return 'bg-green-100 text-green-700';
  if (mode === 'Net Upfront')                   return 'bg-teal-100 text-teal-700';
  if (mode === 'On-Credit')                     return 'bg-orange-100 text-orange-700';
  if (mode === 'Bulk Purchase/Monthly Invoice') return 'bg-violet-100 text-violet-700';
  return 'bg-gray-100 text-gray-700';
};

// 2026-06-11 round 6.2.34: Individual-account post-pay (On-Credit)
// bookings that haven't been paid yet are surfaced to the staff reviewer
// as "Pending Payment" instead of the generic "On-Credit" label, so
// the review queue is unambiguous about which bookings still owe money.
// Conditions: accountType=Individual AND paymentMode=On-Credit AND
// (no paymentStatus recorded OR paymentStatus is anything but Paid).
// Corporate / Agency On-Credit bookings keep the original "On-Credit"
// label (their billing is handled by the agency's monthly invoice
// process, not by the guest paying later).
const formatPaymentLabel = (booking: PendingBooking): string => {
  if (
    booking.accountType === 'Individual' &&
    booking.paymentMode === 'On-Credit' &&
    booking.paymentStatus !== 'Paid'
  ) {
    return 'Pending Payment';
  }
  return booking.paymentMode;
};

const REJECTION_REASONS = [
  'Our lounge availability',
  'In-lounge check-in support is not provided for this flight',
];

// Labelled read-only field
const Field = ({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>{label}</p>
    <div className="text-sm text-gray-900">{children}</div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export interface BookingReviewPageProps {
  booking?: PendingBooking;
  reviewStage?: 'staff' | 'supervisor';
  onBack?: () => void;
  onApprove?: (bookingId: number) => void;
  onReject?: (bookingId: number, reason: string) => void;
  /** Staff new-booking review: persist auto-send invoice for supervisor approve. */
  autoSendInvoice?: boolean;
  onAutoSendInvoiceChange?: (value: boolean) => void;
  // 2026-06-24: supervisor-only — send a Step-2 booking back to
  // Step 1 (staff review). Backend requires a non-empty
  // `rejection_reason` for the PendingForApproval → PendingForReview
  // transition (see BookingController.php:516-527), so a reason
  // is always required. The wrapper calls
  // `updateBookingStatus(id, 'PendingForReview', reason)`.
  onPushBack?: (bookingId: number, reason: string) => void;
}

// ── Default mock booking for standalone preview ───────────────────────────────
const MOCK_PENDING_BOOKING: PendingBooking = {
  id: 1,
  bookingNo: 'A-202603-000001',
  requestType: 'New Booking Request',
  guestName: 'James Hoffmann',
  accountNo: 'ACC-2026-1001',
  accountType: 'Individual',
  membershipTier: 'Gold',
  suite: 'Premier Suite A',
  dateTime: '2026-03-06 08:30',
  flightNo: 'CX113',
  flightTime: '11:45',
  flightOrigin: 'LHR',
  flightDestination: 'HKG',
  flightType: 'Arrival',
  numberOfGuests: 2,
  nonFlyingGuests: 1,
  hasLimousine: false,
  hasShopping: false,
  isAdHoc: false,
  paymentMode: 'Upfront',
  amount: 'HK$3,357',
  bookingType: 'Online',
  submittedAt: '2026-02-24 09:12',
  specialRequests: 'Guest requires wheelchair assistance',
};

export function BookingReviewPage({
  booking: bookingProp,
  reviewStage = 'staff',
  onBack = () => {},
  onApprove,
  onReject,
  onPushBack,
  autoSendInvoice = false,
  onAutoSendInvoiceChange,
}: BookingReviewPageProps = {}) {
  const booking: PendingBooking = bookingProp ?? MOCK_PENDING_BOOKING;
  const [reviewMode, setReviewMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  // 2026-06-24: push-back state (supervisor only). Backend requires
  // a non-empty rejection_reason for the PendingForApproval →
  // PendingForReview transition; we collect it via a dialog.
  const [showPushBackDialog, setShowPushBackDialog] = useState(false);
  const [pushBackReason, setPushBackReason] = useState('');

  // ── Supplementary derived data (deterministic from booking.id) ────────────
  const id = booking.id;
  const flyingGuests   = Math.max(0, booking.numberOfGuests - booking.nonFlyingGuests);
  const flightClass    = FLIGHT_CLASSES[id % 3];
  const numberOfLuggage = 1 + (id % 3);
  const arrivalDate    = booking.flightType === 'Arrival'
    ? booking.dateTime.split(' ')[0]
    : (() => {
        // Pure calendar +1 on Kind W date prefix (INV-X18) — never toISOString().
        const m = booking.dateTime.split(' ')[0].match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return booking.dateTime.split(' ')[0];
        const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1, 12));
        return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
      })();

  // Premiere Suite + Lounge Deluxe breakdown
  // 2026-06-15 — round 6.2.42 (bug "review page shows wrong per-suite
  // breakdown for booking 132"). Pre-6.2.42 this block ALWAYS used
  // mock `id % N` formulas, which overwrote the canonical per-suite
  // counts the wrapper mapper forwarded from `mapBookingFromApi`.
  // Post-6.2.42: if any of the 5 fields are present on `booking`,
  // use the real values (the wrapper always passes them for
  // wrapper-mode bookings). Only fall back to the mock formulas
  // for standalone-preview mode (`bookingProp` undefined → this
  // view is rendered without a real booking, e.g. figma make
  // preview). The fallback keeps the historical behaviour for
  // the figma make import (per INV-X1: don't break the figma
  // Make import).
  const hasRealSuiteBreakdown = booking.numberOfPremiereSuites !== undefined
    || booking.vipPassengersInPremiereSuite !== undefined
    || booking.nonFlyingGuestsInPremiereSuite !== undefined
    || booking.vipPassengersInLoungeDeluxe !== undefined
    || booking.nonFlyingGuestsInLoungeDeluxe !== undefined;
  const numPremiereSuites = hasRealSuiteBreakdown
    ? (booking.numberOfPremiereSuites ?? 0)
    : (flyingGuests > 0 ? (id % 2 === 0 ? 1 : 0) : 0);
  const vipPS = hasRealSuiteBreakdown
    ? (booking.vipPassengersInPremiereSuite ?? 0)
    : (numPremiereSuites > 0 ? Math.min(flyingGuests, 1 + (id % 2)) : 0);
  const nonFlyingPS = hasRealSuiteBreakdown
    ? (booking.nonFlyingGuestsInPremiereSuite ?? 0)
    : (numPremiereSuites > 0 && booking.nonFlyingGuests > 0 ? Math.min(booking.nonFlyingGuests, 1) : 0);
  // Lounge Deluxe breakdown
  const vipLD = hasRealSuiteBreakdown
    ? (booking.vipPassengersInLoungeDeluxe ?? 0)
    : Math.max(0, flyingGuests - vipPS);
  const nonFlyingLD = hasRealSuiteBreakdown
    ? (booking.nonFlyingGuestsInLoungeDeluxe ?? 0)
    : Math.max(0, booking.nonFlyingGuests - nonFlyingPS);

  // 2026-06-08 round 6.2.1 (review page data fix): the `passengers`
  // and `nonFlyingGuestList` and `contact` arrays used to be derived
  // exclusively from the hard-coded `*_SEEDS` mock data (selected by
  // `id % N`). That made the review page show fake passengers like
  // "John Smith / K12345678" even when the real booking had 3 different
  // passengers. The fix: read from `booking.passengers[]` /
  // `booking.nonFlyingGuestsList[]` / `booking.contactPerson{}` if
  // they are populated, and ONLY fall back to the mock seeds when the
  // booking is in standalone-preview mode (no prop passed). This keeps
  // the standalone-preview behavior for the view's own use but
  // ensures real data wins when the wrapper passes a real booking.
  //
  // The `psIdPS` and `psIdLD` indices map the Premiere Suite / Lounge
  // Deluxe pax split (the `vipPS` / `vipLD` above) into the real
  // passenger list: the first `vipPS` passengers belong to PS, the
  // rest to LD. This is the round 6.0+6.1 mixed-kind pricing model.
  const realPassengers = booking.passengers ?? [];
  const realNonFlying = booking.nonFlyingGuestsList ?? [];
  const hasRealPassengerData = realPassengers.length > 0;
  const hasRealNonFlyingData = realNonFlying.length > 0;
  const hasRealContact = !!booking.contactPerson;

  const passengers = hasRealPassengerData
    ? realPassengers.map((p) => ({
        title: p.title ?? '',
        firstName: p.firstName ?? '',
        lastName: p.lastName ?? '',
        doc: p.travelDocNo ?? '',
        mem: p.membershipNo ?? '',
        ageGroup: p.ageGroup ?? '',
        day: p.birthdayDay ?? '',
        month: p.birthdayMonth ?? '',
        year: p.birthdayYear ?? '',
      }))
    : Array.from({ length: flyingGuests }, (_, idx) =>
        PASSENGER_SEEDS[(id + idx) % PASSENGER_SEEDS.length],
      );

  const nonFlyingGuestList = hasRealNonFlyingData
    ? realNonFlying.map((g) => ({
        title: g.title ?? '',
        firstName: g.firstName ?? '',
        lastName: g.lastName ?? '',
        ageGroup: g.ageGroup ?? '',
      }))
    : Array.from({ length: booking.nonFlyingGuests }, (_, idx) =>
        NON_FLYING_SEEDS[(id + idx + 2) % NON_FLYING_SEEDS.length],
      );

  // Contact person
  const contact = hasRealContact
    ? {
        name: booking.contactPerson?.name ?? '',
        email: booking.contactPerson?.email ?? '',
        phone: booking.contactPerson?.phone ?? '',
        memo: booking.contactPerson?.memo ?? '',
      }
    : CONTACT_SEEDS[id % CONTACT_SEEDS.length];
  // 2026-06-30 (round 6.2.81, Bug #6 follow-up — Sky: "booking
  // 1321 review page shows 'VIP20' even though no promo was
  // applied at create"). Pre-6.2.81 the mock-fallback check was
  // `!!booking.promoCode` which fires whenever the wrapper's
  // forwarded `pendingBooking.promoCode` is undefined — i.e. for
  // EVERY real booking in wrapper-mode that didn't apply a code.
  // `PROMO_CODES[id % 10]` then deterministically surfaced a
  // mock string (e.g. 1321 % 10 = 1 → 'VIP20') even though the
  // wrapper passed `bookingProp` (so the view is NOT a figma-Make
  // standalone preview).
  //
  // Fix: gate the mock fallback on `bookingProp === undefined`
  // (true standalone-preview mode, where `MOCK_PENDING_BOOKING`
  // is used and the mock array keeps the figma Make preview
  // rendering meaningful per INV-X1). In wrapper mode, render
  // `booking.promoCode || ''` so an empty value falls through to
  // the existing '<Field>—' placeholder below (line 688).
  //
  // Pattern matches `hasRealSuiteBreakdown` / `hasRealPassenger
  // Data` above but the gating condition is 'preview mode?' rather
  // than 'real data present?' — the empty-real-data path must NOT
  // be treated as preview mode.
  const isStandalonePreview = bookingProp === undefined;
  const promoCode = isStandalonePreview
    ? PROMO_CODES[id % PROMO_CODES.length]
    : (booking.promoCode || '');
  const accountDiscount = booking.agencyDiscountRate
    ? `${booking.agencyDiscountRate}% (Agency Default)`
    : id % 4 === 0 ? '10%' : '—';
  const accountRemark = id % 2 === 0 ? 'VIP Member - Priority Service' : '—';

  // Extra services (wheelchair, private sales) — TODO round 6.2.x:
  // read from `booking.addons[]` (populated by `mapBookingFromApi`
  // from `api.booking_items` via AddonsSyncService). For now the
  // mock `id % N` formulas stay.
  const hasWheelchair = id % 7 === 0;
  const hasPrivateSales = id % 9 === 0;

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleApprove = () => {
    onApprove?.(booking.id);
    if (reviewStage === 'staff') {
      toast.success(`Booking ${booking.bookingNo} forwarded for supervisor approval`, {
        description: 'A supervisor or manager must give final approval before the booking is confirmed.',
      });
    } else {
      toast.success(`Booking ${booking.bookingNo} confirmed`, {
        description: `Final approval granted. A confirmation email has been sent to ${booking.guestName}.`,
      });
    }
    onBack();
  };

  const handleReject = () => {
    if (!selectedReason) return;
    onReject?.(booking.id, customReason ? `${selectedReason} - ${customReason}` : selectedReason);
    setShowRejectDialog(false);
    toast.info(`Booking ${booking.bookingNo} rejection submitted`, {
      description: 'The rejection has been sent to AM / Manager to review',
    });
    onBack();
  };

  // 2026-06-24: supervisor push-back (Step 2 → Step 1). Reason is
  // required by the backend (BookingController.php:516-527) so we
  // disable the confirm button until the textarea has content.
  const handlePushBack = () => {
    const reason = pushBackReason.trim();
    if (!reason) return;
    onPushBack?.(booking.id, reason);
    setShowPushBackDialog(false);
    setPushBackReason('');
    toast.info(`Booking ${booking.bookingNo} sent back to staff review`, {
      description: 'The booking has been moved back to Step 1: Staff Review for revision.',
    });
    onBack();
  };

  const rejectReasonValid = selectedReason !== '';
  const pushBackReasonValid = pushBackReason.trim() !== '';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1>Review Booking Request</h1>
            <Badge className={`text-sm ${
              booking.requestType === 'New Booking Request'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : booking.requestType === 'Cancel'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-orange-100 text-orange-700 border border-orange-200'
            }`}>
              {booking.requestType === 'New Booking Request' ? 'New Booking'
                : booking.requestType === 'Cancel' ? 'Cancellation Request' : 'Edit Request'}
            </Badge>
            {booking.isAdHoc && (
              <Badge className="text-sm bg-amber-100 text-amber-700 border border-amber-200">
                Ad-hoc / Urgent
              </Badge>
            )}
            <span className="text-sm font-mono text-gray-500">{booking.bookingNo}</span>
          </div>
          <p className="text-gray-600 mt-1">
            Review the full booking details and choose to approve or reject.
          </p>
        </div>
      </div>

      {/* ── Approval Stage Banner ── */}
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4 flex-wrap">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium flex-shrink-0 ${
          reviewStage === 'staff' ? 'bg-blue-600 text-white shadow-sm' : 'bg-green-100 text-green-700'
        }`}>
          {reviewStage === 'supervisor' ? <CheckCircle className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
          <span>Step 1: Staff Review</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium flex-shrink-0 ${
          reviewStage === 'supervisor' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-200 text-gray-400'
        }`}>
          <ShieldCheck className="w-4 h-4" />
          <span>Step 2: Supervisor / Manager Approval</span>
        </div>
        <div className="ml-auto text-xs text-gray-500 hidden md:block">
          {reviewStage === 'staff'
            ? 'After staff approval, a supervisor/manager will give final confirmation.'
            : 'Staff review complete. Please give final approval or rejection.'}
        </div>
      </div>

      {/* ── Supervisor Decision card ──
          2026-08-21 — Round 6.2.x. Surfaces the supervisor's
          push-back / reject reason and timestamp + supervisor
          name when a supervisor has acted on this booking.
          Mirrors the round 6.2.79-B (Bug #1) BookingDetail
          Supervisor Decision card
          (`figma-ui/BookingDetail.tsx:2119-2139`).

          Renders when EITHER `supervisorRejectionReason`
          OR `supervisorRejectedAt` is set (the supervisor
          has at minimum stamped the booking). The reason text
          block renders only when the reason is non-empty
          (supervisor APPROVED has no reason). The card is
          ADDITIVE — staff rejection (separate `rejectionReason`
          field) is unrelated and the existing Rejection Reason
          card on BookingDetail continues to render the staff's
          reason when present.

          Prominently placed BEFORE the booking-detail grid so
          staff re-reviewing a pushed-back booking sees the
          reason before scrolling to action buttons. */}
      {(booking.supervisorRejectionReason || booking.supervisorRejectedAt) && (
        <Card
          className="p-6 border-amber-200 bg-amber-50"
          data-testid="supervisor-decision-card"
        >
          <h3 className="text-sm uppercase tracking-wide text-amber-700 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Supervisor Decision
          </h3>
          {booking.supervisorRejectionReason && (
            <p
              className="text-sm text-amber-900 mb-2"
              data-testid="supervisor-reason-text"
            >
              {booking.supervisorRejectionReason}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-amber-700">
            {booking.supervisorRejectedByName && (
              <span data-testid="supervisor-name">
                By <strong>{booking.supervisorRejectedByName}</strong>
              </span>
            )}
            {booking.supervisorRejectedAt && (
              <span data-testid="supervisor-timestamp">
                {new Date(booking.supervisorRejectedAt).toLocaleString()}
              </span>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ════════════════════════════════════════════════════
            LEFT COLUMN — Full Booking Details (read-only)
            ═══════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Ad-hoc Alert ── */}
          {booking.isAdHoc && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Ad-hoc Booking Alert</p>
                <p className="text-sm text-amber-800 mt-0.5">
                  This booking was submitted within the cut-off period and requires immediate attention.
                </p>
              </div>
            </div>
          )}

          {/* ── Edit Request — Changes Panel ──
              Prefer changeRows (from API CR.diff, including nested advanced_details).
              Fall back to originalData field-by-field for older mocks. */}
          {booking.requestType === 'Edit Booking Request'
            && reviewMode === 'view'
            && ((booking.changeRows?.length ?? 0) > 0 || !!booking.originalData) && (
            <Card className="p-6 border-2 border-blue-300 bg-blue-50">
              <div className="flex items-center gap-2 mb-4">
                <FileEdit className="w-5 h-5 text-blue-700" />
                <h2 className="text-lg font-medium text-blue-900">Changes Requested</h2>
              </div>
              {booking.changeRows && booking.changeRows.length > 0 ? (
              /* 2026-08-10 — single-row Field | Before → After layout.
                 Two side-by-side columns repeated the label for every field
                 and made long passenger/contact diffs hard to scan. */
              <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-100/60 text-left text-xs uppercase tracking-wide text-blue-900">
                      <th className="px-3 py-2 font-semibold w-[28%]">Field</th>
                      <th className="px-3 py-2 font-semibold w-[36%]">Original</th>
                      <th className="px-3 py-2 font-semibold w-[36%]">Changed to</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {booking.changeRows.map((row) => (
                      <tr key={`row-${row.field}-${row.label}`} className="align-top hover:bg-blue-50/40">
                        <td className="px-3 py-2.5 text-xs font-medium text-gray-700 whitespace-nowrap">
                          {row.label}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block max-w-full break-words rounded bg-red-50 px-2 py-1 text-red-700 line-through decoration-red-400/80">
                            {row.from}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block max-w-full break-words rounded bg-green-50 px-2 py-1 font-medium text-green-800">
                            {row.to}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b-2 border-red-200 font-medium">Original</p>
                  <div className="space-y-3">
                    {booking.originalData?.guestName !== undefined && booking.originalData.guestName !== booking.guestName && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Guest Name</p><p className="line-through text-red-600 font-medium">{booking.originalData.guestName}</p></div>
                    )}
                    {booking.originalData?.contactPerson && (
                      (booking.originalData.contactPerson.name ?? '') !== (booking.contactPerson?.name ?? '')
                      || (booking.originalData.contactPerson.email ?? '') !== (booking.contactPerson?.email ?? '')
                      || (booking.originalData.contactPerson.phone ?? '') !== (booking.contactPerson?.phone ?? '')
                    ) && (
                      <div>
                        <p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Contact Person</p>
                        <p className="line-through text-red-600 font-medium">
                          {[booking.originalData.contactPerson.name, booking.originalData.contactPerson.email, booking.originalData.contactPerson.phone]
                            .filter(Boolean)
                            .join(' · ') || '(none)'}
                        </p>
                      </div>
                    )}
                    {booking.originalData?.flightType && booking.originalData.flightType !== booking.flightType && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Flight Type</p><p className="line-through text-red-600 font-medium">{booking.originalData.flightType}</p></div>
                    )}
                    {booking.originalData?.suite && booking.originalData.suite !== booking.suite && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Suite</p><p className="line-through text-red-600 font-medium">{booking.originalData.suite}</p></div>
                    )}
                    {booking.originalData?.dateTime && booking.originalData.dateTime !== booking.dateTime && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Visit Date/Time</p><p className="line-through text-red-600 font-medium">{booking.originalData.dateTime}</p></div>
                    )}
                    {booking.originalData?.flightNo && booking.originalData.flightNo !== booking.flightNo && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Flight No.</p><p className="line-through text-red-600 font-medium">{booking.originalData.flightNo}</p></div>
                    )}
                    {booking.originalData?.flightTime && booking.originalData.flightTime !== booking.flightTime && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Flight Time</p><p className="line-through text-red-600 font-medium">{booking.originalData.flightTime}</p></div>
                    )}
                    {booking.originalData?.numberOfGuests !== undefined && booking.originalData.numberOfGuests !== booking.numberOfGuests && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Number of Guests</p><p className="line-through text-red-600 font-medium">{booking.originalData.numberOfGuests} pax</p></div>
                    )}
                    {booking.originalData?.nonFlyingGuests !== undefined && booking.originalData.nonFlyingGuests !== booking.nonFlyingGuests && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Non-flying Guests</p><p className="line-through text-red-600 font-medium">{booking.originalData.nonFlyingGuests}</p></div>
                    )}
                    {booking.originalData?.hasLimousine !== undefined && booking.originalData.hasLimousine !== booking.hasLimousine && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Limousine Service</p><p className="line-through text-red-600 font-medium">{booking.originalData.hasLimousine ? 'Yes' : 'No'}</p></div>
                    )}
                    {booking.originalData?.hasShopping !== undefined && booking.originalData.hasShopping !== booking.hasShopping && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Shopping Service</p><p className="line-through text-red-600 font-medium">{booking.originalData.hasShopping ? 'Yes' : 'No'}</p></div>
                    )}
                    {booking.originalData?.specialRequests !== booking.specialRequests && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Special Request</p><p className="line-through text-red-600 text-sm">{booking.originalData?.specialRequests || '(none)'}</p></div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b-2 border-green-200 font-medium">Changed To</p>
                  <div className="space-y-3">
                    {booking.originalData?.guestName !== undefined && booking.originalData.guestName !== booking.guestName && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Guest Name</p><p className="text-green-700 font-medium">{booking.guestName}</p></div>
                    )}
                    {booking.originalData?.contactPerson && (
                      (booking.originalData.contactPerson.name ?? '') !== (booking.contactPerson?.name ?? '')
                      || (booking.originalData.contactPerson.email ?? '') !== (booking.contactPerson?.email ?? '')
                      || (booking.originalData.contactPerson.phone ?? '') !== (booking.contactPerson?.phone ?? '')
                    ) && (
                      <div>
                        <p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Contact Person</p>
                        <p className="text-green-700 font-medium">
                          {[booking.contactPerson?.name, booking.contactPerson?.email, booking.contactPerson?.phone]
                            .filter(Boolean)
                            .join(' · ') || '(none)'}
                        </p>
                      </div>
                    )}
                    {booking.originalData?.flightType && booking.originalData.flightType !== booking.flightType && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Flight Type</p><p className="text-green-700 font-medium">{booking.flightType}</p></div>
                    )}
                    {booking.originalData?.suite && booking.originalData.suite !== booking.suite && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Suite</p><p className="text-green-700 font-medium">{booking.suite}</p></div>
                    )}
                    {booking.originalData?.dateTime && booking.originalData.dateTime !== booking.dateTime && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Visit Date/Time</p><p className="text-green-700 font-medium">{booking.dateTime}</p></div>
                    )}
                    {booking.originalData?.flightNo && booking.originalData.flightNo !== booking.flightNo && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Flight No.</p><p className="text-green-700 font-medium">{booking.flightNo}</p></div>
                    )}
                    {booking.originalData?.flightTime && booking.originalData.flightTime !== booking.flightTime && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Flight Time</p><p className="text-green-700 font-medium">{booking.flightTime}</p></div>
                    )}
                    {booking.originalData?.numberOfGuests !== undefined && booking.originalData.numberOfGuests !== booking.numberOfGuests && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Number of Guests</p><p className="text-green-700 font-medium">{booking.numberOfGuests} pax</p></div>
                    )}
                    {booking.originalData?.nonFlyingGuests !== undefined && booking.originalData.nonFlyingGuests !== booking.nonFlyingGuests && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Non-flying Guests</p><p className="text-green-700 font-medium">{booking.nonFlyingGuests}</p></div>
                    )}
                    {booking.originalData?.hasLimousine !== undefined && booking.originalData.hasLimousine !== booking.hasLimousine && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Limousine Service</p><p className="text-green-700 font-medium">{booking.hasLimousine ? 'Yes' : 'No'}</p></div>
                    )}
                    {booking.originalData?.hasShopping !== undefined && booking.originalData.hasShopping !== booking.hasShopping && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Shopping Service</p><p className="text-green-700 font-medium">{booking.hasShopping ? 'Yes' : 'No'}</p></div>
                    )}
                    {booking.originalData?.specialRequests !== booking.specialRequests && (
                      <div><p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Special Request</p><p className="text-green-700 font-medium text-sm">{booking.specialRequests || '(none)'}</p></div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </Card>
          )}

          {/* ── 1. Guest Information ── */}
          <Card className="p-6">
            <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-5">Guest Information</h2>
            <div className="grid grid-cols-3 gap-6">
              <Field label="Guest Name">
                <span className="font-medium">{booking.guestName}</span>
              </Field>
              <Field label="Account No.">
                <span className="font-mono">{booking.accountNo}</span>
              </Field>
              <Field label="Account Type">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${accountTypeBadgeClass(booking.accountType)}`}>
                    {booking.accountType}
                  </Badge>
                  {booking.membershipTier && (
                    <Badge className={`text-xs ${membershipBadgeClass(booking.membershipTier)}`}>
                      {booking.membershipTier}
                    </Badge>
                  )}
                </div>
              </Field>
              {booking.companyName && (
                <Field label="Company">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span>{booking.companyName}</span>
                  </div>
                </Field>
              )}
              {booking.agencyName && (
                <Field label="Agency">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    <span>{booking.agencyName}</span>
                  </div>
                </Field>
              )}
              <Field label="Number of Guests">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{booking.numberOfGuests} total</span>
                </div>
              </Field>
              <Field label="Non-Flying Guests">
                <span>{booking.nonFlyingGuests || 0}</span>
              </Field>
              <Field label="Payment Method">
                <span>{formatPaymentLabel(booking)}</span>
              </Field>
              <Field label="Account Discount">
                <span className={booking.agencyDiscountRate || id % 4 === 0 ? 'text-green-600' : ''}>
                  {accountDiscount}
                </span>
              </Field>
              <Field label="Promotion Code">
                {promoCode
                  ? <div className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-indigo-500" /><span className="font-mono text-indigo-600">{promoCode}</span></div>
                  : <span className="text-gray-400">—</span>}
              </Field>
              <Field label="Account Remark">
                <span className={accountRemark !== '—' ? 'text-blue-600' : 'text-gray-400'}>{accountRemark}</span>
              </Field>
              <Field label="Booking Channel">
                <span>{booking.bookingType}</span>
              </Field>
              <Field label="Submitted At">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{booking.submittedAt}</span>
                </div>
              </Field>
            </div>
          </Card>

          {/* ── 2. Flight Information ── */}
          <Card className="p-6">
            <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-5">Flight Information</h2>
            <div className="grid grid-cols-4 gap-6">
              <Field label="Flight Type">
                {booking.flightType === 'Arrival' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                    <Plane className="w-3.5 h-3.5 -rotate-45" /> Arrival
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200">
                    <Plane className="w-3.5 h-3.5 rotate-45" /> Departure
                  </span>
                )}
              </Field>
              <Field label="Arrival Date">
                <span>{arrivalDate || '—'}</span>
              </Field>
              <Field label="Flight Number">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{booking.flightNo}</span>
                </div>
              </Field>
              <Field label="Flight Time (STD/STA)">
                <span className="font-medium">{booking.flightTime}</span>
              </Field>
              <Field label="Route">
                <span>{booking.flightOrigin || '—'} → {booking.flightDestination || '—'}</span>
              </Field>
              <Field label="Number of Luggage">
                <div className="flex items-center gap-1.5">
                  <Luggage className="w-4 h-4 text-gray-400" />
                  <span>{numberOfLuggage} pcs</span>
                </div>
              </Field>
              <Field label="Flight Class (Main VIP)">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${
                  flightClass === 'First Class'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : flightClass === 'Business Class'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  {flightClass === 'First Class' && <Star className="w-3.5 h-3.5 fill-current" />}
                  {flightClass}
                </span>
              </Field>
            </div>
          </Card>

          {/* ── 3. Booking Details ── */}
          <Card className="p-6">
            <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-5">Booking Details</h2>

            {/* Basic booking info */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <Field label="Suite / Lounge">
                <span className="font-medium">{booking.suite}</span>
                {(booking.assignedSuiteNames?.length || booking.assignedLoungeNames?.length) ? (
                  <div className="mt-1.5 space-y-1">
                    {booking.assignedSuiteNames && booking.assignedSuiteNames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Suites</span>
                        {booking.assignedSuiteNames.map(name => (
                          <span key={name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">{name}</span>
                        ))}
                      </div>
                    )}
                    {booking.assignedLoungeNames && booking.assignedLoungeNames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Lounges</span>
                        {booking.assignedLoungeNames.map(name => (
                          <span key={name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">{name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </Field>
              <Field label="Visit Date &amp; Time"><span>{booking.dateTime}</span></Field>
              <Field label="Payment Mode">
                <Badge className={`text-xs ${paymentModeBadgeClass(booking.paymentMode)}`}>{formatPaymentLabel(booking)}</Badge>
              </Field>
              <Field label="Booking Type"><span>{booking.bookingType}</span></Field>
              {booking.isAdHoc && (
                <Field label="Ad-hoc Booking">
                  <span className="text-amber-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Yes — within cut-off period</span>
                </Field>
              )}
            </div>

            {/* Part 1: Premiere Suite */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-purple-50/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Part 1 — Premiere Suite</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Max 6 guests (VIP + Non-Flying) per suite</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                  {vipPS + nonFlyingPS} / {numPremiereSuites * 6 || '—'} guests used
                </span>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <Field label="Quantity of Premiere Suite">
                  <span className="text-base font-medium">{numPremiereSuites}</span>
                </Field>
                <Field label="VIP Passengers">
                  <span className="text-base font-medium">{vipPS}</span>
                </Field>
                <Field label="Non-Flying Guests">
                  <span className="text-base font-medium">{nonFlyingPS}</span>
                </Field>
              </div>
            </div>

            {/* Part 2: Lounge Deluxe */}
            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Part 2 — Lounge Deluxe</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Max 3 Non-Flying Guests per booking</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                  {nonFlyingLD} / 3 non-flying used
                </span>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <Field label="VIP Passengers">
                  <span className="text-base font-medium">{vipLD}</span>
                </Field>
                <Field label="Non-Flying Guests">
                  <span className="text-base font-medium">{nonFlyingLD}</span>
                </Field>
              </div>
            </div>
          </Card>

          {/* ── 4. VIP Passenger Details ── */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm uppercase tracking-wide text-gray-500">VIP Passenger Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {passengers.length} passenger{passengers.length !== 1 ? 's' : ''} —
                  {vipPS > 0 && ` ${vipPS} from Premiere Suite`}
                  {vipPS > 0 && vipLD > 0 && ','}
                  {vipLD > 0 && ` ${vipLD} from Lounge Deluxe`}
                </p>
              </div>
            </div>

            {passengers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                <p className="text-sm">No VIP passengers assigned.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">#</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Section</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Name</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Travel Doc No.</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Membership No.</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Age Group</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Birthday</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {passengers.map((p, idx) => {
                      const isPS = idx < vipPS;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPS ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {isPS ? 'Premiere Suite' : 'Lounge Deluxe'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium">{p.title} {p.firstName} {p.lastName}</td>
                          <td className="px-3 py-2.5 font-mono text-gray-600">{p.doc}</td>
                          <td className="px-3 py-2.5 font-mono text-gray-600">{p.mem || '—'}</td>
                          <td className="px-3 py-2.5 text-gray-600">{p.ageGroup}</td>
                          <td className="px-3 py-2.5 text-gray-600">{p.day} {p.month} {p.year}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── 5. Non-Flying Guest Details ── */}
          {booking.nonFlyingGuests > 0 && (
            <Card className="p-6">
              <div className="mb-5">
                <h2 className="text-sm uppercase tracking-wide text-gray-500">Non-Flying Guest Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {nonFlyingGuestList.length} guest{nonFlyingGuestList.length !== 1 ? 's' : ''} —
                  {nonFlyingPS > 0 && ` ${nonFlyingPS} from Premiere Suite`}
                  {nonFlyingPS > 0 && nonFlyingLD > 0 && ','}
                  {nonFlyingLD > 0 && ` ${nonFlyingLD} from Lounge Deluxe`}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">#</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Section</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Name</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Age Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {nonFlyingGuestList.map((g, idx) => {
                      const isPS = idx < nonFlyingPS;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPS ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {isPS ? 'Premiere Suite' : 'Lounge Deluxe'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium">{g.title} {g.firstName} {g.lastName}</td>
                          <td className="px-3 py-2.5 text-gray-600">{g.ageGroup}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── 6. Services Included ── */}
          <Card className="p-6">
            <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-5">Services Included</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${booking.hasLimousine ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                <Car className={`w-5 h-5 ${booking.hasLimousine ? 'text-purple-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-medium ${booking.hasLimousine ? 'text-purple-800' : 'text-gray-400'}`}>Limousine Transfer</p>
                  <p className="text-xs text-gray-500">{booking.hasLimousine ? 'Included' : 'Not included'}</p>
                </div>
                {booking.hasLimousine && <CheckCircle className="w-4 h-4 text-purple-500 ml-auto" />}
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${booking.hasShopping ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                <ShoppingBag className={`w-5 h-5 ${booking.hasShopping ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-medium ${booking.hasShopping ? 'text-green-800' : 'text-gray-400'}`}>In-lounge Shopping</p>
                  <p className="text-xs text-gray-500">{booking.hasShopping ? 'Included' : 'Not included'}</p>
                </div>
                {booking.hasShopping && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
              </div>
              {/* R6.2.100 (2026-07-02) — Lounge Extension card. The
                  wrapper now synthesises a "Lounge Extension" addon
                  entry from `apiBookings.additional_hours` (the
                  post-R6.2.100 source of truth — the legacy
                  `bookable_items['Lounge Extension']` row was
                  retired). Mirrors the rendering pattern of Limo +
                  Shopping above. Renders only when the wrapper
                  forwarded the addon (i.e. additional_hours > 0);
                  standalone-preview mode (no prop) has no addon so
                  this card stays hidden, preserving the figma Make
                  import. Quantity shown as hours. */}
              {(() => {
                const loungeAddon = booking.addons?.find((a) => a.name === 'Lounge Extension');
                if (!loungeAddon) return null;
                const hours = Number(loungeAddon.quantity ?? 0);
                return (
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-amber-50 border-amber-200">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Lounge Extension</p>
                      <p className="text-xs text-gray-500">{hours} additional hour{hours !== 1 ? 's' : ''}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-amber-500 ml-auto" />
                  </div>
                );
              })()}
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${hasWheelchair ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                <Accessibility className={`w-5 h-5 ${hasWheelchair ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-medium ${hasWheelchair ? 'text-blue-800' : 'text-gray-400'}`}>Wheelchair Assistance</p>
                  <p className="text-xs text-gray-500">{hasWheelchair ? 'Requested' : 'Not required'}</p>
                </div>
                {hasWheelchair && <CheckCircle className="w-4 h-4 text-blue-500 ml-auto" />}
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${hasPrivateSales ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                <Star className={`w-5 h-5 ${hasPrivateSales ? 'text-amber-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-medium ${hasPrivateSales ? 'text-amber-800' : 'text-gray-400'}`}>Private Sales</p>
                  <p className="text-xs text-gray-500">{hasPrivateSales ? 'Requested' : 'Not requested'}</p>
                </div>
                {hasPrivateSales && <CheckCircle className="w-4 h-4 text-amber-500 ml-auto" />}
              </div>
            </div>
          </Card>

          {/* ── 7. Contact Person ── */}
          <Card className="p-6">
            <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-5">Contact Person</h2>
            <div className="grid grid-cols-3 gap-6">
              <Field label={<span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Name</span>}>
                <span>{contact.name}</span>
              </Field>
              <Field label={<span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Contact Email</span>}>
                <span className="text-blue-600">{contact.email}</span>
              </Field>
              <Field label={<span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Contact No.</span>}>
                <span>{contact.phone}</span>
              </Field>
              {contact.memo && (
                <div className="col-span-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5" style={{ marginBottom: '10px' }}>
                    <MessageSquare className="w-3.5 h-3.5" />Booking Memo
                  </p>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                    {contact.memo}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ── 8. Special Requests ── */}
          {booking.specialRequests && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-1">Special Request</h3>
                  <p className="text-sm text-yellow-800">{booking.specialRequests}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            RIGHT COLUMN — Payment Info + Review Actions
            ════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Payment Information */}
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Payment Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Payment Mode</p>
                <Badge className={`text-sm ${paymentModeBadgeClass(booking.paymentMode)}`}>
                  {formatPaymentLabel(booking)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500" style={{ marginBottom: '10px' }}>Amount</p>
                {booking.agencyDiscountRate && booking.originalAmountValue ? (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400 line-through">HK${booking.originalAmountValue.toLocaleString()}</p>
                    <p className="text-2xl text-green-700 font-bold">{booking.amount}</p>
                    <div className="flex items-center gap-1 text-sm text-green-700">
                      <BadgePercent className="w-4 h-4" />
                      <span>{booking.agencyDiscountRate}% agency discount applied</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{booking.amount}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Review Actions */}
          <Card className="p-6 sticky top-6">
            <h2 className="text-lg font-medium mb-4">Review Actions</h2>

            {reviewMode === 'view' && (
              <div className="space-y-3">
                {reviewStage === 'staff' && booking.requestType === 'New Booking Request' && (
                  <div
                    className="rounded-md border border-gray-200 bg-gray-50 p-3"
                    data-testid="auto-send-invoice-radio"
                  >
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      Auto send invoice
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      If Yes, supervisor approval emails the invoice and payment link.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="autoSendInvoice"
                          value="yes"
                          checked={autoSendInvoice}
                          onChange={() => onAutoSendInvoiceChange?.(true)}
                          data-testid="auto-send-invoice-yes"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="autoSendInvoice"
                          value="no"
                          checked={!autoSendInvoice}
                          onChange={() => onAutoSendInvoiceChange?.(false)}
                          data-testid="auto-send-invoice-no"
                        />
                        No
                      </label>
                    </div>
                  </div>
                )}
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-12"
                  onClick={handleApprove}
                >
                  <CheckCircle className="w-5 h-5" />
                  {booking.requestType === 'Cancel'
                    ? (reviewStage === 'staff' ? 'Approve Cancellation' : 'Confirm Cancellation (Final)')
                    : (reviewStage === 'staff' ? 'Approve & Forward to Supervisor' : 'Approve Booking (Final)')}
                </Button>
                {/* 2026-06-24: supervisor-only push-back to Step 1
                    (Staff Review). Yellow per Sky's spec, sits
                    between the green Approve and red Reject
                    buttons. Disabled if the wrapper didn't provide
                    `onPushBack` (e.g. legacy callers). */}
                {reviewStage === 'supervisor' && onPushBack && (
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white gap-2 h-12"
                    onClick={() => setShowPushBackDialog(true)}
                  >
                    <Undo2 className="w-5 h-5" />
                    Push Back to Staff Review
                  </Button>
                )}
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 h-12"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="w-5 h-5" />
                  {booking.requestType === 'Cancel' ? 'Reject Cancellation' : 'Reject Booking'}
                </Button>
              </div>
            )}

            {reviewMode === 'reject' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ marginBottom: '10px' }}>
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {REJECTION_REASONS.map(reason => (
                      <label key={reason} className="flex items-start gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="rejectionReason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={() => setSelectedReason(reason)}
                          className="accent-red-500 mt-0.5"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                  {selectedReason === 'Other (specify below)' && (
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-2 text-sm mt-2"
                      rows={3}
                      placeholder="Please describe the rejection reason…"
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                  <MailCheck className="w-4 h-4 flex-shrink-0" />
                  <span>The guest will be notified of this rejection and the reason via email.</span>
                </div>
                <div className="space-y-2">
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 h-12"
                    disabled={!rejectReasonValid}
                    onClick={handleReject}
                  >
                    <XCircle className="w-5 h-5" />
                    Confirm Rejection
                  </Button>
                  <Button variant="outline" className="w-full h-10" onClick={() => setReviewMode('view')}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
            <DialogDescription>
              Please select a rejection reason below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ marginBottom: '10px' }}>
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REJECTION_REASONS.map(reason => (
                  <label key={reason} className="flex items-start gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-red-500 mt-0.5"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ marginBottom: '10px' }}>
                Additional Details (Optional)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                rows={3}
                placeholder="Add any additional notes about the rejection..."
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              disabled={!rejectReasonValid}
              onClick={handleReject}
            >
              <XCircle className="w-4 h-4" />
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2026-06-24: Push-Back Dialog (supervisor only). Collects
          the reason the supervisor is sending the booking back to
          staff; backend requires a non-empty `rejection_reason`
          for the PendingForApproval → PendingForReview transition
          (see BookingController.php:516-527). */}
      <Dialog open={showPushBackDialog} onOpenChange={(open) => {
        setShowPushBackDialog(open);
        if (!open) setPushBackReason('');
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-yellow-600" />
              Push Back to Staff Review
            </DialogTitle>
            <DialogDescription>
              Send this booking back to Step 1: Staff Review for revision.
              Please describe what the staff member should change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ marginBottom: '10px' }}>
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                rows={4}
                placeholder="e.g. Please verify guest's flight class and re-submit."
                value={pushBackReason}
                onChange={e => setPushBackReason(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>The staff member will see this reason and revise the booking before re-submitting.</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowPushBackDialog(false);
              setPushBackReason('');
            }}>
              Cancel
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
              disabled={!pushBackReasonValid}
              onClick={handlePushBack}
            >
              <Undo2 className="w-4 h-4" />
              Push Back to Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}