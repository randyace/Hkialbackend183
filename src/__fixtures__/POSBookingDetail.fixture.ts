import type {
  POSBookingDetailBooking,
  POSBookingDetailMenuItem,
} from '../app/components/POSBookingDetail';

export const mockMenuItems: POSBookingDetailMenuItem[] = [
  { id: 'coffee-1', name: 'Latte', price: 50, category: 'Coffee', description: 'Classic espresso with steamed milk', foodAllergens: ['Dairy'] },
  { id: 'coffee-2', name: 'Cappuccino', price: 50, category: 'Coffee', description: 'Espresso with foamed milk', foodAllergens: ['Dairy'] },
  { id: 'coffee-3', name: 'Americano', price: 45, category: 'Coffee', description: 'Espresso with hot water' },
  { id: 'coffee-4', name: 'Espresso', price: 40, category: 'Coffee', description: 'Rich Italian coffee' },
  { id: 'coffee-5', name: 'Mocha', price: 55, category: 'Coffee', description: 'Espresso with chocolate and milk', foodAllergens: ['Dairy'] },

  { id: 'tea-1', name: 'English Breakfast', price: 45, category: 'Tea', description: 'Traditional black tea' },
  { id: 'tea-2', name: 'Green Tea', price: 45, category: 'Tea', description: 'Fresh green tea' },
  { id: 'tea-3', name: 'Jasmine Tea', price: 45, category: 'Tea', description: 'Fragrant jasmine tea' },
  { id: 'tea-4', name: 'Earl Grey', price: 45, category: 'Tea', description: 'Bergamot-flavored black tea' },

  { id: 'bev-1', name: 'Fresh Orange Juice', price: 60, category: 'Beverages', description: 'Freshly squeezed' },
  { id: 'bev-2', name: 'Apple Juice', price: 60, category: 'Beverages', description: 'Pure apple juice' },
  { id: 'bev-3', name: 'Mineral Water', price: 30, category: 'Beverages', description: 'Still or sparkling' },
  { id: 'bev-4', name: 'Soft Drinks', price: 35, category: 'Beverages', description: 'Coca-Cola, Sprite, etc.' },

  { id: 'breakfast-1', name: 'Premium Breakfast Set', price: 280, category: 'Breakfast', description: 'Eggs, bacon, toast, juice', foodAllergens: ['Eggs', 'Gluten', 'Dairy'] },
  { id: 'breakfast-2', name: 'Continental Breakfast', price: 220, category: 'Breakfast', description: 'Pastries, croissant, jam, coffee', foodAllergens: ['Gluten', 'Dairy', 'Eggs'] },
  { id: 'breakfast-3', name: 'Congee Set', price: 180, category: 'Breakfast', description: 'Rice porridge with sides' },

  { id: 'main-1', name: 'Dim Sum Platter', price: 380, category: 'Main Course', description: 'Assorted dim sum selection', foodAllergens: ['Shellfish', 'Gluten', 'Soy'] },
  { id: 'main-2', name: 'Beef Noodles', price: 180, category: 'Main Course', description: 'Braised beef with noodles', foodAllergens: ['Gluten', 'Soy'] },
  { id: 'main-3', name: 'Seafood Fried Rice', price: 200, category: 'Main Course', description: 'Wok-fried rice with seafood', foodAllergens: ['Shellfish', 'Fish', 'Eggs'] },
  { id: 'main-4', name: 'Grilled Chicken', price: 220, category: 'Main Course', description: 'Herb-marinated chicken' },

  { id: 'app-1', name: 'Caesar Salad', price: 120, category: 'Appetizer', description: 'Romaine with caesar dressing', foodAllergens: ['Dairy', 'Eggs', 'Fish'] },
  { id: 'app-2', name: 'Spring Rolls', price: 90, category: 'Appetizer', description: 'Crispy vegetable rolls', foodAllergens: ['Gluten', 'Soy'] },
  { id: 'app-3', name: 'Edamame', price: 70, category: 'Appetizer', description: 'Steamed soybeans with salt', foodAllergens: ['Soy'] },

  { id: 'dessert-1', name: 'Dessert Trio', price: 95, category: 'Dessert', description: 'Three mini desserts', foodAllergens: ['Dairy', 'Eggs', 'Gluten', 'Nuts'] },
  { id: 'dessert-2', name: 'Mango Pudding', price: 75, category: 'Dessert', description: 'Traditional Hong Kong dessert', foodAllergens: ['Dairy'] },
  { id: 'dessert-3', name: 'Ice Cream', price: 65, category: 'Dessert', description: 'Vanilla, chocolate, or strawberry', foodAllergens: ['Dairy', 'Eggs'] },
];

