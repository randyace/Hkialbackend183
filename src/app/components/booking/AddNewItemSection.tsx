/**
 * Unified "Add New Item" catalog search (parity with BookingDetail Service Items).
 * Used by Create Booking; Detail still embeds an equivalent block inline.
 */
import { useMemo, useState, type ReactNode } from 'react';
import {
  CheckCircle,
  MapPin,
  Minus,
  Plus,
  Search,
  Tag,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CATALOG_ADDONS } from '../addons';
import { Button } from '../ui/button';

export interface AddNewItemCatalogOption {
  id: number;
  name_en: string;
  price: number;
  category?: string;
  description_en?: string;
}

export interface AddNewItemLimoStop {
  id: number;
  type: 'Pick-up' | 'Destination';
  location: string;
}

export type AddNewItemResult = (
  | { kind: 'limousine'; limoStops: AddNewItemLimoStop[] }
  | { kind: 'wheelchair'; passenger: string }
  | { kind: 'security' }
  | { kind: 'lounge'; qty: number }
  | { kind: 'catalog'; name: string; quantity: number }
) & {
  unitPrice?: string;
  discount?: string;
  remarks?: string;
  /** Qty from the Add New Item Qty input (all kinds that show Qty). */
  quantity?: number;
};

export interface AddNewItemSectionProps {
  catalogAddonOptions?: AddNewItemCatalogOption[];
  bookableItemPrices?: Record<string, number>;
  passengerNames?: string[];
  /** When true, toast mentions Save; Create uses a shorter message. */
  persistHint?: 'create' | 'edit';
  onAdd: (result: AddNewItemResult) => void;
  /** Optional outer layout: 'card' (Create) or 'table' (Detail-style rows). */
  layout?: 'card' | 'table';
}

type AddonChoice = {
  key: string;
  icon: ReactNode;
  desc: string;
  defaultPrice: string;
};

function resolvePrice(
  key: string,
  fallback: number,
  bookableItemPrices?: Record<string, number>,
): string {
  const db = bookableItemPrices?.[key];
  if (typeof db === 'number' && Number.isFinite(db) && db >= 0) {
    return db.toFixed(2);
  }
  return fallback.toFixed(2);
}

