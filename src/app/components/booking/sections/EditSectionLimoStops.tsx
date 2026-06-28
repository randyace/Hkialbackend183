/**
 * EditSectionLimoStops.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for the
 * per-row Limousine stops editor. Pick-up / Destination with
 * location text inputs. Drives the
 * `advanced_details.addons.items[].meta.destinations[]` array
 * that `buildAddonsItems` reads.
 *
 * Only relevant when `hasLimousine=true` (the toggle in the
 * unified `EditSectionAddons` card). The orchestrator's
 * `useEffect` clears `limoStops` when the boolean flips off.
 *
 * Pre-6.2.72 this was a sub-card in `BookingEditView.tsx` around
 * line 1335-1384 (under "Limousine Stops"). Now extracted.
 */

import { Car, Plus, Minus } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../ui/select';
import type { BookingFormData, EditLimoStop } from '../BookingEditView';

export interface EditSectionLimoStopsProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
}

export function EditSectionLimoStops({
  formData,
  onFormChange,
}: EditSectionLimoStopsProps) {
  const stops = formData.limoStops ?? [];

  const addStop = () => {
    onFormChange({
      limoStops: [
        ...stops,
        { id: Math.max(0, ...stops.map(s => s.id)) + 1, type: 'Destination', location: '' },
      ],
    });
  };
  const removeStop = (id: number) => {
    onFormChange({ limoStops: stops.filter(s => s.id !== id) });
  };
  const updateStop = (id: number, patch: Partial<EditLimoStop>) => {
    onFormChange({
      limoStops: stops.map(s => s.id === id ? { ...s, ...patch } : s),
    });
  };

  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
        <Car className="w-4 h-4" /> Limousine Stops
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Per-row Pick-up / Destination with location. The first stop should be a Pick-up;
        additional stops are Destinations. Only relevant when the Limousine Transfer toggle is on.
      </p>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Stops ({stops.length})
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStop}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Stop
          </Button>
        </div>
        {stops.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            No limo stops. Click "Add Stop" to add a pick-up or destination.
          </p>
        ) : (
          <div className="space-y-2">
            {stops.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-6 shrink-0">#{idx + 1}</span>
                <Select
                  value={s.type}
                  onValueChange={v => updateStop(s.id, { type: v as EditLimoStop['type'] })}
                >
                  <SelectTrigger className="w-[130px] shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pick-up">Pick-up</SelectItem>
                    <SelectItem value="Destination">Destination</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  value={s.location}
                  onChange={e => updateStop(s.id, { location: e.target.value })}
                  placeholder="Location (e.g. HKG Terminal 1)"
                  className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStop(s.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}