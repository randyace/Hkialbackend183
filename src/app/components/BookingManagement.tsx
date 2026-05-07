import { Search, Download, Eye, Edit2, Trash2, X, Calendar, AlertCircle, Plane, Car, ShoppingBag, BadgePercent, Building2, Info } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

export interface BookingManagementBooking {
  id: number;
  bookingNo: string;
  guestName: string;
  accountNo: string;
  suite: string;
  dateTime: string;
  flightNo: string;
  flightTime: string;
  flightOrigin?: string;
  flightDestination?: string;
  flightType: 'Arrival' | 'Departure' | 'Transit';
  bookingCategory: 'Agent Booking' | 'Corporate Booking' | 'Individual Booking' | 'Membership Booking' | 'AA Booking';
  status: 'Pending for Review' | 'Pending for Approval' | 'Approved' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'No-show';
  paymentStatus: 'Not Required' | 'Pending' | 'Payment Link Sent' | 'Paid' | 'Overdue' | 'Refunded';
  services: string[];
  amount: string | 'Pending Calculation' | 'Re-calculation' | 'Manual Adjustment';
  numberOfGuests?: number;
  nonFlyingGuests?: number;
  isAdHoc?: boolean;
  hasLimousine?: boolean;
  hasShopping?: boolean;
  cutoffHours?: number;
  accountType?: 'Individual' | 'Corporate' | 'Travel Agency';
  paymentMode?: 'Upfront' | 'On-Credit';
  rejectionReason?: string;
  bookingType: 'Online' | 'Email/Call to HKIAL';
  agencyName?: string;
  agencyDiscountRate?: number;
  originalAmountValue?: number;
  finalAmountValue?: number;
}

export interface BookingManagementProps {
  loading: boolean;
  error: string | null;
  bookings: BookingManagementBooking[];
  searchTerm: string;
  statusFilter: string;
  paymentStatusFilter: string;
  bookingCategoryFilter: string;
  dateFrom: string;
  dateTo: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  deletingBookingId: number | null;
  showDemoInfo: boolean;
  paginationModel: number[];
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPaymentStatusFilterChange: (value: string) => void;
  onBookingCategoryFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onDismissDemoInfo: () => void;
  onExportReport: () => void;
  onViewDetail: (bookingId: number) => void;
  onEditBooking: (bookingId: number) => void;
  onDeleteBooking: (bookingId: number, bookingNo: string) => void;
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
  getBookingCategoryColor: (category: string) => string;
  getFlightTypeColor: (type: string) => string;
}

