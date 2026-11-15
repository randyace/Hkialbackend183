import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export type PosAllergenType = 'Allergy' | 'Dietary';

export interface PosAllergenRow {
  id: number;
  name: string;
  name_en?: string | null;
  name_tc?: string | null;
  name_sc?: string | null;
  code?: string | null;
  type: PosAllergenType;
}

export interface PosAllergensViewProps {
  allergens: PosAllergenRow[];
  isLoading?: boolean;
  onCreateAllergen?: () => void;
  onEditAllergen?: (id: number) => void;
  onDeleteAllergen?: (id: number) => void;
}

function TypeBadge({ type }: { type: PosAllergenType }) {
  if (type === 'Allergy') {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        Allergy
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
      Dietary
    </Badge>
  );
}

export function PosAllergens({
  allergens,
  isLoading = false,
  onCreateAllergen,
  onEditAllergen,
  onDeleteAllergen,
}: PosAllergensViewProps) {
  const [search, setSearch] = useState('');

  const filtered = allergens.filter((allergen) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [
      allergen.name,
      allergen.name_en,
      allergen.name_tc,
      allergen.name_sc,
      allergen.code,
      allergen.type,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">POS Allergens & Dietary</h1>
          <p className="text-sm text-gray-500 mt-1">Manage trilingual allergen and dietary labels for menu items.</p>
        </div>
        <Button onClick={onCreateAllergen} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Allergen
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by EN / TC / SC / code / type..."
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">EN</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">TC / SC</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Loading allergens...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No allergens found.
                  </td>
                </tr>
              ) : (
                filtered.map((allergen) => (
                  <tr key={allergen.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-700">{allergen.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{allergen.code || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{allergen.name_en || allergen.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{allergen.name_tc || '—'}</div>
                      <div className="text-xs text-gray-400">{allergen.name_sc || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={allergen.type} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditAllergen?.(allergen.id)}
                          className="gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteAllergen?.(allergen.id)}
                          className="gap-1 text-red-600 hover:text-red-700"
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
