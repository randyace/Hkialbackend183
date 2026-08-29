import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';

export type OptionGroupSelectionType = 'single' | 'multiple';

export interface PosOptionFormRow {
  id?: number;
  nameEn: string;
  nameZh: string;
  priceExtra: number;
  code: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PosOptionGroupFormData {
  nameEn: string;
  nameZh: string;
  selectionType: OptionGroupSelectionType;
  isRequired: boolean;
  sortOrder: number;
  options: PosOptionFormRow[];
}

export interface PosOptionGroupEditProps {
  optionGroupId?: number | null;
  isLoading?: boolean;
  isSaving?: boolean;
  initialData?: PosOptionGroupFormData;
  onBack?: () => void;
  onSave?: (formData: PosOptionGroupFormData) => void;
}

const defaultOptionRow = (): PosOptionFormRow => ({
  nameEn: '',
  nameZh: '',
  priceExtra: 0,
  code: '',
  sortOrder: 0,
  isActive: true,
});

const defaultFormData: PosOptionGroupFormData = {
  nameEn: '',
  nameZh: '',
  selectionType: 'single',
  isRequired: false,
  sortOrder: 0,
  options: [defaultOptionRow()],
};

export function PosOptionGroupEdit({
  optionGroupId,
  isLoading = false,
  isSaving = false,
  initialData,
  onBack,
  onSave,
}: PosOptionGroupEditProps) {
  const isEditMode = !!optionGroupId;
  const [formData, setFormData] = useState<PosOptionGroupFormData>(defaultFormData);
  const [nameEnError, setNameEnError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const updateOption = (index: number, patch: Partial<PosOptionFormRow>) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { ...defaultOptionRow(), sortOrder: prev.options.length }],
    }));
  };

  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameEn.trim()) {
      setNameEnError('English name is required');
      return;
    }
    setNameEnError(null);

    const validOptions = formData.options.filter((row) => row.nameEn.trim());
    if (validOptions.length === 0) {
      return;
    }

    onSave?.({
      ...formData,
      options: validOptions.map((row, index) => ({ ...row, sortOrder: index })),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading option group...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Option Group' : 'Create Option Group'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure a modifier group and its child options.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Group Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Name (EN)</span>
              <input
                required
                value={formData.nameEn}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, nameEn: e.target.value }));
                  if (nameEnError) setNameEnError(null);
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  nameEnError ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {nameEnError ? <p className="text-xs text-red-600">{nameEnError}</p> : null}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Name (ZH)</span>
              <input
                value={formData.nameZh}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameZh: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Selection Type</span>
              <select
                value={formData.selectionType}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  selectionType: e.target.value as OptionGroupSelectionType,
                }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="single">Single</option>
                <option value="multiple">Multiple</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Sort Order</span>
              <input
                type="number"
                min={0}
                value={formData.sortOrder}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  sortOrder: Number(e.target.value) || 0,
                }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Required</p>
                <p className="text-xs text-gray-500">Guest must choose at least one option</p>
              </div>
              <Switch
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isRequired: checked }))}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Options</h2>
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-1">
              <Plus className="w-4 h-4" />
              Add Option
            </Button>
          </div>

          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={option.id ?? `new-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-gray-100 rounded-lg p-4">
                <label className="md:col-span-3 block space-y-1">
                  <span className="text-xs font-medium text-gray-600">Name</span>
                  <input
                    value={option.nameEn}
                    onChange={(e) => updateOption(index, { nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g. Hot"
                  />
                </label>
                <label className="md:col-span-2 block space-y-1">
                  <span className="text-xs font-medium text-gray-600">Price Extra</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={option.priceExtra}
                    onChange={(e) => updateOption(index, { priceExtra: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </label>
                <label className="md:col-span-2 block space-y-1">
                  <span className="text-xs font-medium text-gray-600">Code</span>
                  <input
                    value={option.code}
                    onChange={(e) => updateOption(index, { code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g. HOT"
                  />
                </label>
                <label className="md:col-span-2 block space-y-1">
                  <span className="text-xs font-medium text-gray-600">Name (ZH)</span>
                  <input
                    value={option.nameZh}
                    onChange={(e) => updateOption(index, { nameZh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </label>
                <div className="md:col-span-2 flex items-center gap-2">
                  <Switch
                    checked={option.isActive}
                    onCheckedChange={(checked) => updateOption(index, { isActive: checked })}
                  />
                  <span className="text-xs text-gray-600">Active</span>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={formData.options.length <= 1}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditMode ? 'Save Changes' : 'Create Option Group'}
          </Button>
        </div>
      </form>
    </div>
  );
}
