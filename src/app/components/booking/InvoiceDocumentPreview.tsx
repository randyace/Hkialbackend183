import {
  formatDocumentDate,
  formatDocumentMoney,
  formatFlightDisplay,
  groupInvoiceBreakdownLines,
  type InvoiceBreakdownLine,
} from './invoiceDocumentModel';

export interface InvoiceDocumentBillingData {
  name?: string;
  company?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface InvoiceDocumentPreviewProps {
  bookingNo: string;
  accountNo?: string;
  dateTime?: string;
  flightNo?: string;
  flightOrigin?: string | null;
  flightDestination?: string | null;
  issueDate?: string | null;
  invoiceType?: string;
  invoiceNo?: string;
  totalAmount: number;
  priceBreakdown?: InvoiceBreakdownLine[];
  vipPassengerSummary?: string | null;
  serviceRemarks?: string | null;
  /** When true, render the Bill To block from `billingData` (no placeholders). */
  showBillingInfo?: boolean;
  billingData?: InvoiceDocumentBillingData | null;
  'data-testid'?: string;
}

/**
 * Official Service Summary / Invoice document preview.
 * Layout mirrors `resources/views/pdf/booking_document.blade.php`.
 */
export function InvoiceDocumentPreview({
  bookingNo,
  accountNo,
  dateTime,
  flightNo,
  flightOrigin,
  flightDestination,
  issueDate,
  invoiceType = 'booking',
  totalAmount,
  priceBreakdown,
  vipPassengerSummary,
  serviceRemarks,
  showBillingInfo = false,
  billingData = null,
  'data-testid': dataTestId = 'invoice-document-preview',
}: InvoiceDocumentPreviewProps) {
  const groups = groupInvoiceBreakdownLines(priceBreakdown, {
    vipSummary: vipPassengerSummary,
    invoiceType,
  });
  const titlePrefix = invoiceType === 'pos_fnb'
    ? 'F&B Invoice of Booking no. :'
    : 'Service Summary of Booking no. :';

  return (
    <div
      className="max-w-4xl mx-auto bg-white p-8 shadow-sm border border-black text-black"
      data-testid={dataTestId}
      style={{ fontFamily: 'DejaVu Sans, Arial, Helvetica, sans-serif' }}
    >
      <table className="w-full mb-2 border-collapse">
        <tbody>
          <tr>
            <td className="align-top w-[42%] p-0">
              <img
                src="/images/invoice-logo.png"
                alt="HKIA VIP LOUNGE"
                className="h-12 w-auto"
              />
            </td>
            <td className="align-top w-[58%] p-0">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr>
                    <td className="py-0.5 pr-2 text-right">Issue Date:</td>
                    <td className="py-0.5 text-right">{formatDocumentDate(issueDate)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 pr-2 text-right">Customer ID:</td>
                    <td className="py-0.5 text-right">{accountNo || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 pr-2 text-right">Booking Date:</td>
                    <td className="py-0.5 text-right">{formatDocumentDate(dateTime)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 pr-2 text-right">Flight No.</td>
                    <td className="py-0.5 text-right">
                      {formatFlightDisplay({ flightNo, flightOrigin, flightDestination })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {showBillingInfo ? (
        <div className="mt-8 mb-6 text-sm" data-testid="invoice-document-bill-to">
          <h3 className="font-bold text-gray-600 mb-2">Bill To:</h3>
          {billingData?.company ? (
            <div className="font-semibold">{billingData.company}</div>
          ) : null}
          {billingData?.name ? (
            <div>Attn: {billingData.name}</div>
          ) : null}
          {billingData?.address ? (
            <div className="whitespace-pre-wrap">{billingData.address}</div>
          ) : null}
          {billingData?.phone ? (
            <div>Tel: {billingData.phone}</div>
          ) : null}
          {billingData?.email ? (
            <div>Email: {billingData.email}</div>
          ) : null}
        </div>
      ) : null}

      <table className="w-full mb-3 border-collapse">
        <tbody>
          <tr>
            <td className="p-0 text-left text-[1.15rem] font-bold align-middle">
              {titlePrefix}
            </td>
            <td className="p-0 text-right text-[1.15rem] font-bold align-middle">
              {bookingNo}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse table-fixed text-[12px]">
        <thead>
          <tr>
            <th className="w-[65%] pb-1.5 text-center font-bold border-b border-black">
              Description
            </th>
            <th className="w-[15%] pb-1.5 text-center font-bold border-b border-black">
              Quantity
            </th>
            <th className="w-[20%] pb-1.5 text-right font-bold border-b border-black pr-3">
              Total (HKD)
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-500">
                No line items
              </td>
            </tr>
          ) : (
            groups.map((group) => (
              <GroupRows key={`${group.product}:${group.title}`} group={group} />
            ))
          )}

          {vipPassengerSummary ? (
            <tr>
              <td colSpan={3} className="pt-2 pb-1 pl-3 text-[12px]">
                {vipPassengerSummary}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="mt-8">
        <table className="w-full border-collapse table-fixed text-[12px] mb-1">
          <tbody>
            <tr>
              <td className="w-[65%]" />
              <td className="w-[15%] text-center font-bold">Total</td>
              <td className="w-[20%] text-right font-bold pr-3">
                {formatDocumentMoney(totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-black w-full" />

        <div className="w-full pt-2.5 pb-16">
          <span className="font-bold text-[12px]">Service Remarks</span>
          {serviceRemarks ? (
            <div className="mt-1 text-[12px] whitespace-pre-wrap">{serviceRemarks}</div>
          ) : (
            <div className="mt-1 min-h-[1.5rem]" aria-hidden />
          )}
        </div>

        <div className="border-t border-black w-full mb-2.5" />

        <div className="w-full text-center text-[10px] pb-2">
          Thank you !<br />
          Phone: +852 2188 6088&nbsp;&nbsp;&nbsp;E-mail: hkiavip@hkairport.com
        </div>
      </div>
    </div>
  );
}

function GroupRows({
  group,
}: {
  group: { title: string; lines: Array<{ description: string; qty: number; total: number; detail?: string | null }> };
}) {
  return (
    <>
      <tr>
        <td colSpan={3} className="pt-2.5 pb-1">
          <u className="font-bold">{group.title}</u>
        </td>
      </tr>
      {group.lines.map((line, idx) => (
        <tr key={`${group.title}:${line.description}:${idx}`}>
          <td className="py-1.5 pl-3 align-top">
            <div>{line.description}</div>
            {line.detail ? (
              <div className="text-[11px] text-gray-700 mt-0.5">{line.detail}</div>
            ) : null}
          </td>
          <td className="py-1.5 text-center align-top whitespace-nowrap">
            {line.qty}
          </td>
          <td className="py-1.5 text-right align-top whitespace-nowrap pr-3">
            {formatDocumentMoney(line.total)}
          </td>
        </tr>
      ))}
    </>
  );
}
