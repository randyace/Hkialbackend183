/**
 * PosMenuEdit — presentational create/edit form for seasonal menus.
 * Item assignment lives in Menu Builder; this form is settings only.
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  CustomDatePicker,
  formatDateValue,
  formatTimeValue,
  parseDateValue,
  parseTimeValue,
} from '../../../../ui/CustomDatePicker';

/** Carbon dayOfWeek: 0=Sun … 6=Sat */
export const MENU_DAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
] as const;

export const MENU_TYPE_OPTIONS = [
  { value: 'dine_in', label: 'Dine-in' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'both', label: 'Both' },
] as const;

export type PosMenuTypeValue = (typeof MENU_TYPE_OPTIONS)[number]['value'];

export function normalizeMenuTypeValue(value: string | null | undefined): PosMenuTypeValue {
  const raw = (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'dine_in' || raw === 'dinein') return 'dine_in';
  if (raw === 'takeaway') return 'takeaway';
  if (raw === 'both') return 'both';
  return 'dine_in';
}

export interface PosMenuFormData {
  name: string;
  nameZh: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableDays: number[];
  menuType: string;
  serviceChargePercent: string;
  takeawayDiscountPercent: string;
  priority: string;
  isActive: boolean;
}

export interface PosMenuEditProps {
  menuId?: number | null;
  isLoading?: boolean;
  isSaving?: boolean;
  initialData?: PosMenuFormData;
  onBack?: () => void;
  onSave?: (formData: PosMenuFormData) => void;
}

const defaultFormData: PosMenuFormData = {
  name: '',
  nameZh: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  availableDays: [0, 1, 2, 3, 4, 5, 6],
  menuType: 'dine_in',
  serviceChargePercent: '',
  takeawayDiscountPercent: '',
  priority: '0',
  isActive: true,
};

export function PosMenuEdit({
  menuId,
  isLoading = false,
  isSaving = false,
  initialData,
  onBack,
  onSave,
}: PosMenuEditProps) {
  const isEditMode = !!menuId;
  const [formData, setFormData] = useState<PosMenuFormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof PosMenuFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        menuType: normalizeMenuTypeValue(initialData.menuType),
      });
    }
  }, [initialData]);

  const patch = <K extends keyof PosMenuFormData>(key: K, value: PosMenuFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => {
      const has = prev.availableDays.includes(day);
      const availableDays = has
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day].sort((a, b) => a - b);
      return { ...prev, availableDays };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof PosMenuFormData, string>> = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Menu name is required';
    }
    if (!formData.startDate) {
      nextErrors.startDate = 'Start date is required';
    }
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      nextErrors.endDate = 'End date must be on or after start date';
    }
    if (formData.availableDays.length === 0) {
      nextErrors.availableDays = 'Select at least one day';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSave?.(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2 w-full">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading menu...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1 shrink-0">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Menu' : 'Create Menu'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure schedule, language, and service settings. Assign items in Menu Builder.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <Card className="p-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1 */}
            <div>
              <Label htmlFor="menu-name-zh" className="mb-2 block">Menu Name (Chinese)</Label>
              <Input
                id="menu-name-zh"
                value={formData.nameZh}
                onChange={(e) => patch('nameZh', e.target.value)}
                placeholder="e.g. Autumn Menu"
              />
            </div>
            <div>
              <Label htmlFor="menu-name" className="mb-2 block">Menu Name (English) *</Label>
              <Input
                id="menu-name"
                value={formData.name}
                onChange={(e) => patch('name', e.target.value)}
                placeholder="e.g. 2026 Autumn Menu"
              />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
            </div>

            {/* Row 2 */}
            <div>
              <Label htmlFor="menu-start-date" className="mb-2 block">Start Date *</Label>
              <CustomDatePicker
                id="menu-start-date"
                mode="date"
                value={parseDateValue(formData.startDate)}
                onChange={(date) => patch('startDate', formatDateValue(date))}
                placeholderText="Select start date"
              />
              {errors.startDate ? (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="menu-end-date" className="mb-2 block">End Date</Label>
              <CustomDatePicker
                id="menu-end-date"
                mode="date"
                value={parseDateValue(formData.endDate)}
                onChange={(date) => patch('endDate', formatDateValue(date))}
                minDate={parseDateValue(formData.startDate)}
                placeholderText="Select end date"
              />
              {errors.endDate ? (
                <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
              ) : null}
            </div>

            {/* Row 3 — days full width */}
            <div className="md:col-span-2">
              <Label className="mb-2 block">Available Days</Label>
              <div className="flex flex-wrap gap-3">
                {MENU_DAY_OPTIONS.map((day) => {
                  const checked = formData.availableDays.includes(day.value);
                  return (
                    <label
                      key={day.value}
                      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                        checked
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={checked}
                        onChange={() => toggleDay(day.value)}
                      />
                      {day.label}
                    </label>
                  );
                })}
              </div>
              {errors.availableDays ? (
                <p className="mt-1 text-xs text-red-600">{errors.availableDays}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to disable. Select all for everyday availability.
                </p>
              )}
            </div>

            {/* Row 4 */}
            <div>
              <Label htmlFor="menu-start-time" className="mb-2 block">Start Time</Label>
              <CustomDatePicker
                id="menu-start-time"
                mode="time"
                value={parseTimeValue(formData.startTime)}
                onChange={(date) => patch('startTime', formatTimeValue(date))}
                timeIntervals={1}
                timeFormat="HH:mm"
                placeholderText="Select start time"
              />
            </div>
            <div>
              <Label htmlFor="menu-end-time" className="mb-2 block">End Time</Label>
              <CustomDatePicker
                id="menu-end-time"
                mode="time"
                value={parseTimeValue(formData.endTime)}
                onChange={(date) => patch('endTime', formatTimeValue(date))}
                timeIntervals={1}
                timeFormat="HH:mm"
                placeholderText="Select end time"
              />
            </div>

            {/* Row 5 — 4 cols on large */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="menu-type" className="mb-2 block">Menu Type</Label>
                <select
                  id="menu-type"
                  value={normalizeMenuTypeValue(formData.menuType)}
                  onChange={(e) => patch('menuType', normalizeMenuTypeValue(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {MENU_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="menu-service-charge" className="mb-2 block">Service Charge %</Label>
                <Input
                  id="menu-service-charge"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={formData.serviceChargePercent}
                  onChange={(e) => patch('serviceChargePercent', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="menu-takeaway-discount" className="mb-2 block">Takeaway Discount %</Label>
                <Input
                  id="menu-takeaway-discount"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={formData.takeawayDiscountPercent}
                  onChange={(e) => patch('takeawayDiscountPercent', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="menu-priority" className="mb-2 block">Priority</Label>
                <Input
                  id="menu-priority"
                  type="number"
                  min={0}
                  max={9999}
                  step={1}
                  value={formData.priority}
                  onChange={(e) => patch('priority', e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Active</p>
                <p className="text-xs text-gray-500">
                  Available for ordering when schedule matches
                </p>
              </div>
              <Switch
                id="menu-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => patch('isActive', checked)}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditMode ? 'Save Changes' : 'Create Menu'}
          </Button>
        </div>
      </form>
    </div>
  );
}
