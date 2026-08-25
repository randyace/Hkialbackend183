/**
 * EditSectionFlight.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for Flight
 * Information (flightType / flightNo / flightTime / origin /
 * destination / flightClass / leg 2 [Transit only] /
 * numberOfLuggage) + Visit Date/Time + Suite (legacy) +
 * Payment Mode. All "booking basics" that don't fit elsewhere.
 *
 * 2026-06-28 round 6.2.74 — Sky's 3h booking-time rule
 * (visitTime within 3h of arrival at HKG, OR within 3h of
 * departure from HKG). Implemented via input `min`/`max`
 * + inline error hint. The helper `computeVisitTimeRange`
 * is exported from `BookingEditView.tsx` and reused by
 * the figma-ui BookingDetail.tsx for master Save gating.
 *
 * Pattern: section receives `formData` + `onFormChange`. The
 * orchestrator `BookingEditView.tsx` holds lifted state.
 *
 * Pre-6.2.72 these fields were in `BookingEditView.tsx` around
 * line 751-969 (Cards "Flight Information" + "Booking Details").
 * Now merged into one section for visual cohesion.
 */

import type { ReactNode } from 'react';
import { Plane, Calendar, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../ui/select';
import type {
  BookingFormData, EditFlightType, EditFlightClass, EditPaymentMode,
} from '../../BookingEditView';
import { computeVisitTimeRange } from '../../BookingEditView';
import { getLaravelFieldError } from '../../../../../../../lib/api/errors';

const INPUT_ERROR_CLS = 'border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500';
const INPUT_OK_CLS = 'border-gray-300';

function FieldErrorHint({ message, testId }: { message?: string; testId?: string }) {
  if (!message) return null;
  return (
    <p
      className="text-xs text-red-600 mt-1 flex items-start gap-1"
      data-testid={testId}
      role="alert"
    >
      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </p>
  );
}

// ── Time5MinSelect (port from customer NewBooking.tsx, round 6.2.122) ───────

/**
 * Two-column HH:MM time picker with a fixed 5-minute step on the minute
 * column. See round 6.2.121 handoff for the full rationale. The
 * CreateBooking port is in `figma-ui/src/app/components/CreateBooking.tsx:104-187`;
 * this EditSectionFlight copy follows the same inlined convention.
 */
const TIME5MIN_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const TIME5MIN_MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const TIME5MIN_SELECT_CLS =
  'flex-1 min-w-0 bg-transparent border-0 outline-none text-sm cursor-pointer appearance-none text-center px-2 py-0';

function Time5MinSelect({
  value,
  onChange,
  required,
  wrapperClassName,
  wrapperStyle,
  testId,
}: {
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
  testId?: string;
}) {
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

export interface EditSectionFlightProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
  // 2026-06-30 — hide Transit option + 2nd-leg block in the Flight
  // Type <Select>. Default true (backward-compat). Wrapper passes
  // false from the admin Detail page per Sky's directive to stop
  // staff from flipping existing bookings into Transit.
  showTransit?: boolean;
  /** Optional actions rendered in the card header (e.g. Update Flight Info). */
  headerActions?: ReactNode;
  /** Freshness text shown after the Flight Information title. */
  lastCheckedLabel?: ReactNode;
  /** Laravel 422 errors bag (snake_case keys) from Save All Changes. */
  fieldErrors?: Record<string, string[]>;
}

// 2026-06-28 (round 6.2.76) — "Suite / Venue (legacy)" dropdown
// REMOVED. The physical resource grid in `<EditSectionPhysicalResource>`
// (assignedSuiteIds[] + assignedLoungeIds[]) is the canonical edit
// surface; the legacy single-select was a fallback for bookings with
// no assigned suite/lounge and was the source of Sky's 2026-06-28
// directive "remove 'Suite / Venue (legacy)'".

export function EditSectionFlight({
  formData,
  onFormChange,
  showTransit = true,
  headerActions,
  lastCheckedLabel,
  fieldErrors,
}: EditSectionFlightProps) {
  const flightType = formData.flightType;
  // Round 6.2.74 — Sky's 3h booking-time rule. The range is empty when
  // flightTime / leg2FlightTime are unset (caller gates the Save button).
  const visitTimeRange = computeVisitTimeRange(formData);
  const visitTimeRangeError = visitTimeRange.error;
  const visitTimeHint = visitTimeRange.min && visitTimeRange.max
    ? `Must be between ${visitTimeRange.min} and ${visitTimeRange.max}`
    : null;

  const dateTimeError = getLaravelFieldError(fieldErrors, 'date_time');
  const flightNoError = getLaravelFieldError(fieldErrors, 'flight_no');
  const flightTimeError = getLaravelFieldError(fieldErrors, 'flight_time');
  const flightOriginError = getLaravelFieldError(fieldErrors, 'flight_origin');
  const flightDestError = getLaravelFieldError(fieldErrors, 'flight_destination');
  const flightTypeError = getLaravelFieldError(fieldErrors, 'flight_type');
  const paymentModeError = getLaravelFieldError(fieldErrors, 'payment_mode');
  const leg2FlightNoError = getLaravelFieldError(
    fieldErrors,
    'advanced_details.flight.legs.1.flightNo',
    'advanced_details.flight.legs',
  );
  const leg2FlightTimeError = getLaravelFieldError(
    fieldErrors,
    'advanced_details.flight.legs.1.flightTime',
  );
  const leg2ArrivalDateError = getLaravelFieldError(
    fieldErrors,
    'advanced_details.flight.legs.1.arrivalDate',
    'advanced_details.flight.legs',
  );
  const leg2ClassError = getLaravelFieldError(
    fieldErrors,
    'advanced_details.flight.legs.1.flightClass',
  );
  const leg2DestError = getLaravelFieldError(
    fieldErrors,
    'advanced_details.flight.legs.1.destination',
  );

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
          <h3 className="text-sm uppercase tracking-wide text-gray-500 flex items-center gap-2">
            <Plane className="w-4 h-4" /> Flight Information
          </h3>
          {lastCheckedLabel ? (
            <span data-testid="booking-detail-flight-last-checked" className="text-xs font-normal normal-case tracking-normal text-gray-400">
              {lastCheckedLabel}
            </span>
          ) : null}
        </div>
        {headerActions}
      </div>
      <div className="grid grid-cols-3 gap-6">

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Flight Type</label>
          <Select
            value={flightType}
            onValueChange={v => onFormChange({ flightType: v as EditFlightType })}
          >
            <SelectTrigger className={flightTypeError ? INPUT_ERROR_CLS : undefined}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Departure">Departure</SelectItem>
              <SelectItem value="Arrival">Arrival</SelectItem>
              {/* 2026-06-08 round 6.2.6.1 — INV-11. Pre-6.2.6 the
                  standalone edit page's dropdown was missing
                  'Transit'; bookings that came in as Transit
                  had flightType coerced to 'Arrival' on the
                  form (round 6.2.36 bug). */}
              {showTransit && <SelectItem value="Transit">Transit</SelectItem>}
            </SelectContent>
          </Select>
          <FieldErrorHint message={flightTypeError} />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Flight Number</label>
          <input
            id="edit-flight-no"
            type="text"
            value={formData.flightNo}
            onChange={e => onFormChange({ flightNo: e.target.value.toUpperCase() })}
            className={`w-full border rounded-md px-3 py-2 text-sm uppercase ${flightNoError ? INPUT_ERROR_CLS : INPUT_OK_CLS}`}
            placeholder="e.g. CX234"
          />
          <FieldErrorHint message={flightNoError} />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Flight Time</label>
          {/* 2026-07-07 (round 6.2.122) — Safari/Firefox timepicker
              fix (sibling finding from M35). Same port as the 3
              CreateBooking fields in 6.2.121. */}
          <Time5MinSelect
            value={formData.flightTime}
            onChange={(v) => onFormChange({ flightTime: v })}
            wrapperClassName={`w-full border rounded-md px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-300 ${
              flightTimeError ? INPUT_ERROR_CLS : INPUT_OK_CLS
            }`}
            testId="edit-section-flightTime"
          />
          <FieldErrorHint message={flightTimeError} />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">
            {flightType === 'Departure' ? 'Origin' : (flightType === 'Transit' ? 'Origin' : 'Destination (HKG)')}
          </label>
          <input
            type="text"
            value={flightType === 'Departure' || flightType === 'Transit' ? (formData.flightOrigin ?? '') : 'HKG'}
            onChange={e => (flightType === 'Departure' || flightType === 'Transit')
              ? onFormChange({ flightOrigin: e.target.value.toUpperCase() })
              : undefined}
            readOnly={flightType === 'Arrival'}
            className={`w-full border rounded-md px-3 py-2 text-sm uppercase ${
              flightOriginError && (flightType === 'Departure' || flightType === 'Transit')
                ? INPUT_ERROR_CLS
                : INPUT_OK_CLS
            }`}
            placeholder="e.g. LHR"
          />
          <FieldErrorHint message={flightType === 'Arrival' ? undefined : flightOriginError} />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">
            {flightType === 'Departure' ? 'Destination' : 'Origin'}
          </label>
          <input
            type="text"
            value={flightType === 'Departure' ? (formData.flightDestination ?? '') : (formData.flightOrigin ?? '')}
            onChange={e => flightType === 'Departure'
              ? onFormChange({ flightDestination: e.target.value.toUpperCase() })
              : onFormChange({ flightOrigin: e.target.value.toUpperCase() })}
            className={`w-full border rounded-md px-3 py-2 text-sm uppercase ${
              (flightType === 'Departure' ? flightDestError : flightOriginError)
                ? INPUT_ERROR_CLS
                : INPUT_OK_CLS
            }`}
            placeholder="e.g. NRT"
          />
          <FieldErrorHint
            message={flightType === 'Departure' ? flightDestError : flightOriginError}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Flight Class</label>
          <Select
            value={formData.flightClass ?? ''}
            onValueChange={v => onFormChange({ flightClass: v as EditFlightClass })}
          >
            <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Economy Class">Economy Class</SelectItem>
              <SelectItem value="Business Class">Business Class</SelectItem>
              <SelectItem value="First Class">First Class</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Number of Luggage</label>
          <input
            id="edit-num-luggage"
            type="number"
            min={0}
            value={formData.numberOfLuggage ?? 0}
            onChange={e => onFormChange({
              numberOfLuggage: Math.max(0, parseInt(e.target.value) || 0),
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* 2026-06-08 round 6.2.6.1 — 2nd-leg editor (Transit only).
          The create form has had this since round 6.2.36 (Phase 1.1).
          Pre-6.2.71 the standalone edit page had no leg2 UI — Transit
          bookings' 2nd leg was effectively read-only.
          2026-06-30 — also gated on `showTransit` so the block
          disappears when the wrapper opts out of Transit. */}
      {showTransit && flightType === 'Transit' && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5" /> Transit 2nd Leg (outbound from HKG)
          </h4>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Flight No.</label>
              <input
                type="text"
                value={formData.leg2FlightNo ?? ''}
                onChange={e => onFormChange({ leg2FlightNo: e.target.value.toUpperCase() })}
                className={`w-full border rounded-md px-3 py-2 text-sm uppercase ${leg2FlightNoError ? INPUT_ERROR_CLS : INPUT_OK_CLS}`}
                placeholder="e.g. CX888"
              />
              <FieldErrorHint message={leg2FlightNoError} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Flight Time</label>
              {/* 2026-07-07 (round 6.2.122) — same M35 sibling port.
                  Leg 2 has no 3h rule of its own (the visit-time 3h rule
                  is enforced on `formData.visitTime` against either
                  flightTime or leg2FlightTime depending on flightType). */}
              <Time5MinSelect
                value={formData.leg2FlightTime ?? ''}
                onChange={(v) => onFormChange({ leg2FlightTime: v })}
                wrapperClassName={`w-full border rounded-md px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-300 ${
                  leg2FlightTimeError ? INPUT_ERROR_CLS : INPUT_OK_CLS
                }`}
                testId="edit-section-leg2FlightTime"
              />
              <FieldErrorHint message={leg2FlightTimeError} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Arrival Date</label>
              <input
                type="date"
                value={formData.leg2ArrivalDate ?? ''}
                onChange={e => onFormChange({ leg2ArrivalDate: e.target.value })}
                className={`w-full border rounded-md px-3 py-2 text-sm ${leg2ArrivalDateError ? INPUT_ERROR_CLS : INPUT_OK_CLS}`}
              />
              <FieldErrorHint message={leg2ArrivalDateError} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Flight Class</label>
              <Select
                value={formData.leg2FlightClass ?? ''}
                onValueChange={v => onFormChange({ leg2FlightClass: v as EditFlightClass })}
              >
                <SelectTrigger className={leg2ClassError ? INPUT_ERROR_CLS : undefined}><SelectValue placeholder="Select class…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy Class">Economy Class</SelectItem>
                  <SelectItem value="Business Class">Business Class</SelectItem>
                  <SelectItem value="First Class">First Class</SelectItem>
                </SelectContent>
              </Select>
              <FieldErrorHint message={leg2ClassError} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Destination</label>
              <input
                type="text"
                value={formData.leg2Destination ?? ''}
                onChange={e => onFormChange({ leg2Destination: e.target.value.toUpperCase() })}
                className={`w-full border rounded-md px-3 py-2 text-sm uppercase ${leg2DestError ? INPUT_ERROR_CLS : INPUT_OK_CLS}`}
                placeholder="e.g. LHR"
              />
              <FieldErrorHint message={leg2DestError} />
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-3 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Backend enforces a 6h MIN gap between the 1st leg's arrival time and the 2nd leg's departure time (round 6.2.98 MAX rule — flip confirmed). If leg 2 conflicts with leg 1's arrival, save will fail with a 422.</span>
          </p>
        </div>
      )}

      {/* Booking basics: visit date/time + suite + payment mode.
          Pre-6.2.72 this was a separate "Booking Details" card
          (line 919-969 of the legacy BookingEditView.tsx); now
          merged into the Flight section for visual cohesion. */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Visit & Payment
        </h4>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-[10px]">Visit Date</label>
            <input
              id="edit-visit-date"
              type="date"
              value={formData.visitDate}
              onChange={e => onFormChange({ visitDate: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 text-sm ${dateTimeError ? INPUT_ERROR_CLS : INPUT_OK_CLS}`}
            />
            <FieldErrorHint message={dateTimeError} testId="edit-visit-date-error" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-[10px]">Visit Time</label>
            {/* Round 6.2.74 → 6.2.121 → 6.2.122 — Sky's 3h rule.
                Pre-6.2.122: native `<input type="time">` with `min`/`max`
                that broke on Safari/Firefox (see round 6.2.121 handoff).
                6.2.122: dropped `min`/`max` UX (broken on the native
                picker), kept the 3 enforcement layers:
                  1. red-border CSS class on out-of-range
                  2. inline error <p data-testid="edit-visit-time-error">
                  3. master Save button gated on visitTimeRangeError
                     in BookingDetail.tsx (hasGuestErrorsFinal).
                The `visitTimeHint` <p> shows the range reminder when
                flightTime + visitDate are present + in-range. testId
                preserved so the existing Playwright e2e selector keeps
                working — selectors targeting `input[type="time"]` need
                to drop the `[type="time"]` qualifier (test updates in
                BookingDetail.round6_2_74.test.tsx). */}
            <Time5MinSelect
              value={formData.visitTime}
              onChange={(v) => onFormChange({ visitTime: v })}
              wrapperClassName={`w-full border rounded-md px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-300 ${
                visitTimeRangeError || dateTimeError ? INPUT_ERROR_CLS : INPUT_OK_CLS
              }`}
              testId="edit-visit-time"
            />
            {(visitTimeRangeError || dateTimeError) ? (
              <p
                className="text-xs text-red-600 mt-1 flex items-start gap-1"
                data-testid="edit-visit-time-error"
                role="alert"
              >
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{visitTimeRangeError || dateTimeError}</span>
              </p>
            ) : visitTimeHint ? (
              <p
                className="text-xs text-gray-500 mt-1"
                data-testid="edit-visit-time-hint"
              >
                {visitTimeHint} (3h rule)
              </p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-[10px]">Payment Mode</label>
            <Select
              value={formData.paymentMode}
              onValueChange={v => onFormChange({ paymentMode: v as EditPaymentMode })}
            >
              <SelectTrigger className={paymentModeError ? INPUT_ERROR_CLS : undefined}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Upfront">Upfront</SelectItem>
                <SelectItem value="Net Upfront">Net Upfront</SelectItem>
                <SelectItem value="On-Credit">On-Credit</SelectItem>
                <SelectItem value="Bulk Purchase/Monthly Invoice">Bulk Purchase / Monthly Invoice</SelectItem>
              </SelectContent>
            </Select>
            <FieldErrorHint message={paymentModeError} />
          </div>
        </div>
      </div>
    </Card>
  );
}