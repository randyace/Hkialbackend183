import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useMsg } from '@/i18n/useMsg';

export interface PosMenuCategoryFormData {
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PosMenuCategoryEditProps {
  categoryId?: number | null;
  isLoading?: boolean;
  isSaving?: boolean;
  initialData?: PosMenuCategoryFormData;
  onBack?: () => void;
  onSave?: (formData: PosMenuCategoryFormData) => void;
}

const defaultFormData: PosMenuCategoryFormData = {
  name: '',
  sortOrder: 0,
  isActive: true,
};

export function PosMenuCategoryEdit({
  categoryId,
  isLoading = false,
  isSaving = false,
  initialData,
  onBack,
  onSave,
}: PosMenuCategoryEditProps) {
  const msg = useMsg();
  const isEditMode = !!categoryId;
  const [formData, setFormData] = useState<PosMenuCategoryFormData>(defaultFormData);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setNameError('Category name is required');
      return;
    }

    setNameError(null);
    onSave?.(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {msg('Loading category...')}
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
            {isEditMode ? 'Edit Menu Category' : 'Create Menu Category'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{msg('Configure POS menu category details.')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">{msg('Category Name')}</span>
            <input
              required
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (nameError) setNameError(null);
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                nameError ? 'border-red-400 focus:ring-red-500' : 'border-gray-200'
              }`}
            />
            {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">{msg('Sort Order')}</span>
            <input
              type="number"
              min={0}
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </label>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{msg('Is Active')}</p>
              <p className="text-xs text-gray-500">{msg('Inactive categories are hidden from POS ordering tabs.')}</p>
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
              {isEditMode ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
