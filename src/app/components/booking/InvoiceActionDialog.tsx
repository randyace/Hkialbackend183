import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Mail, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import type { InvoiceHistoryEntry } from './BookingInvoiceDialog';

export interface InvoiceActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  bookingNo?: string;
  invoices: InvoiceHistoryEntry[];
  apiBaseUrl?: string;
  authToken?: string;
  /** Fired after a successful resend so the parent can refresh booking state. */
  onInvoiceSent?: (response: { invoice_no: string; data: Record<string, unknown> }) => void;
}

type BusyAction = 'pdf' | 'excel' | 'send';

function formatInvoiceTypeLabel(invoiceType: string): string {
  if (invoiceType === 'pos_fnb') {
    return 'Food & Beverage';
  }
  return 'Booking Fee';
}

function getInvoiceTypeBadgeClass(invoiceType: string): string {
  if (invoiceType === 'pos_fnb') {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  }
  return 'bg-blue-100 text-blue-800 border-blue-200';
}

function paidLabel(status: string): { label: string; className: string } {
  if (status === 'Paid') {
    return { label: 'Paid', className: 'bg-green-100 text-green-800 border-green-200' };
  }
  if (status === 'Voided') {
    return { label: 'Voided', className: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
  return { label: 'Unpaid', className: 'bg-amber-100 text-amber-800 border-amber-200' };
}

function documentTypeForInvoice(status: string): 'invoice' | 'receipt' {
  return status === 'Paid' ? 'receipt' : 'invoice';
}

export function InvoiceActionDialog({
  isOpen,
  onClose,
  bookingId,
  bookingNo,
  invoices,
  apiBaseUrl,
  authToken,
  onInvoiceSent,
}: InvoiceActionDialogProps) {
  const baseUrl = String(
    apiBaseUrl
      ?? (typeof window !== 'undefined' ? window.location?.origin : '')
      ?? '',
  ).replace(/\/$/, '');
  const token = authToken
    ?? (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  const [busyKey, setBusyKey] = useState<string | null>(null);

  const busyId = (invoiceId: number, action: BusyAction) => `${invoiceId}:${action}`;

  const downloadPdf = async (entry: InvoiceHistoryEntry) => {
    if (!token) {
      toast.error('Not signed in. Please log in to download.');
      return;
    }
    if (busyKey) return;
    const key = busyId(entry.id, 'pdf');
    setBusyKey(key);
    try {
      const docType = documentTypeForInvoice(entry.status);
      const query = new URLSearchParams({
        type: docType,
        invoice_id: String(entry.id),
      });
      const response = await fetch(
        `${baseUrl}/bookings/${bookingId}/document.pdf?${query.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf',
          },
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const head = new TextDecoder('utf-8').decode(buffer.slice(0, 5));
      if (head !== '%PDF-') {
        throw new Error('Invoice endpoint returned non-PDF content');
      }
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${docType === 'receipt' ? 'Receipt' : 'Invoice'}-${entry.invoiceNo}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success('PDF downloaded', { description: entry.invoiceNo });
    } catch (err) {
      toast.error('Failed to download PDF', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const downloadExcel = async (entry: InvoiceHistoryEntry) => {
    if (!token) {
      toast.error('Not signed in. Please log in to download.');
      return;
    }
    if (busyKey) return;
    const key = busyId(entry.id, 'excel');
    setBusyKey(key);
    try {
      const docType = documentTypeForInvoice(entry.status);
      const query = new URLSearchParams({
        type: docType,
        invoice_id: String(entry.id),
      });
      const response = await fetch(
        `${baseUrl}/bookings/${bookingId}/document/excel?${query.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('spreadsheet') && !contentType.includes('excel')) {
        throw new Error(`Unexpected content-type "${contentType}"`);
      }
      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${docType === 'receipt' ? 'Receipt' : 'Invoice'}-${entry.invoiceNo}.xlsx`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success('Excel downloaded', { description: entry.invoiceNo });
    } catch (err) {
      toast.error('Failed to download Excel', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const sendToCustomer = async (entry: InvoiceHistoryEntry) => {
    if (!token) {
      toast.error('Not signed in. Please log in to send.');
      return;
    }
    if (entry.status === 'Voided') {
      toast.error('Cannot send a voided invoice.');
      return;
    }
    if (busyKey) return;
    const key = busyId(entry.id, 'send');
    setBusyKey(key);
    try {
      const response = await fetch(
        `${baseUrl}/bookings/${bookingId}/invoices/${entry.id}/resend`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: '{}',
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      toast.success('Sent to customer', {
        description: `${entry.invoiceNo} emailed successfully.`,
      });
      onInvoiceSent?.({
        invoice_no: entry.invoiceNo,
        data: (body.data ?? {}) as Record<string, unknown>,
      });
    } catch (err) {
      toast.error('Failed to send invoice', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="!max-w-[calc(100%-2rem)] sm:!max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto"
        data-testid="invoice-action-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-700" />
            Select Invoice / Receipt
            <span className="text-sm font-normal text-gray-500">（選擇發票/收據）</span>
          </DialogTitle>
          <DialogDescription>
            {bookingNo
              ? `Choose a document for booking ${bookingNo}. Download PDF, Excel, or email it to the customer.`
              : 'Choose a document to download or email to the customer.'}
          </DialogDescription>
        </DialogHeader>

        {invoices.length === 0 ? (
          <div
            className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500"
            data-testid="invoice-action-empty"
          >
            No invoices have been issued for this booking yet.
            Use Generate Invoice to create the first booking-fee invoice.
          </div>
        ) : (
          <ul className="space-y-3" data-testid="invoice-action-list">
            {invoices.map((entry) => {
              const pay = paidLabel(entry.status);
              const pdfBusy = busyKey === busyId(entry.id, 'pdf');
              const excelBusy = busyKey === busyId(entry.id, 'excel');
              const sendBusy = busyKey === busyId(entry.id, 'send');
              const rowBusy = pdfBusy || excelBusy || sendBusy;
              return (
                <li
                  key={entry.id}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
                  data-testid={`invoice-action-row-${entry.id}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900 font-mono text-sm">
                          {entry.invoiceNo}
                        </p>
                        <Badge variant="outline" className={getInvoiceTypeBadgeClass(entry.invoiceType)}>
                          {formatInvoiceTypeLabel(entry.invoiceType)}
                        </Badge>
                        <Badge variant="outline" className={pay.className}>
                          {pay.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {entry.totalAmount > 0
                          ? `HK$${entry.totalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}`
                          : 'Complimentary'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={rowBusy}
                        onClick={() => void downloadPdf(entry)}
                        data-testid={`invoice-action-pdf-${entry.id}`}
                        title="Download PDF"
                      >
                        {pdfBusy ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-1.5" />
                        )}
                        PDF
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={rowBusy}
                        onClick={() => void downloadExcel(entry)}
                        data-testid={`invoice-action-excel-${entry.id}`}
                        title="Download Excel"
                      >
                        {excelBusy ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                        )}
                        Excel
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={rowBusy || entry.status === 'Voided'}
                        onClick={() => void sendToCustomer(entry)}
                        data-testid={`invoice-action-send-${entry.id}`}
                        title="Send to Customer"
                        className="border-blue-200 text-blue-800 hover:bg-blue-50"
                      >
                        {sendBusy ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4 mr-1.5" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
