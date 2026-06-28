/**
 * EditSectionNFGs.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for per-NFG
 * (Non-Flying Guest) detail forms. Parallel structure to
 * EditSectionPassengers but with fewer fields (no travel
 * doc no, no membership no per round 6.2.65).
 *
 * Order is [PS NFGs..., LD NFGs...]. The orchestrator splits
 * the array back into `suite_nonFlyingGuests[]` +
 * `lounge_nonFlyingGuests[]` on save (round 6.2.50).
 *
 * Pre-6.2.72 this was a card in `BookingEditView.tsx` around
 * line 1153-1229. Now extracted.
 */

import { Users } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../ui/select';
import type {
  BookingFormData, EditNonFlyingGuest,
} from '../BookingEditView';

const AGE_GROUP_OPTIONS = [
  { value: 'Adult (13+ years)', label: 'Adult (13+ years)' },
  { value: 'Children (aged 2-11)', label: 'Children (aged 2-11)' },
  { value: 'Infants (under 2 years old)', label: 'Infants (under 2 years old)' },
  { value: 'Adult', label: 'Adult (legacy)' },
  { value: 'Child', label: 'Child (legacy)' },
  { value: 'Infant', label: 'Infant (legacy)' },
];

export interface EditSectionNFGsProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
}

export function EditSectionNFGs({
  formData,
  onFormChange,
}: EditSectionNFGsProps) {
  const nfgs = formData.nonFlyingGuestsList ?? [];
  const nonFlyingPS = formData.nonFlyingGuestsInPremiereSuite ?? 0;
  const nonFlyingLD = formData.nonFlyingGuestsInLoungeDeluxe ?? 0;
  if (nfgs.length === 0) return null;

  const updateNfg = (i: number, patch: Partial<EditNonFlyingGuest>) => {
    onFormChange({
      nonFlyingGuestsList: nfgs.map((g, idx) => idx === i ? { ...g, ...patch } : g),
    });
  };

  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
        <Users className="w-4 h-4" /> Non-Flying Guests ({nfgs.length})
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Per-NFG fields. The 1st {nonFlyingPS} rows are PS NFGs; the next {nonFlyingLD} are LD NFGs.
        Title, First Name, Last Name, and Age Group are required.
      </p>
      <div className="space-y-3">
        {nfgs.map((g, i) => {
          const section = i < nonFlyingPS ? 'PS' : 'LD';
          return (
            <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={section === 'PS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                  {section} NFG #{i + 1}
                </Badge>
              </div>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                  <Select
                    value={g.title}
                    onValueChange={v => updateNfg(i, { title: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Miss">Miss</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Prof">Prof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={g.firstName}
                    onChange={e => updateNfg(i, { firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={g.lastName}
                    onChange={e => updateNfg(i, { lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Age Group <span className="text-red-500">*</span></label>
                  <Select
                    value={g.ageGroup}
                    onValueChange={v => updateNfg(i, { ageGroup: v as EditNonFlyingGuest['ageGroup'] })}
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
                  <label className="block text-xs text-gray-600 mb-1">Food Allergies</label>
                  <input
                    type="text"
                    value={g.foodAllergies ?? ''}
                    onChange={e => updateNfg(i, { foodAllergies: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                    placeholder="optional"
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