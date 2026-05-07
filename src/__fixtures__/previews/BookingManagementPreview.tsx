import { useMemo, useState } from 'react';
import { BookingManagement } from '../../app/components/BookingManagement';
import { generateMockBookings } from '../BookingManagement.fixture';

const ITEMS_PER_PAGE = 10;

interface BookingManagementPreviewProps {
  onViewDetail?: (bookingId: number) => void;
}

const ALL_BOOKINGS = generateMockBookings();

function buildPagination(currentPage: number, totalPages: number): number[] {
  const pages: number[] = [];
  const maxVisiblePages = 5;
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, -1, totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages);
  }
  return pages;
}

const STATUS_COLORS: Record<string, string> = {
  'Pending for Review': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Pending for Approval': 'bg-blue-100 text-blue-800 border border-blue-200',
  Approved: 'bg-green-100 text-green-800 border border-green-200',
  Confirmed: 'bg-green-100 text-green-800 border border-green-200',
  Rejected: 'bg-red-100 text-red-800 border border-red-200',
  Cancelled: 'bg-gray-100 text-gray-800 border border-gray-200',
  'No-show': 'bg-orange-100 text-orange-800 border border-orange-200',
};

const PAYMENT_COLORS: Record<string, string> = {
  'Not Required': 'bg-gray-100 text-gray-600',
  Pending: 'bg-yellow-100 text-yellow-700',
  'Payment Link Sent': 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
  Refunded: 'bg-purple-100 text-purple-700',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Agent Booking': 'bg-purple-100 text-purple-700',
  'Corporate Booking': 'bg-blue-100 text-blue-700',
  'Individual Booking': 'bg-teal-100 text-teal-700',
  'Membership Booking': 'bg-indigo-100 text-indigo-700',
  'AA Booking': 'bg-orange-100 text-orange-700',
};

const FLIGHT_COLORS: Record<string, string> = {
  Arrival: 'bg-emerald-100 text-emerald-700',
  Departure: 'bg-rose-100 text-rose-700',
  Transit: 'bg-sky-100 text-sky-700',
};

export function BookingManagementPreview({ onViewDetail }: BookingManagementPreviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [bookingCategoryFilter, setBookingCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDemoInfo, setShowDemoInfo] = useState(true);

  const filtered = useMemo(() => {
    return ALL_BOOKINGS.filter((booking) => {
      const matchesSearch =
        booking.bookingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.accountNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.flightNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesPayment = paymentStatusFilter === 'all' || booking.paymentStatus === paymentStatusFilter;

      let matchesCategory = true;
      if (bookingCategoryFilter !== 'all') {
        if (bookingCategoryFilter === 'Agent Booking') matchesCategory = booking.accountType === 'Travel Agency';
        else if (bookingCategoryFilter === 'Corporate Booking') matchesCategory = booking.accountType === 'Corporate';
        else if (bookingCategoryFilter === 'Individual Booking') matchesCategory = booking.accountType === 'Individual';
      }

      const matchesDateRange =
        !dateFrom ||
        !dateTo ||
        (new Date(booking.dateTime.split(' ')[0]) >= new Date(dateFrom) &&
          new Date(booking.dateTime.split(' ')[0]) <= new Date(dateTo));

      return matchesSearch && matchesStatus && matchesPayment && matchesCategory && matchesDateRange;
    }).sort((a, b) => b.id - a.id);
  }, [searchTerm, statusFilter, paymentStatusFilter, bookingCategoryFilter, dateFrom, dateTo]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageBookings = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const endIndex = startIndex + pageBookings.length;

  return (
    <BookingManagement
      loading={false}
      error={null}
      bookings={pageBookings}
      searchTerm={searchTerm}
      statusFilter={statusFilter}
      paymentStatusFilter={paymentStatusFilter}
      bookingCategoryFilter={bookingCategoryFilter}
      dateFrom={dateFrom}
      dateTo={dateTo}
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      itemsPerPage={ITEMS_PER_PAGE}
      startIndex={startIndex}
      endIndex={endIndex}
      deletingBookingId={null}
      showDemoInfo={showDemoInfo}
      paginationModel={buildPagination(currentPage, totalPages)}
      onSearchTermChange={(value) => {
        setSearchTerm(value);
        setCurrentPage(1);
      }}
      onStatusFilterChange={(value) => {
        setStatusFilter(value);
        setCurrentPage(1);
      }}
      onPaymentStatusFilterChange={(value) => {
        setPaymentStatusFilter(value);
        setCurrentPage(1);
      }}
      onBookingCategoryFilterChange={(value) => {
        setBookingCategoryFilter(value);
        setCurrentPage(1);
      }}
      onDateFromChange={(value) => {
        setDateFrom(value);
        setCurrentPage(1);
      }}
      onDateToChange={(value) => {
        setDateTo(value);
        setCurrentPage(1);
      }}
      onPageChange={setCurrentPage}
      onPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
      onNextPage={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
      onDismissDemoInfo={() => setShowDemoInfo(false)}
      onExportReport={() => undefined}
      onViewDetail={(id) => onViewDetail?.(id)}
      onEditBooking={() => undefined}
      onDeleteBooking={() => undefined}
      getStatusColor={(s) => STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-700'}
      getPaymentStatusColor={(s) => PAYMENT_COLORS[s] ?? 'bg-gray-100 text-gray-700'}
      getBookingCategoryColor={(c) => CATEGORY_COLORS[c] ?? 'bg-gray-100 text-gray-700'}
      getFlightTypeColor={(f) => FLIGHT_COLORS[f] ?? 'bg-gray-100 text-gray-700'}
    />
  );
}
