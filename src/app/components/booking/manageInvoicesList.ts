import type { InvoiceHistoryEntry } from './BookingInvoiceDialog';
import type { InvoiceBreakdownLine } from './invoiceDocumentModel';

/** Stable React key / testid for the synthetic master booking invoice. */
export const VIRTUAL_MAIN_INVOICE_KEY = 'virtual-main-invoice';

/** Sentinel numeric id — never collides with auto-increment DB ids. */
export const VIRTUAL_MAIN_INVOICE_ID = -1;

export function invoiceRowKey(entry: InvoiceHistoryEntry): string {
  return entry.isVirtual ? VIRTUAL_MAIN_INVOICE_KEY : String(entry.id);
}

export function isBookingFeeInvoice(entry: InvoiceHistoryEntry): boolean {
  return entry.invoiceType !== 'pos_fnb';
}

export function hasActiveBookingFeeInvoice(invoices: InvoiceHistoryEntry[]): boolean {
  return invoices.some(
    (entry) => isBookingFeeInvoice(entry) && entry.status !== 'Voided' && !entry.isVirtual,
  );
}

export interface MasterInvoiceSource {
  bookingNo: string;
  totalAmount: number;
  priceBreakdown?: InvoiceBreakdownLine[];
  paymentStatus?: string | null;
}

/**
 * Ensure Manage Invoices always lists the main Booking Fee at index 0.
 * When no non-voided persisted booking invoice exists (Pending / unpaid),
 * inject a virtual master invoice built from the booking payable total.
 */
export function buildManageInvoicesList(
  persisted: InvoiceHistoryEntry[],
  master: MasterInvoiceSource,
): InvoiceHistoryEntry[] {
  const rows = Array.isArray(persisted) ? persisted : [];
  if (hasActiveBookingFeeInvoice(rows)) {
    return rows;
  }

  const paid = master.paymentStatus === 'Paid'
    || master.paymentStatus === 'PaymentLinkPaid';

  const virtual: InvoiceHistoryEntry = {
    id: VIRTUAL_MAIN_INVOICE_ID,
    invoiceNo: 'Booking Fee (Main Receipt)',
    invoiceType: 'booking',
    status: paid ? 'Paid' : 'Pending',
    totalAmount: Number.isFinite(master.totalAmount) ? master.totalAmount : 0,
    subtotal: Number.isFinite(master.totalAmount) ? master.totalAmount : 0,
    discountAmount: 0,
    priceBreakdown: Array.isArray(master.priceBreakdown) ? master.priceBreakdown : [],
    sentAt: null,
    createdAt: null,
    posOrderId: null,
    isVirtual: true,
  };

  return [virtual, ...rows];
}

/** Paid invoices are treated as receipts in the Manage UI. */
export function isPaidReceipt(entry: InvoiceHistoryEntry): boolean {
  return entry.status === 'Paid';
}

/** Receipts = paid subset of the full invoice history list. */
export function filterPaidReceipts(entries: InvoiceHistoryEntry[]): InvoiceHistoryEntry[] {
  return (entries ?? []).filter(isPaidReceipt);
}

const APPROVED_STATUSES = new Set(['Approved', 'Confirmed']);
const BLOCKED_PAYMENT_STATUSES = new Set([
  'Paid',
  'Refunded',
  'Not Required',
  'NotRequired',
]);

export interface VirtualInvoiceSendContext {
  status?: string | null;
  paymentStatus?: string | null;
  mode?: 'invoice' | 'receipt';
}

/**
 * First-issue (not resend): virtual Booking Fee row after double approval.
 * Same gate as the old BookingInvoiceDialog "Send Invoice & Payment Link".
 */
export function canIssueVirtualBookingInvoice(
  entry: Pick<InvoiceHistoryEntry, 'isVirtual' | 'invoiceType' | 'totalAmount'>,
  context: VirtualInvoiceSendContext = {},
): boolean {
  if (context.mode === 'receipt') return false;
  if (!entry.isVirtual) return false;
  if (entry.invoiceType === 'pos_fnb') return false;
  if (!Number.isFinite(entry.totalAmount) || entry.totalAmount <= 0.009) return false;
  if (!APPROVED_STATUSES.has(String(context.status ?? ''))) return false;
  if (BLOCKED_PAYMENT_STATUSES.has(String(context.paymentStatus ?? ''))) return false;
  return true;
}

export function virtualInvoiceSendTooltip(
  entry: Pick<InvoiceHistoryEntry, 'isVirtual' | 'invoiceType' | 'totalAmount'>,
  context: VirtualInvoiceSendContext = {},
): string {
  if (canIssueVirtualBookingInvoice(entry, context)) {
    return 'Creates the booking-fee invoice, Adyen Pay Now link, and emails the customer.';
  }
  if (!APPROVED_STATUSES.has(String(context.status ?? ''))) {
    return 'Approve the booking before sending the invoice and payment link.';
  }
  if (BLOCKED_PAYMENT_STATUSES.has(String(context.paymentStatus ?? ''))) {
    return 'This booking does not need an invoice email.';
  }
  if (!Number.isFinite(entry.totalAmount) || entry.totalAmount <= 0.009) {
    return 'No invoice to send for a complimentary booking.';
  }
  return 'This draft is not yet a persisted invoice.';
}
