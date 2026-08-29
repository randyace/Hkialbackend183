import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export type OptionGroupSelectionType = 'single' | 'multiple';

export interface PosOptionGroupRow {
  id: number;
  nameEn: string;
  nameZh: string;
  selectionType: OptionGroupSelectionType;
  isRequired: boolean;
  optionsCount: number;
  sortOrder: number;
}

export interface PosOptionGroupsViewProps {
  optionGroups: PosOptionGroupRow[];
  isLoading?: boolean;
  onCreateOptionGroup?: () => void;
  onEditOptionGroup?: (id: number) => void;
  onDeleteOptionGroup?: (id: number) => void;
}

function SelectionTypeBadge({ type }: { type: OptionGroupSelectionType }) {
  return (
    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
      {type === 'single' ? 'Single' : 'Multiple'}
    </Badge>
  );
}

export function PosOptionGroups({
  optionGroups,
  isLoading = false,
  onCreateOptionGroup,
  onEditOptionGroup,
  onDeleteOptionGroup,
}: PosOptionGroupsViewProps) {
  const [search, setSearch] = useState('');

  const filtered = optionGroups.filter((group) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      group.nameEn.toLowerCase().includes(q)
      || group.nameZh.toLowerCase().includes(q)
      || group.selectionType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">POS Option Groups</h1>
          <p className="text-sm text-gray-500 mt-1">Manage modifier groups and their options for menu items.</p>
        </div>
        <Button onClick={onCreateOptionGroup} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Option Group
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or selection type..."
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name (EN)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name (ZH)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Selection</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Required</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Options</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Loading option groups...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No option groups found.
                  </td>
                </tr>
              ) : (
                filtered.map((group) => (
                  <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-700">{group.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{group.nameEn}</td>
                    <td className="px-4 py-3 text-gray-700">{group.nameZh || '—'}</td>
                    <td className="px-4 py-3">
                      <SelectionTypeBadge type={group.selectionType} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{group.isRequired ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-gray-700">{group.optionsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditOptionGroup?.(group.id)}
                          className="gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteOptionGroup?.(group.id)}
                          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
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
