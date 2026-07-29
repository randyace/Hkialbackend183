import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useMsg } from '@/i18n/useMsg';

export interface BookableItemFormData {
  nameEn: string;
  nameSimp: string;
  nameTrad: string;
  category: string;
  descriptionEn: string;
  descriptionSimp: string;
  descriptionTrad: string;
  price: number;
  discountRate: number;
  priceCalEquation: string;
  availability: string;
  stock: string;
  priority: number;
}

export interface BookableItemEditProps {
  itemId?: number | null;
  isLoading?: boolean;
  initialData?: BookableItemFormData;
  onBack?: () => void;
  onSave?: (formData: BookableItemFormData) => void;
}

export function BookableItemEdit({ itemId, isLoading, initialData, onBack, onSave }: BookableItemEditProps) {
  const msg = useMsg();
  const isEditMode = !!itemId;

  const [formData, setFormData] = useState<BookableItemFormData>({
    nameEn: '',
    nameSimp: '',
    nameTrad: '',
    category: 'Suite',
    descriptionEn: '',
    descriptionSimp: '',
    descriptionTrad: '',
    price: 0,
    discountRate: 0,
    priceCalEquation: 'unitPrice',
    availability: 'available',
    stock: '',
    priority: 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  const handleCancel = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {msg('Back to Bookable Items')}
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>{isEditMode ? 'Edit Bookable Item' : 'Create New Bookable Item'}</h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update the details of the bookable item' : 'Enter the details of the new bookable item'}
          </p>
        </div>
        </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="mb-4">{msg('Basic Information')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2.5">{msg('Item English Name')}</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder={msg('e.g., VIP Suite A')}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2.5">{msg('Item Simp Chi Name')}</label>
                  <input
                    type="text"
                    value={formData.nameSimp}
                    onChange={(e) => setFormData({ ...formData, nameSimp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 贵宾套房A"
                  />
                </div>
                <div>
                  <label className="block mb-2.5">{msg('Item Trad Chi Name')}</label>
                  <input
                    type="text"
                    value={formData.nameTrad}
                    onChange={(e) => setFormData({ ...formData, nameTrad: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., 貴賓套房A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2.5">{msg('Category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="Suite">{msg('Suite')}</option>
                    <option value="Transfer Services">{msg('Transfer Services')}</option>
                    <option value="Food & Beverage">{msg('Food & Beverage')}</option>
                    <option value="Shopping">{msg('Shopping')}</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2.5">{msg('Priority')}</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="1"
                    min="1"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {msg('Lower numbers appear first')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Descriptions */}
          <Card className="p-6">
            <h2 className="mb-4">{msg('Descriptions')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2.5">{msg('Description (English)')}</label>
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder={msg('Detailed description of the item in English...')}
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block mb-2.5">{msg('Description (Simplified Chinese)')}</label>
                <Textarea
                  value={formData.descriptionSimp}
                  onChange={(e) => setFormData({ ...formData, descriptionSimp: e.target.value })}
                  placeholder="简体中文描述..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block mb-2.5">{msg('Description (Traditional Chinese)')}</label>
                <Textarea
                  value={formData.descriptionTrad}
                  onChange={(e) => setFormData({ ...formData, descriptionTrad: e.target.value })}
                  placeholder="繁體中文描述..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Pricing & Availability */}
          <Card className="p-6">
            <h2 className="mb-4">{msg('Pricing & Availability')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2.5">{msg('Base Price (HK$)')}</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2.5">{msg('Discount Rate (%)')}</label>
                  <input
                    type="number"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2.5">{msg('Price Cal Equation')}</label>
                <input
                  type="text"
                  value={formData.priceCalEquation}
                  onChange={(e) => setFormData({ ...formData, priceCalEquation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md font-mono"
                  placeholder={msg('e.g., unitPrice or (qty * unitPrice) - discount')}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  {msg('Define the calculation formula for pricing. Examples:')} <code className="bg-gray-100 px-1 rounded">unitPrice</code>, <code className="bg-gray-100 px-1 rounded">(qty * unitPrice) - discount</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2.5">{msg('Availability')}</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="available">{msg('Available')}</option>
                    <option value="limited">{msg('Limited')}</option>
                    <option value="unavailable">{msg('Unavailable')}</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2.5">{msg('Stock Quantity (Optional)')}</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder={msg('Leave blank for unlimited')}
                    min="0"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {msg('Only applicable for items with limited availability')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="p-6">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {msg('Cancel')}
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                {isEditMode ? 'Save Changes' : 'Create Item'}
              </Button>
            </div>
          </Card>
        </div>
      </form>
      )}
    </div>
  );
}