/**
 * EditSectionAccountInfo.tsx
 *
 * 2026-06-28 round 6.2.72 — section component for Account
 * Settings (membership tier / discount % / promo code /
 * booking channel / account remark). The detail page's
 * inline "Save Edit Booking" card pre-6.2.71 didn't exist
 * — these fields were read-only. Per Q1 of round 6.2.72's
 * pivot, the detail page becomes the sole edit surface;
 * this section is the slot inside the master Save form.
 *
 * Pattern: section receives `formData` (full BookingFormData)
 * + `onFormChange` (controlled inputs). The orchestrator
 * `BookingEditView.tsx` holds lifted state and merges patches.
 *
 * Pre-6.2.72 these fields were embedded in `BookingEditView.tsx`
 * around line 687-749 (Card "Account Settings"). Now extracted.
 */

import { Award, Minus, Plus } from 'lucide-react';
import { Card } from '../../ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../ui/select';
import type {
  BookingFormData, EditMembershipTier, EditBookingChannel,
} from '../BookingEditView';

export interface EditSectionAccountInfoProps {
  formData: BookingFormData;
  onFormChange: (patch: Partial<BookingFormData>) => void;
  // 2026-06-29 (round 6.2.80, Bug #6 / Pilot 2 Bug 3) — the
  // parent wrapper (`BookingDetail.tsx`) loads the active
  // promo-code list via `promoCodeService.getPromoCodes({status:
  // 'active', per_page: 100})` on mount and forwards the
  // options here so the Promo Code dropdown can show real
  // codes instead of a free-text field. Optional — falls back
  // to a disabled `<input>` placeholder when the wrapper hasn't
  // loaded yet (mirrors the existing `staffOptions` /
  // `suiteOptions` prop pattern).
  promoCodeOptions?: Array<{
    id: number;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number | string;
  }>;
  /**
   * Wrapper-owned membership eligibility. When omitted, standalone Figma
   * previews retain the legacy checkbox behavior.
   */
  membershipControls?: {
    canUseLdFree: boolean;
    canUsePsFree: boolean;
    maxLdUnits?: number;
  };
}

