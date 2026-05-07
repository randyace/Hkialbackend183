import { useMemo } from 'react';
import { POSBookingDetail } from '../../app/components/POSBookingDetail';
import { buildMockPOSBooking, mockMenuItems } from '../POSBookingDetail.fixture';

interface POSBookingDetailPreviewProps {
  bookingNo: string;
  onBack: () => void;
}

const initialCart = [
  { id: 'coffee-1', name: 'Latte', price: 50, category: 'Coffee', description: 'Classic espresso with steamed milk', quantity: 2 },
  { id: 'breakfast-1', name: 'Premium Breakfast Set', price: 280, category: 'Breakfast', description: 'Eggs, bacon, toast, juice', quantity: 1 },
  { id: 'bev-1', name: 'Fresh Orange Juice', price: 60, category: 'Beverages', description: 'Freshly squeezed', quantity: 2 },
];

export function POSBookingDetailPreview({ bookingNo, onBack }: POSBookingDetailPreviewProps) {
  const booking = useMemo(() => buildMockPOSBooking(bookingNo), [bookingNo]);
  return (
    <POSBookingDetail
      booking={booking}
      menuItems={mockMenuItems}
      initialCart={initialCart}
      onBack={onBack}
      onPlaceOrder={(cart) => console.log('Placing order:', cart)}
    />
  );
}
