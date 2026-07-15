import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Check, ImageIcon } from 'lucide-react';

export interface PosMenuItemRow {
  id: number;
  nameEn: string;
  nameZh: string;
  categoryName: string;
  expectedPrepTime: number;
  printerName: string | null;
  availability: 'available' | 'unavailable';
  published: boolean;
  imageUrl: string | null;
}

export interface PosMenuItemsViewProps {
  items: PosMenuItemRow[];
  isLoading?: boolean;
  onCreateItem?: () => void;
  onEditItem?: (id: number) => void;
  onDeleteItem?: (id: number) => void;
}

export function PosMenuItems({
  items,
  isLoading = false,
  onCreateItem,
  onEditItem,
  onDeleteItem,
}: PosMenuItemsViewProps) {
  const [search, setSearch] = useState('');

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.nameEn.toLowerCase().includes(q)
      || item.nameZh.toLowerCase().includes(q)
      || item.categoryName.toLowerCase().includes(q)
      || (item.printerName?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">POS Menu Items</h1>
          <p className="text-sm text-gray-500 mt-1">Manage F&B menu products for the VIP lounge POS.</p>
        </div>
        <Button onClick={onCreateItem} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Menu Item
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, or printer..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Image</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Prep Time</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Printer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Availability</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Published</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">Loading menu items...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">No menu items found.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-700">{item.id}</td>
                    <td className="px-4 py-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.nameEn}
                          className="w-12 h-12 rounded-md object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.nameEn}</div>
                      <div className="text-gray-500">{item.nameZh}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.categoryName}</td>
                    <td className="px-4 py-3 text-gray-700">{item.expectedPrepTime} min</td>
                    <td className="px-4 py-3 text-gray-700">{item.printerName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          item.availability === 'available'
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                        }
                      >
                        {item.availability}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.published ? (
                        <Check className="w-5 h-5 text-green-600 inline-block" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEditItem?.(item.id)} className="gap-1">
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        {onDeleteItem && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteItem(item.id)}
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
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
