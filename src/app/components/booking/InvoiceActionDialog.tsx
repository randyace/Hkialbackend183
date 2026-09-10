import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  Link2,
  Loader2,
  Mail,
  FileText,
  Save,
  XOctagon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';
import type { InvoiceHistoryEntry } from './BookingInvoiceDialog';
import { InvoiceDocumentPreview } from './InvoiceDocumentPreview';
import { buildVipPassengerSummary } from './invoiceDocumentModel';
import {
  canIssueVirtualBookingInvoice,
  invoiceRowKey,
  virtualInvoiceSendTooltip,
} from './manageInvoicesList';

export type InvoiceActionModalMode = 'invoice' | 'receipt';

export interface InvoiceBillingDetails {
  billingName: string;
  billingCompany: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
  /** Persist with `advanced_details.billing.showBillingInfo`. */
  showBillingInfo: boolean;
  /** Customer-facing invoice remarks → `advanced_details.invoice_remarks`. */
  invoiceRemarks: string;
}

export interface InvoiceActionBookingContext {
  bookingNo: string;
  guestName?: string;
  accountNo: string;
  dateTime: string;
  flightNo: string;
  flightOrigin?: string | null;
  flightDestination?: string | null;
  /** @deprecated Prefer invoiceRemarks — was wrongly mapped from notes/memo. */
  serviceRemarks?: string | null;
  paymentStatus?: string | null;
  /** Wire or display status — first-issue send requires Approved/Confirmed. */
  status?: string | null;
  billingName?: string | null;
  billingCompany?: string | null;
  billingEmail?: string | null;
  billingPhone?: string | null;
  billingAddress?: string | null;
  showBillingInfo?: boolean | null;
  invoiceRemarks?: string | null;
  /** Booking contact person email — optional CC on Send. */
  contactEmail?: string | null;
  passengers?: Array<{
    title?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }>;
}

export type InvoiceSendEmailOptions = {
  additional_email?: string;
  cc_contact?: boolean;
};

export interface InvoiceActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  bookingNo?: string;
  /** Booking fields needed for the Service Summary document preview. */
  booking?: InvoiceActionBookingContext;
  /**
   * Pre-built document list from the parent:
   * - invoice mode → full billing history (paid + unpaid, incl. virtual master when unpaid)
   * - receipt mode → Paid invoices only
   */
  invoices: InvoiceHistoryEntry[];
  /** Controls list title / empty copy / back label. */
  mode?: InvoiceActionModalMode;
  apiBaseUrl?: string;
  authToken?: string;
  /** Fired after a successful resend so the parent can refresh booking state. */
  onInvoiceSent?: (response: { invoice_no: string; data: Record<string, unknown> }) => void;
  /**
   * First-issue send for the virtual Booking Fee draft.
   * Parent owns `POST /bookings/{id}/send-invoice` (invoice + Pay Now + email).
   */
  onSendInvoice?: (opts?: InvoiceSendEmailOptions) => Promise<unknown>;
  /**
   * Persist invoice Bill-To fields (`advanced_details.billing`) via a
   * targeted booking update. Shared by Manage Invoices and Manage Receipts.
   */
  onSaveBillingDetails?: (details: InvoiceBillingDetails) => Promise<void>;
}

type BusyAction = 'pdf' | 'excel' | 'send' | 'generate-link' | 'revoke-link';
type ViewMode = 'list' | 'preview';

