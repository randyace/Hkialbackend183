/**
 * 2026-06-12 (round 6.2.39, M11 fix) — Shared catalog of the 4
 * HKIAL add-on services that the backend can persist.
 *
 * Background (round 6.2.36 self-critique #2): pre-6.2.39 each
 * form (`CreateBooking.tsx`, `BookingEditDialog.tsx`) had its
 * OWN hardcoded list of add-on services. The lists had drifted
 * from the live `bookable_items` catalog in the Laravel
 * backend:
 *
 *   - `CreateBooking.tsx` had a 4-item list whose names DID
 *     match the catalog (Limousine Transfer / Wheelchair
 *     Assistance / Lounge Extension / Security Escort Service).
 *   - `BookingEditDialog.tsx` had a 22-item list with names
 *     that did NOT match the catalog (e.g. 'Limousine Service'
 *     vs catalog 'Limousine Transfer', 'VIP Escort (Airside)'
 *     vs catalog 'VIP Transfer', 'Private Dining Room' vs
 *     nothing). When the admin toggled these in the form,
 *     `AddonsSyncService` silently dropped the data (matched
 *     by name, dropped if not found).
 *
 * The fix: this file is the single source of truth for the
 * add-on catalog. Both forms import from it. The 4 names here
 * are the ONLY 4 add-ons the backend can persist (per the
 * migration `2026_06_09_120100_seed_3_bookable_items.php` —
 * "The other placeholders in [the 22-item list] are NOT
 * seeded — they will be removed from 22 addons").
 *
 * Per INV-X1 (figma-ui one-way submodule), this file lives in
 * the figma-ui working tree. The user (Sky) handles the
 * manual sync.
 */
import { Accessibility, Car, Clock, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * The 4 add-on services that the backend can persist. All
 * form surfaces (create / edit) should import from this list
 * instead of hardcoding their own.
 */
export const CATALOG_ADDONS: CatalogAddon[] = [
  {
    key: 'Limousine Transfer',
    icon: <Car className="w-4 h-4" />,
    desc: 'Private car transfer service',
    defaultPrice: 1500,
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  {
    key: 'Wheelchair Assistance',
    icon: <Accessibility className="w-4 h-4" />,
    desc: 'Mobility and accessibility support',
    defaultPrice: 0,
    badge: 'Contact us',
    badgeClass: 'bg-gray-100 text-gray-600',
  },
  {
    key: 'Lounge Extension',
    icon: <Clock className="w-4 h-4" />,
    desc: 'Extend VIP lounge access by an additional hour',
    defaultPrice: 1500,
    badge: '+HK$—/hr',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'Security Escort Service',
    icon: <ShieldCheck className="w-4 h-4" />,
    desc: 'Dedicated security escort throughout',
    defaultPrice: 1200,
    badgeClass: 'bg-amber-100 text-amber-700',
  },
];

export interface CatalogAddon {
  /** The `name_en` value in `bookable_items` (the catalog match key). */
  key: string;
  icon: ReactNode;
  desc: string;
  /** Default price from the seeded `bookable_items.price`. May be 0 (free service). */
  defaultPrice: number;
  /** Optional badge text shown next to the price chip. */
  badge?: string;
  /** Tailwind classes for the badge background + text. */
  badgeClass: string;
}
