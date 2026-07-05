/**
 * EditSectionAddons.tsx
 *
 * 2026-06-28 (round 6.2.75, Phase B — Create parity) — REWRITTEN
 * from a 4-key CATALOG_ADDONS checkbox list into a unified
 * "Add-on Services" card mirroring `CreateBooking.tsx:2628-2954`:
 *  - Selected service chips at the top (deletable)
 *  - Search input + dropdown over CATALOG_ADDONS
 *  - Each dropdown row toggles the matching boolean (via
 *    `KEYED_BOOLEANS` map + `toggleByKey`) so the data model is
 *    single-source-of-truth (booleans drive `selectedKeys`)
 *  - `isAdHoc` standalone toggle at the bottom (legacy
 *    `is_ad_hoc` column, NOT a catalog item)
 *  - `loungeExtensionQty` stepper when Lounge Extension is on
 *
 * Pre-6.2.75 history:
 *  - 2026-06-28 round 6.2.72 — extracted from BookingEditView.tsx
 *    as a 4-key checkbox list, with the 6 boolean add-on
 *    toggles split into a separate `EditSectionBooleanAddons`.
 *  - 2026-06-28 round 6.2.75 — unified the two cards into this
 *    one (Create parity per Sky's request). `EditSectionBooleanAddons`
 *    deleted; `isAdHoc` kept as an inline toggle here (only
 *    non-catalog boolean still in the form).
 *
 * Data flow:
 *  - formData.hasLimousine / hasShopping / hasWheelchair /
 *    hasSecurity / hasPrivateSales / hasLoungeExtension drive
 *    `KEYED_BOOLEANS` (single source of truth).
 *  - Dropdown toggles write back via `toggleByKey(key, !val)`
 *    which routes to the matching boolean.
 *  - The parent's mapper derives `selectedAddonKeys[]` from
 *    booking_items on load (already wired) — this card does
 *    NOT maintain its own selectedAddonKeys slot. The dedup in
 *    `buildAddonsItems` handles the boolean-vs-array convergence
 *    on submit.
 */

import { useState } from 'react';
import {
  Search, X, Plus, CheckCircle, Car, Accessibility, Clock,
  AlertCircle, Minus,
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { CATALOG_ADDONS } from '../../addons';
import type { BookingFormData } from '../BookingEditView';

export interface EditSectionAddonsProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
  /**
   * DB price map from `GET /api/bookable-items`. Optional —
   * falls back to `CATALOG_ADDONS.defaultPrice` when missing
   * (matches Create's behavior at line 2706-2716).
   */
  bookableItemPrices?: Record<string, number>;
}

