import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useMsg } from '@/i18n/useMsg';

export interface PosMenuCategoryRow {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PosMenuCategoriesViewProps {
  categories: PosMenuCategoryRow[];
  isLoading?: boolean;
  onCreateCategory?: () => void;
  onEditCategory?: (id: number) => void;
  onDeleteCategory?: (id: number) => void;
}

export function PosMenuCategories({
  categories,
  isLoading = false,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}: PosMenuCategoriesViewProps) {
  const msg = useMsg();
  const [search, setSearch] = useState('');

  const filtered = categories.filter((category) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return category.name.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{msg('POS Menu Categories')}</h1>
          <p className="text-sm text-gray-500 mt-1">{msg('Manage F&B menu categories for the VIP lounge POS.')}</p>
        </div>
        <Button onClick={onCreateCategory} className="gap-2">
          <Plus className="w-4 h-4" />
          {msg('Create Category')}
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={msg('Search by category name...')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('ID')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('Category Name')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('Sort Order')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('Status')}</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">{msg('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    {msg('Loading categories...')}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    {msg('No categories found.')}
                  </td>
                </tr>
              ) : (
                filtered.map((category) => (
                  <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-700">{category.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{category.name}</td>
                    <td className="px-4 py-3 text-gray-700">{category.sortOrder}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          category.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                        }
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditCategory?.(category.id)}
                          className="gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          {msg('Edit')}
                        </Button>
                        {onDeleteCategory && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteCategory(category.id)}
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {msg('Delete')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
