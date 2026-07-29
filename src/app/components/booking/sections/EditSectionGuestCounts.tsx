/**
 * EditSectionGuestCounts.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for per-kind
 * guest counts (PS/LD VIPs + NFGs, 5 fields). Source of truth
 * per Q3=A; the orchestrator computes legacy aggregates
 * (`numberOfGuests`, `nonFlyingGuests`) from these.
 *
 * Pattern: section receives `formData` + `onFormChange`.
 * The orchestrator's `useEffect` re-slices passengers[] /
 * nonFlyingGuestsList[] arrays when these counts change.
 *
 * Pre-6.2.72 this was a card in `BookingEditView.tsx` around
 * line 977-1044. Now extracted.
 */

import { Users } from 'lucide-react';
import { Card } from '../../ui/card';
import type { BookingFormData } from '../BookingEditView';
import { useMsg } from '@/i18n/useMsg';

export interface EditSectionGuestCountsProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
}

export function EditSectionGuestCounts({
  formData,
  onFormChange,
}: EditSectionGuestCountsProps) {
  const msg = useMsg();
  const vipPS = formData.vipPassengersInPremiereSuite ?? 0;
  const vipLD = formData.vipPassengersInLoungeDeluxe ?? 0;
  const nonFlyingPS = formData.nonFlyingGuestsInPremiereSuite ?? 0;
  const nonFlyingLD = formData.nonFlyingGuestsInLoungeDeluxe ?? 0;
  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
        <Users className="w-4 h-4" /> {msg('Guest Counts (per kind)')}
      </h3>
      <p className="text-xs text-gray-500 mb-4">{msg('Per-kind counts drive the pricing breakdown. Edit them here to change the booking\'s pax mix.')}</p>
      <div className="grid grid-cols-5 gap-6">
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">{msg('Premiere Suites')}</label>
          <input
            id="edit-num-premiere-suites"
            type="number"
            min={0}
            value={formData.numPremiereSuites ?? 0}
            onChange={e => onFormChange({
              numPremiereSuites: Math.max(0, parseInt(e.target.value) || 0),
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">{msg('PS VIPs')}</label>
          <input
            id="edit-vip-ps"
            type="number"
            min={0}
            value={vipPS}
            onChange={e => onFormChange({
              vipPassengersInPremiereSuite: Math.max(0, parseInt(e.target.value) || 0),
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">{msg('PS NFGs')}</label>
          <input
            id="edit-nfg-ps"
            type="number"
            min={0}
            value={nonFlyingPS}
            onChange={e => onFormChange({
              nonFlyingGuestsInPremiereSuite: Math.max(0, parseInt(e.target.value) || 0),
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">{msg('LD VIPs')}</label>
          <input
            id="edit-vip-ld"
            type="number"
            min={0}
            value={vipLD}
            onChange={e => onFormChange({
              vipPassengersInLoungeDeluxe: Math.max(0, parseInt(e.target.value) || 0),
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">{msg('LD NFGs')}</label>
          <input
            id="edit-nfg-ld"
            type="number"
            min={0}
            value={nonFlyingLD}
            onChange={e => onFormChange({
              nonFlyingGuestsInLoungeDeluxe: Math.max(0, parseInt(e.target.value) || 0),
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        {msg('Legacy aggregates (read-only):')} <strong>Total VIPs = {vipPS + vipLD}</strong>,
        {' '}<strong>Total NFGs = {nonFlyingPS + nonFlyingLD}</strong>.
        Computed from the per-kind fields above per round 6.2.38.
      </p>
    </Card>
  );
}