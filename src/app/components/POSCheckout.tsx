import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  ArrowLeft,
  Receipt,
  Printer,
  Mail,
  Check,
  Loader2,
  RefreshCw,
  Copy,
  QrCode,
  Download,
  XOctagon,
} from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PaymentQrModal } from '../../../../ui/PaymentQrModal';

interface OrderItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  lineTotal: number;
}

interface BookingData {
  bookingNo: string;
  guestName: string;
  accountNo: string;
  membershipTier: string;
  suiteName: string;
  checkInTime: string;
  checkOutTime: string;
  duration: string;
  loungeAccess: number;
  creditBalance: number;
}

export interface POSCheckoutPaymentHistoryItem {
  id: number;
  invoiceNo: string;
  invoiceType: string;
  totalAmount: number;
  status: string;
  createdAt: string | null;
}

export interface POSCheckoutProps {
  bookingNo?: string;
  bookingData?: BookingData;
  orderItems?: OrderItem[];
  fnbSubtotal?: number;
  paidFnbAmount?: number;
  outstandingFnbAmount?: number;
  guestEmail?: string;
  isWalkIn?: boolean;
  orderPaymentStatus?: string;
  paymentLinkUrl?: string | null;
  paymentLinkInvoiceId?: number | null;
  paymentHistory?: POSCheckoutPaymentHistoryItem[];
  isRefreshingPaymentStatus?: boolean;
  isRevokingPaymentLink?: boolean;
  onBack?: () => void;
  onComplete?: (paymentData: { method: string; total: number }) => void | Promise<void>;
  onGeneratePaymentLink?: () => void | Promise<void>;
  onSendPaymentEmail?: (email: string) => void | Promise<void>;
  /** Email a Paid F&B receipt to the Customer Email field. */
  onSendReceipt?: (email: string) => void | Promise<void>;
  onRefreshPaymentStatus?: () => void | Promise<void>;
  onRevokePaymentLink?: () => void | Promise<void>;
  onDownloadInvoice?: (entry: POSCheckoutPaymentHistoryItem) => void | Promise<void>;
}

function paymentStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Sent':
    case 'Pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Voided':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function invoiceTypeLabel(invoiceType: string): string {
  return invoiceType === 'pos_fnb' ? 'F&B' : 'Booking Fee';
}

