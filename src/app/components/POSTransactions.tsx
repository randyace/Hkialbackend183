import { Fragment, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, ChevronDown, ChevronRight, Clock, Pencil } from 'lucide-react';
import { StringDatePicker } from '../../../../ui/CustomDatePicker';

export interface PosTransactionGuestRow {
  name: string;
  age: string | null;
  dateOfBirth: string | null;
  allergies: Array<{ allergen?: string; severity?: string | null; notes?: string | null } | string>;
  dietaryRestrictions: Array<{ requirement?: string; notes?: string | null } | string>;
  isMainMember: boolean;
  isSpouse: boolean;
}

export interface PosTransactionItemRow {
  id: number;
  itemName: string;
  itemNameZh: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  remarks: string | null;
  kitchenStatus: string;
  orderedAt: string | null;
  displayTime: string | null;
  isUnfiredPreorder: boolean;
  cancelledAt: string | null;
}

export interface PosTransactionOrderRow {
  id: number;
  suiteName: string | null;
  fnbSubtotal: number;
  items: PosTransactionItemRow[];
}

export interface PosTransactionBookingRow {
  id: number;
  createdAt: string;
  bookingRef: string;
  mainGuest: string;
  totalSuites: number;
  totalOrders: number;
  fnbSubtotal: number;
  guests: PosTransactionGuestRow[];
  posOrders: PosTransactionOrderRow[];
}

export interface PosTransactionsViewProps {
  transactions: PosTransactionBookingRow[];
  startDate: string;
  endDate: string;
  searchQuery: string;
  isLoading?: boolean;
  totalCount?: number;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  onSearchQueryChange?: (value: string) => void;
  onFilter?: () => void;
}

