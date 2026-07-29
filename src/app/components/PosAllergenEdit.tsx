import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useMsg } from '@/i18n/useMsg';
import { msg } from '@/i18n/msgFallback';

export type PosAllergenType = 'Allergy' | 'Dietary';

export interface PosAllergenFormData {
  name: string;
  type: PosAllergenType | '';
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
  { value: 'Allergy', label: msg('Allergy') },
  { value: 'Dietary', label: msg('Dietary') },
];

const defaultFormData: PosAllergenFormData = {
  name: '',
  type: '',
};

export function PosAllergenEdit({
  allergenId,
  isLoading = false,
  isSaving = false,
  initialData,
  onBack,
  onSave,
}: PosAllergenEditProps) {
  const msg = useMsg();
  const isEditMode = !!allergenId;
  const [formData, setFormData] = useState<PosAllergenFormData>(defaultFormData);
  const [nameError, setNameError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let valid = true;

    if (!formData.name.trim()) {
      setNameError('Name is required');
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

    onSave?.(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {msg('Loading allergen...')}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {msg('Back')}
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Allergen / Dietary Label' : 'Create Allergen / Dietary Label'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{msg('Configure allergen or dietary restriction labels for POS menu items.')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">{msg('Name')}</span>
            <input
              required
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (nameError) setNameError(null);
              }}
              placeholder={msg('e.g. Peanuts, Dairy, Vegetarian, Gluten-Free')}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                nameError ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700">{msg('Type')}</legend>
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