const VIRTUAL_SEND_TOOLTIP =
  'This draft is not yet a persisted invoice.';

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined'
    && typeof navigator.clipboard?.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand.
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

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
  booking,
  invoices,
  mode = 'invoice',
  apiBaseUrl,
  authToken,
  onInvoiceSent,
  onSendInvoice,
  onSaveBillingDetails,
}: InvoiceActionDialogProps) {
  const baseUrl = String(
    apiBaseUrl
      ?? (typeof window !== 'undefined' ? window.location?.origin : '')
      ?? '',
  ).replace(/\/$/, '');
  const token = authToken
    ?? (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceHistoryEntry | null>(null);
  /** Row-key → payment URL overlay so Copy enables immediately after Generate (no browser navigation). */
  const [localPaymentLinks, setLocalPaymentLinks] = useState<Record<string, string | null>>({});
  const [billingExpanded, setBillingExpanded] = useState(true);
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingName, setBillingName] = useState('');
  const [billingCompany, setBillingCompany] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [showBillingInfo, setShowBillingInfo] = useState(false);
  const [invoiceRemarks, setInvoiceRemarks] = useState('');
  const [additionalRecipientEmail, setAdditionalRecipientEmail] = useState('');
  const [ccContactEmail, setCcContactEmail] = useState(false);

  // Parent owns virtual-master injection + Paid/pending partition.
  // Local overlay keeps freshly minted Adyen URLs available for Copy without redirecting.
  const displayInvoices = useMemo(() => {
    const base = Array.isArray(invoices) ? invoices : [];
    return base.map((entry) => {
      const key = invoiceRowKey(entry);
      if (!Object.prototype.hasOwnProperty.call(localPaymentLinks, key)) {
        return entry;
      }
      const url = localPaymentLinks[key];
      const trimmed = typeof url === 'string' ? url.trim() : '';
      return {
        ...entry,
        paymentLinkUrl: trimmed || null,
        hasActivePaymentLink: trimmed !== '',
      };
    });
  }, [invoices, localPaymentLinks]);
  const isReceiptMode = mode === 'receipt';
  const listTitle = isReceiptMode ? 'Select Receipt' : 'Select Invoice';
  const listTitleZh = isReceiptMode ? '（選擇收據）' : '（選擇發票）';
  const listNoun = isReceiptMode ? 'receipt' : 'invoice';
  const backLabel = isReceiptMode ? 'Back to Receipts' : 'Back to Invoices';
  const emptyCopy = isReceiptMode
    ? 'No paid receipts for this booking yet.'
    : 'No invoices for this booking yet.';

  useEffect(() => {
    if (!isOpen) {
      setViewMode('list');
      setSelectedInvoice(null);
      setBusyKey(null);
      setBillingSaving(false);
      setLocalPaymentLinks({});
      setAdditionalRecipientEmail('');
      setCcContactEmail(false);
      return;
    }
    // Hydrate Bill To once per open so typing is not clobbered by parent re-renders.
    setBillingExpanded(true);
    setBillingName(booking?.billingName ?? '');
    setBillingCompany(booking?.billingCompany ?? '');
    setBillingEmail(booking?.billingEmail ?? '');
    setBillingPhone(booking?.billingPhone ?? '');
    setBillingAddress(booking?.billingAddress ?? '');
    setShowBillingInfo(Boolean(booking?.showBillingInfo));
    setInvoiceRemarks(booking?.invoiceRemarks ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot billing when modal opens
  }, [isOpen]);

  useEffect(() => {
    if (!selectedInvoice?.isVirtual) return;
    if (displayInvoices.some((row) => row.isVirtual)) return;
    setViewMode('list');
    setSelectedInvoice(null);
  }, [displayInvoices, selectedInvoice]);

  const busyId = (entry: InvoiceHistoryEntry, action: BusyAction) =>
    `${invoiceRowKey(entry)}:${action}`;

  const openPreview = (entry: InvoiceHistoryEntry) => {
    setSelectedInvoice(entry);
    setViewMode('preview');
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedInvoice(null);
  };

  const handleClose = () => {
    setViewMode('list');
    setSelectedInvoice(null);
    onClose();
  };

  const handleSaveBillingDetails = async () => {
    if (!onSaveBillingDetails) {
      toast.error('Unable to save billing details', {
        description: 'Save handler is not wired for this page.',
      });
      return;
    }
    if (billingSaving) return;
    setBillingSaving(true);
    try {
      await onSaveBillingDetails({
        billingName: billingName.trim(),
        billingCompany: billingCompany.trim(),
        billingEmail: billingEmail.trim(),
        billingPhone: billingPhone.trim(),
        billingAddress: billingAddress.trim(),
        showBillingInfo,
        invoiceRemarks: invoiceRemarks.trim(),
      });
      toast.success('Billing details saved', {
        description: 'Invoice Bill To will use these values on the next PDF / send.',
      });
    } catch (err) {
      toast.error('Failed to save billing details', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setBillingSaving(false);
    }
  };

  const downloadPdf = async (entry: InvoiceHistoryEntry) => {
    if (!token) {
      toast.error('Not signed in. Please log in to download.');
      return;
    }
    if (busyKey) return;
    const key = busyId(entry, 'pdf');
    setBusyKey(key);
    try {
      const docType = documentTypeForInvoice(entry.status);
      const query = new URLSearchParams({ type: docType });
      // Virtual master: on-the-fly generator from booking (no invoice_id).
      if (!entry.isVirtual) {
        query.set('invoice_id', String(entry.id));
      }
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
      const fileBase = entry.isVirtual
        ? (bookingNo || booking?.bookingNo || String(bookingId))
        : entry.invoiceNo;
      a.download = `${docType === 'receipt' ? 'Receipt' : 'Invoice'}-${fileBase}.pdf`;
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
    const key = busyId(entry, 'excel');
    setBusyKey(key);
    try {
      const docType = documentTypeForInvoice(entry.status);
      const query = new URLSearchParams({ type: docType });
      if (!entry.isVirtual) {
        query.set('invoice_id', String(entry.id));
      }
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
      const fileBase = entry.isVirtual
        ? (bookingNo || booking?.bookingNo || String(bookingId))
        : entry.invoiceNo;
      a.download = `${docType === 'receipt' ? 'Receipt' : 'Invoice'}-${fileBase}.xlsx`;
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

  const issueContext = {
    status: booking?.status,
    paymentStatus: booking?.paymentStatus,
    mode,
  };

  const canIssue = (entry: InvoiceHistoryEntry) =>
    canIssueVirtualBookingInvoice(entry, issueContext);

  const isDraftRow = (entry: InvoiceHistoryEntry) =>
    Boolean(entry.isVirtual) || entry.status === 'Draft' || entry.status === 'Pending';

  /** Paid / Voided / settled rows never show Generate/Copy payment actions. */
  const showPaymentLinkActions = (entry: InvoiceHistoryEntry) => {
    if (entry.status === 'Paid' || entry.status === 'Voided' || entry.status === 'Refunded') {
      return false;
    }
    if (Number(entry.totalAmount) <= 0) {
      return false;
    }
    return (
      Boolean(entry.isVirtual)
      || entry.status === 'Draft'
      || entry.status === 'Pending'
      || entry.status === 'Sent'
      || entry.status === 'Unpaid'
    );
  };

  const generateLinkDisabledReason = (entry: InvoiceHistoryEntry): string | null => {
    if (!showPaymentLinkActions(entry)) {
      return 'Payment link actions are only available for unpaid invoices.';
    }
    if (entry.isVirtual || entry.status === 'Draft') {
      if (entry.isVirtual && !canIssue(entry)) {
        return virtualInvoiceSendTooltip(entry, issueContext) || VIRTUAL_SEND_TOOLTIP;
      }
      return null;
    }
    return null;
  };

  const sendTitle = (entry: InvoiceHistoryEntry) => {
    if (entry.status === 'Voided') return 'Cannot send a voided invoice.';
    if (entry.isVirtual) return virtualInvoiceSendTooltip(entry, issueContext);
    return 'Send to Customer';
  };

  const rememberPaymentLink = (entry: InvoiceHistoryEntry, url: string | null) => {
    const key = invoiceRowKey(entry);
    const trimmed = typeof url === 'string' ? url.trim() : '';
    setLocalPaymentLinks((prev) => ({
      ...prev,
      [key]: trimmed || null,
    }));
  };

  const generatePaymentLink = async (entry: InvoiceHistoryEntry) => {
    const blocked = generateLinkDisabledReason(entry);
    if (blocked) {
      toast.error(blocked);
      return;
    }
    if (!token) {
      toast.error('Not signed in. Please log in to generate a payment link.');
      return;
    }
    if (busyKey) return;
    const key = busyId(entry, 'generate-link');
    setBusyKey(key);
    try {
      // Virtual / Draft booking-fee row: persist invoice + mint link without emailing.
      // Never navigate the staff browser to the Adyen URL — mirror Payment History (Copy only).
      if (entry.isVirtual || entry.status === 'Draft') {
        const response = await fetch(
          `${baseUrl}/bookings/${bookingId}/send-invoice`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ send_email: false }),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body.message || `HTTP ${response.status}`);
        }
        const invoiceNo = typeof body.data?.invoice_no === 'string'
          ? body.data.invoice_no
          : entry.invoiceNo;
        const url = typeof body.data?.payment_link_url === 'string'
          ? body.data.payment_link_url.trim()
          : '';
        rememberPaymentLink(entry, url || null);
        toast.success(
          url ? 'Invoice created and payment link generated' : 'Invoice created',
          { description: invoiceNo },
        );
        onInvoiceSent?.({
          invoice_no: invoiceNo,
          data: {
            ...(body.data ?? {}),
            payment_link_url: url || null,
            status: 'Sent',
          },
        });
        return;
      }

      const response = await fetch(
        `${baseUrl}/invoices/${entry.id}/payment-link`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ send_email: false }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      const url = typeof body.data?.payment_link_url === 'string'
        ? body.data.payment_link_url.trim()
        : '';
      if (!url) {
        throw new Error('No payment link URL was returned.');
      }
      rememberPaymentLink(entry, url);
      toast.success(
        body.data?.reused ? 'Payment link ready' : 'Payment link generated',
        { description: entry.invoiceNo },
      );
      onInvoiceSent?.({
        invoice_no: entry.invoiceNo,
        data: {
          payment_link_url: url,
          payment_id: body.data?.payment_id ?? null,
          reused: Boolean(body.data?.reused),
          status: entry.status === 'Sent' ? 'Sent' : entry.status,
        },
      });
    } catch (error) {
      toast.error('Failed to generate payment link', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const copyPaymentLink = async (entry: InvoiceHistoryEntry) => {
    const url = typeof entry.paymentLinkUrl === 'string'
      ? entry.paymentLinkUrl.trim()
      : '';
    if (!url) {
      toast.error('No active payment link to copy. Generate one first.');
      return;
    }
    const copied = await copyTextToClipboard(url);
    if (!copied) {
      toast.error('Clipboard copy failed', { description: url });
      return;
    }
    toast.success('Payment link copied', { description: entry.invoiceNo });
  };

  const hasActivePaymentLink = (entry: InvoiceHistoryEntry) => {
    const url = typeof entry.paymentLinkUrl === 'string' ? entry.paymentLinkUrl.trim() : '';
    return Boolean(entry.hasActivePaymentLink) || url !== '';
  };

  const revokePaymentLink = async (entry: InvoiceHistoryEntry) => {
    if (entry.isVirtual || !entry.id || entry.id <= 0) {
      toast.error('Cannot revoke a draft invoice payment link.');
      return;
    }
    if (!hasActivePaymentLink(entry)) {
      toast.error('No active payment link to revoke.');
      return;
    }
    if (!token) {
      toast.error('Not signed in. Please log in to revoke a payment link.');
      return;
    }

    const isFnB = entry.invoiceType === 'pos_fnb';
    const confirmed = window.confirm(
      isFnB
        ? 'Revoke this payment link and void the F&B invoice? You can generate a new invoice/link afterward.'
        : 'Revoke (expire) this payment link? The invoice will stay unpaid so you can generate a new link.',
    );
    if (!confirmed) return;

    if (busyKey) return;
    const key = busyId(entry, 'revoke-link');
    setBusyKey(key);
    try {
      const response = await fetch(
        `${baseUrl}/invoices/${entry.id}/revoke-payment-link`,
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
      toast.success(
        body.data?.voided
          ? 'Payment link revoked and invoice voided'
          : 'Payment link revoked',
        { description: entry.invoiceNo },
      );
      rememberPaymentLink(entry, null);
      onInvoiceSent?.({
        invoice_no: entry.invoiceNo,
        data: {
          ...(body.data ?? {}),
          payment_link_url: null,
          has_active_payment_link: false,
          revoked: true,
        },
      });
    } catch (error) {
      toast.error('Failed to revoke payment link', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const contactEmail = typeof booking?.contactEmail === 'string'
    ? booking.contactEmail.trim()
    : '';

  const buildSendEmailPayload = () => {
    const additional = additionalRecipientEmail.trim();
    return {
      ...(additional ? { additional_email: additional } : {}),
      ...(ccContactEmail ? { cc_contact: true } : {}),
    };
  };

  const sendRecipientHint = () => {
    const parts: string[] = ['primary account / guest'];
    if (additionalRecipientEmail.trim()) {
      parts.push(additionalRecipientEmail.trim());
    }
    if (ccContactEmail && contactEmail) {
      parts.push(`CC ${contactEmail}`);
    }
    return parts.join(' + ');
  };

  const sendToCustomer = async (entry: InvoiceHistoryEntry) => {
    const issuing = canIssue(entry);
    if (entry.isVirtual && !issuing) {
      toast.error(virtualInvoiceSendTooltip(entry, issueContext) || VIRTUAL_SEND_TOOLTIP);
      return;
    }
    if (!issuing && !token) {
      toast.error('Not signed in. Please log in to send.');
      return;
    }
    if (entry.status === 'Voided') {
      toast.error('Cannot send a voided invoice.');
      return;
    }
    if (ccContactEmail && !contactEmail) {
      toast.error('No booking contact email to CC. Add a contact email on the booking first.');
      return;
    }
    if (busyKey) return;
    const key = busyId(entry, 'send');
    setBusyKey(key);
    const emailOpts = buildSendEmailPayload();
    try {
      if (issuing) {
        if (onSendInvoice) {
          const result = await onSendInvoice(emailOpts);
          const data = (result && typeof result === 'object')
            ? result as Record<string, unknown>
            : {};
          const invoiceNo = typeof data.invoice_no === 'string'
            ? data.invoice_no
            : (bookingNo || booking?.bookingNo || 'Invoice');
          toast.success('Invoice emailed', {
            description: `Sent to ${sendRecipientHint()}`,
          });
          onInvoiceSent?.({ invoice_no: invoiceNo, data });
          return;
        }
        if (!token) {
          toast.error('Not signed in. Please log in to send.');
          return;
        }
        const response = await fetch(
          `${baseUrl}/bookings/${bookingId}/send-invoice`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailOpts),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) {
          throw new Error(body.message || `HTTP ${response.status}`);
        }
        const invoiceNo = body.data?.invoice_no ?? '';
        const paymentId = body.data?.payment_id ?? null;
        const paymentLinkReason = body.data?.payment_link_reason ?? null;
        toast.success('Invoice + payment link sent!', {
          description: paymentId
            ? `${invoiceNo} emailed to ${sendRecipientHint()} (PDF + Pay Now).`
            : `${invoiceNo} emailed to ${sendRecipientHint()}.${paymentLinkReason ? ` Reason: ${paymentLinkReason}` : ''}`,
        });
        onInvoiceSent?.({
          invoice_no: invoiceNo,
          data: (body.data ?? {}) as Record<string, unknown>,
        });
        return;
      }
      if (!token) {
        toast.error('Not signed in. Please log in to send.');
        return;
      }
      const response = await fetch(
        `${baseUrl}/bookings/${bookingId}/invoices/${entry.id}/resend`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...emailOpts,
            ...(isReceiptMode || entry.status === 'Paid' ? { as_receipt: true } : {}),
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.message || `HTTP ${response.status}`);
      }
      toast.success(isReceiptMode || entry.status === 'Paid' ? 'Receipt emailed' : 'Invoice emailed', {
        description: `${entry.invoiceNo} → ${sendRecipientHint()}`,
      });
      onInvoiceSent?.({
        invoice_no: entry.invoiceNo,
        data: (body.data ?? {}) as Record<string, unknown>,
      });
    } catch (error) {
      toast.error('Failed to send email', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const previewBooking = booking ?? {
    bookingNo: bookingNo ?? '',
    accountNo: '',
    dateTime: '',
    flightNo: '',
  };
  const documentLabel = selectedInvoice
    ? (documentTypeForInvoice(selectedInvoice.status) === 'receipt' ? 'Receipt' : 'Invoice')
    : 'Invoice';
  const vipSummary = buildVipPassengerSummary(previewBooking.passengers);
  const previewBusy = selectedInvoice
    ? (
      busyKey === busyId(selectedInvoice, 'pdf')
      || busyKey === busyId(selectedInvoice, 'excel')
      || busyKey === busyId(selectedInvoice, 'send')
    )
    : false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        className="!max-w-[calc(100%-2rem)] sm:!max-w-5xl w-[95vw] max-h-[85vh] overflow-y-auto"
        data-testid="invoice-action-dialog"
      >
        {viewMode === 'list' || !selectedInvoice ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-700" />
                {listTitle}
                <span className="text-sm font-normal text-gray-500">{listTitleZh}</span>
              </DialogTitle>
              <DialogDescription>
                {bookingNo
                  ? `Choose a ${listNoun} for booking ${bookingNo}. Preview, download PDF/Excel, or email it to the customer.`
                  : `Choose a ${listNoun} to preview, download, or email to the customer.`}
              </DialogDescription>
            </DialogHeader>

            <div
              className="rounded-lg border border-gray-200 bg-slate-50/80 mb-4"
              data-testid="invoice-billing-details"
            >
              <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-4 py-3 ${billingExpanded ? 'border-b border-gray-200' : ''}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Invoice Billing Details (發票抬頭)
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Shown on the invoice PDF Bill To. Leave blank to keep guest / account defaults.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-expanded={billingExpanded}
                    onClick={() => setBillingExpanded((open) => !open)}
                    data-testid="invoice-billing-details-toggle"
                  >
                    {billingExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    <span className="ml-1.5">{billingExpanded ? 'Collapse' : 'Expand'}</span>
                  </Button>
                </div>
              </div>
              {billingExpanded ? (
                <div className="px-4 pb-4 pt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">Bill-to name</label>
                      <input
                        type="text"
                        data-testid="input-billing-name"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        placeholder="Name on invoice"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">Company</label>
                      <input
                        type="text"
                        data-testid="input-billing-company"
                        value={billingCompany}
                        onChange={(e) => setBillingCompany(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        placeholder="Company / organisation"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">Email</label>
                      <input
                        type="email"
                        data-testid="input-billing-email"
                        value={billingEmail}
                        onChange={(e) => setBillingEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        placeholder="billing@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">Phone</label>
                      <input
                        type="text"
                        data-testid="input-billing-phone"
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        placeholder="+852 0000 0000"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1.5">Address</label>
                      <textarea
                        data-testid="input-billing-address"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-h-[72px]"
                        placeholder="Billing address"
                        rows={3}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1.5">
                        Additional Recipient Email
                      </label>
                      <input
                        type="email"
                        data-testid="input-additional-recipient-email"
                        value={additionalRecipientEmail}
                        onChange={(e) => setAdditionalRecipientEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        placeholder="extra@example.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional CC beyond the primary account / guest recipient.
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        className="flex items-start gap-3 cursor-pointer select-none"
                        data-testid="cc-contact-email-toggle"
                      >
                        <Switch
                          checked={ccContactEmail}
                          onCheckedChange={setCcContactEmail}
                          disabled={!contactEmail}
                          aria-label="CC booking contact email"
                        />
                        <span className="text-sm text-gray-700">
                          CC Booking Contact Email
                          {contactEmail ? (
                            <span className="block text-xs text-gray-500 mt-0.5 font-mono">
                              ({contactEmail})
                            </span>
                          ) : (
                            <span className="block text-xs text-amber-700 mt-0.5">
                              No contact email on this booking
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label
                      className="flex items-center gap-3 cursor-pointer select-none"
                      data-testid="show-billing-info-toggle"
                    >
                      <Switch
                        checked={showBillingInfo}
                        onCheckedChange={setShowBillingInfo}
                        aria-label="Show billing info on document"
                      />
                      <span className="text-sm text-gray-700">
                        Show billing info on document
                        <span className="text-gray-500"> (顯示發票抬頭)</span>
                      </span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={billingSaving || !onSaveBillingDetails}
                      onClick={() => void handleSaveBillingDetails()}
                      data-testid="save-billing-details"
                    >
                      {billingSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Billing Details
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div
              className="rounded-lg border border-gray-200 bg-slate-50/80 mb-4"
              data-testid="invoice-remarks-section"
            >
              <div className="px-4 py-3 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Invoice Remarks (發票備註)
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    These remarks will be printed explicitly on the invoice under &apos;Service Remarks&apos;.
                  </p>
                </div>
                <textarea
                  data-testid="input-invoice-remarks"
                  value={invoiceRemarks}
                  onChange={(e) => setInvoiceRemarks(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-h-[80px]"
                  placeholder="Customer-facing remarks for the invoice"
                  rows={3}
                />
              </div>
            </div>

            {displayInvoices.length === 0 ? (
              <div
                className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500"
                data-testid="invoice-action-empty"
              >
                {emptyCopy}
              </div>
            ) : (
              <ul className="space-y-3" data-testid="invoice-action-list">
                {displayInvoices.map((entry) => {
                  const rowKey = invoiceRowKey(entry);
                  const pay = paidLabel(entry.status);
                  const pdfBusy = busyKey === busyId(entry, 'pdf');
                  const excelBusy = busyKey === busyId(entry, 'excel');
                  const generateLinkBusy = busyKey === busyId(entry, 'generate-link');
                  const revokeLinkBusy = busyKey === busyId(entry, 'revoke-link');
                  const sendBusy = busyKey === busyId(entry, 'send');
                  const rowBusy = pdfBusy || excelBusy || generateLinkBusy || revokeLinkBusy || sendBusy;
                  const issuing = canIssue(entry);
                  const showLinkActions = showPaymentLinkActions(entry);
                  const activeLink = hasActivePaymentLink(entry);
                  const generateBlocked = generateLinkDisabledReason(entry);
                  const generateDisabled = rowBusy || Boolean(generateBlocked);
                  const copyUrl = typeof entry.paymentLinkUrl === 'string'
                    ? entry.paymentLinkUrl.trim()
                    : '';
                  const canCopyPaymentLink = copyUrl !== '';
                  const sendDisabled = rowBusy || entry.status === 'Voided' || (Boolean(entry.isVirtual) && !issuing);
                  return (
                    <li
                      key={rowKey}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
                      data-testid={`invoice-action-row-${rowKey}`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-semibold text-gray-900 text-sm ${entry.isVirtual ? '' : 'font-mono'}`}>
                              {entry.invoiceNo}
                            </p>
                            <Badge variant="outline" className={getInvoiceTypeBadgeClass(entry.invoiceType)}>
                              {formatInvoiceTypeLabel(entry.invoiceType)}
                            </Badge>
                            <Badge variant="outline" className={pay.className}>
                              {pay.label}
                            </Badge>
                            {entry.isVirtual ? (
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                Draft
                              </Badge>
                            ) : null}
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
                        <div className="flex flex-col gap-2 sm:items-end">
                          <div
                            className="flex flex-wrap items-center gap-1.5"
                            data-testid={`invoice-action-doc-group-${rowKey}`}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={rowBusy}
                              onClick={() => openPreview(entry)}
                              data-testid={`invoice-action-preview-${rowKey}`}
                              title="Preview"
                            >
                              <Eye className="w-4 h-4 mr-1.5" />
                              Preview
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={rowBusy}
                              onClick={() => void downloadPdf(entry)}
                              data-testid={`invoice-action-pdf-${rowKey}`}
                              title={entry.isVirtual
                                ? 'Download PDF from current booking (on-the-fly)'
                                : 'Download PDF'}
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
                              data-testid={`invoice-action-excel-${rowKey}`}
                              title={entry.isVirtual
                                ? 'Download Excel from current booking (on-the-fly)'
                                : 'Download Excel'}
                            >
                              {excelBusy ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              ) : (
                                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                              )}
                              Excel
                            </Button>
                          </div>
                          <div
                            className="flex flex-wrap items-center gap-1.5"
                            data-testid={`invoice-action-pay-group-${rowKey}`}
                          >
                            {showLinkActions ? (
                              <>
                                {activeLink && !entry.isVirtual ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={rowBusy}
                                    onClick={() => void revokePaymentLink(entry)}
                                    data-testid={`invoice-action-revoke-link-${rowKey}`}
                                    title={entry.invoiceType === 'pos_fnb'
                                      ? 'Expire Adyen link and void this F&B invoice'
                                      : 'Expire Adyen link (invoice stays unpaid)'}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    {revokeLinkBusy ? (
                                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    ) : (
                                      <XOctagon className="w-4 h-4 mr-1.5" />
                                    )}
                                    Revoke Link
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={generateDisabled}
                                    onClick={() => void generatePaymentLink(entry)}
                                    data-testid={`invoice-action-generate-link-${rowKey}`}
                                    title={generateBlocked ?? (isDraftRow(entry)
                                      ? 'Create invoice and generate payment link (no email)'
                                      : 'Generate Adyen payment link for this invoice')}
                                    className="border-amber-200 text-amber-900 hover:bg-amber-50"
                                  >
                                    {generateLinkBusy ? (
                                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    ) : (
                                      <Link2 className="w-4 h-4 mr-1.5" />
                                    )}
                                    Generate Link
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={rowBusy || !canCopyPaymentLink}
                                  onClick={() => void copyPaymentLink(entry)}
                                  data-testid={`invoice-action-copy-link-${rowKey}`}
                                  title={canCopyPaymentLink
                                    ? 'Copy existing payment link'
                                    : 'Generate a payment link first'}
                                  className="border-amber-200 text-amber-900 hover:bg-amber-50"
                                >
                                  <Copy className="w-4 h-4 mr-1.5" />
                                  Copy Link
                                </Button>
                              </>
                            ) : null}
                            <Button
                              type="button"
                              variant={issuing ? 'default' : 'outline'}
                              size="sm"
                              disabled={sendDisabled}
                              onClick={() => void sendToCustomer(entry)}
                              data-testid={`invoice-action-send-${rowKey}`}
                              title={sendTitle(entry)}
                              className={issuing
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'border-blue-200 text-blue-800 hover:bg-blue-50'}
                            >
                              {sendBusy ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4 mr-1.5" />
                              )}
                              {issuing ? 'Send Invoice & Payment Link' : 'Send'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <>
            <div
              className="sticky top-0 z-10 -mx-6 -mt-6 mb-4 border-b border-gray-200 bg-white px-6 py-3"
              data-testid="invoice-action-preview-header"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={backToList}
                  data-testid="invoice-action-back-to-list"
                  className="text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  {backLabel}
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm font-semibold text-gray-900 ${selectedInvoice.isVirtual ? '' : 'font-mono'}`}>
                    {selectedInvoice.invoiceNo}
                  </p>
                  <Badge variant="outline" className={getInvoiceTypeBadgeClass(selectedInvoice.invoiceType)}>
                    {formatInvoiceTypeLabel(selectedInvoice.invoiceType)}
                  </Badge>
                  <Badge variant="outline" className={paidLabel(selectedInvoice.status).className}>
                    {paidLabel(selectedInvoice.status).label}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogHeader className="sr-only">
              <DialogTitle>{documentLabel} preview — {selectedInvoice.invoiceNo}</DialogTitle>
              <DialogDescription>
                {selectedInvoice.isVirtual
                  ? `Preview of current booking fee for ${previewBooking.bookingNo || bookingNo}`
                  : `Preview of persisted invoice ${selectedInvoice.invoiceNo}`}
              </DialogDescription>
            </DialogHeader>

            <div className="w-full overflow-x-auto" data-testid="invoice-action-preview">
              <InvoiceDocumentPreview
                bookingNo={previewBooking.bookingNo || bookingNo || ''}
                accountNo={previewBooking.accountNo}
                dateTime={previewBooking.dateTime}
                flightNo={previewBooking.flightNo}
                flightOrigin={previewBooking.flightOrigin}
                flightDestination={previewBooking.flightDestination}
                issueDate={selectedInvoice.sentAt ?? selectedInvoice.createdAt}
                invoiceType={selectedInvoice.invoiceType}
                invoiceNo={selectedInvoice.invoiceNo}
                totalAmount={selectedInvoice.totalAmount}
                priceBreakdown={selectedInvoice.priceBreakdown}
                vipPassengerSummary={vipSummary}
                serviceRemarks={
                  selectedInvoice.invoiceType === 'pos_fnb'
                    ? (invoiceRemarks.trim() || 'Food & Beverage')
                    : (invoiceRemarks.trim() || null)
                }
                showBillingInfo={showBillingInfo}
                billingData={{
                  name: billingName.trim() || undefined,
                  company: billingCompany.trim() || undefined,
                  address: billingAddress.trim() || undefined,
                  phone: billingPhone.trim() || undefined,
                  email: billingEmail.trim() || undefined,
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t sticky bottom-0 bg-white">
              <Button
                type="button"
                variant="outline"
                disabled={previewBusy}
                onClick={() => void downloadPdf(selectedInvoice)}
                data-testid={`invoice-action-preview-pdf-${invoiceRowKey(selectedInvoice)}`}
              >
                {busyKey === busyId(selectedInvoice, 'pdf') ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={previewBusy}
                onClick={() => void downloadExcel(selectedInvoice)}
                data-testid={`invoice-action-preview-excel-${invoiceRowKey(selectedInvoice)}`}
              >
                {busyKey === busyId(selectedInvoice, 'excel') ? (
                  <Loader2 className="w-4 h-4 mr-2" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Download Excel
              </Button>
              <Button
                type="button"
                variant={canIssue(selectedInvoice) ? 'default' : 'outline'}
                disabled={previewBusy || selectedInvoice.status === 'Voided' || (Boolean(selectedInvoice.isVirtual) && !canIssue(selectedInvoice))}
                onClick={() => void sendToCustomer(selectedInvoice)}
                data-testid={`invoice-action-preview-send-${invoiceRowKey(selectedInvoice)}`}
                title={sendTitle(selectedInvoice)}
                className={canIssue(selectedInvoice)
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'border-blue-200 text-blue-800 hover:bg-blue-50'}
              >
                {busyKey === busyId(selectedInvoice, 'send') ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {canIssue(selectedInvoice)
                  ? 'Send Invoice & Payment Link'
                  : (isReceiptMode ? 'Send Receipt' : 'Send Invoice')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