export function buildMockPOSBooking(bookingNo: string): POSBookingDetailBooking {
  const orders = [
    { id: 'ORD-001', name: 'Premium Breakfast Set', category: 'Breakfast', quantity: 2, unitPrice: 280, total: 560, status: 'served' as const, orderTime: '14:35', servedTime: '14:50' },
    { id: 'ORD-002', name: 'Dim Sum Platter', category: 'Main Course', quantity: 1, unitPrice: 380, total: 380, status: 'served' as const, orderTime: '15:00', servedTime: '15:20' },
    { id: 'ORD-003', name: 'Fresh Fruit Juice', category: 'Beverages', quantity: 3, unitPrice: 60, total: 180, status: 'served' as const, orderTime: '14:35', servedTime: '14:45' },
    { id: 'ORD-004', name: 'Coffee (Latte)', category: 'Beverages', quantity: 2, unitPrice: 50, total: 100, status: 'served' as const, orderTime: '15:30', servedTime: '15:35' },
    { id: 'ORD-005', name: 'Caesar Salad', category: 'Appetizer', quantity: 1, unitPrice: 120, total: 120, status: 'preparing' as const, orderTime: '16:00' },
    { id: 'ORD-006', name: 'Dessert Trio', category: 'Dessert', quantity: 2, unitPrice: 95, total: 190, status: 'pending' as const, orderTime: '16:15' },
  ];

  return {
    bookingNo,
    suiteId: 'vip-a1',
    suiteName: 'VIP Suite A1',
    memberName: 'John Smith',
    accountNo: 'ACC-2024-1001',
    accountType: 'Corporate',
    membershipTier: 'Platinum',
    email: 'john.smith@company.com',
    phone: '+852 9123 4567',
    companyName: 'Tech Solutions Ltd.',
    foodAllergies: [
      { id: 1, allergen: 'Shellfish', severity: 'Severe', notes: 'Avoid all shellfish products.' },
    ],
    dietaryRequirements: [
      { id: 1, requirement: 'Vegetarian', notes: 'No meat or fish.' },
    ],
    guestProfiles: [
      {
        guestId: 1,
        name: 'John Smith',
        relation: 'Main Member',
        foodAllergies: [
          { id: 1, allergen: 'Shellfish', severity: 'Severe', notes: 'Avoid all shellfish products.' },
        ],
        dietaryRequirements: [
          { id: 1, requirement: 'Vegetarian', notes: 'No meat or fish.' },
        ],
      },
      {
        guestId: 2,
        name: 'Mary Smith',
        relation: 'Spouse',
        foodAllergies: [
          { id: 2, allergen: 'Nuts', severity: 'Severe', notes: 'Severe tree nut allergy — carries EpiPen.' },
          { id: 3, allergen: 'Dairy', severity: 'Mild', notes: 'Mild lactose sensitivity.' },
        ],
        dietaryRequirements: [
          { id: 2, requirement: 'Gluten-Free', notes: 'Coeliac disease — strict gluten-free required.' },
        ],
      },
    ],
    checkInTime: '14:30',
    flightNo: 'CX888',
    flightTime: '17:30',
    flightDestination: 'London (LHR)',
    numberOfGuests: 2,
    orders,
    paymentMode: 'On-Credit',
    paymentStatus: 'Billed to Account',
    totalAmount: orders.reduce((sum, item) => sum + item.total, 0),
    creditBalance: 15000,
  };
}
