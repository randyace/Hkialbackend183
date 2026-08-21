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
} from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

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

export interface POSCheckoutProps {
  bookingNo?: string;
  bookingData?: BookingData;
  orderItems?: OrderItem[];
  fnbSubtotal?: number;
  guestEmail?: string;
  isWalkIn?: boolean;
  orderPaymentStatus?: string;
  paymentLinkUrl?: string | null;
  isRefreshingPaymentStatus?: boolean;
  onBack?: () => void;
  onComplete?: (paymentData: { method: string; total: number }) => void | Promise<void>;
  onSendPaymentEmail?: (email: string) => void | Promise<void>;
  onRefreshPaymentStatus?: () => void | Promise<void>;
}

function paymentStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function POSCheckout({
  bookingNo: bookingNoProp,
  bookingData: bookingDataProp,
  orderItems: orderItemsProp,
  fnbSubtotal: fnbSubtotalProp,
  guestEmail: guestEmailProp = '',
  isWalkIn = false,
  orderPaymentStatus = 'Unpaid',
  paymentLinkUrl = null,
  isRefreshingPaymentStatus = false,
  onBack = () => {},
  onComplete,
  onSendPaymentEmail,
  onRefreshPaymentStatus,
}: POSCheckoutProps = {}) {
  const [paymentEmail, setPaymentEmail] = useState(guestEmailProp);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingPaymentEmail, setIsSendingPaymentEmail] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
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
    if (!isQrOpen || !paymentLinkUrl) {
      return;
    }

    let cancelled = false;
    setIsQrLoading(true);
    setQrError(null);
    setQrDataUrl(null);

    void (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const dataUrl = await QRCode.toDataURL(paymentLinkUrl, {
          width: 256,
          margin: 2,
          color: { dark: '#0f2942', light: '#ffffff' },
        });
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setQrError('Could not generate QR code.');
        }
      } finally {
        if (!cancelled) {
          setIsQrLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isQrOpen, paymentLinkUrl]);

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
  const serviceCharge = fnbSubtotal * 0.1;
  const totalAmount = bookingData.loungeAccess + fnbSubtotal;
  const requiresPayment = fnbSubtotal > 0;
  const hasPaymentLink = Boolean(paymentLinkUrl?.trim());

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

  const handleRefreshPaymentStatus = async () => {
    if (!onRefreshPaymentStatus || isRefreshingPaymentStatus) {
      return;
    }
    await Promise.resolve(onRefreshPaymentStatus());
  };

  const handleCopyPaymentLink = async () => {
    if (!paymentLinkUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(paymentLinkUrl);
      setCopyFeedback('copied');
    } catch {
      setCopyFeedback('failed');
    }

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
          Total: HKD {totalAmount.toFixed(2)}
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
                  Email the customer an F&amp;B invoice and Adyen payment link before checkout.
                </p>
              </div>
              {requiresPayment ? (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={paymentStatusBadgeClass(orderPaymentStatus)}
                    data-testid="pos-payment-status-badge"
                  >
                    {orderPaymentStatus}
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
              <p className="text-sm text-gray-500">
                No F&amp;B charges on this order. You can complete checkout without sending a payment link.
              </p>
            ) : isWalkIn ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Walk-in sessions cannot send a booking-linked payment link from this screen. Collect payment before checkout.
              </p>
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
                <Button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                    </>
                  )}
                </Button>

                {hasPaymentLink && paymentLinkUrl ? (
                  <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Label htmlFor="payment-link-url" className="text-sm">
                      Payment link
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
                      <div className="flex gap-2 shrink-0">
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
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Share this link or QR if the guest has not received the email yet.
                    </p>
                  </div>
                ) : null}
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
                {requiresPayment ? (
                  <div className="flex justify-between items-center text-sm mt-2 gap-2">
                    <span className="text-gray-600">Payment Status</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={paymentStatusBadgeClass(orderPaymentStatus)}>
                        {orderPaymentStatus}
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
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold text-blue-600">HKD {totalAmount.toFixed(2)}</span>
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

      {isQrOpen && paymentLinkUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pos-payment-qr-title"
          data-testid="pos-payment-qr-dialog"
          onClick={() => setIsQrOpen(false)}
        >
          <Card
            className="w-full max-w-sm p-6 space-y-4 bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h3 id="pos-payment-qr-title" className="text-lg font-semibold">
                Scan to pay
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Guest can scan this QR code with their phone camera.
              </p>
            </div>

            <div className="flex min-h-[256px] items-center justify-center rounded-lg border border-gray-200 bg-white p-4">
              {isQrLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              ) : qrError ? (
                <p className="text-sm text-red-600 text-center">{qrError}</p>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Payment link QR code"
                  width={256}
                  height={256}
                  className="h-64 w-64"
                  data-testid="pos-payment-qr-image"
                />
              ) : null}
            </div>

            <Button
              type="button"
              className="w-full"
              variant="outline"
              onClick={() => setIsQrOpen(false)}
              data-testid="pos-payment-qr-close-button"
            >
              Close
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
