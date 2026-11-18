import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { POSCheckout } from './POSCheckout';

const bookingData = {
  bookingNo: 'A-1',
  guestName: 'Test Guest',
  accountNo: 'ACC-1',
  membershipTier: 'Gold',
  suiteName: 'CIP 1',
  checkInTime: '10:00:00',
  checkOutTime: '11:00:00',
  duration: '1h',
  loungeAccess: 0,
  creditBalance: 0,
};

describe('POSCheckout — Order Summary fulfillment badges', () => {
  it('renders Served and Unserved badges and does not show cancelled item names', () => {
    render(
      <POSCheckout
        bookingNo="A-1"
        bookingData={bookingData}
        orderItems={[
          {
            id: 1,
            name: 'Wonton Noodles',
            category: 'Menu Item',
            quantity: 1,
            unitPrice: 60,
            discount: 0,
            lineTotal: 60,
            fulfillmentStatus: 'served',
          },
          {
            id: 2,
            name: 'Potato Soup',
            category: 'Menu Item',
            quantity: 1,
            unitPrice: 40,
            discount: 0,
            lineTotal: 40,
            fulfillmentStatus: 'unserved',
          },
        ]}
        fnbSubtotal={100}
        paidFnbAmount={0}
        outstandingFnbAmount={100}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText('Wonton Noodles')).toBeInTheDocument();
    expect(screen.getByText('Potato Soup')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-item-status-1')).toHaveTextContent('Served');
    expect(screen.getByTestId('checkout-item-status-2')).toHaveTextContent('Unserved');
    expect(screen.queryByText('Sprite')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
  });

  it('defaults missing fulfillmentStatus to Unserved', () => {
    render(
      <POSCheckout
        bookingNo="A-1"
        bookingData={bookingData}
        orderItems={[
          {
            id: 9,
            name: 'Honey Lemon Water',
            category: 'Menu Item',
            quantity: 1,
            unitPrice: 25,
            lineTotal: 25,
          },
        ]}
        fnbSubtotal={25}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByTestId('checkout-item-status-9')).toHaveTextContent('Unserved');
  });
});
