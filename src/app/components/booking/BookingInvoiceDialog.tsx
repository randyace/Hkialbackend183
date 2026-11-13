import { Mail, Download, Ticket, Utensils, Loader2, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';

interface InvoiceBooking {
  bookingNo: string;
  guestName: string;
  accountNo: string;
  accountType?: string;
  billingName?: string;
  billingCompany?: string;
  billingAddress?: string;
  billingEmail?: string;
  billingPhone?: string;
  suite: string;
  dateTime: string;
  flightNo: string;
  flightTime: string;
  numberOfGuests?: number;
  hasLimousine?: boolean;
  hasShopping?: boolean;
  amount: string;
  paymentMode?: string;
  paymentStatus: string;
  bookingType: string;
  /** Required for Send Invoice gate — Approved/Confirmed after double approval. */
  status?: string;
}

// 2026-06-17 (round 6.2.47) — breakdown line item shape
// from `POST /api/bookings/price-preview`'s response. The
// dialog renders these as real line items in the items
// table (replacing the round 6.2.13 single-line "Lounge
// Access" black-box row). The keys mirror the backend's
// PricingService::compute output.
interface BreakdownLineItem {
  key: string;
  label: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  product?: string;
}

export interface InvoiceHistoryEntry {
  id: number;
  invoiceNo: string;
  invoiceType: string;
  status: string;
  totalAmount: number;
  subtotal?: number;
  discountAmount?: number;
  priceBreakdown?: Array<{
    key: string;
    label: string;
    qty: number;
    unit_price: number;
    subtotal: number;
    product?: string;
    note?: string;
  }>;
  sentAt: string | null;
  createdAt: string | null;
  posOrderId?: number | null;
  /** Raw Adyen Pay by Link URL when an active link covers this invoice. */
  paymentLinkUrl?: string | null;
  /** True when an active exact-coverage payment link already exists. */
  hasActivePaymentLink?: boolean;
  /** True when synthesized client-side (not yet persisted in `invoices`). */
  isVirtual?: boolean;
}

interface BookingInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  booking: InvoiceBooking;
  bookingId: number;
  voucherCount: number;
  voucherTotal: number;
  voucherUnitValue: number;
  // Round 6.2.13 (2026-06-08) — REMOVED `headCountRate` and
  // `headCountTotal` from the props per the user directive
  // ("we are not using headCountRate now, we make them call
  // the same endpoint first"). The wrapper now passes the
  // backend's authoritative `livePreviewTotal` (sourced from
  // `POST /api/bookings/price-preview`).
  livePreviewTotal: number | null;
  // 2026-06-17 (round 6.2.47) — the `breakdown[]` array
  // from the same price-preview response. Rendered as real
  // line items in the items table (one row per line, with
  // label / qty / unit_price / subtotal). When the array
  // is empty (preview not yet fetched), the dialog falls
  // back to a single "Lounge Access" row with the
  // `livePreviewTotal` total (round 6.2.13 behavior).
  breakdown?: BreakdownLineItem[];
  serviceSubtotal: number;
  // `amountDueAfterVouchers` is now a placeholder (0); voucher
  // pricing model will be revised in a future round per the
  // user directive. The invoice displays `livePreviewTotal` as
  // the authoritative Subtotal + Total Amount.
  amountDueAfterVouchers: number;
  getStatusColor: (s: string) => string;
  getPaymentStatusColor: (s: string) => string;
  // 2026-06-19 (round 6.2.49, payment_getway merge) — the
  // payment link button delegates to this callback. The parent
  // wrapper hits `POST /api/bookings/{id}/send-payment-link`
  // (Laravel + Adyen) and re-fetches the booking so the badge
  // flips to "PaymentLinkSent". The dialog itself stays free
  // of the `paymentApi` import — keeps the figma-ui surface
  // thin (per INV-X1 surgical patch policy).
  onSendPaymentLink?: () => void | Promise<void>;
  // 2026-06-17 (round 6.2.47) — base URL for the invoice
  // API endpoints. The dialog uses this to construct the
  // send-invoice + PDF download URLs. Default to the
  // current origin if omitted.
  apiBaseUrl?: string;
  // 2026-06-17 (round 6.2.47) — auth token (Sanctum) for
  // the staff user. The dialog uses this for the bearer
  // header on `POST /api/bookings/{id}/send-invoice`.
  // Optional — falls back to `localStorage.auth_token` if
  // omitted (matches the rest of the admin SPA).
  authToken?: string;
  // 2026-06-17 (round 6.2.47) — callback fired after a
  // successful `send-invoice` POST. The parent wrapper
  // uses this to refresh the booking's payment_status.
  onInvoiceSent?: (response: { invoice_no: string; data: Record<string, unknown> }) => void;
  /** Distinguishes unpaid invoice preview from paid receipt preview. */
  documentType?: 'invoice' | 'receipt';
  /** All persisted invoices for this booking (newest first). */
  invoiceHistory?: InvoiceHistoryEntry[];
}

