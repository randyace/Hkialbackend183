/**
 * EditSectionPhysicalResource.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for the
 * Premiere Suite (PS) + Lounge Deluxe (LD) checkbox grids.
 * Per Sky's Q1 answer: "list of checkboxes for assigning PS
 * + another list of checkboxes for assigning LD" — the
 * physical resource multi-select model. Drives the
 * `assigned_suite_ids[]` + `assigned_lounge_ids[]` arrays
 * that the backend's `syncSuiteAssignments` reads.
 *
 * At least one suite OR lounge is required (the backend's
 * `PricingPreviewService` throws "Pick at least one resource"
 * otherwise).
 *
 * 2026-06-28 round 6.2.74 — per-type checkbox caps (Sky:
 * "the Physical Resources should have checked checkbox
 * limit to it's type. you may check on how create booking
 * doing so"). Matches the CreateBooking pattern:
 *   - PS cap = numPremiereSuites (matches CreateBooking line 2081)
 *   - LD cap = vipPassengersInLoungeDeluxe (= numLoungeDeluxe
 *     per the "1 LD = 1 LDVIP" pricing rule; NEW for the edit
 *     surface — CreateBooking LD was previously "free choice").
 * Unchecked checkboxes are disabled when at cap; counter badge
 * "{X} / {cap} assigned" shown for both types.
 *
 * Pre-6.2.72 this was a card in `BookingEditView.tsx` around
 * line 1237-1294. Now extracted.
 */

import { Building2 } from 'lucide-react';
import { Card } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import type { BookingFormData, EditSuiteOption } from '../BookingEditView';

export interface EditSectionPhysicalResourceProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
  suiteOptions: EditSuiteOption[];
}

export function EditSectionPhysicalResource({
  formData,
  onFormChange,
  suiteOptions,
}: EditSectionPhysicalResourceProps) {
  const assignedSuiteIds = new Set(formData.assignedSuiteIds ?? []);
  const assignedLoungeIds = new Set(formData.assignedLoungeIds ?? []);
  const suiteOpts = suiteOptions.filter(s => s.kind === 'suite');
  const loungeOpts = suiteOptions.filter(s => s.kind === 'lounge');

  // Round 6.2.74 — per-type caps. PS cap = numPremiereSuites (matches
  // CreateBooking). LD cap = vipPassengersInLoungeDeluxe (= numLoungeDeluxe
  // per the "1 LD = 1 LDVIP" pricing rule). When the cap is 0 the
  // corresponding checkbox grid is hidden (no PS/LD ordered → nothing
  // to assign).
  const psCap = formData.numPremiereSuites ?? 0;
  const ldCap = formData.vipPassengersInLoungeDeluxe ?? 0;
  const psAtCap = assignedSuiteIds.size >= psCap;
  const ldAtCap = assignedLoungeIds.size >= ldCap;

  const toggleSuite = (id: number) => {
    const next = new Set(assignedSuiteIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onFormChange({ assignedSuiteIds: Array.from(next) });
  };
  const toggleLounge = (id: number) => {
    const next = new Set(assignedLoungeIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onFormChange({ assignedLoungeIds: Array.from(next) });
  };

  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
        <Building2 className="w-4 h-4" /> Physical Resources
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Select at least one suite OR lounge. Pricing is routed to the matching product
        (Premiere Suite if any suite is picked, Lounge Deluxe otherwise).
      </p>

      {/* Premiere Suites — round 6.2.74 cap = numPremiereSuites */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Premiere Suites (CIP 1-6, Function Room)
          </h4>
          {psCap > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              assignedSuiteIds.size > psCap
                ? 'bg-red-100 text-red-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {assignedSuiteIds.size} / {psCap} assigned
            </span>
          )}
        </div>
        {psCap === 0 ? (
          <p className="text-xs text-gray-400 italic">
            Set Quantity of Premiere Suite above to enable suite assignment.
          </p>
        ) : suiteOpts.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            No suite options loaded. The wrapper will fetch from `/api/suites` on mount.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {suiteOpts.map(s => {
              const checked = assignedSuiteIds.has(s.id);
              // Round 6.2.74 — disable unchecked when at cap (matches
              // CreateBooking line 2081). User can always UNCHECK
              // existing selections (toggle is one-way when at cap).
              const isAtCap = !checked && psAtCap;
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                    checked
                      ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300'
                      : isAtCap
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={isAtCap}
                    onCheckedChange={() => toggleSuite(s.id)}
                  />
                  <span className={`truncate ${isAtCap ? 'text-gray-400' : ''}`}>{s.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Lounge Deluxe — round 6.2.74 cap = vipPassengersInLoungeDeluxe */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Lounge Deluxe (Lobby 1-8)
          </h4>
          {ldCap > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              assignedLoungeIds.size > ldCap
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {assignedLoungeIds.size} / {ldCap} assigned
            </span>
          )}
        </div>
        {ldCap === 0 ? (
          <p className="text-xs text-gray-400 italic">
            Set Quantity of VIP Passengers (LD) above to enable lounge assignment.
          </p>
        ) : loungeOpts.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No lounge options loaded.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {loungeOpts.map(l => {
              const checked = assignedLoungeIds.has(l.id);
              // Round 6.2.74 — same disable-at-cap pattern as PS.
              const isAtCap = !checked && ldAtCap;
              return (
                <label
                  key={l.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                    checked
                      ? 'bg-purple-50 border-purple-400 ring-1 ring-purple-300'
                      : isAtCap
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={isAtCap}
                    onCheckedChange={() => toggleLounge(l.id)}
                  />
                  <span className={`truncate ${isAtCap ? 'text-gray-400' : ''}`}>{l.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}