export function EditSectionAddons({
  formData,
  onFormChange,
  bookableItemPrices,
}: EditSectionAddonsProps) {
  // Local search state (mirrors Create's `addonSearch` /
  // `showAddonDropdown` pattern at CreateBooking.tsx:2781-2853).
  const [addonSearch, setAddonSearch] = useState('');
  const [showAddonDropdown, setShowAddonDropdown] = useState(false);

  // 6-keyed map mirroring CreateBooking.tsx:2719-2727.
  // Source of truth: the 6 booleans + `hasLoungeExtension`
  // on `formData`. The dropdown rows call `toggleByKey` to
  // flip the matching boolean.
  const KEYED_BOOLEANS: Record<string, boolean> = {
    'Limousine Transfer': formData.hasLimousine,
    'In-lounge Personal Shopping Assistance': formData.hasShopping,
    'Wheelchair Assistance': formData.hasWheelchair,
    'Security Escort Service': formData.hasSecurity,
    'Private Sales': formData.hasPrivateSales,
    'Lounge Extension': formData.hasLoungeExtension,
  };

  const toggleByKey = (key: string, val: boolean) => {
    if      (key === 'Limousine Transfer')                        onFormChange({ hasLimousine: val });
    else if (key === 'In-lounge Personal Shopping Assistance')    onFormChange({ hasShopping: val });
    else if (key === 'Wheelchair Assistance')                    onFormChange({ hasWheelchair: val });
    else if (key === 'Security Escort Service')                  onFormChange({ hasSecurity: val });
    else if (key === 'Private Sales')                            onFormChange({ hasPrivateSales: val });
    else if (key === 'Lounge Extension')                         onFormChange({ hasLoungeExtension: val });
  };

  // selectedKeys derived from booleans (mirrors Create line 2737-2739).
  const selectedKeys = CATALOG_ADDONS
    .filter(a => KEYED_BOOLEANS[a.key])
    .map(a => a.key);

  // DB price override (mirrors Create line 2706-2716).
  const resolveServiceDisplay = (svc: typeof CATALOG_ADDONS[number]) => {
    const dbPrice = bookableItemPrices?.[svc.key];
    if (typeof dbPrice === 'number' && Number.isFinite(dbPrice) && dbPrice > 0) {
      return {
        ...svc,
        badge: `+HK$${dbPrice.toLocaleString()}`,
      };
    }
    return svc;
  };

  // Search filter (mirrors Create line 2741-2745).
  const q = addonSearch.trim().toLowerCase();
  const dropdownResults = q
    ? CATALOG_ADDONS.filter(a =>
        a.key.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q))
    : CATALOG_ADDONS;

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Add-on Services
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Search and select services to include with this booking. Toggle off a chip to
        remove an addon. The Ad-hoc Booking switch below is independent (booking mode
        flag, not a catalog item).
      </p>

      {/* Selected service chips (mirrors CreateBooking.tsx:2751-2778) */}
      {selectedKeys.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedKeys.map(key => {
            const svc = resolveServiceDisplay(CATALOG_ADDONS.find(a => a.key === key)!);
            return (
              <div key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-800">
                <span className="text-blue-500 shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{svc.icon}</span>
                <span>{key}</span>
                <Badge className={`ml-1 text-xs ${svc.badgeClass}`}>{svc.badge ?? (svc.defaultPrice > 0 ? `+HK$${svc.defaultPrice.toLocaleString()}` : '+HK$—')}</Badge>
                <button
                  type="button"
                  onClick={() => toggleByKey(key, false)}
                  className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                  aria-label={`Remove ${key}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search input + dropdown (mirrors CreateBooking.tsx:2780-2853) */}
      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search services to add, e.g. Limousine, Wheelchair, Lounge…"
            value={addonSearch}
            onChange={e => { setAddonSearch(e.target.value); setShowAddonDropdown(true); }}
            onFocus={() => setShowAddonDropdown(true)}
            onBlur={() => setTimeout(() => setShowAddonDropdown(false), 150)}
            className="pl-9 pr-10"
          />
          {addonSearch && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setAddonSearch(''); setShowAddonDropdown(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showAddonDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-64 overflow-y-auto">
            {dropdownResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No services found for "<span className="font-medium">{addonSearch}</span>"
              </div>
            ) : dropdownResults.map((rawSvc) => {
              const svc = resolveServiceDisplay(rawSvc);
              const { key, icon, desc, badge, badgeClass } = svc;
              const isSelected = !!KEYED_BOOLEANS[key];
              const isTracked  = key in KEYED_BOOLEANS;
              return (
                <button
                  key={key}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    if (isTracked) {
                      toggleByKey(key, !isSelected);
                    }
                    setAddonSearch('');
                    setShowAddonDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-gray-100 last:border-0 transition-colors hover:bg-blue-50 ${isSelected ? 'bg-blue-50/60' : ''}`}
                >
                  <span className={`p-1.5 rounded-md shrink-0 [&>svg]:w-4 [&>svg]:h-4 ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{key}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <Badge className={`text-xs shrink-0 ${badgeClass}`}>{badge ?? (svc.defaultPrice > 0 ? `+HK$${svc.defaultPrice.toLocaleString()}` : '+HK$—')}</Badge>
                  {isSelected
                    ? <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    : <Plus className="w-4 h-4 text-gray-300 shrink-0" />
                  }
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {selectedKeys.length === 0
          ? 'No services selected. Click the search bar above to browse all available services.'
          : `${selectedKeys.length} service${selectedKeys.length !== 1 ? 's' : ''} selected. Click a chip above to remove.`}
      </p>

      {/* Lounge Extension qty stepper (mirrors CreateBooking.tsx:2910-2948) */}
      {formData.hasLoungeExtension && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/40 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800 font-medium">Lounge Extension — Additional Hours</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Hours</label>
            <button type="button"
              onClick={() => onFormChange({ loungeExtensionQty: Math.max(1, formData.loungeExtensionQty - 1) })}
              disabled={formData.loungeExtensionQty <= 1}
              className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input type="number" min={1} max={6}
              value={formData.loungeExtensionQty}
              onChange={e => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n)) onFormChange({ loungeExtensionQty: Math.max(1, Math.min(6, n)) });
              }}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300" />
            <button type="button"
              onClick={() => onFormChange({ loungeExtensionQty: Math.min(6, formData.loungeExtensionQty + 1) })}
              disabled={formData.loungeExtensionQty >= 6}
              className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-500">(max 6 hours per booking)</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            HK${(bookableItemPrices?.['Lounge Extension'] ?? 0).toLocaleString()} per hour
            {' × '}{formData.loungeExtensionQty} hour{formData.loungeExtensionQty !== 1 ? 's' : ''}
            {' = '}
            <span className="font-medium text-amber-700">
              HK${((bookableItemPrices?.['Lounge Extension'] ?? 0) * formData.loungeExtensionQty).toLocaleString()}
            </span>
          </p>
          {/* ── 2026-07-05 round 6.2.106 (recovery of 6.2.83 lost-edit) ──
               Mixed PS+LD breakdown hint when BOTH PS>0 AND LD people>0.
               Reads VIP+NFG from formData (live upper-card state) per the
               round 6.2.100 wrapper memo contract. ── */}
          {(formData.numPremiereSuites ?? 0) > 0
            && ((formData.vipPassengersInLoungeDeluxe ?? 0) + (formData.nonFlyingGuestsInLoungeDeluxe ?? 0)) > 0 && (
            <p
              data-testid="lounge-extension-mixed-breakdown"
              className="text-xs text-gray-600 mt-1"
            >
              HK$3,000 PS + HK${(bookableItemPrices?.['Lounge Extension'] ?? 0).toLocaleString()} LD per hour (mixed PS + LD)
            </p>
          )}
        </div>
      )}

      {/* Limousine stops hint (gated on hasLimousine) — full editor is the
          separate `EditSectionLimoStops` card below (kept for visual
          space + grouping). Mirrors Create pattern of letting the
          dedicated editor handle multi-row inputs. */}
      {formData.hasLimousine && (
        <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/40 mb-4 text-xs text-purple-800 flex items-center gap-2">
          <Car className="w-3.5 h-3.5" />
          Limousine Transfer is on — edit stops in the <strong className="ml-1">Limousine Stops</strong> section below.
        </div>
      )}

      {/* Wheelchair pax hint (gated on hasWheelchair) — full editor is the
          separate `EditSectionWheelchair` card below. */}
      {formData.hasWheelchair && (
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/40 mb-4 text-xs text-blue-800 flex items-center gap-2">
          <Accessibility className="w-3.5 h-3.5" />
          Wheelchair Assistance is on — set the recipient in the <strong className="ml-1">Wheelchair Recipient</strong> section below.
        </div>
      )}

      {/* isAdHoc — legacy booking-mode flag, NOT a catalog addon. */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isAdHoc}
            onChange={e => onFormChange({ isAdHoc: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Ad-hoc Booking (this booking was created outside the normal flow)
          </span>
        </label>
        <p className="text-xs text-gray-400 mt-1 ml-7">
          Toggle on if this booking was not scheduled in advance. Drives the `is_ad_hoc`
          column on the backend.
        </p>
      </div>
    </Card>
  );
}