function formatHistoryAmount(amount: number): string {
  return `HK$ ${amount.toLocaleString('en-HK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatHistoryDateTime(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const text = String(iso).trim();
  const date = /T/.test(text) || /(?:Z|[+-]\d{2}:?\d{2})$/.test(text)
    ? new Date(text)
    : new Date(text.includes(' ') ? text.replace(' ', 'T') + '+08:00' : text);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-HK', {
    timeZone: 'Asia/Hong_Kong',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Clipboard write with a synchronous fallback. `navigator.clipboard` often
 * rejects on non-secure origins, iframe permission policies, or denied
 * permissions — the textarea path still works from a user click.
 */
async function copyTextToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined'
    && window.isSecureContext
    && typeof navigator.clipboard?.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy path.
    }
  }

  try {
    const input = document.getElementById('payment-link-url');
    if (input instanceof HTMLInputElement) {
      input.focus();
      input.select();
      input.setSelectionRange(0, text.length);
      if (document.execCommand('copy')) {
        input.setSelectionRange(0, 0);
        input.blur();
        return true;
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function POSCheckout({
  bookingNo: bookingNoProp,
  bookingData: bookingDataProp,
  orderItems: orderItemsProp,
  fnbSubtotal: fnbSubtotalProp,
  paidFnbAmount: paidFnbAmountProp,
  outstandingFnbAmount: outstandingFnbAmountProp,
  guestEmail: guestEmailProp = '',
  isWalkIn: _isWalkIn = false,
  orderPaymentStatus = 'Unpaid',
  paymentLinkUrl = null,
  paymentLinkInvoiceId = null,
  paymentHistory = [],
  isRefreshingPaymentStatus = false,
  isRevokingPaymentLink = false,
  onBack = () => {},
  onComplete,
  onGeneratePaymentLink,
  onSendPaymentEmail,
  onSendReceipt,
  onRefreshPaymentStatus,
  onRevokePaymentLink,
  onDownloadInvoice,
}: POSCheckoutProps = {}) {
  const [paymentEmail, setPaymentEmail] = useState(guestEmailProp);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingPaymentEmail, setIsSendingPaymentEmail] = useState(false);
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);
  const [isGeneratingPaymentLink, setIsGeneratingPaymentLink] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPaymentEmail(guestEmailProp);
  }, [guestEmailProp]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!paymentLinkUrl) {
      setIsQrOpen(false);
      setCopyFeedback('idle');
    }
  }, [paymentLinkUrl]);

  const bookingData: BookingData = bookingDataProp ?? {
    bookingNo: bookingNoProp ?? '—',
    guestName: '—',
    accountNo: '—',
    membershipTier: 'Gold',
    suiteName: '—',
    checkInTime: '—',
    checkOutTime: '—',
    duration: '—',
    loungeAccess: 0,
    creditBalance: 0,
  };
  const orderItems: OrderItem[] = orderItemsProp ?? [];

  const fnbSubtotal = fnbSubtotalProp ?? orderItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  const paidFnbAmount = Math.max(0, paidFnbAmountProp ?? 0);
  const outstandingFnbAmount = Math.max(
    0,
    outstandingFnbAmountProp ?? Math.max(0, fnbSubtotal - paidFnbAmount),
  );
  const serviceCharge = fnbSubtotal * 0.1;
  const totalAmount = bookingData.loungeAccess + outstandingFnbAmount;
  const requiresPayment = outstandingFnbAmount > 0;
  const hasPaymentLink = requiresPayment && Boolean(paymentLinkUrl?.trim());
  const displayPaymentStatus = requiresPayment
    ? (hasPaymentLink ? 'Pending' : orderPaymentStatus)
    : 'Paid';

  const handleSendPaymentEmail = async () => {
    const email = paymentEmail.trim();
    if (!email) {
      return;
    }
    if (!onSendPaymentEmail || isSendingPaymentEmail) {
      return;
    }

    setIsSendingPaymentEmail(true);
    try {
      await Promise.resolve(onSendPaymentEmail(email));
    } finally {
      setIsSendingPaymentEmail(false);
    }
  };

  const handleSendReceipt = async () => {
    const email = paymentEmail.trim();
    if (!email) {
      return;
    }
    if (!onSendReceipt || isSendingReceipt) {
      return;
    }

    setIsSendingReceipt(true);
    try {
      await Promise.resolve(onSendReceipt(email));
    } finally {
      setIsSendingReceipt(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!onGeneratePaymentLink || isGeneratingPaymentLink) {
      return;
    }

    setIsGeneratingPaymentLink(true);
    try {
      await Promise.resolve(onGeneratePaymentLink());
    } finally {
      setIsGeneratingPaymentLink(false);
    }
  };

  const handleRefreshPaymentStatus = async () => {
    if (!onRefreshPaymentStatus || isRefreshingPaymentStatus) {
      return;
    }
    await Promise.resolve(onRefreshPaymentStatus());
  };

  const handleDownloadInvoice = async (entry: POSCheckoutPaymentHistoryItem) => {
    if (!onDownloadInvoice || downloadingInvoiceId != null) {
      return;
    }
    setDownloadingInvoiceId(entry.id);
    try {
      await Promise.resolve(onDownloadInvoice(entry));
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleCopyPaymentLink = async () => {
    if (!paymentLinkUrl) {
      return;
    }

    const copied = await copyTextToClipboard(paymentLinkUrl);
    setCopyFeedback(copied ? 'copied' : 'failed');

    if (copyResetTimerRef.current) {
      clearTimeout(copyResetTimerRef.current);
    }
    copyResetTimerRef.current = setTimeout(() => {
      setCopyFeedback('idle');
    }, 2000);
  };

  const handleCompleteCheckout = () => {
    if (onComplete) {
      setIsProcessing(true);
      void Promise.resolve(onComplete({ method: 'payment-link', total: totalAmount }))
        .then(() => {
          setIsComplete(true);
        })
        .catch(() => {
          // Parent shows error toast; keep checkout form open.
        })
        .finally(() => {
          setIsProcessing(false);
        });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 1500);
  };

  if (isComplete) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Floor Plan
            </Button>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h2 className="text-2xl mb-2">Checkout Complete!</h2>
            <p className="text-gray-600">The suite has been released successfully</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking Number:</span>
              <span className="font-semibold">{bookingData.bookingNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Guest Name:</span>
              <span className="font-semibold">{bookingData.guestName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">F&amp;B Total:</span>
              <span className="font-semibold">HKD {fnbSubtotal.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full" onClick={onBack}>
            Return to Floor Plan
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Floor Plan
          </Button>
          <div>
            <h1>Checkout - {bookingNoProp}</h1>
            <p className="text-gray-600">Collect F&amp;B payment before releasing the suite</p>
          </div>
        </div>
        <Badge className="bg-green-600 text-white text-lg px-4 py-2">
          Outstanding: HKD {totalAmount.toFixed(2)}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg mb-4">Guest Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Guest Name</Label>
                <p className="font-semibold">{bookingData.guestName}</p>
              </div>
              <div>
                <Label className="mb-2">Account Number</Label>
                <p className="font-semibold">{bookingData.accountNo}</p>
              </div>
              <div>
                <Label className="mb-2">Membership Tier</Label>
                <Badge variant="default">{bookingData.membershipTier}</Badge>
              </div>
              <div>
                <Label className="mb-2">Suite</Label>
                <p className="font-semibold">{bookingData.suiteName}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg mb-4">Time Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-2">Check-in Time</Label>
                <p className="font-semibold">{bookingData.checkInTime}</p>
              </div>
              <div>
                <Label className="mb-2">Check-out Time</Label>
                <p className="font-semibold">{bookingData.checkOutTime}</p>
              </div>
              <div>
                <Label className="mb-2">Duration</Label>
                <p className="font-semibold">{bookingData.duration}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg mb-4">Order Summary</h3>
            <div className="space-y-3">
              {orderItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">No food and beverage orders for this suite.</p>
              ) : (
                orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.unitPrice > 0 ? (
                        <p className="text-sm text-gray-500">
                          HK${item.unitPrice.toFixed(2)} x {item.quantity}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                      )}
                      {item.discount != null && item.discount > 0 ? (
                        <p className="text-xs text-green-600">Discount: HK${item.discount.toFixed(2)}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      {item.lineTotal > 0 ? (
                        <p className="font-semibold">HK${item.lineTotal.toFixed(2)}</p>
                      ) : (
                        <p className="font-semibold text-gray-400">Complimentary</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg">Payment Link</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Generate an Adyen payment link now, then optionally send it by email.
                </p>
              </div>
              {requiresPayment ? (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={paymentStatusBadgeClass(displayPaymentStatus)}
                    data-testid="pos-payment-status-badge"
                  >
                    {displayPaymentStatus}
                  </Badge>
                  {onRefreshPaymentStatus ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => void handleRefreshPaymentStatus()}
                      disabled={isRefreshingPaymentStatus}
                      aria-label="Refresh payment status"
                      data-testid="pos-refresh-payment-status-button"
                    >
                      {isRefreshingPaymentStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {!requiresPayment ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {fnbSubtotal > 0
                    ? 'F&B balance is fully paid. You can complete checkout.'
                    : 'No F&B charges on this order. You can complete checkout without sending a payment link.'}
                </p>
                {onSendReceipt && paymentHistory.some((row) => row.status === 'Paid') ? (
                  <>
                    <div>
                      <Label htmlFor="payment-email" className="mb-2">Customer Email</Label>
                      <Input
                        id="payment-email"
                        type="email"
                        placeholder="guest@example.com"
                        value={paymentEmail}
                        onChange={(event) => setPaymentEmail(event.target.value)}
                        data-testid="pos-receipt-email-input"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-700"
                      onClick={() => void handleSendReceipt()}
                      disabled={isSendingReceipt || !paymentEmail.trim()}
                      data-testid="pos-send-receipt-button"
                    >
                      {isSendingReceipt ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending receipt…
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Receipt
                        </>
                      )}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-email" className="mb-2">Customer Email</Label>
                  <Input
                    id="payment-email"
                    type="email"
                    placeholder="guest@example.com"
                    value={paymentEmail}
                    onChange={(event) => setPaymentEmail(event.target.value)}
                  />
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:flex-1 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => void handleGeneratePaymentLink()}
                    disabled={isGeneratingPaymentLink || !onGeneratePaymentLink}
                    data-testid="pos-generate-payment-link-button"
                  >
                    {isGeneratingPaymentLink ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating payment link…
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4 mr-2" />
                        Generate Payment Link
                        {outstandingFnbAmount > 0
                          ? ` (HKD ${outstandingFnbAmount.toFixed(2)})`
                          : ''}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    className="w-full sm:flex-1 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => void handleSendPaymentEmail()}
                    disabled={isSendingPaymentEmail || !paymentEmail.trim()}
                    data-testid="pos-send-payment-email-button"
                  >
                    {isSendingPaymentEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending payment email…
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Payment Email
                        {outstandingFnbAmount > 0
                          ? ` (HKD ${outstandingFnbAmount.toFixed(2)})`
                          : ''}
                      </>
                    )}
                  </Button>
                </div>

                {hasPaymentLink && paymentLinkUrl ? (
                  <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Label htmlFor="payment-link-url" className="text-sm">
                      Payment URL &amp; QR Code
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="payment-link-url"
                        type="text"
                        readOnly
                        value={paymentLinkUrl}
                        className="bg-white font-mono text-xs"
                        data-testid="pos-payment-link-url-input"
                      />
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleCopyPaymentLink()}
                          data-testid="pos-copy-payment-link-button"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copyFeedback === 'copied'
                            ? 'Copied'
                            : copyFeedback === 'failed'
                              ? 'Copy failed'
                              : 'Copy'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsQrOpen(true)}
                          data-testid="pos-show-qr-code-button"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Show QR Code
                        </Button>
                        {onRevokePaymentLink && paymentLinkInvoiceId ? (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => void onRevokePaymentLink()}
                            disabled={isRevokingPaymentLink}
                            data-testid="pos-revoke-payment-link-button"
                          >
                            {isRevokingPaymentLink ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <XOctagon className="w-4 h-4 mr-2" />
                            )}
                            Revoke Link
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Share this URL or QR code with the guest for immediate payment.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Outstanding balance HKD {outstandingFnbAmount.toFixed(2)}. Generate a payment link or send a payment email.
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6" data-testid="pos-payment-history-card">
            <div className="mb-4">
              <h3 className="text-lg">Payment History</h3>
              <p className="text-sm text-gray-500 mt-1">
                Invoice audit trail for this checkout session.
              </p>
            </div>

            {paymentHistory.length === 0 ? (
              <p className="text-sm text-gray-500" data-testid="pos-payment-history-empty">
                No payment history found.
              </p>
            ) : (
              <div className="space-y-3" data-testid="pos-payment-history-list">
                {paymentHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    data-testid={`pos-payment-history-row-${entry.id}`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm truncate">{entry.invoiceNo}</p>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {invoiceTypeLabel(entry.invoiceType)}
                        </Badge>
                        <Badge variant="outline" className={paymentStatusBadgeClass(entry.status)}>
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatHistoryDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <p className="font-semibold text-sm whitespace-nowrap">
                        {formatHistoryAmount(entry.totalAmount)}
                      </p>
                      {onDownloadInvoice ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => void handleDownloadInvoice(entry)}
                          disabled={downloadingInvoiceId === entry.id}
                          aria-label={`Download invoice ${entry.invoiceNo}`}
                          data-testid={`pos-payment-history-download-${entry.id}`}
                        >
                          {downloadingInvoiceId === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Lounge Access Fee</span>
                <span className="font-semibold">HKD {bookingData.loungeAccess.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2">Food &amp; Beverage</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>HKD {fnbSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Service Charge (10%)</span>
                  <span>HKD {serviceCharge.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">F&amp;B Total</span>
                  <span className="font-semibold">HKD {fnbSubtotal.toFixed(2)}</span>
                </div>
                {paidFnbAmount > 0 ? (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-semibold text-green-700" data-testid="pos-paid-fnb-amount">
                      - HKD {paidFnbAmount.toFixed(2)}
                    </span>
                  </div>
                ) : null}
                {requiresPayment ? (
                  <div className="flex justify-between items-center text-sm mt-2 gap-2">
                    <span className="text-gray-600">Payment Status</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={paymentStatusBadgeClass(displayPaymentStatus)}>
                        {displayPaymentStatus}
                      </Badge>
                      {onRefreshPaymentStatus ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => void handleRefreshPaymentStatus()}
                          disabled={isRefreshingPaymentStatus}
                          aria-label="Refresh payment status"
                          data-testid="pos-refresh-payment-status-summary-button"
                        >
                          {isRefreshingPaymentStatus ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Outstanding Balance</span>
                  <span
                    className="font-bold text-blue-600"
                    data-testid="pos-outstanding-fnb-amount"
                  >
                    HKD {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCompleteCheckout}
                disabled={isProcessing}
                data-testid="pos-complete-checkout-button"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" />
                    Complete Checkout
                  </>
                )}
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={onBack}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-gray-50">
            <h4 className="text-sm mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Printer className="w-3 h-3 mr-2" />
                Print Pre-bill
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <PaymentQrModal
        open={isQrOpen}
        paymentUrl={paymentLinkUrl}
        onClose={() => setIsQrOpen(false)}
        testIdPrefix="pos-payment-qr"
        titleId="pos-payment-qr-title"
      />
    </div>
  );
}
