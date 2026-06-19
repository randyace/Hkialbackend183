import { Car, ShoppingBag, Mail, FileText, Download, CreditCard, Ticket, Utensils } from 'lucide-react';
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
}

export function BookingInvoiceDialog({
  open, onClose, booking, bookingId,
  voucherCount, voucherTotal, voucherUnitValue,
  livePreviewTotal, breakdown = [],
  serviceSubtotal,
  amountDueAfterVouchers,
  getStatusColor, getPaymentStatusColor,
  apiBaseUrl,
  authToken,
  onInvoiceSent,
}: BookingInvoiceDialogProps) {
  // 2026-06-17 (round 6.2.47) — action handlers. The dialog
  // now hits the new backend endpoints (POST send-invoice,
  // GET invoice.pdf) instead of being a toast-stub. Errors
  // surface via the same `toast` lib the rest of figma-ui uses.
  const baseUrl = apiBaseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const token = authToken ?? (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  const handleSendInvoice = async () => {
    if (!token) {
      toast.error('Not signed in. Please log in to send an invoice.');
      return;
    }
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
      toast.success('Invoice sent!', {
        description: `Invoice ${body.data?.invoice_no ?? ''} has been saved. The customer's payment status is now "Invoice Sent".`,
      });
      onInvoiceSent?.({ invoice_no: body.data?.invoice_no ?? '', data: body.data ?? {} });
    } catch (err) {
      toast.error('Failed to send invoice', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleDownloadPdf = async () => {
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
    try {
      const response = await fetch(`${baseUrl}/bookings/${bookingId}/invoice.pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `invoice-${bookingId}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success('Invoice downloaded');
    } catch (err) {
      toast.error('Failed to download PDF', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleEmailInvoice = () => {
    // The send-invoice endpoint already records the action in
    // AuditLog. The actual email delivery is a future ops
    // concern. For now, sending the invoice IS the email trigger
    // (the backend logs to AuditLog with action='CREATE' on
    // entity_type='invoices').
    handleSendInvoice();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[650px] max-w-[95vw] w-[1400px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice - {booking.bookingNo}</DialogTitle>
          <DialogDescription>Review and send invoice for this booking</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="bg-[#0f2942] text-white p-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl mb-2">HKIA VIP Lounge</h2>
                <p className="text-sm text-gray-300">Hong Kong International Airport</p>
                <p className="text-sm text-gray-300">Terminal 1, Level 6</p>
                <p className="text-sm text-gray-300">Email: vip@hkia-lounge.com</p>
                <p className="text-sm text-gray-300">Tel: +852 2345 6789</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl mb-2">INVOICE</h3>
                <p className="text-sm text-gray-300">Invoice No: INV-{booking.bookingNo}</p>
                <p className="text-sm text-gray-300">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-sm text-gray-300">Booking: {booking.bookingNo}</p>
              </div>
            </div>
          </div>

          {/* Bill To & Booking Info */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-3">Bill To</h3>
              <div className="space-y-2">
                <p className="font-medium">{booking.guestName}</p>
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Amount</th>
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
                    <tr key={`${line.product ?? 'unknown'}::${line.key}::${idx}`}>
                      <td className="px-6 py-4">
                        <p className="font-medium">{line.label}</p>
                        {line.product && (
                          <p className="text-sm text-gray-500">{line.product}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">{line.qty}</td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        HK${(line.unit_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        HK${(line.subtotal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <td className="px-6 py-4 text-right text-gray-500">—</td>
                    <td className="px-6 py-4 text-right font-medium">
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
                        <p className="font-medium">Food &amp; Beverage (incl. Pre-order)</p>
                        <p className="text-sm text-gray-500">Premium selection — all food &amp; drinks included</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">—</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-green-600 font-medium">Complimentary</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">HK$0</td>
                </tr>
              </tbody>
              <tfoot className="border-t-2">
                {/* Round 6.2.13: replaced the "Head Count" row
                  (which used `headCountRate` + `headCountTotal`)
                  with a "Live Preview" row that displays
                  `livePreviewTotal` (or "Pending pricing" if the
                  fetch is still in flight). Per the user
                  directive, NO MORE local `headCountRate × pax`
                  calculation. */}
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-6 py-3 text-right text-sm text-gray-600">
                    Live Preview (POST /api/bookings/price-preview):
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-600">{booking.numberOfGuests} pax</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-800">
                    {livePreviewTotal !== null
                      ? `HK$${livePreviewTotal.toLocaleString()}`
                      : 'Pending pricing'}
                  </td>
                </tr>
                {/* Food note */}
                <tr className="bg-green-50">
                  <td colSpan={3} className="px-6 py-2 text-right text-sm text-green-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5" />
                      Food &amp; Beverage (incl. pre-order):
                    </span>
                  </td>
                  <td className="px-6 py-2 text-right text-sm font-medium text-green-600">Complimentary</td>
                </tr>
                {serviceSubtotal > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-600">Services Subtotal:</td>
                    <td className="px-6 py-2 text-right font-medium text-gray-800">HK${Math.round(serviceSubtotal).toLocaleString()}</td>
                  </tr>
                )}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-2 text-right text-sm text-gray-600 font-medium">Subtotal:</td>
                  <td className="px-6 py-2 text-right font-medium text-gray-800">
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
                  <td className="px-6 py-2 text-right text-gray-600">HK$0</td>
                </tr>
                {voucherCount > 0 && (
                  <tr className="bg-amber-50">
                    <td colSpan={3} className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5" />
                          Entry Vouchers Applied ({voucherCount} × HK${voucherUnitValue.toLocaleString()} — Account Owner &amp; Spouse):
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
                    <td className="px-6 py-3 text-right font-semibold text-amber-700">
                      − HK${voucherTotal.toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr className="text-lg bg-gray-100">
                  <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">
                    {voucherCount > 0 ? 'Total Amount Payable (after entry vouchers):' : 'Total Amount:'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {booking.paymentStatus === 'Pending' && booking.paymentMode === 'Upfront' && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => toast.success('Payment link generated successfully!')}>
                <CreditCard className="w-4 h-4 mr-2" />Generate Payment Link
              </Button>
            )}
            {(booking.paymentStatus === 'Pending' || booking.paymentStatus === 'Payment Link Sent' || booking.paymentStatus === 'Invoice Sent' || booking.paymentStatus === 'InvoiceSent') && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleEmailInvoice}
                data-testid="invoice-email-button"
              >
                <Mail className="w-4 h-4 mr-2" />Email Invoice to Customer
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              data-testid="invoice-download-pdf-button"
            >
              <Download className="w-4 h-4 mr-2" />Download PDF
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <FileText className="w-4 h-4 mr-2" />Print Invoice
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>

          <div className="pt-4 border-t">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              onClick={handleSendInvoice}
              data-testid="invoice-send-button"
            >
              <Mail className="w-5 h-5 mr-2" />Send Invoice to Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}