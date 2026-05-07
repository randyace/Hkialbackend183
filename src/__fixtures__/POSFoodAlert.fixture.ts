import type { PendingOrder } from '../app/components/POSFoodAlert';

export const OVERDUE_THRESHOLD = 20;

export const INITIAL_PENDING: PendingOrder[] = [
  {
    suiteId: 'exec-1',
    suiteName: 'Executive Suite 1',
    bookingNo: 'A-202602-000002',
    guestName: 'Mary Johnson',
    items: [
      { name: 'Premium Breakfast Set', qty: 2, status: 'preparing', waitMinutes: 35 },
    ],
  },
  {
    suiteId: 'vip-a1',
    suiteName: 'VIP Suite A1',
    bookingNo: 'A-202602-000001',
    guestName: 'John Smith',
    items: [
      { name: 'Wagyu Beef Burger', qty: 1, status: 'preparing', waitMinutes: 28 },
      { name: 'Dim Sum Platter', qty: 1, status: 'pending', waitMinutes: 12 },
    ],
  },
  {
    suiteId: 'business-4',
    suiteName: 'Business Suite 4',
    bookingNo: 'A-202602-000009',
    guestName: 'Sarah Chen',
    items: [
      { name: 'Lobster Salad', qty: 1, status: 'pending', waitMinutes: 8 },
      { name: 'Champagne (Dom Pérignon)', qty: 1, status: 'pending', waitMinutes: 8 },
    ],
  },
];

export const INITIAL_OVERDUE_COUNT = INITIAL_PENDING.filter((o) =>
  o.items.some((i) => i.waitMinutes >= OVERDUE_THRESHOLD),
).length;
