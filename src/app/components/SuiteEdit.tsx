import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export type SuiteKind = 'suite' | 'lounge';

export type SuiteOperationalStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'maintenance';

export interface SuiteFormData {
  suiteName: string;
  kind: SuiteKind | '';
  capacity: number;
  floor: string;
  status: SuiteOperationalStatus | '';
  isActive: boolean;
}

export interface SuiteEditProps {
  suiteId?: number | null;
  isLoading?: boolean;
  isSaving?: boolean;
  initialData?: SuiteFormData;
  onBack?: () => void;
  onSave?: (formData: SuiteFormData) => void;
}

const KIND_OPTIONS: { value: SuiteKind; label: string }[] = [
  { value: 'suite', label: 'Suite' },
  { value: 'lounge', label: 'Lounge' },
];

const STATUS_OPTIONS: { value: SuiteOperationalStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'maintenance', label: 'Maintenance' },
];

const defaultFormData: SuiteFormData = {
  suiteName: '',
  kind: '',
  capacity: 4,
  floor: '',
  status: 'available',
  isActive: true,
};

export function SuiteEdit({
  suiteId,
  isLoading = false,
  isSaving = false,
  initialData,
  onBack,
  onSave,
}: SuiteEditProps) {
  const isEditMode = !!suiteId;
  const [formData, setFormData] = useState<SuiteFormData>(defaultFormData);
  const [suiteNameError, setSuiteNameError] = useState<string | null>(null);
  const [kindError, setKindError] = useState<string | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let valid = true;

    if (!formData.suiteName.trim()) {
      setSuiteNameError('Suite name is required');
      valid = false;
    } else {
      setSuiteNameError(null);
    }

    if (!formData.kind) {
      setKindError('Type is required');
      valid = false;
    } else {
      setKindError(null);
    }

    if (!formData.capacity || formData.capacity < 1) {
      setCapacityError('Capacity is required and must be at least 1');
      valid = false;
    } else {
      setCapacityError(null);
    }

    if (!formData.status) {
      setStatusError('Operational status is required');
      valid = false;
    } else {
      setStatusError(null);
    }

    if (!valid) return;

    onSave?.(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading suite...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Suite' : 'Create Suite'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure physical suite or lounge seat details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Suite Name</span>
            <input
              required
              value={formData.suiteName}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, suiteName: e.target.value }));
                if (suiteNameError) setSuiteNameError(null);
              }}
              placeholder="e.g. CIP 1, Lobby 3"
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                suiteNameError ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {suiteNameError ? <p className="text-xs text-red-600">{suiteNameError}</p> : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Type</span>
            <select
              value={formData.kind}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, kind: e.target.value as SuiteKind | '' }));
                if (kindError) setKindError(null);
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${
                kindError ? 'border-red-400' : 'border-gray-200'
              }`}
            >
              <option value="">Select type...</option>
              {KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {kindError ? <p className="text-xs text-red-600">{kindError}</p> : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Capacity</span>
            <input
              type="number"
              min={1}
              required
              value={formData.capacity}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, capacity: Number(e.target.value) || 0 }));
                if (capacityError) setCapacityError(null);
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                capacityError ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {capacityError ? <p className="text-xs text-red-600">{capacityError}</p> : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Floor</span>
            <input
              value={formData.floor}
              onChange={(e) => setFormData((prev) => ({ ...prev, floor: e.target.value }))}
              placeholder="e.g. Level 7"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Operational Status</span>
            <select
              value={formData.status}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as SuiteOperationalStatus | '',
                }));
                if (statusError) setStatusError(null);
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${
                statusError ? 'border-red-400' : 'border-gray-200'
              }`}
            >
              <option value="">Select status...</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {statusError ? <p className="text-xs text-red-600">{statusError}</p> : null}
          </label>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Is Active</p>
              <p className="text-xs text-gray-500">Inactive suites are hidden from booking assignment.</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditMode ? 'Save Changes' : 'Create Suite'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
