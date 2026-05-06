import { BookingSchedules } from './BookingSchedules';

export function SuiteBookingSchedules({
  onViewDetail,
  onPreOrder,
}: {
  onViewDetail?: (bookingId: number) => void;
  onPreOrder?: (booking: any) => void;
}) {
  return (
    <BookingSchedules
      venueTypeFilter="suites"
      pageTitle="Suite Booking Schedules"
      pageSubtitle="Daily schedule view across all VIP, Executive, Business, Premier and Family suites"
      onViewDetail={onViewDetail}
      onPreOrder={onPreOrder}
    />
  );
}
