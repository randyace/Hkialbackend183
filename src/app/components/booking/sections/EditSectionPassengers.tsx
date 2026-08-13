/**
 * EditSectionPassengers.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for per-VIP
 * passenger detail forms. Renders N rows = vipPS + vipLD.
 * Order is [PS VIPs..., LD VIPs...] per the create form's
 * invariant. The orchestrator splits the array back into
 * `suite_passengers[]` + `lounge_suite_passengers[]` per
 * round 6.2.50 (segmented arrays) on save.
 *
 * Pre-6.2.72 this was a card in `BookingEditView.tsx` around
 * line 1052-1147. Now extracted.
 */

import { UserCheck } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../ui/select';
import { NationalityTypeahead } from '../../../../../../../components/NationalityTypeahead';
import type {
  BookingFormData, EditPassenger,
} from '../BookingEditView';

// Spec (Sky 2026-06-10 age-dropdown normalize): ONLY these 3 labels.
// Pre-rename wire values are normalised on read by mapPassengerAgeGroup
// and must never reappear as selectable dropdown options.
const AGE_GROUP_OPTIONS = [
  { value: 'Adults (aged 12 and above)', label: 'Adults (aged 12 and above)' },
  { value: 'Children (aged 2-11)', label: 'Children (aged 2-11)' },
  { value: 'Infants (under 2 years old)', label: 'Infants (under 2 years old)' },
];

export interface EditSectionPassengersProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
}

export function EditSectionPassengers({
  formData,
  onFormChange,
}: EditSectionPassengersProps) {
  const passengers = formData.passengers ?? [];
  const vipPS = formData.vipPassengersInPremiereSuite ?? 0;
  const vipLD = formData.vipPassengersInLoungeDeluxe ?? 0;
  if (passengers.length === 0) return null;

  const updatePassenger = (i: number, patch: Partial<EditPassenger>) => {
    onFormChange({
      passengers: passengers.map((p, idx) => idx === i ? { ...p, ...patch } : p),
    });
  };

  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
        <UserCheck className="w-4 h-4" /> VIP Passengers ({passengers.length})
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Per-passenger fields. The 1st {vipPS} rows are Premiere Suite VIPs; the next {vipLD} are Lounge Deluxe VIPs.
        Title, First Name, Last Name, Age Group, and Nationality are required. Travel Doc No. is optional.
      </p>
      <div className="space-y-4">
        {passengers.map((p, i) => {
          const section = i < vipPS ? 'PS' : 'LD';
          return (
            <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={section === 'PS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                  {section} #{i + 1}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                  <Select
                    value={p.title}
                    onValueChange={v => updatePassenger(i, { title: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Miss">Miss</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Prof">Prof</SelectItem>
                      <SelectItem value="Mstr">Mstr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={p.firstName}
                    onChange={e => updatePassenger(i, { firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={p.lastName}
                    onChange={e => updatePassenger(i, { lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Age Group <span className="text-red-500">*</span></label>
                  <Select
                    value={p.ageGroup}
                    onValueChange={v => updatePassenger(i, { ageGroup: v as EditPassenger['ageGroup'] })}
                  >
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {AGE_GROUP_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Travel Doc No.</label>
                  <input
                    type="text"
                    value={p.travelDocNo}
                    onChange={e => updatePassenger(i, { travelDocNo: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Membership No.</label>
                  <input
                    type="text"
                    value={p.membershipNo ?? ''}
                    onChange={e => updatePassenger(i, { membershipNo: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Nationality <span className="text-red-500">*</span></label>
                  <NationalityTypeahead
                    id={`edit-vip-nationality-${i}`}
                    value={p.nationality ?? ''}
                    required
                    onChange={(code) => updatePassenger(i, { nationality: code })}
                    data-testid={`edit-vip-nationality-${i}`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Food Allergies</label>
                  <input
                    type="text"
                    value={p.foodAllergies ?? ''}
                    onChange={e => updatePassenger(i, { foodAllergies: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                    placeholder="e.g. shellfish, peanuts"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}