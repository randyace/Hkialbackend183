/**
 * EditSectionStaff.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for In-Charge
 * Staff multi-select. Drives the `bookings.assigned_staff_ids`
 * JSON column (Phase 1 migration). The orchestrator's parent
 * fetches `GET /api/system/users` on mount and forwards the
 * list here via the `staffOptions` prop.
 *
 * Replaces the detail page's inline "Save Staff Assignment"
 * card which was a UI stub pre-6.2.71.
 *
 * Pre-6.2.72 this was a card in `BookingEditView.tsx` around
 * line 1452-1500. Now extracted.
 */

import { UserCheck } from 'lucide-react';
import { Card } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import type { BookingFormData, EditStaffOption } from '../BookingEditView';

export interface EditSectionStaffProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
  staffOptions: EditStaffOption[];
}

export function EditSectionStaff({
  formData,
  onFormChange,
  staffOptions,
}: EditSectionStaffProps) {
  const assignedIds = new Set(formData.assignedStaffIds ?? []);
  const toggle = (id: number) => {
    const next = new Set(assignedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onFormChange({ assignedStaffIds: Array.from(next) });
  };

  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
        <UserCheck className="w-4 h-4" /> In-Charge Staff
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Select one or more staff members who will be responsible for this booking.
        Multiple selections allowed.
      </p>
      {staffOptions.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          No staff options loaded. The wrapper will fetch from `/api/system/users` on mount.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {staffOptions.map(staff => {
            const isSelected = assignedIds.has(staff.id);
            return (
              <label
                key={staff.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300'
                    : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggle(staff.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                    {staff.name}
                  </p>
                  <p className="text-xs text-gray-500">{staff.role}</p>
                </div>
                {isSelected && (
                  <span className="shrink-0 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    In-Charge
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
      {assignedIds.size > 0 && staffOptions.length > 0 && (
        <div className="mt-4 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg">
          <p className="text-xs text-indigo-700">
            <strong>Assigned:</strong>{' '}
            {staffOptions.filter(s => assignedIds.has(s.id)).map(s => s.name).join(', ')}
          </p>
        </div>
      )}
    </Card>
  );
}