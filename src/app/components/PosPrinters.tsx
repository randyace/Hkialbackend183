import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Search, Printer } from 'lucide-react';

export interface PosPrinterRow {
  id: number;
  name: string;
  host: string;
  port: number;
  beepCount: number;
  role?: 'kitchen' | 'receipt' | 'both';
  isActive: boolean;
}

export interface PosPrintersViewProps {
  printers: PosPrinterRow[];
  isLoading?: boolean;
  testingPrinterId?: number | null;
  onCreatePrinter?: () => void;
  onEditPrinter?: (id: number) => void;
  onDeletePrinter?: (id: number) => void;
  onTestPrint?: (id: number) => void;
}

export function PosPrinters({
  printers,
  isLoading = false,
  testingPrinterId = null,
  onCreatePrinter,
  onEditPrinter,
  onDeletePrinter,
  onTestPrint,
}: PosPrintersViewProps) {
  const [search, setSearch] = useState('');

  const filtered = printers.filter((printer) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      printer.name.toLowerCase().includes(q)
      || printer.host.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">POS Printers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage kitchen and bar receipt printers for the VIP lounge POS.</p>
        </div>
        <Button onClick={onCreatePrinter} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Printer
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or host IP..."
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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Printer Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Host IP</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Port</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Beep Count</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    Loading printers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No printers found.
                  </td>
                </tr>
              ) : (
                filtered.map((printer) => (
                  <tr key={printer.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-700">{printer.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{printer.name}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{printer.host}</td>
                    <td className="px-4 py-3 text-gray-700">{printer.port}</td>
                    <td className="px-4 py-3 text-gray-700">{printer.beepCount}</td>
                    <td className="px-4 py-3 text-gray-700 capitalize">{printer.role ?? 'both'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          printer.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                        }
                      >
                        {printer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {onTestPrint && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!printer.isActive || testingPrinterId === printer.id}
                            onClick={() => onTestPrint(printer.id)}
                            className="gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {testingPrinterId === printer.id ? 'Sending…' : 'Test print'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditPrinter?.(printer.id)}
                          className="gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeletePrinter?.(printer.id)}
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
