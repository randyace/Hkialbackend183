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

import { Plane, Calendar, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../ui/select';
import type {
  BookingFormData, EditFlightType, EditFlightClass, EditPaymentMode,
} from '../../BookingEditView';
import { computeVisitTimeRange } from '../../BookingEditView';

export interface EditSectionFlightProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
  // 2026-06-30 — hide Transit option + 2nd-leg block in the Flight
  // Type <Select>. Default true (backward-compat). Wrapper passes
  // false from the admin Detail page per Sky's directive to stop
  // staff from flipping existing bookings into Transit.
  showTransit?: boolean;
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
}: EditSectionFlightProps) {
  const flightType = formData.flightType;
  // Round 6.2.74 — Sky's 3h booking-time rule. The range is empty when
  // flightTime / leg2FlightTime are unset (caller gates the Save button).
  const visitTimeRange = computeVisitTimeRange(formData);
  const visitTimeRangeError = visitTimeRange.error;
  const visitTimeHint = visitTimeRange.min && visitTimeRange.max
    ? `Must be between ${visitTimeRange.min} and ${visitTimeRange.max}`
    : null;
  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
        <Plane className="w-4 h-4" /> Flight Information
      </h3>
      <div className="grid grid-cols-3 gap-6">

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Flight Type</label>
          <Select
            value={flightType}
            onValueChange={v => onFormChange({ flightType: v as EditFlightType })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
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
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Flight Number</label>
          <input
            id="edit-flight-no"
            type="text"
            value={formData.flightNo}
            onChange={e => onFormChange({ flightNo: e.target.value.toUpperCase() })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
            placeholder="e.g. CX234"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Flight Time</label>
          <input
            type="time"
            value={formData.flightTime}
            onChange={e => onFormChange({ flightTime: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
            placeholder="e.g. LHR"
          />
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
            placeholder="e.g. NRT"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
                placeholder="e.g. CX888"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Flight Time</label>
              <input
                type="time"
                value={formData.leg2FlightTime ?? ''}
                onChange={e => onFormChange({ leg2FlightTime: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Arrival Date</label>
              <input
                type="date"
                value={formData.leg2ArrivalDate ?? ''}
                onChange={e => onFormChange({ leg2ArrivalDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Flight Class</label>
              <Select
                value={formData.leg2FlightClass ?? ''}
                onValueChange={v => onFormChange({ leg2FlightClass: v as EditFlightClass })}
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
              <label className="block text-sm text-gray-600 mb-[10px]">Leg 2 Destination</label>
              <input
                type="text"
                value={formData.leg2Destination ?? ''}
                onChange={e => onFormChange({ leg2Destination: e.target.value.toUpperCase() })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
                placeholder="e.g. LHR"
              />
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-[10px]">Visit Time</label>
            {/* Round 6.2.74 — Sky's 3h rule: `min`/`max` constrain the
                time picker; inline hint/error surfaces the rule. The
                master Save button (BookingDetail.tsx) is also gated on
                `visitTimeError` via `hasGuestErrorsFinal`. */}
            <input
              type="time"
              value={formData.visitTime}
              onChange={e => onFormChange({ visitTime: e.target.value })}
              min={visitTimeRange.min}
              max={visitTimeRange.max}
              data-testid="edit-visit-time"
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                visitTimeRangeError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {visitTimeRangeError ? (
              <p
                className="text-xs text-red-600 mt-1 flex items-start gap-1"
                data-testid="edit-visit-time-error"
                role="alert"
              >
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{visitTimeRangeError}</span>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Upfront">Upfront</SelectItem>
                <SelectItem value="Net Upfront">Net Upfront</SelectItem>
                <SelectItem value="On-Credit">On-Credit</SelectItem>
                <SelectItem value="Bulk Purchase/Monthly Invoice">Bulk Purchase / Monthly Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}