import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useMsg } from '@/i18n/useMsg';

export type PosPrinterRole = 'kitchen' | 'receipt' | 'both';

/** Matches API PosPrinter models */
export type PosPrinterModel = 'thermal' | 'tm_u220';

export interface PosPrinterFormData {
  name: string;
  host: string;
  port: number;
  beepCount: number;
  role: PosPrinterRole;
  model: PosPrinterModel;
  isActive: boolean;
}

export interface PosPrinterEditProps {
  printerId?: number | null;
  isLoading?: boolean;
  isSaving?: boolean;
  initialData?: PosPrinterFormData;
  onBack?: () => void;
  onSave?: (formData: PosPrinterFormData) => void;
}

const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

const defaultFormData: PosPrinterFormData = {
  name: '',
  host: '',
  port: 9100,
  beepCount: 1,
  role: 'both',
  model: 'thermal',
  isActive: true,
};

export function PosPrinterEdit({
  printerId,
  isLoading = false,
  isSaving = false,
  initialData,
  onBack,
  onSave,
}: PosPrinterEditProps) {
  const msg = useMsg();
  const isEditMode = !!printerId;
  const [formData, setFormData] = useState<PosPrinterFormData>(defaultFormData);
  const [nameError, setNameError] = useState<string | null>(null);
  const [hostError, setHostError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let valid = true;

    if (!formData.name.trim()) {
      setNameError('Printer name is required');
      valid = false;
    } else {
      setNameError(null);
    }

    if (!formData.host.trim()) {
      setHostError('Host IP address is required');
      valid = false;
    } else if (!IPV4_PATTERN.test(formData.host.trim())) {
      setHostError('Enter a valid IPv4 address (e.g. 192.168.1.100)');
      valid = false;
    } else {
      setHostError(null);
    }

    if (!valid) return;

    onSave?.(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[320px] text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {msg('Loading printer...')}
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
            {isEditMode ? 'Edit Printer' : 'Create Printer'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{msg('Configure POS receipt printer connection details.')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">{msg('Printer Name')}</span>
            <input
              required
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (nameError) setNameError(null);
              }}
              placeholder={msg('e.g. Hot Kitchen, Bar')}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                nameError ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">{msg('Host IP Address')}</span>
            <input
              required
              value={formData.host}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, host: e.target.value }));
                if (hostError) setHostError(null);
              }}
              placeholder="192.168.1.100"
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono ${
                hostError ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {hostError ? <p className="text-xs text-red-600">{hostError}</p> : null}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{msg('Port')}</span>
              <input
                type="number"
                min={1}
                max={65535}
                value={formData.port}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, port: Number(e.target.value) || 9100 }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">{msg('Beep Count')}</span>
              <input
                type="number"
                min={0}
                value={formData.beepCount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, beepCount: Number(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">{msg('Role')}</span>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  role: e.target.value as PosPrinterRole,
                }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="both">{msg('Kitchen + Receipt')}</option>
              <option value="kitchen">{msg('Kitchen tickets only')}</option>
              <option value="receipt">{msg('Guest receipts only')}</option>
            </select>
            <p className="text-xs text-gray-500">
              Kitchen routing still uses each menu item&apos;s assigned printer. Receipt jobs go to
              printers with role Receipt or Both.
            </p>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">{msg('Printer Model')}</span>
            <select
              value={formData.model}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  model: e.target.value as PosPrinterModel,
                }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="thermal">{msg('Thermal ESC/POS (default)')}</option>
              <option value="tm_u220">{msg('Epson TM-U220A (impact, auto-cutter)')}</option>
            </select>
            <p className="text-xs text-gray-500">
              Model sets paper width, feed/cut, and agent TCP timeout. TM-U220 uses 76mm impact
              profile with Big5 Chinese.
            </p>
          </label>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{msg('Is Active')}</p>
              <p className="text-xs text-gray-500">{msg('Inactive printers are hidden from menu item assignment.')}</p>
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
              {isEditMode ? 'Save Changes' : 'Create Printer'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