function formatDateTime(value: string): string {
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function computeAgeFromDateOfBirth(dateOfBirth: string): number | null {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function formatGuestAge(guest: PosTransactionGuestRow): string {
  const numericAge = guest.dateOfBirth ? computeAgeFromDateOfBirth(guest.dateOfBirth) : null;

  if (numericAge !== null) {
    return String(numericAge);
  }

  return guest.age ?? '—';
}

function resolveAllergyLabel(
  allergy: { allergen?: string; severity?: string | null; notes?: string | null } | string,
): string {
  if (typeof allergy === 'string') {
    return allergy;
  }

  const label = allergy.allergen?.trim();
  if (!label) {
    return '—';
  }

  return allergy.severity ? `${label} (${allergy.severity})` : label;
}

function resolveDietaryLabel(
  dietary: { requirement?: string; notes?: string | null } | string,
): string {
  if (typeof dietary === 'string') {
    return dietary;
  }

  return dietary.requirement?.trim() || '—';
}

function getKitchenStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'Preparing':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'Served':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'On Hold':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'Cancelled':
      return 'bg-gray-100 text-gray-600 border border-gray-200';
    case 'Unserved':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
}

function formatPosItemUnitPrice(unitPrice: number): string {
  if (unitPrice <= 0) {
    return 'Complimentary';
  }

  return `HK$ ${unitPrice.toFixed(2)}`;
}

function formatPosItemLineTotal(lineTotal: number): string {
  if (lineTotal <= 0) {
    return 'Complimentary';
  }

  return `HK$ ${lineTotal.toFixed(2)}`;
}

function formatPosOrderSubtotal(subtotal: number): string {
  if (subtotal <= 0) {
    return 'Complimentary';
  }

  return `HK$ ${subtotal.toFixed(2)}`;
}

function toggleExpandedRow(expandedRows: number[], bookingId: number): number[] {
  return expandedRows.includes(bookingId)
    ? expandedRows.filter((id) => id !== bookingId)
    : [...expandedRows, bookingId];
}

function ExpandedBookingDetails({ booking }: { booking: PosTransactionBookingRow }) {
  return (
    <div className="px-6 py-5 space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Guest Information & Dietary
        </h3>

        {booking.guests.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No guest information recorded for this booking.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {booking.guests.map((guest, index) => {
              const allergies = guest.allergies.filter((entry) => resolveAllergyLabel(entry) !== '—');
              const dietary = guest.dietaryRestrictions.filter((entry) => resolveDietaryLabel(entry) !== '—');
              const hasDietaryNeeds = allergies.length > 0 || dietary.length > 0;

              return (
                <div
                  key={`${guest.name}-${index}`}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{guest.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">Age: {formatGuestAge(guest)}</p>
                    </div>
                    {guest.isMainMember ? (
                      <Badge variant="outline" className="text-xs shrink-0">Main Member</Badge>
                    ) : guest.isSpouse ? (
                      <Badge variant="outline" className="text-xs shrink-0">Spouse</Badge>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-2">
                    {allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {allergies.map((allergy, allergyIndex) => (
                          <Badge
                            key={`${resolveAllergyLabel(allergy)}-${allergyIndex}`}
                            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50"
                          >
                            {resolveAllergyLabel(allergy)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {dietary.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {dietary.map((restriction, dietaryIndex) => (
                          <Badge
                            key={`${resolveDietaryLabel(restriction)}-${dietaryIndex}`}
                            className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50"
                          >
                            {resolveDietaryLabel(restriction)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {!hasDietaryNeeds ? (
                      <p className="text-sm text-gray-400">No dietary restrictions</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Suites & Order Items
        </h3>

        {booking.posOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No POS orders for this booking.</p>
        ) : (
          <div className="space-y-4">
            {booking.posOrders.map((order) => (
              <div key={order.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-100 border-b border-gray-200 flex justify-between items-center gap-4">
                  <p className="text-sm font-medium text-gray-800">
                    Suite: {order.suiteName || 'Unassigned / Lounge'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">
                    Order Subtotal: {formatPosOrderSubtotal(order.fnbSubtotal)}
                  </p>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Line Total
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Status
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-center text-gray-400">
                          No items
                        </td>
                      </tr>
                    ) : (
                      order.items.map((item) => {
                        const kitchenStatus = item.kitchenStatus;
                        const isInactive =
                          kitchenStatus === 'Cancelled' || kitchenStatus === 'Unserved';

                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-2.5 align-top">
                              <div className="flex items-center gap-2">
                                <p className={isInactive ? 'line-through text-gray-400 font-medium' : 'font-medium text-gray-900'}>
                                  {item.itemName}
                                </p>
                                {item.isUnfiredPreorder ? (
                                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                    Pre-order
                                  </span>
                                ) : null}
                              </div>
                              {item.itemNameZh ? (
                                <p className={isInactive ? 'line-through text-gray-400 text-xs mt-0.5' : 'text-xs text-gray-500 mt-0.5'}>
                                  {item.itemNameZh}
                                </p>
                              ) : null}
                              {item.remarks?.trim() ? (
                                <div className="mt-1.5 flex">
                                  <span
                                    className={`inline-flex max-w-full items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 ${
                                      isInactive ? 'opacity-60' : ''
                                    }`}
                                  >
                                    <Pencil className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
                                    <span className={`line-clamp-2 ${isInactive ? 'line-through' : ''}`}>
                                      {item.remarks.trim()}
                                    </span>
                                  </span>
                                </div>
                              ) : null}
                            </td>
                            <td className={`px-4 py-2.5 text-center align-top ${isInactive ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {item.quantity}
                            </td>
                            <td className={`px-4 py-2.5 text-right align-top whitespace-nowrap ${isInactive ? 'line-through text-gray-400' : item.unitPrice > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                              {formatPosItemUnitPrice(item.unitPrice)}
                            </td>
                            <td className={`px-4 py-2.5 text-right align-top whitespace-nowrap font-medium ${isInactive ? 'line-through text-gray-400' : item.lineTotal > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                              {formatPosItemLineTotal(item.lineTotal)}
                            </td>
                            <td className="px-4 py-2.5 text-center align-top">
                              <Badge className={getKitchenStatusBadgeClass(kitchenStatus)}>
                                {kitchenStatus || '—'}
                              </Badge>
                            </td>
                            <td className={`px-4 py-2.5 text-right align-top whitespace-nowrap ${isInactive ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {item.displayTime ? (
                                <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                                  <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                  {formatDateTime(item.displayTime)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function PosTransactions({
  transactions,
  startDate,
  endDate,
  searchQuery,
  isLoading = false,
  totalCount = 0,
  onStartDateChange,
  onEndDateChange,
  onSearchQueryChange,
  onFilter,
}: PosTransactionsViewProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">POS Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Audit historical POS orders with booking context and line-item detail.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <StringDatePicker
                id="start-date"
                value={startDate}
                onChange={(next) => onStartDateChange?.(next)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <StringDatePicker
                id="end-date"
                value={endDate}
                onChange={(next) => onEndDateChange?.(next)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <label htmlFor="transaction-search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="transaction-search"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onFilter?.();
                  }
                }}
                placeholder="Guest name or booking ref..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <Button onClick={onFilter} className="gap-2 shrink-0">
            <Search className="w-4 h-4" />
            Filter / Search
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
          {isLoading ? 'Loading transactions...' : `${totalCount} transaction${totalCount === 1 ? '' : 's'} found`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Booking Ref</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Main Guest</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Total Suites</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Total Orders</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">F&B Subtotal</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((booking) => {
                  const isExpanded = expandedRows.includes(booking.id);

                  return (
                    <Fragment key={booking.id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-gray-700">{formatDateTime(booking.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{booking.bookingRef}</td>
                        <td className="px-4 py-3 text-gray-700">{booking.mainGuest}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{booking.totalSuites}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{booking.totalOrders}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${booking.fnbSubtotal > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                          {formatPosOrderSubtotal(booking.fnbSubtotal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedRows((prev) => toggleExpandedRow(prev, booking.id))}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label={isExpanded ? 'Collapse booking details' : 'Expand booking details'}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr className="bg-gray-50 border-x border-b border-gray-200">
                          <td colSpan={7} className="p-0">
                            <ExpandedBookingDetails booking={booking} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
