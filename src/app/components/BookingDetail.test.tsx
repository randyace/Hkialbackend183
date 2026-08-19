import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookingDetail } from './BookingDetail';

// 2026-08-19 — round 6.2.169 task 8 (Cirium flight schedule
// auto-poll). figma-ui self-tests for the new flight-change
// props. The wrapper (admin BookingDetail.tsx) passes
// onRefreshFlight / pendingChanges / onResolvePendingChange /
// refreshing to this view; the view consumes them by rendering
// an "Update Flight Info" button (when onRefreshFlight is
// provided) and per-change banners (when pendingChanges is
// non-empty). These tests pin the contract from the figma-ui
// side; the wrapper's behavior is verified by Task 7's tests
// (tests/services/bookingsApi.test.ts).

describe('BookingDetail — flight change props', () => {
  it('renders Update Flight Info button inside the Flight Information card when onRefreshFlight is provided', () => {
    render(
      <BookingDetail
        onBack={vi.fn()}
        onRefreshFlight={vi.fn()}
        pendingChanges={[]}
        onResolvePendingChange={vi.fn()}
        refreshing={false}
      />,
    );
    const card = screen.getByTestId('booking-detail-flight-readonly');
    expect(card).toContainElement(screen.getByTestId('booking-detail-refresh-flight'));
  });

  it('renders last-checked timestamp after the Flight Information title', () => {
    render(
      <BookingDetail
        onBack={vi.fn()}
        onRefreshFlight={vi.fn()}
        pendingChanges={[]}
        onResolvePendingChange={vi.fn()}
        refreshing={false}
        flightLastCheckedLabel="Last checked 19 Aug 2026, 21:00 HKT (auto-poll)"
      />,
    );
    const card = screen.getByTestId('booking-detail-flight-readonly');
    const stamp = screen.getByTestId('booking-detail-flight-last-checked');
    expect(card).toContainElement(stamp);
    expect(stamp).toHaveTextContent('Last checked 19 Aug 2026, 21:00 HKT (auto-poll)');
  });

  it('renders pending-change banner when pendingChanges is non-empty', () => {
    render(
      <BookingDetail
        onBack={vi.fn()}
        onRefreshFlight={vi.fn()}
        pendingChanges={[
          {
            id: 42,
            change_type: 'time_or_date',
            old: { flight_time: '21:30' },
            new: { flight_time: '21:50' },
          },
        ]}
        onResolvePendingChange={vi.fn()}
        refreshing={false}
      />,
    );
    expect(screen.getByTestId('booking-detail-pending-change-42')).toBeInTheDocument();
    expect(screen.getByText(/21:30/)).toBeInTheDocument();
    expect(screen.getByText(/21:50/)).toBeInTheDocument();
  });
});
