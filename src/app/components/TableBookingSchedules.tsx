import { BookingSchedules } from './BookingSchedules';

export function TableBookingSchedules({
  onViewDetail,
  onPreOrder,
}: {
  onViewDetail?: (bookingId: number) => void;
  onPreOrder?: (booking: any) => void;
}) {
  return (
    <BookingSchedules
      venueTypeFilter="tables"
      pageTitle="Table Booking Schedules"
      pageSubtitle="Daily schedule view across all lounge tables (Table 1–5)"
      onViewDetail={onViewDetail}
      onPreOrder={onPreOrder}
    />
  );
}