export function BookingManagement({
  loading,
  error,
  bookings,
  searchTerm,
  statusFilter,
  paymentStatusFilter,
  bookingCategoryFilter,
  dateFrom,
  dateTo,
  currentPage,
  totalPages,
  totalCount,
  startIndex,
  endIndex,
  deletingBookingId,
  showDemoInfo,
  paginationModel,
  onSearchTermChange,
  onStatusFilterChange,
  onPaymentStatusFilterChange,
  onBookingCategoryFilterChange,
  onDateFromChange,
  onDateToChange,
  onPageChange,
  onPrevPage,
  onNextPage,
  onDismissDemoInfo,
  onExportReport,
  onViewDetail,
  onEditBooking,
  onDeleteBooking,
  getStatusColor,
  getPaymentStatusColor,
  getBookingCategoryColor,
  getFlightTypeColor,
}: BookingManagementProps) {
  const renderPagination = () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={onPrevPage}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
        {paginationModel.map((page, index) => {
          if (page === -1 || page === -2) {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          return (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            onClick={onNextPage}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Booking Management</h1>
          <p className="text-gray-600">Manage and review all lounge bookings</p>
        </div>
        <Button onClick={onExportReport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {showDemoInfo && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <BadgePercent className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-2">
                Travel Agency Auto-Discount — Sample Demonstration
                <span className="text-xs font-normal bg-green-200 text-green-800 px-2 py-0.5 rounded-full">For Client Review</span>
              </p>
              <p className="text-sm text-green-700 mb-3">
                Bookings made under a Travel Agency account automatically apply the agency's pre-configured default discount rate.
              </p>
              <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Filter by <strong>"Agent Booking"</strong> in the Booking Category dropdown to see only Travel Agency bookings with auto-discounts.
              </p>
            </div>
            <button
              onClick={onDismissDemoInfo}
              className="text-green-600 hover:text-green-800 flex-shrink-0 ml-2"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking number, guest name, account number, or flight number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Booking Status</SelectItem>
                <SelectItem value="Pending for Review">Pending for Review</SelectItem>
                <SelectItem value="Pending for Approval">Pending for Approval</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="No-show">No-show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={onPaymentStatusFilterChange}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="Not Required">Not Required</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Payment Link Sent">Payment Link Sent</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bookingCategoryFilter} onValueChange={onBookingCategoryFilterChange}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Booking Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Booking Category</SelectItem>
                <SelectItem value="Agent Booking">Agent Booking</SelectItem>
                <SelectItem value="Corporate Booking">Corporate Booking</SelectItem>
                <SelectItem value="Individual Booking">Individual Booking</SelectItem>
                <SelectItem value="Membership Booking">Membership Booking</SelectItem>
                <SelectItem value="AA Booking">AA Booking</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                placeholder="From date..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
              />
            </div>
            <div className="flex-1 relative">
              <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                placeholder="To date..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {loading
              ? 'Loading bookings...'
              : `Showing ${totalCount === 0 ? 0 : startIndex + 1}-${endIndex} of ${totalCount} bookings`}
          </div>
          <div>{renderPagination()}</div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Booking No.</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Guest Name</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Suite</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Flight Info</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Guests</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className={`hover:bg-gray-50 ${booking.isAdHoc ? 'bg-amber-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-start gap-2">
                      {booking.isAdHoc && (
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-mono text-xs font-medium text-gray-900">{booking.bookingNo}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${getFlightTypeColor(booking.flightType)}`}>
                            {booking.flightType}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${getBookingCategoryColor(booking.bookingCategory)}`}>
                            {booking.bookingCategory}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => onViewDetail(booking.id)}
                    >
                      {booking.guestName}
                    </button>
                    <div className="text-xs text-gray-500">{booking.accountNo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.suite}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-xs text-gray-500 mb-1">{booking.dateTime.split(' ')[0]}</div>
                    <div className="flex items-center gap-1">
                      <Plane className="w-3 h-3 text-gray-400" />
                      {booking.flightNo}
                    </div>
                    <div className="text-gray-600">{booking.flightTime}</div>
                    {(booking.flightOrigin || booking.flightDestination) && (
                      <div className="text-xs text-gray-500">
                        {booking.flightOrigin || '—'} → {booking.flightDestination || '—'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>{booking.numberOfGuests} pax</div>
                    {(booking.nonFlyingGuests ?? 0) > 0 && (
                      <div className="text-xs text-gray-600">{booking.nonFlyingGuests} non-flying</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {booking.hasLimousine && (
                        <Car className="w-4 h-4 text-purple-600" />
                      )}
                      {booking.hasShopping && (
                        <ShoppingBag className="w-4 h-4 text-green-600" />
                      )}
                      {!booking.hasLimousine && !booking.hasShopping && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                      {booking.paymentStatus}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">{booking.paymentMode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {booking.agencyDiscountRate && booking.originalAmountValue ? (
                      <div className="space-y-0.5">
                        <p className="text-gray-400 line-through text-xs leading-tight">
                          HK${booking.originalAmountValue.toLocaleString()}
                        </p>
                        <p className="text-green-700 font-medium">{booking.amount}</p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                          <BadgePercent className="w-3 h-3" />
                          {booking.agencyDiscountRate}% off
                        </span>
                        {booking.agencyName && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />{booking.agencyName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span>{booking.amount}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(booking.id)}
                        className="h-8 w-8 p-0"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditBooking(booking.id)}
                        className="h-8 w-8 p-0"
                        title="Edit Booking"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingBookingId === booking.id}
                        onClick={() => onDeleteBooking(booking.id, booking.bookingNo)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Delete Booking"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && bookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">No bookings found.</div>
        )}

        {bookings.length > 0 && (
          <div className="p-4 border-t flex justify-end">{renderPagination()}</div>
        )}
      </Card>
    </div>
  );
}
