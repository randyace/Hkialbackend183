import { useState } from 'react';
import {
  Dashboard,
  type DashboardPendingApproval,
} from '../../app/components/Dashboard';
import {
  mockStats,
  mockBookingStatusStats,
  mockRecentBookings,
  mockPendingBookings,
  mockUpcomingArrivals,
  mockAvailableSuites,
  mockOccupiedSuites,
} from '../Dashboard.fixture';

const STATUS_DISPLAY: Record<string, string> = {
  PendingForReview: 'Pending for Review',
  PendingForApproval: 'Pending for Approval',
  PaymentLinkSent: 'Payment Link Sent',
};

function getStatusDisplay(status: string): string {
  return STATUS_DISPLAY[status] ?? status.replace(/([A-Z])/g, ' $1').trim();
}

function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Confirmed: 'bg-green-100 text-green-700',
    PendingForReview: 'bg-yellow-100 text-yellow-700',
    PendingForApproval: 'bg-blue-100 text-blue-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Cancelled: 'bg-gray-100 text-gray-700',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}

function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Paid: 'bg-green-100 text-green-600',
    Pending: 'bg-yellow-100 text-yellow-600',
    PaymentLinkSent: 'bg-blue-100 text-blue-600',
    NotRequired: 'bg-gray-100 text-gray-600',
    Overdue: 'bg-red-100 text-red-600',
    Refunded: 'bg-purple-100 text-purple-600',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-600';
}

export function DashboardPreview() {
  const [pendingBookings, setPendingBookings] = useState<DashboardPendingApproval[]>(mockPendingBookings);
  const [selectedBooking, setSelectedBooking] = useState<DashboardPendingApproval | null>(null);

  const handleApprove = (booking: DashboardPendingApproval) => {
    setPendingBookings((prev) => prev.filter((item) => item.id !== booking.id));
    setSelectedBooking(null);
  };

  const handleReject = (booking: DashboardPendingApproval) => {
    setPendingBookings((prev) => prev.filter((item) => item.id !== booking.id));
    setSelectedBooking(null);
  };

  return (
    <Dashboard
      stats={mockStats}
      bookingStatusStats={mockBookingStatusStats}
      recentBookings={mockRecentBookings}
      pendingBookings={pendingBookings}
      selectedBooking={selectedBooking}
      availableSuites={mockAvailableSuites}
      occupiedSuites={mockOccupiedSuites}
      upcomingArrivals={mockUpcomingArrivals}
      onSelectBooking={setSelectedBooking}
      onCloseSelectedBooking={() => setSelectedBooking(null)}
      onApprove={handleApprove}
      onReject={handleReject}
      getStatusDisplay={getStatusDisplay}
      getBookingStatusColor={getBookingStatusColor}
      getPaymentStatusColor={getPaymentStatusColor}
    />
  );
}
