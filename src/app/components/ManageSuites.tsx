import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Check, X } from 'lucide-react';
import { useMsg } from '@/i18n/useMsg';

export type SuiteKind = 'suite' | 'lounge';

export type SuiteOperationalStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'maintenance';

export interface ManageSuiteRow {
  id: number;
  suiteName: string;
  kind: SuiteKind;
  capacity: number;
  floor: string;
  status: SuiteOperationalStatus | string;
  isActive: boolean;
}

export interface ManageSuitesViewProps {
  suites: ManageSuiteRow[];
  isLoading?: boolean;
  onCreateSuite?: () => void;
  onEditSuite?: (id: number) => void;
  onDeleteSuite?: (id: number) => void;
}

function KindBadge({ kind }: { kind: SuiteKind }) {
  if (kind === 'lounge') {
    return (
      <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 capitalize">
        {lounge}
      </Badge>
    );
  }

  return (
    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 capitalize">
      {suite}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-green-100 text-green-700 hover:bg-green-100',
    occupied: 'bg-red-100 text-red-700 hover:bg-red-100',
    reserved: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    maintenance: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  };

  return (
    <Badge className={styles[status] ?? 'bg-gray-100 text-gray-600 hover:bg-gray-100 capitalize'}>
      {status.replace('-', ' ')}
    </Badge>
  );
}

export function ManageSuites({
  suites,
  isLoading = false,
  onCreateSuite,
  onEditSuite,
  onDeleteSuite,
}: ManageSuitesViewProps) {
  const msg = useMsg();
  const [search, setSearch] = useState('');

  const filtered = suites.filter((suite) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      suite.suiteName.toLowerCase().includes(q) ||
      suite.floor.toLowerCase().includes(q) ||
      suite.kind.toLowerCase().includes(q) ||
      suite.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{msg('Manage Suites')}</h1>
          <p className="text-sm text-gray-500 mt-1">{msg('Manage physical VIP suites and lounge seats.')}</p>
        </div>
        <Button onClick={onCreateSuite} className="gap-2">
          <Plus className="w-4 h-4" />
          {msg('Create Suite')}
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={msg('Search by name, floor, type, or status...')}
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('Suite Name')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('Type')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('Capacity')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('Floor')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{msg('Operational Status')}</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">{msg('Active')}</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">{msg('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    {msg('Loading suites...')}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    {msg('No suites found.')}
                  </td>
                </tr>
              ) : (
                filtered.map((suite) => (
                  <tr key={suite.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-700">{suite.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{suite.suiteName}</td>
                    <td className="px-4 py-3">
                      <KindBadge kind={suite.kind} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{suite.capacity}</td>
                    <td className="px-4 py-3 text-gray-700">{suite.floor || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={suite.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {suite.isActive ? (
                        <Check className="w-4 h-4 text-green-600 inline-block" aria-label={msg('Active')} />
                      ) : (
                        <X className="w-4 h-4 text-red-500 inline-block" aria-label={msg('Inactive')} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditSuite?.(suite.id)}
                          className="gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          {msg('Edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteSuite?.(suite.id)}
                          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {msg('Delete')}
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
