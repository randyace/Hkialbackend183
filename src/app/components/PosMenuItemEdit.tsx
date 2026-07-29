import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Loader2, Save, Upload, X, ImageIcon } from 'lucide-react';
import { useMsg } from '@/i18n/useMsg';

export interface PosMenuCategoryOption {
  id: number;
  name: string;
}

export interface PosPrinterOption {
  id: number;
  name: string;
}

export interface PosAllergenOption {
  id: number;
  name: string;
  type: 'Allergy' | 'Dietary';
}

export interface PosMenuItemFormData {
  nameEn: string;
  nameZh: string;
  printName: string;
  categoryId: number | '';
  expectedPrepTime: number;
  printerId: number | '';
  allergenIds: number[];
  availability: 'available' | 'unavailable';
  published: boolean;
  existingImageUrl: string | null;
}

export interface PosMenuItemEditProps {
  itemId?: number | null;
  isLoading?: boolean;
  isSaving?: boolean;
  initialData?: PosMenuItemFormData;
  categories?: PosMenuCategoryOption[];
  printers?: PosPrinterOption[];
  allergens?: PosAllergenOption[];
  onBack?: () => void;
  onSave?: (formData: PosMenuItemFormData, imageFile: File | null) => void;
}

const defaultFormData: PosMenuItemFormData = {
  nameEn: '',
  nameZh: '',
  printName: '',
  categoryId: '',
  expectedPrepTime: 15,
  printerId: '',
  allergenIds: [],
  availability: 'available',
  published: true,
  existingImageUrl: null,
};

export function PosMenuItemEdit({
  itemId,
  isLoading = false,
  isSaving = false,
  initialData,
  categories = [],
  printers = [],
  allergens = [],
  onBack,
  onSave,
}: PosMenuItemEditProps) {
  const msg = useMsg();
  const isEditMode = !!itemId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<PosMenuItemFormData>(defaultFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setImagePreview(initialData.existingImageUrl);
      setImageFile(null);
    }
  }, [initialData]);

  const updateField = <K extends keyof PosMenuItemFormData>(key: K, value: PosMenuItemFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAllergen = (id: number) => {
    setFormData((prev) => {
      const next = new Set(prev.allergenIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, allergenIds: Array.from(next) };
    });
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(formData.existingImageUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData, imageFile);
  };

  const allergyOptions = allergens.filter((a) => a.type === 'Allergy');
  const dietaryOptions = allergens.filter((a) => a.type === 'Dietary');

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {msg('Loading menu item...')}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {msg('Back')}
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Menu Item' : 'Create Menu Item'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{msg('Configure POS F&B product details.')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{msg('Product Details')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{msg('Product Name EN')}</span>
              <input
                required
                value={formData.nameEn}
                onChange={(e) => updateField('nameEn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{msg('Product Name ZH')}</span>
              <input
                required
                value={formData.nameZh}
                onChange={(e) => updateField('nameZh', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">{msg('Print Name')}</span>
              <input
                value={formData.printName}
                onChange={(e) => updateField('printName', e.target.value)}
                placeholder={msg('Optional shorter name for kitchen printer')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{msg('Category')}</span>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">{msg('Select category')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{msg('Expected Prep Time (minutes)')}</span>
              <input
                required
                type="number"
                min={1}
                value={formData.expectedPrepTime}
                onChange={(e) => updateField('expectedPrepTime', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{msg('Target Printer')}</span>
              <select
                value={formData.printerId}
                onChange={(e) => updateField('printerId', e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">{msg('No printer')}</option>
                {printers.map((printer) => (
                  <option key={printer.id} value={printer.id}>{printer.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{msg('Availability')}</span>
              <select
                value={formData.availability}
                onChange={(e) => updateField('availability', e.target.value as 'available' | 'unavailable')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="available">{available}</option>
                <option value="unavailable">{unavailable}</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{msg('Published')}</p>
              <p className="text-xs text-gray-500">{msg('Show this item on the POS menu.')}</p>
            </div>
            <Switch
              checked={formData.published}
              onCheckedChange={(checked) => updateField('published', checked)}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{msg('Image Upload')}</h2>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-gray-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFile(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            {imagePreview ? (
              <div className="space-y-3">
                <img src={imagePreview} alt={msg('Preview')} className="mx-auto max-h-48 rounded-lg object-cover border" />
                <div className="flex items-center justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    {msg('Replace Image')}
                  </Button>
                  {imageFile && (
                    <Button type="button" variant="outline" size="sm" onClick={clearImage}>
                      <X className="w-4 h-4 mr-1" />
                      {msg('Clear Selection')}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">{msg('Drag and drop an image here, or click to browse.')}</p>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="w-4 h-4" />
                  {msg('Choose File')}
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{msg('Allergens and Dietary')}</h2>
          {allergens.length === 0 ? (
            <p className="text-sm text-gray-500">{msg('No allergens configured yet.')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 mb-3">{msg('Allergies')}</p>
                <div className="space-y-2">
                  {allergyOptions.map((allergen) => (
                    <label key={allergen.id} className="flex items-center gap-3 text-sm text-gray-700">
                      <Checkbox
                        checked={formData.allergenIds.includes(allergen.id)}
                        onCheckedChange={() => toggleAllergen(allergen.id)}
                      />
                      {allergen.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 mb-3">{msg('Dietary')}</p>
                <div className="space-y-2">
                  {dietaryOptions.map((allergen) => (
                    <label key={allergen.id} className="flex items-center gap-3 text-sm text-gray-700">
                      <Checkbox
                        checked={formData.allergenIds.includes(allergen.id)}
                        onCheckedChange={() => toggleAllergen(allergen.id)}
                      />
                      {allergen.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditMode ? 'Save Changes' : 'Create Menu Item'}
          </Button>
        </div>
      </form>
    </div>
  );
}