function CreditQuantityBar({
  value,
  max,
  onChange,
  accent,
  disabled,
  testId,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  accent: string;
  disabled?: boolean;
  testId?: string;
}) {
  const cap = Math.max(0, max);
  const current = Math.min(Math.max(0, value), cap);
  const minusDisabled = disabled || current <= 0;
  const plusDisabled = disabled || current >= cap;
  return (
    <div
      className="flex items-center rounded-md overflow-hidden border border-gray-300 bg-white"
      data-testid={testId}
      data-selected={current > 0 ? 'true' : 'false'}
    >
      <button
        type="button"
        disabled={minusDisabled}
        data-testid={testId ? `${testId}-minus` : undefined}
        onClick={(e) => {
          e.preventDefault();
          if (!minusDisabled) onChange(current - 1);
        }}
        className="w-10 h-10 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="flex-1 text-center text-sm tabular-nums">
        <span style={{ color: accent }}>{current}</span>
        <span className="text-gray-500">{` / ${cap}`}</span>
      </div>
      <button
        type="button"
        disabled={plusDisabled}
        data-testid={testId ? `${testId}-plus` : undefined}
        onClick={(e) => {
          e.preventDefault();
          if (!plusDisabled) onChange(current + 1);
        }}
        className="w-10 h-10 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function EditSectionAccountInfo({
  formData,
  onFormChange,
  promoCodeOptions = [],
  membershipControls,
}: EditSectionAccountInfoProps) {
  const membershipLdDisabled =
    membershipControls !== undefined && !membershipControls.canUseLdFree;
  const membershipPsDisabled =
    membershipControls !== undefined && !membershipControls.canUsePsFree;

  return (
    <Card className="p-5">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
        <Award className="w-4 h-4" /> Account Settings
      </h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Membership Tier</label>
          <Select
            value={formData.membershipTier || 'none'}
            onValueChange={v => onFormChange({
              membershipTier: v === 'none' ? undefined : (v as EditMembershipTier),
            })}
          >
            <SelectTrigger><SelectValue placeholder="— Select —" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              <SelectItem value="Diamond">Diamond</SelectItem>
              <SelectItem value="Platinum">Platinum</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
              <SelectItem value="Sapphire">Sapphire</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Account Discount %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={typeof formData.accountDiscountPct === 'number' ? formData.accountDiscountPct : ''}
            onChange={e => onFormChange({
              accountDiscountPct: e.target.value === '' ? '' : Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Promo Code</label>
          {promoCodeOptions.length > 0 ? (
            // 2026-06-29 (round 6.2.80, Bug #6 / Pilot 2 Bug 3) —
            // real FK picker. The wrapper's `handleMasterSave`
            // forwards `formData.promoCodeId` as the top-level
            // `promo_code_id` field in the PUT body; the
            // backend's `BookingController::update` validator
            // accepts it as `sometimes|nullable|exists:promo_codes,id`.
            // Selecting "— None —" sets `promoCodeId: null` which
            // clears the FK (mirrors the `status` / `payment_status`
            // null-clear pattern at handleMasterSave:1171-1173).
            <Select
              value={formData.promoCodeId == null ? 'none' : String(formData.promoCodeId)}
              onValueChange={v => onFormChange({
                promoCodeId: v === 'none' ? null : Number(v),
                // Also seed the legacy `promoCode` STRING field
                // (the wrapper still writes the legacy nested
                // `advanced_details.account.promoApplied.code`
                // block for back-compat with pre-6.2.80 admin-
                // created bookings that used the text input).
                promoCode: v === 'none'
                  ? ''
                  : (promoCodeOptions.find((o) => o.id === Number(v))?.code ?? ''),
                promoDiscountPct: v === 'none'
                  ? undefined
                  : (() => {
                      const opt = promoCodeOptions.find((o) => o.id === Number(v));
                      if (!opt) return undefined;
                      return opt.discountType === 'percentage'
                        ? Number(opt.discountValue)
                        : undefined;
                    })(),
              })}
            >
              <SelectTrigger><SelectValue placeholder="— Select —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {promoCodeOptions.map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    {opt.code}
                    {opt.discountType === 'percentage'
                      ? ` (−${opt.discountValue}%)`
                      : ` (−HK$${opt.discountValue})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // Fallback for figma-ui standalone preview (no
            // wrapper-loaded options). Render the legacy
            // free-text input so the MOCK booking form stays
            // self-previewable per INV-X1.
            <input
              type="text"
              value={formData.promoCode ?? ''}
              onChange={e => onFormChange({ promoCode: e.target.value.toUpperCase() })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
              placeholder="e.g. SUMMER2024"
              disabled
            />
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-[10px]">Booking Channel</label>
          <Select
            value={formData.bookingChannel ?? 'Email/Call to HKIAL'}
            onValueChange={v => onFormChange({ bookingChannel: v as EditBookingChannel })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Email/Call to HKIAL">Email / Call to HKIAL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-600 mb-[10px]">Account Remark (staff internal note)</label>
          <input
            type="text"
            value={formData.accountRemark ?? ''}
            onChange={e => onFormChange({ accountRemark: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="e.g. VIP preferred seating near window"
          />
        </div>
      </div>

      {/* Bill To fields live in Manage Invoices / Receipts modal. */}

      {/* Round 6.2.139 — free LD / free PS credit opt-in on edit reprice */}
      {(formData.membershipTier || formData.ldEntriesRemaining != null || formData.psFreeUpgradesRemaining != null) && (
        <div className="mt-4 rounded-md border border-indigo-100 bg-indigo-50/60 px-4 py-3">
          <p className="text-sm font-medium text-[#0f2942] mb-2">Membership free credits</p>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <span className="text-gray-600">Free LD entries left</span>
              <p className="font-semibold text-[#0f2942]" data-testid="edit-membership-ld-remaining">
                {formatQuota(formData.ldEntriesRemaining)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Free PS upgrades left</span>
              <p className="font-semibold text-[#0f2942]" data-testid="edit-membership-ps-remaining">
                {formatQuota(formData.psFreeUpgradesRemaining)}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {(() => {
              const maxLdUnits = membershipLdDisabled
                ? 0
                : (membershipControls?.maxLdUnits ?? 1);
              const ldValue = membershipLdDisabled
                ? 0
                : Math.min(
                    formData.useMembershipLdUnits
                      ?? (formData.useMembershipLdFree === false ? 0 : maxLdUnits),
                    maxLdUnits,
                  );
              const includesPs = (formData.numPremiereSuites ?? 0) > 0
                || (formData.vipPassengersInPremiereSuite ?? 0) > 0
                || (formData.nonFlyingGuestsInPremiereSuite ?? 0) > 0;
              const psEnabled = !membershipPsDisabled && includesPs && ldValue > 0;
              const psValue = psEnabled && formData.useMembershipPsFree !== false ? 1 : 0;
              return (
                <>
                  <div className={membershipLdDisabled ? 'opacity-60' : ''}>
                    <p className="text-sm font-medium text-[#0f2942] mb-2">Use free LD entry credit</p>
                    <CreditQuantityBar
                      value={ldValue}
                      max={maxLdUnits}
                      disabled={membershipLdDisabled}
                      accent="rgb(220,181,21)"
                      testId="edit-use-membership-ld-free"
                      onChange={(next) => onFormChange({
                        useMembershipLdUnits: next,
                        useMembershipLdFree: next > 0,
                        ...(next <= 0 ? { useMembershipPsFree: false } : {}),
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Required for pure LD free entry and for paid PS 40% off (burns 1 LD). Qty 0 → full PS base. Mixed + free PS: dual-quota ticket only, LD room stays charged.
                      {maxLdUnits > 1 ? ' Member and registered spouse can each use a credit when they sit in Lounge Deluxe or Premiere Suite. Choosing 1 of 2 uses the Lounge Deluxe seat first.' : ''}
                    </p>
                  </div>
                  <div className={psEnabled ? '' : 'opacity-60'}>
                    <p className="text-sm font-medium text-[#0f2942] mb-2">Use free PS upgrade credit</p>
                    <CreditQuantityBar
                      value={psValue}
                      max={psEnabled ? 1 : 0}
                      disabled={!psEnabled}
                      accent="rgb(22,163,74)"
                      testId="edit-use-membership-ps-free"
                      onChange={(next) => onFormChange({ useMembershipPsFree: next > 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Only when this booking includes Premiere Suite, and only together with the LD credit (cannot use free PS alone).
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </Card>
  );
}

function formatQuota(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value === -1) return 'Unlimited';
  return String(value);
}