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

import { Award } from 'lucide-react';
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
}

export function EditSectionAccountInfo({
  formData,
  onFormChange,
}: EditSectionAccountInfoProps) {
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
          <input
            type="text"
            value={formData.promoCode ?? ''}
            onChange={e => onFormChange({ promoCode: e.target.value.toUpperCase() })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
            placeholder="e.g. SUMMER2024"
          />
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
    </Card>
  );
}