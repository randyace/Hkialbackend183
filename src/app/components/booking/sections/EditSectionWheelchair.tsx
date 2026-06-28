/**
 * EditSectionWheelchair.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for the
 * Wheelchair Recipient name text input. Stored in
 * `advanced_details.addons.wheelchairPassenger`. Only
 * relevant when `hasWheelchair=true` (the toggle in the
 * unified `EditSectionAddons` card).
 *
 * Pre-6.2.72 this was inline in `BookingEditView.tsx` around
 * line 1390-1404 (inside the "Add-on Services" card). Now
 * extracted.
 */

import { Accessibility } from 'lucide-react';
import { Card } from '../../ui/card';
import type { BookingFormData } from '../BookingEditView';

export interface EditSectionWheelchairProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
}

export function EditSectionWheelchair({
  formData,
  onFormChange,
}: EditSectionWheelchairProps) {
  if (!formData.hasWheelchair) return null;
  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
        <Accessibility className="w-4 h-4" /> Wheelchair Recipient
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        The passenger who will receive the wheelchair assistance. Only shown when
        "Wheelchair Assistance" is toggled on.
      </p>
      <div>
        <label className="block text-sm text-gray-600 mb-[10px]">
          <Accessibility className="w-3.5 h-3.5 inline mr-1" />
          Passenger Name
        </label>
        <input
          type="text"
          value={formData.wheelchairPassenger ?? ''}
          onChange={e => onFormChange({ wheelchairPassenger: e.target.value })}
          placeholder="e.g. Mr James Hoffmann"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
    </Card>
  );
}