function isInvoiceDiscountLine(line: { key?: string; subtotal?: number }): boolean {
  const key = String(line.key ?? '');
  return (line.subtotal != null && line.subtotal < 0)
    || key === 'account_discount'
    || key === 'contract_discount'
    || key === 'promo_discount'
    || key.startsWith('membership_');
}

function formatInvoiceTypeLabel(invoiceType: string): string {
  if (invoiceType === 'pos_fnb') {
    return 'F&B (POS)';
  }
  return 'Booking Fee';
}

function getInvoiceTypeBadgeClass(invoiceType: string): string {
  if (invoiceType === 'pos_fnb') {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  }
  return 'bg-blue-100 text-blue-800 border-blue-200';
}

function getInvoiceStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Voided':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'Sent':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200';
  }
}

function formatInvoiceTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatReceiptDate(value?: string): string {
  if (!value) {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  const datePart = value.split(/[,\s]/)[0];
  return datePart || value;
}

export function BookingInvoiceDialog({
  open, onClose, booking, bookingId,
  voucherCount, voucherTotal, voucherUnitValue,
  livePreviewTotal, breakdown = [],
  serviceSubtotal,
  // 2026-06-27 (round 6.2.69) — `amountDueAfterVouchers` and
  // `onSendPaymentLink` are kept in the props interface for
  // forward-compat but not destructured here. The merged
  // send-invoice flow no longer needs them (backend creates
  // the payment link as part of send-invoice; voucher pricing
  // is still a placeholder per round 6.2.13).
  getStatusColor, getPaymentStatusColor,
  apiBaseUrl,
  authToken,
  onInvoiceSent,
  documentType = 'invoice',
  invoiceHistory = [],
}: BookingInvoiceDialogProps) {
  const isInvoice = documentType === 'invoice';
  const documentLabel = isInvoice ? 'Invoice' : 'Receipt';
  // 2026-06-17 (round 6.2.47) — action handlers. The dialog
  // now hits the new backend endpoints (POST send-invoice,
  // GET invoice.pdf) instead of being a toast-stub. Errors
  // surface via the same `toast` lib the rest of figma-ui uses.
  const baseUrl = apiBaseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const token = authToken ?? (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  // 2026-06-27 (round 6.2.69) — the merged send-invoice call is
  // a single round-trip + a queued email dispatch, so a few
  // seconds is normal. The flag drives a `disabled + Loader2`
  // UX so the user doesn't double-click and so they see the
  // action is in flight (otherwise the dialog looks frozen
  // until the parent refetch updates the badge).
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);

  // 2026-06-27 — "Send Invoice & Payment Link" handler.
  //
  // Round 6.2.49: this fired BOTH a local send-invoice POST
  // AND the parent's onSendPaymentLink callback, producing TWO
  // emails (invoice PDF email + payment-link email).
  //
  // Round 6.2.69 (2026-06-27, Sky directive): merged into ONE
  // email. The backend `POST /api/bookings/{id}/send-invoice`
  // now ALSO creates the Adyen payment link internally
  // (silently on Adyen failure) and the `SendInvoiceEmail`
  // queued job includes the payment URL inline in the email
  // body. So a single click → ONE API call → ONE email with
  // the invoice PDF attached AND a "Pay Now" CTA inline.
  //
  // We still re-fetch the booking via `onInvoiceSent` so the
  // dialog's payment-status badge + the page header chip
  // refresh after the backend flips `payment_status` to
  // `PaymentLinkSent` (AdyenPaymentService::createPaymentLink
  // does the flip when the link succeeds).
  const handleSendInvoiceAndPaymentLink = async () => {
    if (isSendingInvoice) return;
    if (!token) {
      toast.error('Not signed in. Please log in to send.');
      return;
    }
    setIsSendingInvoice(true);
    try {
      const response = await fetch(`${baseUrl}/bookings/${bookingId}/send-invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      const invoiceNo = body.data?.invoice_no ?? '';
      const paymentId = body.data?.payment_id ?? null;
      const paymentLinkReason = body.data?.payment_link_reason ?? null;
      // 2026-06-27 (user-reported "payment link is missing in
      // the email") — surface the backend's `payment_link_reason`
      // when the link couldn't be generated so the staff user
      // sees WHY (Adyen SDK failed, booking isn't Upfront, etc.)
      // instead of silently getting an invoice-only email.
      toast.success('Invoice + payment link sent!', {
        description: paymentId
          ? `${invoiceNo} + Adyen payment link emailed to ${booking.guestName || 'the customer'} (one email, PDF attached + Pay Now button).`
          : `${invoiceNo} emailed to ${booking.guestName || 'the customer'} (PDF attached, no Pay Now CTA).${paymentLinkReason ? ` Reason: ${paymentLinkReason}` : ''}`,
      });
      onInvoiceSent?.({ invoice_no: invoiceNo, data: body.data ?? {} });
    } catch (err) {
      toast.error('Failed to send invoice', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handleDownloadPdf = async () => {
    await handleDownloadInvoicePdf(undefined, `${documentLabel}-${booking.bookingNo || bookingId}`);
  };

  const handleDownloadInvoicePdf = async (
    invoiceId?: number,
    filename?: string,
    docTypeOverride?: 'invoice' | 'receipt',
  ) => {
    if (!token) {
      toast.error('Not signed in. Please log in to download.');
      return;
    }
    const docType = docTypeOverride ?? documentType;
    try {
      const apiRoot = (baseUrl || '').replace(/\/$/, '');
      const query = new URLSearchParams({ type: docType });
      if (invoiceId != null) {
        query.set('invoice_id', String(invoiceId));
      }
      const response = await fetch(
        `${apiRoot}/bookings/${bookingId}/document.pdf?${query.toString()}`,
        {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const head = new TextDecoder('utf-8').decode(buffer.slice(0, 5));
      if (head !== '%PDF-') {
        const contentType = response.headers.get('content-type') ?? 'unknown';
        throw new Error(`Invoice endpoint returned non-PDF content (${contentType})`);
      }
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename ?? `${documentLabel}-${booking.bookingNo || bookingId}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success(`${documentLabel} downloaded`);
    } catch (err) {
      toast.error('Failed to download PDF', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleDownloadPdfLegacy = async () => {
    if (!token) {
      toast.error('Not signed in. Please log in to download.');
      return;
    }
    // 2026-06-17 (round 6.2.47 follow-up, user-reported:
    // "the pdf download link not working") — fetch the PDF
    // as a blob so the Authorization header is sent. The
    // pre-fix implementation opened a new tab with
    // `?token=` query string, but the `auth:sanctum`
    // middleware only reads the `Authorization` header
    // (not query params), so the request 401'd and the
    // new tab showed the login error page.
    //
    // The fix: use `fetch()` to call the endpoint with
    // the bearer header, then wrap the response blob in
    // a temporary `<a download>` click to trigger the
    // browser's native download UX. The blob URL is
    // revoked after a short delay to free memory.
    //
    // 2026-08-10 — reject non-PDF bodies (401/HTML error
    // pages) so the browser never saves a "broken" PDF.
    try {
      const apiRoot = (baseUrl || '').replace(/\/$/, '');
      const response = await fetch(
        `${apiRoot}/bookings/${bookingId}/document.pdf?type=${encodeURIComponent(documentType)}`,
        {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const head = new TextDecoder('utf-8').decode(buffer.slice(0, 5));
      if (head !== '%PDF-') {
        const contentType = response.headers.get('content-type') ?? 'unknown';
        throw new Error(`Invoice endpoint returned non-PDF content (${contentType})`);
      }
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${documentLabel}-${booking.bookingNo || bookingId}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success(`${documentLabel} downloaded`);
    } catch (err) {
      toast.error('Failed to download PDF', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!token) {
      toast.error('Not signed in. Please log in to download.');
      return;
    }
    try {
      const apiRoot = (baseUrl || '').replace(/\/$/, '');
      const response = await fetch(
        `${apiRoot}/bookings/${bookingId}/document/excel?type=${encodeURIComponent(documentType)}`,
        {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('spreadsheet') && !contentType.includes('excel')) {
        throw new Error(`Receipt Excel endpoint returned unexpected content-type "${contentType}"`);
      }
      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${documentLabel}-${booking.bookingNo || bookingId}.xlsx`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success(`${documentLabel} Excel downloaded`);
    } catch (err) {
      toast.error('Failed to download Excel', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleDownloadHistoryPdf = async (entry: InvoiceHistoryEntry) => {
    if (downloadingInvoiceId != null) {
      return;
    }

    setDownloadingInvoiceId(entry.id);
    try {
      const docType = entry.status === 'Paid' ? 'receipt' : 'invoice';
      await handleDownloadInvoicePdf(
        entry.id,
        `${docType === 'receipt' ? 'Receipt' : 'Invoice'}-${entry.invoiceNo}.pdf`,
        docType,
      );
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const bookingDate = formatReceiptDate(booking.dateTime);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Dialog width: override DialogContent defaults (`sm:max-w-lg`) with
        `sm:!max-w-5xl` + `w-[95vw]`. Invoice document scrolls horizontally
        inside `overflow-x-auto` when narrower than `min-w-[800px]`. */}
      <DialogContent className="!max-w-[calc(100%-2rem)] sm:!max-w-5xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{documentLabel.toUpperCase()} - {booking.bookingNo}</DialogTitle>
          <DialogDescription>
            {isInvoice
              ? 'Review invoice history, preview the current document, and send a new booking-fee invoice when ready.'
              : 'Review and download receipt for this confirmed payment'}
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
            Invoice History
          </h3>
          {invoiceHistory.length === 0 ? (
            <Card className="p-4 text-sm text-gray-500">
              No invoices have been sent for this booking yet.
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice No.
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Sent Date
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {entry.invoiceNo}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={getInvoiceTypeBadgeClass(entry.invoiceType)}
                          >
                            {formatInvoiceTypeLabel(entry.invoiceType)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                          {entry.totalAmount > 0
                            ? `HK$ ${entry.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'Complimentary'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={getInvoiceStatusBadgeClass(entry.status)}
                          >
                            {entry.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                          {formatInvoiceTimestamp(entry.sentAt ?? entry.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleDownloadHistoryPdf(entry)}
                            disabled={downloadingInvoiceId === entry.id}
                            data-testid={`invoice-history-download-${entry.id}`}
                          >
                            {downloadingInvoiceId === entry.id ? (
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-1.5" />
                            )}
                            View / Download PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px] bg-white space-y-6 border border-black p-6">
          {/* Receipt header — matches PDF layout (white, minimal) */}
          <div className="flex items-start justify-between gap-6 pb-2">
            <div className="shrink-0">
              <img
                src="/images/invoice-logo.png"
                alt="HKIA VIP LOUNGE"
                className="h-12 w-auto"
              />
            </div>
            <table className="text-[10px] border-collapse ml-auto">
              <tbody>
                <tr>
                  <td className="pr-2 text-right text-gray-700">Issue Date:</td>
                  <td className="text-right text-gray-900">{issueDate}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-right text-gray-700">Customer ID:</td>
                  <td className="text-right text-gray-900">{booking.accountNo}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-right text-gray-700">Booking Date:</td>
                  <td className="text-right text-gray-900">{bookingDate}</td>
                </tr>
                <tr>
                  <td className="pr-2 text-right text-gray-700">Flight No.</td>
                  <td className="text-right text-gray-900">{booking.flightNo}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bill To & Booking Info */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-3">Bill To</h3>
              <div className="space-y-2">
                <p className="font-medium">{booking.billingName || booking.guestName}</p>
                {booking.billingCompany ? (
                  <p className="text-sm text-gray-800">{booking.billingCompany}</p>
                ) : null}
                {booking.billingAddress ? (
                  <p className="text-sm text-gray-600 whitespace-pre-line">{booking.billingAddress}</p>
                ) : null}
                {booking.billingEmail ? (
                  <p className="text-sm text-gray-600">Email: {booking.billingEmail}</p>
                ) : null}
                {booking.billingPhone ? (
                  <p className="text-sm text-gray-600">Tel: {booking.billingPhone}</p>
                ) : null}
                <p className="text-sm text-gray-600">Account: {booking.accountNo}</p>
                <p className="text-sm text-gray-600">Type: {booking.accountType}</p>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-3">Booking Information</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-gray-600">Suite:</span> {booking.suite}</p>
                <p className="text-sm"><span className="text-gray-600">Date/Time:</span> {booking.dateTime}</p>
                <p className="text-sm"><span className="text-gray-600">Flight:</span> {booking.flightNo} at {booking.flightTime}</p>
                <p className="text-sm"><span className="text-gray-600">Guests:</span> {booking.numberOfGuests} pax</p>
                {voucherCount > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-100">
                    <Ticket className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">{voucherCount} Voucher{voucherCount > 1 ? 's' : ''} Applied</span>
                      {' '} — saving HK${voucherTotal.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Invoice Items Table */}
          <Card>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* 2026-06-17 (round 6.2.47) — render the actual
                  price-preview `breakdown[]` as real line items.
                  This replaces the round 6.2.13 single "Lounge
                  Access" black-box row with one row per line
                  item (base, NFG, children, hours, limo, addons,
                  account discount). The hardcoded Limo/Shopping
                  rows that used to render at L167-192 are gone —
                  those lines are now in the breakdown. When the
                  breakdown is empty (preview not yet fetched),
                  we fall back to the round 6.2.13 single-line
                  "Lounge Access" row with the live preview total. */}
                {breakdown.length > 0 ? (
                  breakdown.map((line, idx) => (
                    // 2026-06-17 (round 6.2.47 follow-up) — the
                    // multi-kind compute emits multiple lines
                    // with the SAME `key` (e.g. PS base +
                    // LD base both have `key: "base"`), so the
                    // React key must include the product (or
                    // index) for uniqueness. Pre-fix the console
                    // logged a React warning
                    // "Encountered two children with the same
                    // key" and the dialog rendered with the
                    // warning. Post-fix the key is
                    // `${product}::${key}::${idx}` — unique
                    // across the breakdown[].
                    //
                    // 2026-06-27 (round 6.2.70, Sky directive):
                    // removed the second-line product slug
                    // (`<p className="text-sm text-gray-500">{
                    // line.product}</p>`) — the product code is
                    // an internal identifier (e.g.
                    // `premier_suite_a`) and was leaking into
                    // the customer-facing invoice PDF. Each line
                    // item now shows only the human-readable
                    // label on a single row. The `line.product`
                    // field is preserved on the data side for
                    // any future per-product UI (e.g. grouping
                    // toggles) without re-introducing the slug.
                    <tr key={`${line.product ?? 'unknown'}::${line.key}::${idx}`}>
                      <td className="px-6 py-4">
                        <p className={`font-medium${isInvoiceDiscountLine(line) ? ' text-green-700' : ''}`}>{line.label}</p>
                      </td>
                      <td className="px-6 py-4 text-center">{isInvoiceDiscountLine(line) ? '—' : line.qty}</td>
                      <td className="px-6 py-4 text-right text-gray-700 whitespace-nowrap">
                        {isInvoiceDiscountLine(line)
                          ? '—'
                          : `HK$${(line.unit_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium whitespace-nowrap${isInvoiceDiscountLine(line) ? ' text-green-700' : ''}`}>
                        {isInvoiceDiscountLine(line)
                          ? `− HK$${Math.abs(line.subtotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `HK$${(line.subtotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-4">
                      <p className="font-medium">{booking.suite} - Lounge Access</p>
                      <p className="text-sm text-gray-600">Date: {booking.dateTime}</p>
                    </td>
                    <td className="px-6 py-4 text-center">{booking.numberOfGuests}</td>
                    <td className="px-6 py-4 text-right text-gray-500 whitespace-nowrap">—</td>
                    <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                      {livePreviewTotal !== null
                        ? `HK$${livePreviewTotal.toLocaleString()}`
                        : '—'}
                    </td>
                  </tr>
                )}
                {/* Food & Beverage — always complimentary */}
                <tr>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-medium">Food & Beverage (incl. Pre-order)</p>
                        <p className="text-sm text-gray-500">Premium selection — all food & drinks included</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">—</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm text-green-600 font-medium">Complimentary</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-green-600 whitespace-nowrap">HK$0</td>
                </tr>
              </tbody>
              <tfoot className="border-t-2">
                {/* 2026-06-25 — round 6.2.63 (bug 5): removed
                  the "Live Preview (POST /api/bookings/
                  price-preview)" row. Per Sky's directive, the
                  invoice should not expose the live-preview
                  endpoint URL or duplicate the subtotal as a
                  separate debug line. The authoritative total
                  already renders in the Subtotal row below
                  (and the grand total after vouchers /
                  discount), so removing this row is purely
                  surface-area cleanup. The `livePreviewTotal`
                  prop is still used by the Subtotal row. */}
                {/* Food note */}
                <tr className="bg-green-50">
                  <td colSpan={3} className="px-6 py-2 text-right text-sm text-green-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5" />
                      Food & Beverage (incl. pre-order):
                    </span>
                  </td>
                  <td className="px-6 py-2 text-right text-sm font-medium text-green-600 whitespace-nowrap">Complimentary</td>
                </tr>
                {serviceSubtotal > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-600">Services Subtotal:</td>
                    <td className="px-6 py-2 text-right font-medium text-gray-800 whitespace-nowrap">HK${Math.round(serviceSubtotal).toLocaleString()}</td>
                  </tr>
                )}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-600 font-medium">Subtotal:</td>
                  <td className="px-6 py-2 text-right font-medium text-gray-800 whitespace-nowrap">
                    {/* Round 6.2.13: use `livePreviewTotal` (the
                     * backend's authoritative total) instead of
                     * `headCountTotal + serviceSubtotal`. The
                     * `livePreviewTotal` is the price the user
                     * will actually pay (it includes the suite
                     * base + free-block allocations + addons +
                     * per-guest charges, all per the backend's
                     * `PricingService::computeMultiKind`).
                     * `serviceSubtotal` is still displayed as a
                     * line item above for traceability. */}
                    {livePreviewTotal !== null
                      ? `HK$${livePreviewTotal.toLocaleString()}`
                      : 'Pending pricing'}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-600">Tax (0%):</td>
                  <td className="px-6 py-2 text-right text-gray-600 whitespace-nowrap">HK$0</td>
                </tr>
                {voucherCount > 0 && (
                  <tr className="bg-amber-50">
                    <td colSpan={3} className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5" />
                          Entry Vouchers Applied ({voucherCount} × HK${voucherUnitValue.toLocaleString()} — Account Owner & Spouse):
                        </span>
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          {Array.from({ length: voucherCount }, (_, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs">
                              <Ticket className="w-3 h-3" />
                              Voucher #{String(bookingId * 10 + i + 1).padStart(4, '0')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-amber-700 whitespace-nowrap">
                      − HK${voucherTotal.toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr className="text-lg bg-gray-100">
                  <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">
                    {voucherCount > 0 ? 'Total Amount Payable (after entry vouchers):' : 'Total Amount:'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600 whitespace-nowrap">
                    {/* Round 6.2.13: use `livePreviewTotal` instead
                     * of `amountDueAfterVouchers` (which is now
                     * a placeholder 0). Voucher pricing model
                     * will be revised in a future round per the
                     * user directive. For now, the invoice
                     * displays the backend's authoritative
                     * `livePreviewTotal` here. */}
                    {livePreviewTotal !== null
                      ? `HK$${livePreviewTotal.toLocaleString()}`
                      : 'Pending pricing'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>

          {/* Payment Information */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="text-sm uppercase tracking-wide text-blue-900 mb-3">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-900"><span className="font-medium">Payment Mode:</span> {booking.paymentMode}</p>
                <p className="text-sm text-blue-900"><span className="font-medium">Payment Status:</span> <Badge className={getPaymentStatusColor(booking.paymentStatus)}>{booking.paymentStatus}</Badge></p>
              </div>
              <div>
                <p className="text-sm text-blue-900"><span className="font-medium">Booking Type:</span> {booking.bookingType}</p>
                <p className="text-sm text-blue-900"><span className="font-medium">Booking Status:</span> <Badge className={getStatusColor('Confirmed')}>Confirmed</Badge></p>
              </div>
            </div>
          </Card>

          {/* Terms */}
          <Card className="p-4 bg-gray-50">
            <h3 className="text-sm uppercase tracking-wide text-gray-700 mb-2">Terms & Conditions</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Payment is due upon receipt of this invoice</li>
              <li>• Cancellation must be made at least 24 hours in advance for full refund</li>
              <li>• Late cancellation or no-show may result in charges</li>
              <li>• All prices are in Hong Kong Dollars (HKD)</li>
            </ul>
          </Card>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              data-testid="invoice-download-pdf-button"
            >
              <Download className="w-4 h-4 mr-2" />Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadExcel}
              data-testid="invoice-download-excel-button"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />Download Excel
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>

          {/* 2026-06-27 — Send Invoice + Send Payment Link merged
            into a single button per Sky directive. Visibility is
            gated on supervisor approval (status must be
            'Approved' or 'Confirmed'). Paid / Refunded hide the
            button. Invoice Sent / Payment Link Sent still allow
            re-send after an edited booking is re-approved (fresh
            invoice snapshot for the new total). */}
          {isInvoice &&
           (booking.status === 'Approved' || booking.status === 'Confirmed') &&
           booking.paymentStatus !== 'Paid' &&
           booking.paymentStatus !== 'Refunded' && (
            <div className="pt-4 border-t">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                onClick={handleSendInvoiceAndPaymentLink}
                disabled={isSendingInvoice}
                data-testid="invoice-send-button"
              >
                {(isSendingInvoice) ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5 mr-2" />
                )}
                {(isSendingInvoice)
                  ? 'Sending invoice & payment link…'
                  : 'Send Invoice & Payment Link'}
              </Button>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}