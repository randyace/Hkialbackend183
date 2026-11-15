import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export type PosAllergenType = 'Allergy' | 'Dietary';

export interface PosAllergenFormData {
  name: string;
  name_en: string;
  name_tc: string;
  name_sc: string;
  code: string;
  aliases: string;
  type: PosAllergenType | '';
  sort_order?: number;
}

export interface PosAllergenEditProps {
  allergenId?: number | null;
  isLoading?: boolean;
  isSaving?: boolean;
  initialData?: PosAllergenFormData;
  onBack?: () => void;
  onSave?: (formData: PosAllergenFormData) => void;
}

const TYPE_OPTIONS: { value: PosAllergenType; label: string }[] = [
  { value: 'Allergy', label: 'Allergy' },
  { value: 'Dietary', label: 'Dietary' },
];

const defaultFormData: PosAllergenFormData = {
  name: '',
  name_en: '',
  name_tc: '',
  name_sc: '',
  code: '',
  aliases: '',
  type: '',
  sort_order: 0,
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function PosAllergenEdit({
  allergenId,
  isLoading = false,
  isSaving = false,
  initialData,
  onBack,
  onSave,
}: PosAllergenEditProps) {
  const isEditMode = !!allergenId;
  const [formData, setFormData] = useState<PosAllergenFormData>(defaultFormData);
  const [nameError, setNameError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...defaultFormData, ...initialData });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let valid = true;
    const nameEn = (formData.name_en || formData.name).trim();

    if (!nameEn) {
      setNameError('English name is required');
      valid = false;
    } else {
      setNameError(null);
    }

    if (!formData.type) {
      setTypeError('Type is required');
      valid = false;
    } else {
      setTypeError(null);
    }

    if (!valid) return;

    onSave?.({
      ...formData,
      name: nameEn,
      name_en: nameEn,
      code: formData.code.trim() || slugify(nameEn),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading allergen...
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
            {isEditMode ? 'Edit Allergen / Dietary Label' : 'Create Allergen / Dietary Label'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure trilingual allergen or dietary labels for POS menu items.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">English Name (EN)</span>
            <input
              required
              value={formData.name_en || formData.name}
              onChange={(e) => {
                const name_en = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  name_en,
                  name: name_en,
                  code: prev.code.trim() ? prev.code : slugify(name_en),
                }));
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Peanuts, Milk & Dairy (Lactose)"
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                nameError ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Traditional Chinese (TC)</span>
              <input
                value={formData.name_tc}
                onChange={(e) => setFormData((prev) => ({ ...prev, name_tc: e.target.value }))}
                placeholder="繁體中文名稱"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Simplified Chinese (SC)</span>
              <input
                value={formData.name_sc}
                onChange={(e) => setFormData((prev) => ({ ...prev, name_sc: e.target.value }))}
                placeholder="简体中文名称"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Code</span>
            <input
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="Auto-generated from English name if blank"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
            />
            <p className="text-xs text-gray-500">Stable slug used for matching (e.g. peanuts, milk).</p>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Search Aliases</span>
            <input
              value={formData.aliases}
              onChange={(e) => setFormData((prev) => ({ ...prev, aliases: e.target.value }))}
              placeholder="Comma-separated, e.g. dairy, lactose, 牛奶, 芝士"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700">Type</legend>
            <div className="flex flex-wrap gap-4">
              {TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-3 text-sm ${
                    formData.type === option.value
                      ? option.value === 'Allergy'
                        ? 'border-red-300 bg-red-50 text-red-800'
                        : 'border-green-300 bg-green-50 text-green-800'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } ${typeError ? 'border-red-400' : ''}`}
                >
                  <input
                    type="radio"
                    name="allergenType"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={() => {
                      setFormData((prev) => ({ ...prev, type: option.value }));
                      if (typeError) setTypeError(null);
                    }}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {typeError ? <p className="text-xs text-red-600">{typeError}</p> : null}
          </fieldset>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditMode ? 'Save Changes' : 'Create Allergen'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