export function AddNewItemSection({
  catalogAddonOptions = [],
  bookableItemPrices = {},
  passengerNames = [],
  persistHint = 'create',
  onAdd,
  layout = 'card',
}: AddNewItemSectionProps) {
  const laneA: AddonChoice[] = useMemo(
    () =>
      CATALOG_ADDONS.map((a) => ({
        key: a.key,
        icon: a.icon,
        desc: a.desc,
        defaultPrice: resolvePrice(a.key, a.defaultPrice, bookableItemPrices),
      })),
    [bookableItemPrices],
  );

  const addonSearchChoices = useMemo(() => {
    const laneB = catalogAddonOptions
      .filter((o) => !laneA.some((s) => s.key.toLowerCase() === o.name_en.toLowerCase()))
      .map((o) => ({
        key: o.name_en,
        icon: <Tag className="w-4 h-4" />,
        desc: o.description_en || o.category || 'Catalog service',
        defaultPrice: Number(o.price || 0).toFixed(2),
      }));
    return [...laneA, ...laneB];
  }, [catalogAddonOptions, laneA]);

  const findAddonChoice = (key: string) =>
    addonSearchChoices.find((s) => s.key === key);

  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  const [addonQty, setAddonQty] = useState(1);
  const [addonUnitPrice, setAddonUnitPrice] = useState('');
  const [addonDiscount, setAddonDiscount] = useState('0');
  const [addonRemarks, setAddonRemarks] = useState('');
  const [addonSearch, setAddonSearch] = useState('');
  const [showAddonDropdown, setShowAddonDropdown] = useState(false);
  const [limoStops, setLimoStops] = useState<AddNewItemLimoStop[]>([
    { id: 1, type: 'Pick-up', location: '' },
  ]);
  const [wheelchairPassenger, setWheelchairPassenger] = useState('');

  const addLimoStop = () =>
    setLimoStops((prev) => [...prev, { id: Date.now(), type: 'Destination', location: '' }]);
  const removeLimoStop = (id: number) =>
    setLimoStops((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  const updateLimoStop = (id: number, field: keyof AddNewItemLimoStop, value: string) =>
    setLimoStops((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const handleSelectAddon = (key: string, defaultPrice: string) => {
    setSelectedAddon(key);
    setAddonUnitPrice(defaultPrice);
    setAddonQty(1);
    setAddonDiscount('0');
    setLimoStops([{ id: 1, type: 'Pick-up', location: '' }]);
    setWheelchairPassenger('');
    setAddonSearch('');
    setShowAddonDropdown(false);
  };

  const resetStaging = () => {
    setSelectedAddon(null);
    setAddonQty(1);
    setAddonUnitPrice('');
    setAddonDiscount('0');
    setAddonRemarks('');
    setAddonSearch('');
    setShowAddonDropdown(false);
    setLimoStops([{ id: 1, type: 'Pick-up', location: '' }]);
    setWheelchairPassenger('');
  };

  const handleAddItem = () => {
    if (!selectedAddon) {
      toast.error('Please select an add-on service first.');
      return;
    }
    if (selectedAddon === 'Limousine Transfer' && limoStops.every((s) => !s.location.trim())) {
      toast.error('Please enter at least one destination or pick-up point.');
      return;
    }
    if (selectedAddon === 'Wheelchair Assistance' && !wheelchairPassenger.trim()) {
      toast.error('Please enter the passenger name.');
      return;
    }

    const qty = Math.max(1, addonQty || 1);
    const priceFields = {
      unitPrice: addonUnitPrice,
      discount: addonDiscount,
      remarks: addonRemarks,
      quantity: qty,
    };

    if (selectedAddon === 'Limousine Transfer') {
      onAdd({
        kind: 'limousine',
        limoStops: limoStops.map((s) => ({
          id: s.id,
          type: s.type,
          location: s.location,
        })),
        ...priceFields,
      });
    } else if (selectedAddon === 'Wheelchair Assistance') {
      onAdd({ kind: 'wheelchair', passenger: wheelchairPassenger.trim(), ...priceFields });
    } else if (selectedAddon === 'Security Escort Service') {
      onAdd({ kind: 'security', ...priceFields });
    } else if (selectedAddon === 'Lounge Extension') {
      onAdd({
        kind: 'lounge',
        qty: Math.max(1, Math.min(6, qty)),
        ...priceFields,
        quantity: Math.max(1, Math.min(6, qty)),
      });
    } else {
      onAdd({
        kind: 'catalog',
        name: selectedAddon,
        quantity: qty,
        unitPrice: addonUnitPrice,
        discount: addonDiscount,
        remarks: addonRemarks,
      });
    }

    const hint =
      persistHint === 'edit'
        ? `"${selectedAddon}" added. Click Save All Changes below to persist.`
        : `"${selectedAddon}" added.`;
    toast.success(hint);
    resetStaging();
  };

  const shellClass =
    layout === 'card'
      ? 'rounded-lg border border-green-200 bg-green-50/40'
      : '';

  const searchBlock = (
    <div className="relative">
      <p className="text-xs text-gray-500 mb-2">
        Search and select a special or catalog service, then click Add Item.
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          data-testid="service-items-add-search"
          placeholder="Search services to add, e.g. Limousine, Security, Champagne…"
          value={addonSearch}
          onChange={(e) => {
            setAddonSearch(e.target.value);
            setShowAddonDropdown(true);
          }}
          onFocus={() => setShowAddonDropdown(true)}
          onBlur={() => setTimeout(() => setShowAddonDropdown(false), 150)}
          className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        />
        {addonSearch && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setAddonSearch('');
              setShowAddonDropdown(false);
              setSelectedAddon(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {selectedAddon && !showAddonDropdown && (
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-md text-sm text-green-800">
          {findAddonChoice(selectedAddon)?.icon}
          <span>{selectedAddon}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedAddon(null);
              setAddonSearch('');
            }}
            className="ml-1 text-green-500 hover:text-green-700"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {showAddonDropdown && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {(() => {
            const q = addonSearch.trim().toLowerCase();
            const results = q
              ? addonSearchChoices.filter(
                  (s) =>
                    s.key.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q),
                )
              : addonSearchChoices;
            if (results.length === 0) {
              return (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No services found for &quot;<span className="font-medium">{addonSearch}</span>&quot;
                </div>
              );
            }
            return results.map(({ key, icon, desc, defaultPrice }) => (
              <button
                key={key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectAddon(key, defaultPrice)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-green-50 border-b border-gray-100 last:border-0 transition-colors ${
                  selectedAddon === key ? 'bg-green-50' : ''
                }`}
              >
                <span
                  className={`p-1.5 rounded-md shrink-0 ${
                    selectedAddon === key
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{key}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {parseFloat(defaultPrice) === 0
                    ? 'Complimentary'
                    : `HK$${parseFloat(defaultPrice).toLocaleString()}`}
                </span>
                {selectedAddon === key && (
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                )}
              </button>
            ));
          })()}
        </div>
      )}
    </div>
  );

  const configBlock =
    selectedAddon !== null ? (
      <div className="space-y-3 border-t border-green-100 pt-3 mt-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[15rem]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-100 text-green-800 text-sm">
              {findAddonChoice(selectedAddon)?.icon}
              {selectedAddon}
            </span>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Qty</label>
            <input
              type="number"
              value={addonQty}
              onChange={(e) => setAddonQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 px-2 py-1 border rounded text-center bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto"
              min={1}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Unit price</label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">HK$</span>
              <input
                type="text"
                value={addonUnitPrice}
                onChange={(e) => setAddonUnitPrice(e.target.value)}
                className="w-28 px-2 py-1 border rounded text-right bg-white"
                data-testid="service-items-add-unit-price"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Discount %</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={addonDiscount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setAddonDiscount('');
                    return;
                  }
                  const n = Number(raw);
                  if (!Number.isFinite(n) || n < 0) return;
                  setAddonDiscount(String(Math.min(100, n)));
                }}
                className="w-16 px-2 py-1 border rounded text-right bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto"
                data-testid="service-items-add-discount-percent"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleAddItem}
            data-testid="service-items-add-button"
          >
            Add Item
          </Button>
        </div>

        {selectedAddon === 'Limousine Transfer' && (
          <div className="rounded-md border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-800">Destinations / Pick-up Points</p>
            </div>
            <div className="space-y-2">
              {limoStops.map((stop, idx) => (
                <div key={stop.id} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <select
                    value={stop.type}
                    onChange={(e) => updateLimoStop(stop.id, 'type', e.target.value)}
                    className="px-2 py-1.5 border rounded text-sm bg-white w-36 shrink-0"
                  >
                    <option value="Pick-up">Pick-up</option>
                    <option value="Destination">Destination</option>
                  </select>
                  <input
                    type="text"
                    value={stop.location}
                    onChange={(e) => updateLimoStop(stop.id, 'location', e.target.value)}
                    placeholder={
                      stop.type === 'Pick-up'
                        ? 'e.g. Terminal 1, Arrival Hall'
                        : 'e.g. Four Seasons Hotel, HK'
                    }
                    className="flex-1 px-3 py-1.5 border rounded text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeLimoStop(stop.id)}
                    disabled={limoStops.length === 1}
                    className="p-1.5 rounded border text-gray-400 hover:text-red-500 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLimoStop}
              className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add another stop
            </button>
          </div>
        )}

        {selectedAddon === 'Wheelchair Assistance' && (
          <div className="rounded-md border border-orange-100 bg-orange-50/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-orange-600" />
              <p className="text-xs text-orange-800">Passenger Requiring Assistance</p>
            </div>
            {passengerNames.length > 0 ? (
              <select
                value={wheelchairPassenger}
                onChange={(e) => setWheelchairPassenger(e.target.value)}
                className="w-full max-w-2xl px-3 py-1.5 border rounded text-sm bg-white"
                data-testid="service-items-add-wheelchair-passenger-select"
              >
                <option value="" disabled>
                  Select a passenger...
                </option>
                {passengerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={wheelchairPassenger}
                onChange={(e) => setWheelchairPassenger(e.target.value)}
                placeholder="Enter full name of passenger..."
                className="w-full max-w-2xl px-3 py-1.5 border rounded text-sm bg-white"
                data-testid="service-items-add-wheelchair-passenger-input"
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600 mb-[10px]">Remarks by Staff:</label>
          <textarea
            value={addonRemarks}
            onChange={(e) => setAddonRemarks(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm resize-none bg-white"
            rows={2}
            placeholder="Enter remarks for this new item..."
          />
        </div>
      </div>
    ) : null;

  return layout === 'table' ? (
    <>
      <tr className="bg-green-50" data-testid="add-new-item-section">
        <td colSpan={5} className="px-4 py-2">
          <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">Add New Item</p>
        </td>
      </tr>
      <tr className="bg-green-50/30">
        <td colSpan={5} className="px-4 pt-3 pb-2">
          {searchBlock}
        </td>
      </tr>
      {selectedAddon && (
        <tr className="bg-green-50/20 border-t border-green-100">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-100 text-green-800 text-sm">
                {findAddonChoice(selectedAddon)?.icon}
                {selectedAddon}
              </span>
            </div>
          </td>
          <td className="px-4 py-3 text-center">
            <input
              type="number"
              value={addonQty}
              onChange={(e) => setAddonQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 px-2 py-1 border rounded text-center bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto"
              min={1}
            />
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="text-xs text-gray-400">HK$</span>
              <input
                type="text"
                value={addonUnitPrice}
                onChange={(e) => setAddonUnitPrice(e.target.value)}
                className="w-28 px-2 py-1 border rounded text-right bg-white"
                data-testid="service-items-add-unit-price"
              />
            </div>
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={addonDiscount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setAddonDiscount('');
                    return;
                  }
                  const n = Number(raw);
                  if (!Number.isFinite(n) || n < 0) return;
                  setAddonDiscount(String(Math.min(100, n)));
                }}
                className="w-16 px-2 py-1 border rounded text-right bg-white"
                data-testid="service-items-add-discount-percent"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </td>
          <td className="px-4 py-3 text-right">
            <Button
              type="button"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAddItem}
              data-testid="service-items-add-button"
            >
              Add Item
            </Button>
          </td>
        </tr>
      )}
      {selectedAddon === 'Limousine Transfer' && (
        <tr className="bg-blue-50/40 border-t border-blue-100">
          <td colSpan={5} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-800">Destinations / Pick-up Points</p>
            </div>
            <div className="space-y-2">
              {limoStops.map((stop, idx) => (
                <div key={stop.id} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <select
                    value={stop.type}
                    onChange={(e) => updateLimoStop(stop.id, 'type', e.target.value)}
                    className="px-2 py-1.5 border rounded text-sm bg-white w-36 shrink-0"
                  >
                    <option value="Pick-up">Pick-up</option>
                    <option value="Destination">Destination</option>
                  </select>
                  <input
                    type="text"
                    value={stop.location}
                    onChange={(e) => updateLimoStop(stop.id, 'location', e.target.value)}
                    placeholder={
                      stop.type === 'Pick-up'
                        ? 'e.g. Terminal 1, Arrival Hall'
                        : 'e.g. Four Seasons Hotel, HK'
                    }
                    className="flex-1 px-3 py-1.5 border rounded text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeLimoStop(stop.id)}
                    disabled={limoStops.length === 1}
                    className="p-1.5 rounded border text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLimoStop}
              className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add another stop
            </button>
          </td>
        </tr>
      )}
      {selectedAddon === 'Wheelchair Assistance' && (
        <tr className="bg-orange-50/40 border-t border-orange-100">
          <td colSpan={5} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-orange-600" />
              <p className="text-xs text-orange-800">Passenger Requiring Assistance</p>
            </div>
            {passengerNames.length > 0 ? (
              <select
                value={wheelchairPassenger}
                onChange={(e) => setWheelchairPassenger(e.target.value)}
                className="w-full max-w-2xl px-3 py-1.5 border rounded text-sm bg-white"
                data-testid="service-items-add-wheelchair-passenger-select"
              >
                <option value="" disabled>
                  Select a passenger...
                </option>
                {passengerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={wheelchairPassenger}
                onChange={(e) => setWheelchairPassenger(e.target.value)}
                placeholder="Enter full name of passenger..."
                className="w-full max-w-2xl px-3 py-1.5 border rounded text-sm bg-white"
                data-testid="service-items-add-wheelchair-passenger-input"
              />
            )}
          </td>
        </tr>
      )}
      <tr className="bg-green-50/20">
        <td colSpan={5} className="px-4 pb-3 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600 mb-[10px]">Remarks by Staff:</label>
            <textarea
              value={addonRemarks}
              onChange={(e) => setAddonRemarks(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm resize-none bg-white"
              rows={2}
              placeholder="Enter remarks for this new item..."
            />
          </div>
        </td>
      </tr>
    </>
  ) : (
    <div className={shellClass} data-testid="add-new-item-section">
      <div className="px-4 py-2 bg-green-50 border-b border-green-100">
        <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">Add New Item</p>
      </div>
      <div className="px-4 py-3">{searchBlock}</div>
      {selectedAddon && <div className="px-4 pb-4">{configBlock}</div>}
    </div>
  );
}
